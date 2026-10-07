// Pruebas de la acción `calcular` (S6): entrada del navegador → validación → motor → resultado → vista → persistencia → link.
// Correr: node --test backend/test/calcular.test.mjs
// Usan manejar() (la lógica real del endpoint) con una base EN MEMORIA: sin red ni Mongo, deterministas. El HTTP real se prueba con tools/e2e-calcular.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { manejar } from '../lib/herramientas.js';
import { calcularYGuardar, podar, MAX_DATOS, MAX_ENTRADA } from '../lib/rentabilidad.js';
import { limpiarResumen } from '../lib/resultados.js';
import { evaluar } from '../lib/motor/economia.js';
import { resolverObjetivos } from '../lib/motor/inversas.js';
import { resumenGuardable } from '../lib/motor/vista.js';
import { MOTOR_VERSION } from '../lib/motor/version.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = r => readFileSync(join(AQUI, '..', r), 'utf8');
const clon = x => structuredClone(x);

// ── doble de base de datos: las operaciones que de verdad usan http.js, resultados.js y herramientas.js ──
const coincide = (d, q) => Object.entries(q).every(([k, v]) => (v && typeof v === 'object' && '$gt' in v) ? d[k] > v.$gt : d[k] === v);
class Col {
  constructor() { this.docs = []; }
  async createIndex() {}
  async insertOne(d) { const doc = { ...structuredClone(d) }; if (doc._id === undefined) doc._id = this.docs.length + 1; this.docs.push(doc); return { insertedId: doc._id }; }
  async findOne(q) { const d = this.docs.find(x => coincide(x, q)); return d ? structuredClone(d) : null; }
  aplicar(d, u) { for (const [k, v] of Object.entries(u.$set || {})) d[k] = v; for (const [k, v] of Object.entries(u.$inc || {})) d[k] = (d[k] || 0) + v; }
  async findOneAndUpdate(q, u, o) { const d = this.docs.find(x => coincide(x, q)); if (!d) return null; const antes = structuredClone(d); this.aplicar(d, u); return o?.returnDocument === 'after' ? structuredClone(d) : antes; }
  async updateOne(q, u, o) {
    let d = this.docs.find(x => coincide(x, q));
    if (!d) { if (!o?.upsert) return { matchedCount: 0 }; d = { _id: q._id, ...(u.$setOnInsert || {}) }; this.docs.push(d); }
    this.aplicar(d, u); return { matchedCount: 1 };
  }
}
const nuevaDb = () => { const c = {}; return { colecciones: c, collection: n => (c[n] ||= new Col()) }; };
const res = () => { const r = { code: 200, body: null, headers: {} }; r.status = c => { r.code = c; return r; }; r.json = b => { r.body = b; return r; }; r.end = () => r; r.setHeader = () => r; return r; };
const pedir = async (db, { method = 'POST', action = 'calcular', body, query = {}, ip = '10.0.0.1' }) => {
  const r = res(); await manejar({ method, query: { action, ...query }, body, headers: {}, socket: { remoteAddress: ip } }, r, db); return r;
};
const resultados = db => db.colecciones.resultados?.docs ?? [];

// Caso A (monotributo): ganancia 3.635 · piso 10.594
const A = (extra = {}) => ({ precio: 15000, fiscal: { regimen: 'monotributo' }, costo: { producto: 6000, ivaIncluido: true }, canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'incluido' }, impuestosVentaPct: 0.035, ...extra });

// ═══ cálculo válido por la API ═══
test('cálculo válido: 201, id, link compartible, resultado del motor y versión', async () => {
  const db = nuevaDb(), r = await pedir(db, { body: { entrada: A() } });
  assert.equal(r.code, 201); assert.equal(r.body.ok, true);
  assert.match(r.body.resultadoId, /^[A-Za-z0-9_-]{8,16}$/); assert.equal(r.body.url, `/herramientas.html?r=${r.body.resultadoId}`);
  assert.equal(r.body.resultado.ganancia, 3635); assert.equal(r.body.resultado.margenNeto, 3635 / 15000);
  assert.equal(r.body.objetivos.precioPiso.equilibrio.precio, 10594); assert.equal(r.body.objetivos.costoMaximoProveedor.costoMaximo, 9635);
  assert.deepEqual(r.body.motor, { version: MOTOR_VERSION });
  assert.equal(r.body.resumen.titulo, 'Rentabilidad: $ 3.635 por unidad (24,2% de margen)');
  assert.equal(r.body.entrada.fiscal.regimen, 'monotributo');
  assert.deepEqual(JSON.parse(JSON.stringify(r.body)), r.body, 'la respuesta es JSON puro');
});

