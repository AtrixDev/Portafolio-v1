// tools/e2e-calcular.mjs — prueba HTTP REAL de POST /api/herramientas?action=calcular (S6).
// Levanta tools/dev-server.mjs en un puerto libre y usa la base REAL de backend/.env (MongoDB). NO es parte de `node --test`: depende de la base.
// Limpieza: borra SOLO lo que esta corrida creó (por id, por email de prueba y por las claves de límite de la IP local) y restaura las métricas
// que tocó comparando una foto de antes con la de después. Nunca hace un borrado global.
//
//   node tools/e2e-calcular.mjs
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { evaluar } from '../backend/lib/motor/economia.js';
import { resolverObjetivos } from '../backend/lib/motor/inversas.js';
import { MOTOR_VERSION } from '../backend/lib/motor/version.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MongoClient } = createRequire(join(RAIZ, 'backend/package.json'))('mongodb');
const uri = readFileSync(join(RAIZ, 'backend/.env'), 'utf8').match(/^MONGODB_URI=(.*)$/m)[1].replace(/^["']|["']$/g, '');
const puerto = await new Promise(ok => { const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
const A = () => ({ precio: 15000, fiscal: { regimen: 'monotributo' }, costo: { producto: 6000, ivaIncluido: true }, canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'incluido' }, impuestosVentaPct: 0.035 });

const cliente = await new MongoClient(uri).connect(), db = cliente.db('portafolio');
const fotoMetricas = Object.fromEntries((await db.collection('metricas').find({}).toArray()).map(d => [d._id, d]));
const creados = [], resultados = []; let n = 0;
const ok = (nombre, c, extra = '') => { n++; resultados.push([nombre, !!c]); console.log(`${c ? 'PASS' : 'FAIL'}  ${nombre}${extra ? '  ' + extra : ''}`); };
const srv = spawn('node', ['tools/dev-server.mjs'], { cwd: RAIZ, env: { ...process.env, PORT: String(puerto) }, stdio: ['ignore', 'pipe', 'ignore'] });
const base = `http://127.0.0.1:${puerto}/api/herramientas`;
const post = async (action, body, headers = {}) => { const r = await fetch(`${base}?action=${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null) }; };

try {
  await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('dev-server no arrancó')), 15000); srv.stdout.on('data', d => { if (String(d).includes('Portfolio')) { clearTimeout(t); res(); } }); });

  // a) cálculo válido
  const a = await post('calcular', { entrada: A() }); if (a.body?.resultadoId) creados.push(a.body.resultadoId);
  ok('POST calcular válido → 201', a.status === 201 && a.body.ok === true, `id ${a.body?.resultadoId}`);
  ok('el resultado trae ganancia $3.635 y piso $10.594', a.body.resultado.ganancia === 3635 && a.body.objetivos.precioPiso.equilibrio.precio === 10594);
  ok('la versión del motor viaja en la respuesta', a.body.motor.version === MOTOR_VERSION, MOTOR_VERSION);

  // b) paridad contra el motor directo
  const directo = evaluar(A()), { entrada, ...resultado } = directo;
  assert.deepEqual(a.body.resultado, resultado); assert.deepEqual(a.body.entrada, entrada); assert.deepEqual(a.body.objetivos, resolverObjetivos(entrada));
  ok('paridad: respuesta HTTP == motor directo (resultado, entrada normalizada y objetivos)', true);

  // c) recuperación por link desde una "sesión nueva" (otro pedido, sin estado)
  const g = await (await fetch(`${base}?action=resultado&id=${a.body.resultadoId}`)).json();
  ok('GET resultado por link → herramienta, resumen y datos', g.herramienta === 'rentabilidad' && g.resumen.titulo === a.body.resumen.titulo && g.datos.entrada.precio === 15000);
  ok('persistió la versión del motor y lo declarado', g.datos.motor.version === MOTOR_VERSION && g.datos.entradaDeclarada.canal.ivaModo === 'incluido', JSON.stringify(Object.keys(g.datos)));
  ok('lo guardado coincide con lo que respondió el cálculo', JSON.stringify(g.datos.resultado) === JSON.stringify(a.body.resultado) && JSON.stringify(g.datos.objetivos) === JSON.stringify(a.body.objetivos));
  const enBase = await db.collection('resultados').findOne({ _id: a.body.resultadoId });
  ok('en la base: herramienta, fuente, vencimiento a 90 días', enBase.herramienta === 'rentabilidad' && enBase.fuente === 'reglas' && Math.round((enBase.expiraEn - enBase.creadoEn) / 86400000) === 90);

  // d) el servidor recalcula aunque el cliente mande métricas falsas
  const falsas = { ganancia: 1e9, margenNeto: 0.99, precioPiso: 1, resultado: { ganancia: 1e9 }, resumen: { titulo: 'FALSO' }, motor: { version: '9.9.9' } };
  const f = await post('calcular', { ...falsas, entrada: { ...A(), ...falsas } }); if (f.body?.resultadoId) creados.push(f.body.resultadoId);
  ok('métricas falsas del cliente → 201 y se ignoran', f.status === 201 && f.body.resultado.ganancia === 3635 && f.body.motor.version === MOTOR_VERSION && f.body.resumen.titulo !== 'FALSO');
  const gf = await db.collection('resultados').findOne({ _id: f.body.resultadoId });
  ok('lo persistido no contiene nada de lo falso', !/FALSO|9\.9\.9|1000000000/.test(JSON.stringify(gf)) && gf.datos.resultado.ganancia === 3635);

  // e) entradas inválidas
  const mala = await post('calcular', { entrada: { ...A(), canal: { ventaPct: 14, ivaModo: 'incluido' } } });
  ok('entrada inválida → 400 con el campo y el código', mala.status === 400 && mala.body.errores[0].campo === 'canal.ventaPct' && mala.body.errores[0].codigo === 'PORCENTAJE_FUERA_DE_RANGO');
  ok('sin entrada → 400', (await post('calcular', { ganancia: 5 })).status === 400);
  ok('GET calcular → 405', (await fetch(`${base}?action=calcular`)).status === 405);
  const antes = await db.collection('resultados').countDocuments({ _id: { $in: creados } });
  ok('lo inválido no dejó nada en la base', antes === creados.length);

  // f) el lead de F0 sobre un resultado de rentabilidad
  const l = await post('lead', { resultadoId: a.body.resultadoId, email: 'e2e-calcular@f0test.example', nombre: 'Prueba' });
  ok('lead sobre el resultado de rentabilidad → 201 (reutiliza F0)', l.status === 201 && l.body.ok === true);
  const msg = await db.collection('messages').findOne({ resultadoId: a.body.resultadoId, email: 'e2e-calcular@f0test.example' });
  ok('el mensaje del admin trae el resumen de rentabilidad', msg && msg.herramienta === 'rentabilidad' && /Rentabilidad: \$ 3\.635 por unidad/.test(msg.message));
} finally {
  srv.kill();
  // ── limpieza filtrada por lo que ESTA corrida creó ──
  const borrados = {
    resultados: (await db.collection('resultados').deleteMany({ _id: { $in: creados } })).deletedCount,
    messages: (await db.collection('messages').deleteMany({ email: 'e2e-calcular@f0test.example' })).deletedCount,
    ratelimits: (await db.collection('ratelimits').deleteMany({ _id: /^(calc|res|lead):(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$|^leadmail:e2e-calcular@f0test\.example$/ })).deletedCount,
  };
  let metricas = 0;
  for (const d of await db.collection('metricas').find({ herramienta: { $in: ['rentabilidad'] } }).toArray()) {
    const antes = fotoMetricas[d._id];
    if (!antes) { await db.collection('metricas').deleteOne({ _id: d._id }); metricas++; continue; }
    const inc = Object.fromEntries(['resultado', 'compartir', 'lead'].map(k => [k, (antes[k] || 0) - (d[k] || 0)]).filter(([, v]) => v));
    if (Object.keys(inc).length) { await db.collection('metricas').updateOne({ _id: d._id }, { $inc: inc }); metricas++; }
  }
  console.log('\nlimpieza (solo lo creado en esta corrida):', JSON.stringify({ ...borrados, metricasRestauradas: metricas }));
  await cliente.close();
}
const fallas = resultados.filter(([, o]) => !o).length;
console.log(`\n${n - fallas}/${n} verificaciones OK`); process.exit(fallas ? 1 : 0);