// ═══ entrada inválida ═══
test('entrada inválida: 400 con los errores por campo y NADA se persiste', async () => {
  const db = nuevaDb();
  const casos = [
    [{ entrada: A({ canal: { ventaPct: 14, ivaModo: 'incluido' } }) }, ['canal.ventaPct:PORCENTAJE_FUERA_DE_RANGO']],
    [{ entrada: A({ precio: -5 }) }, ['precio:MONTO_FUERA_DE_RANGO']],
    [{ entrada: A({ fiscal: {} }) }, ['fiscal.regimen:REGIMEN_INVALIDO']],
    [{ entrada: A({ canal: { ventaPct: 0.14, fijo: 2740 } }) }, ['canal.ivaModo:IVA_MODO_REQUERIDO']],
    [{ entrada: A({ precio: '15000' }) }, ['precio:TIPO_INVALIDO']],
  ];
  for (const [body, esperado] of casos) {
    const r = await pedir(db, { body });
    assert.equal(r.code, 400); assert.equal(r.body.ok, false); assert.equal(r.body.code, 'entrada_invalida');
    assert.deepEqual(r.body.errores.map(e => `${e.campo}:${e.codigo}`), esperado); assert.ok(r.body.errores.every(e => e.texto));
    assert.equal(r.body.resultadoId, undefined);
  }
  for (const body of [undefined, null, {}, { entrada: null }, { entrada: 'x' }, { entrada: 42 }, { entrada: [] }, { resultado: { ganancia: 5 } }]) {
    const r = await pedir(db, { body }); assert.equal(r.code, 400, JSON.stringify(body)); assert.equal(r.body.code, 'entrada_invalida');
  }
  assert.equal(resultados(db).length, 0, 'ningún resultado inválido llega a la base');
  assert.equal(db.colecciones.metricas, undefined, 'ni cuenta como uso');
});

// ═══ el servidor recalcula ═══
test('EL SERVIDOR RECALCULA: métricas falsas del cliente (en el cuerpo o dentro de la entrada) se ignoran por completo', async () => {
  const limpia = nuevaDb(), sucia = nuevaDb();
  const a = await pedir(limpia, { body: { entrada: A() } });
  const falsas = { ganancia: 1e9, margen: 0.99, margenNeto: 0.99, markup: 99, precioPiso: 1, precioEquilibrio: 1, acosEquilibrio: 9, costoMaximo: 1e9, unidadesEquilibrio: 1,
    resultado: { ganancia: 1e9, margenNeto: 0.99 }, objetivos: { precioPiso: { equilibrio: { precio: 1 } } }, resumen: { titulo: 'FALSO', veredicto: 'FALSO' }, motor: { version: '9.9.9' }, resultadoId: 'FALSO', url: '/falso', datos: { x: 1 } };
  const b = await pedir(sucia, { body: { ...falsas, entrada: { ...A(), ...falsas } } });
  assert.equal(b.code, 201);
  assert.equal(b.body.resultado.ganancia, 3635); assert.equal(b.body.resumen.titulo, a.body.resumen.titulo); assert.equal(b.body.motor.version, MOTOR_VERSION);
  assert.deepEqual(b.body.entrada, a.body.entrada, 'la entrada normalizada no arrastra nada de lo falso');
  assert.deepEqual(b.body.resultado, a.body.resultado); assert.deepEqual(b.body.objetivos, a.body.objetivos); assert.deepEqual(b.body.resumen, a.body.resumen);
  assert.notEqual(b.body.resultadoId, 'FALSO');
  const da = resultados(limpia)[0], db_ = resultados(sucia)[0];
  assert.deepEqual(db_.datos, da.datos, 'lo persistido es idéntico al de la entrada limpia'); assert.deepEqual(db_.resumen, da.resumen);
  assert.doesNotMatch(JSON.stringify(db_), /FALSO|9\.9\.9|1000000000/);
});
test('la única puerta de entrada es `entrada`: el código del endpoint no lee ninguna otra cosa del cuerpo', () => {
  const man = leer('lib/herramientas.js'), rent = leer('lib/rentabilidad.js');
  const bloque = man.slice(man.indexOf("action === 'calcular'"), man.indexOf("return res.status(405)"));
  assert.deepEqual([...bloque.matchAll(/req\.body[?.]*(\w*)/g)].map(m => m[1]), ['entrada']);
  assert.doesNotMatch(bloque, /ganancia|margen|precioPiso|resultado\b|objetivos|resumen/);
  assert.equal(calcularYGuardar.length, 2, 'calcularYGuardar(db, entrada): no recibe resultados');
  assert.doesNotMatch(rent, /req\.|body\./);
});

// ═══ persistencia, link y versión ═══
test('PERSISTENCIA: qué queda guardado, con qué forma y con la versión del motor', async () => {
  const db = nuevaDb(), r = await pedir(db, { body: { entrada: A({ unidades: 3, publicidad: { acos: 0.1, ivaModo: 'incluido' }, objetivo: { margenPct: 0.2 }, fijosMes: 50000 }) } });
  const docs = resultados(db); assert.equal(docs.length, 1);
  const d = docs[0];
  assert.equal(d._id, r.body.resultadoId); assert.equal(d.herramienta, 'rentabilidad'); assert.equal(d.fuente, 'reglas');
  assert.equal(d.entrada, 'Precio $ 15.000 · Monotributo · 3 u.');
  assert.deepEqual(Object.keys(d.datos), ['motor', 'entradaDeclarada', 'entrada', 'resultado', 'objetivos']);
  assert.deepEqual(d.datos.motor, { version: MOTOR_VERSION });
  assert.deepEqual(d.datos.entrada, r.body.entrada); assert.equal(d.datos.entrada.unidades, 3);
  assert.equal('entrada' in d.datos.resultado, false, 'la entrada se guarda una sola vez');
  assert.equal(d.datos.resultado.ok, true); assert.equal(d.datos.resultado.ganancia, 2135); assert.equal(d.datos.resultado.gananciaTotal, 6405);   // 3.635 − 10% de ACOS sobre 15.000 = 2.135 · × 3 unidades
  assert.ok(Array.isArray(d.datos.resultado.costos) && d.datos.resultado.costos.length === 8); assert.ok(Array.isArray(d.datos.resultado.supuestos));
  assert.deepEqual(d.resumen, r.body.resumen); assert.deepEqual(limpiarResumen(d.resumen), d.resumen);
  assert.ok(d.creadoEn instanceof Date && d.expiraEn instanceof Date);
  assert.equal(Math.round((d.expiraEn - d.creadoEn) / 86400000), 90, 'vive 90 días');
  assert.deepEqual(JSON.parse(JSON.stringify(d.datos)), d.datos, 'JSON puro (sin Infinity ni undefined)');
  assert.equal(db.colecciones.metricas.docs[0].herramienta, 'rentabilidad'); assert.equal(db.colecciones.metricas.docs[0].resultado, 1);
});
test('RECUPERACIÓN POR LINK: GET resultado devuelve exactamente lo guardado', async () => {
  const db = nuevaDb(), p = await pedir(db, { body: { entrada: A() } });
  const g = await pedir(db, { method: 'GET', action: 'resultado', query: { id: p.body.resultadoId } });
  assert.equal(g.code, 200); assert.equal(g.body.id, p.body.resultadoId); assert.equal(g.body.herramienta, 'rentabilidad');
  assert.deepEqual(g.body.resumen, p.body.resumen); assert.deepEqual(g.body.datos, resultados(db)[0].datos);
  assert.deepEqual(g.body.datos.entrada, p.body.entrada); assert.deepEqual(g.body.datos.objetivos, p.body.objetivos); assert.equal(g.body.datos.motor.version, MOTOR_VERSION);
  assert.equal((await pedir(db, { method: 'GET', action: 'resultado', query: { id: 'noexiste123' } })).code, 404);
  assert.equal((await pedir(db, { method: 'GET', action: 'resultado', query: { id: '../../etc' } })).code, 404);
});
test('REPRODUCIBLE: desde lo declarado y la versión guardadas se obtiene EXACTAMENTE el mismo resultado, supuestos y avisos incluidos', async () => {
  const db = nuevaDb(), entradas = [A(), A({ unidades: 4, publicidad: { acos: 0.12, ivaModo: 'incluido' }, objetivo: { margenPct: 0.2, gananciaUnidad: 900, gananciaMes: 40000 }, fijosMes: 80000 }),
    { precio: 12100, fiscal: { regimen: 'ri' }, costo: { producto: 5000, ivaIncluido: false }, canal: { ventaPct: 0.14, ivaModo: 'adicional' }, impuestosVentaPct: 0.03 },
    { precio: 100, fiscal: { regimen: 'sin_iva' }, costo: { producto: 40 } }];                 // sin canal ni impuestos: genera avisos
  for (const e of entradas) {
    const p = await pedir(db, { body: { entrada: e } }), g = (await pedir(db, { method: 'GET', action: 'resultado', query: { id: p.body.resultadoId } })).body, d = g.datos;
    assert.equal(d.motor.version, MOTOR_VERSION);
    const r = evaluar(d.entradaDeclarada), { entrada, ...resultado } = r;                     // se vuelve a correr el motor con lo guardado
    assert.deepEqual(entrada, d.entrada); assert.deepEqual(resultado, d.resultado, 'incluye supuestos y advertencias');
    const o = resolverObjetivos(entrada); assert.deepEqual(o, d.objetivos);
    assert.deepEqual(limpiarResumen(resumenGuardable(r, o)), g.resumen);
  }
});
test('HALLAZGO DE S6: la entrada NORMALIZADA reproduce los números pero NO los supuestos ni los avisos (por eso se guarda también lo declarado)', async () => {
  const db = nuevaDb(), p = await pedir(db, { body: { entrada: { precio: 100, fiscal: { regimen: 'sin_iva' }, costo: { producto: 40 } } } });   // sin unidades, canal ni impuestos
  const d = resultados(db)[0].datos, { entrada, ...desdeNormalizada } = evaluar(d.entrada);
  assert.deepEqual({ ...desdeNormalizada, supuestos: null, advertencias: null }, { ...d.resultado, supuestos: null, advertencias: null }, 'todos los números coinciden');
  assert.ok(d.resultado.supuestos.length > 0 && d.resultado.advertencias.length > 0, 'el resultado original SÍ tenía supuestos y avisos');
  assert.deepEqual(desdeNormalizada.supuestos, [], 'recalculado desde lo normalizado, los supuestos desaparecen');
  assert.deepEqual(desdeNormalizada.advertencias, [], 'y los avisos también');
  assert.deepEqual(d.resultado.advertencias.map(a => a.codigo).sort(), ['CANAL_NO_DECLARADO', 'IMPUESTOS_NO_DECLARADOS']);
  void p;
});
test('lo declarado no arrastra claves ajenas ni métricas del cliente, y conserva la diferencia entre «no declarado» y «declarado en 0»', async () => {
  const db = nuevaDb();
  await pedir(db, { body: { entrada: { ...A(), ganancia: 9e9, extra: { x: 1 }, fiscal: { regimen: 'monotributo', ganancia: 5 }, costo: { producto: 6000, ivaIncluido: true, extras: [{ nombre: 'Caja', monto: 100, ivaIncluido: true, basura: 'x' }] } } } });
  const d = resultados(db)[0].datos.entradaDeclarada;
  assert.deepEqual(d, { precio: 15000, fiscal: { regimen: 'monotributo' }, costo: { producto: 6000, ivaIncluido: true, extras: [{ nombre: 'Caja', monto: 100, ivaIncluido: true }] }, canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'incluido' }, impuestosVentaPct: 0.035 });
  assert.equal('unidades' in d, false, 'lo que no se declaró no aparece');
  await pedir(db, { body: { entrada: A({ impuestosVentaPct: 0, devolucionesPct: 0 }) } });
  const cero = resultados(db)[1].datos.entradaDeclarada;
  assert.equal(cero.impuestosVentaPct, 0); assert.equal(cero.devolucionesPct, 0);                // un 0 declarado se conserva (≠ ausente)
  assert.deepEqual(resultados(db)[1].datos.resultado.advertencias, [], 'y un 0 declarado no dispara el aviso de impuestos');
  assert.deepEqual(podar({ a: 1, b: undefined, c: { z: 1, k: 2 } }, { a: 0, b: 0, c: { k: 0 } }), { a: 1, c: { k: 2 } });
});

// ═══ paridad: cálculo directo del motor == cálculo por la API ═══
function prng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
test('PARIDAD (300 entradas con semilla fija): lo que devuelve y guarda la API es EXACTAMENTE lo que da el motor directo', async () => {
  const rnd = prng(20261007), pick = a => a[Math.floor(rnd() * a.length)], en = (lo, hi) => lo + rnd() * (hi - lo);
  const db = nuevaDb(); let validas = 0, invalidas = 0;
  for (let i = 0; i < 300; i++) {
    const regimen = pick(['monotributo', 'ri', 'sin_iva']), modo = () => pick(['incluido', 'adicional', 'sin']), precio = Math.round(en(-500, 200000)), unidades = rnd() < 0.2 ? en(1, 5) : Math.floor(en(1, 40));
    const e = {
      precio, unidades, fiscal: { regimen }, costo: { producto: Math.round(Math.abs(precio) * en(0.05, 0.9)), ivaIncluido: rnd() < 0.5 },
      canal: { ventaPct: en(0.02, rnd() < 0.05 ? 14 : 0.3), financiacionPct: rnd() < 0.4 ? en(0, 0.1) : 0, fijo: rnd() < 0.5 ? Math.round(en(0, 3000)) : [{ hasta: Math.round(en(3000, 100000)), monto: Math.round(en(0, 1500)) }, { hasta: null, monto: Math.round(en(1500, 4000)) }], envio: Math.round(en(0, 4000)), ivaModo: modo() },
      publicidad: { acos: rnd() < 0.5 ? en(0, 0.3) : 0, ivaModo: modo() }, impuestosVentaPct: rnd() < 0.9 ? en(0, 0.1) : undefined, fijosMes: rnd() < 0.5 ? Math.round(en(0, 300000)) : 0,
      objetivo: { margenPct: rnd() < 0.6 ? en(0, 0.4) : null, gananciaUnidad: rnd() < 0.4 ? Math.round(en(0, 3000)) : null, gananciaMes: rnd() < 0.4 ? Math.round(en(0, 500000)) : null },
    };
    const directo = evaluar(clon(e)), api = await pedir(db, { body: { entrada: clon(e) }, ip: `10.0.${Math.floor(i / 30)}.${i % 30}` });
    if (!directo.ok) {
      invalidas++; assert.equal(api.code, 400); assert.deepEqual(api.body.errores, directo.errores); assert.deepEqual(api.body.advertencias, directo.advertencias); continue;
    }
    validas++;
    const { entrada, ...resultado } = directo, objetivos = resolverObjetivos(entrada);
    assert.equal(api.code, 201); assert.deepEqual(api.body.entrada, entrada); assert.deepEqual(api.body.resultado, resultado); assert.deepEqual(api.body.objetivos, objetivos);
    assert.deepEqual(api.body.resumen, limpiarResumen(resumenGuardable(directo, objetivos)));
    const guardado = resultados(db).find(x => x._id === api.body.resultadoId);
    assert.deepEqual(guardado.datos, { motor: directo.motor, entradaDeclarada: JSON.parse(JSON.stringify(e)), entrada, resultado, objetivos }); assert.notEqual(guardado.datos, null);
  }
  assert.ok(validas > 180 && invalidas > 20, `muestra significativa (${validas} válidas, ${invalidas} inválidas)`);
  assert.equal(resultados(db).length, validas, 'solo se persisten las válidas');
});

// ═══ límites ═══
test('LÍMITES: entrada enorme → 413 sin persistir; el peor caso legítimo cabe y NO pierde datos', async () => {
  const db = nuevaDb();
  const enorme = await pedir(db, { body: { entrada: { ...A(), basura: 'x'.repeat(MAX_ENTRADA) } } });
  assert.equal(enorme.code, 413); assert.equal(enorme.body.code, 'entrada_grande'); assert.equal(resultados(db).length, 0);
  const peor = A({ unidades: 5000, fiscal: { regimen: 'ri' }, costo: { producto: 6000, ivaIncluido: false, extras: Array.from({ length: 20 }, (_, i) => ({ nombre: `Costo extra ${i}`.padEnd(60, 'x'), monto: 100 + i, ivaIncluido: true })) },
    canal: { ventaPct: 0.14, financiacionPct: 0.05, fijo: Array.from({ length: 9 }, (_, i) => ({ hasta: 2000 * (i + 1), monto: 1000 + i })).concat([{ hasta: null, monto: 3000 }]), envio: Array.from({ length: 9 }, (_, i) => ({ hasta: 2500 * (i + 1), monto: 500 + i })).concat([{ hasta: null, monto: 2500 }]), ivaModo: 'incluido' },
    publicidad: { acos: 0.1, ivaModo: 'incluido' }, devolucionesPct: 0.01, fijosMes: 100000, objetivo: { margenPct: 0.2, gananciaUnidad: 1000, gananciaMes: 500000 } });
  const r = await pedir(db, { body: { entrada: peor } });
  assert.equal(r.code, 201); const d = resultados(db)[0].datos;
  assert.notEqual(d, null, 'guardarResultado descarta `datos` en silencio si pasan de 20.000: acá no puede pasar');
  assert.ok(JSON.stringify(d).length < MAX_DATOS * 0.85, `el peor caso ocupa ${JSON.stringify(d).length} de ${MAX_DATOS}`);
  assert.ok(JSON.stringify(peor).length < MAX_ENTRADA * 0.5);
  assert.equal(d.resultado.costos.length, 8 + 20);
});
test('LÍMITE DE TASA: 30 cálculos por hora por IP, y otra IP no se ve afectada', async () => {
  const db = nuevaDb();
  for (let i = 0; i < 30; i++) assert.equal((await pedir(db, { body: { entrada: A() }, ip: '9.9.9.9' })).code, 201, `pedido ${i + 1}`);
  const r = await pedir(db, { body: { entrada: A() }, ip: '9.9.9.9' });
  assert.equal(r.code, 429); assert.match(r.body.error, /muchas veces/); assert.equal(resultados(db).length, 30, 'el pedido 31 no calculó ni guardó nada');
  assert.equal((await pedir(db, { body: { entrada: A() }, ip: '8.8.8.8' })).code, 201);
});
test('método y acción: GET calcular no existe', async () => {
  const r = await pedir(nuevaDb(), { method: 'GET', action: 'calcular' });
  assert.equal(r.code, 405); assert.equal((await pedir(nuevaDb(), { method: 'POST', action: 'otra' })).code, 405);
});

// ═══ reutiliza F0/F0.1 ═══
test('REUTILIZA F0: el lead después del resultado funciona con un resultado de rentabilidad (sin tocar el sistema de leads)', async () => {
  const db = nuevaDb(), p = await pedir(db, { body: { entrada: A() } });
  const l = await pedir(db, { action: 'lead', body: { resultadoId: p.body.resultadoId, email: 'ana@f0test.example', nombre: 'Ana' } });
  assert.equal(l.code, 201); assert.equal(l.body.ok, true);
  const m = db.colecciones.messages.docs[0];
  assert.equal(m.herramienta, 'rentabilidad'); assert.equal(m.resultadoId, p.body.resultadoId); assert.equal(m.reason, 'herramienta');
  assert.match(m.message, /Rentabilidad: \$ 3\.635 por unidad/); assert.match(m.message, /\[OK\] Ganancia por unidad: \$ 3\.635/); assert.match(m.message, /Precio mínimo para no perder: \$ 10\.594/);
  assert.equal(db.colecciones.metricas.docs.find(x => x.herramienta === 'rentabilidad').lead, 1);
});
test('REGRESIÓN F0 por el endpoint: evento, resultado inexistente, lead inválido y honeypot siguen igual tras mover la lógica a lib/', async () => {
  const db = nuevaDb(), p = await pedir(db, { body: { entrada: A() } });
  assert.equal((await pedir(db, { action: 'evento', body: { herramienta: 'rentabilidad', evento: 'compartir' } })).code, 200);
  assert.equal(db.colecciones.metricas.docs[0].compartir, 1);
  assert.equal((await pedir(db, { action: 'lead', body: { resultadoId: p.body.resultadoId, email: 'no-es-mail' } })).code, 400);
  assert.equal((await pedir(db, { action: 'lead', body: { resultadoId: 'noexiste1', email: 'b@f0test.example' } })).code, 404);
  const hp = await pedir(db, { action: 'lead', body: { resultadoId: p.body.resultadoId, email: 'bot@f0test.example', website: 'x' } });
  assert.equal(hp.code, 200); assert.equal(db.colecciones.messages, undefined, 'el honeypot no guarda nada');
  assert.equal((await pedir(db, { action: 'resultado', method: 'POST' })).code, 405);
});
test('ESTRUCTURA: api/herramientas.js es un envoltorio fino y lib/herramientas.js no toca la base real', () => {
  const api = leer('api/herramientas.js'), lib = leer('lib/herramientas.js');
  assert.match(api, /import \{ manejar \} from '\.\.\/lib\/herramientas\.js'/); assert.match(api, /return manejar\(req, res, db\)/); assert.ok(api.split('\n').length < 25);
  assert.doesNotMatch(lib, /getDB|mongodb|\.\/db\.js/);
});
