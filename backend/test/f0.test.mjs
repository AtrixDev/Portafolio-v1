// Pruebas de F0. Correr: node --test backend/test/f0.test.mjs   (no necesita Mongo ni red)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clasificarJSON } from '../lib/ia.js';
import { scorePublicacion, planDeAccion, noVerificables } from '../lib/audit.js';
import { guardarResultado, leerResultado, limpiarResumen, resumenChequeo, textoResultado } from '../lib/resultados.js';

const BACK = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── IA: nunca necesaria ──
const base = { prompt: 'x', validar: j => typeof j.tema === 'string', fallback: () => ({ tema: 'regla' }) };
const conClave = fn => async () => { process.env.GROQ_API_KEY = 'k'; try { await fn(); } finally { delete process.env.GROQ_API_KEY; } };
const respuesta = (ok, body) => async () => ({ ok, status: ok ? 200 : 500, json: async () => body });

test('sin GROQ_API_KEY devuelve el fallback determinista', async () => {
  delete process.env.GROQ_API_KEY;
  const r = await clasificarJSON({ ...base, fetchImpl: () => { throw new Error('no debería llamar a la red'); } });
  assert.deepEqual(r, { datos: { tema: 'regla' }, fuente: 'reglas', motivo: 'sin_clave' });
});
test('exige fallback y validar', async () => {
  await assert.rejects(() => clasificarJSON({ prompt: 'x', validar: () => true }), TypeError);
  await assert.rejects(() => clasificarJSON({ prompt: 'x', fallback: () => 1 }), TypeError);
});
test('con clave y JSON válido usa la IA', conClave(async () => {
  const r = await clasificarJSON({ ...base, fetchImpl: respuesta(true, { choices: [{ message: { content: 'Claro: {"tema":"ia"}' } }] }) });
  assert.equal(r.fuente, 'ia'); assert.equal(r.datos.tema, 'ia');
}));
test('JSON inválido, error HTTP o red caída → fallback', conClave(async () => {
  for (const [fetchImpl, motivo] of [
    [respuesta(true, { choices: [{ message: { content: 'sin json' } }] }), 'invalido'],
    [respuesta(true, { choices: [{ message: { content: '{"otro":1}' } }] }), 'invalido'],
    [respuesta(false, {}), 'http_500'],
    [() => { throw new Error('red'); }, 'error'],
  ]) {
    const r = await clasificarJSON({ ...base, fetchImpl });
    assert.equal(r.fuente, 'reglas'); assert.equal(r.motivo, motivo); assert.deepEqual(r.datos, { tema: 'regla' });
  }
}));

// ── Ninguna herramienta depende de Groq ──
test('GROQ_API_KEY solo se lee en lib/ia.js y en el título opcional de lib/audit.js', () => {
  const archivos = ['api', 'lib'].flatMap(d => readdirSync(join(BACK, d), { recursive: true }).filter(f => f.endsWith('.js')).map(f => join(d, f)));
  const usan = archivos.filter(f => readFileSync(join(BACK, f), 'utf8').includes('GROQ_API_KEY')).sort();
  assert.deepEqual(usan, ['lib/audit.js', 'lib/ia.js']);
  // tituloConIA ya devolvía null sin clave: el chequeo no la necesita
  assert.match(readFileSync(join(BACK, 'lib/audit.js'), 'utf8'), /if \(!key \|\| !item\.title \|\| item\._faltan\) return null;/);
  // las libs de resultados/correo y el endpoint nuevo no mencionan a Groq ni a la IA
  for (const f of ['lib/resultados.js', 'lib/correo.js', 'api/herramientas.js']) assert.doesNotMatch(readFileSync(join(BACK, f), 'utf8'), /groq|clasificarJSON|lib\/ia/i, f);
});

// ── Resultados (base falsa en memoria) ──
function fakeDb() {
  const cols = {};
  const col = n => cols[n] ||= {
    docs: new Map(),
    async createIndex() {}, async insertOne(d) { this.docs.set(d._id, structuredClone(d)); },
    async findOne(q) { return this.docs.get(q._id) ?? null; },
    async updateOne(q, u, o) {
      let d = this.docs.get(q._id);
      if (!d) { if (!o?.upsert) return; d = { _id: q._id, ...(u.$setOnInsert || {}) }; this.docs.set(d._id, d); }
      for (const [k, v] of Object.entries(u.$inc || {})) d[k] = (d[k] || 0) + v;
    },
  };
  return { collection: col, _cols: cols };
}

test('guardar → leer: el servidor es la única fuente, y se cuenta la métrica', async () => {
  const db = fakeDb();
  const resumen = resumenChequeo({ catalogo: true, item: { title: 'Cafetera X' }, datos: { fotos: 3, atributos: 22, descripcion: 0, opiniones: null, preguntas: 4 } });
  const g = await guardarResultado(db, { herramienta: 'chequeo', entrada: 'MLA1', resumen, datos: { a: 1 } });
  assert.match(g.id, /^[A-Za-z0-9_-]{8,16}$/); assert.equal(g.url, `/herramientas.html?r=${g.id}`);
  const r = await leerResultado(db, g.id);
  assert.equal(r.resumen.titulo, 'Cafetera X'); assert.equal(r.fuente, 'reglas'); assert.equal(r.herramienta, 'chequeo');
  assert.equal(r.resumen.puntos.find(p => p.t === '3 fotos').ok, false);
  assert.equal(r.resumen.puntos.find(p => p.t === '22 atributos').ok, true);
  assert.match(r.resumen.veredicto, /2 de 3 puntos necesitan trabajo/); assert.doesNotMatch(r.resumen.veredicto, /están bien/);
  const m = [...db._cols.metricas.docs.values()][0]; assert.equal(m.resultado, 1); assert.equal(m.herramienta, 'chequeo');
  assert.match(textoResultado(r, 'https://x/y'), /\[ATENCIÓN\] 3 fotos: Lo ideal son 7 o más[\s\S]*Resultado completo: https:\/\/x\/y/);
});
test('rechaza herramientas desconocidas e ids inválidos o inexistentes', async () => {
  const db = fakeDb();
  await assert.rejects(() => guardarResultado(db, { herramienta: 'hack', entrada: '', resumen: {} }));
  for (const id of [undefined, '', 'x', '../../etc', 'a'.repeat(40), 'noexiste1']) assert.equal(await leerResultado(db, id), null);
});
test('limpiarResumen recorta, normaliza y descarta basura', () => {
  const r = limpiarResumen({ titulo: 'T'.repeat(500), veredicto: 'v', numero: 'NaN', puntos: [{ ok: 'sí', t: 'a' }, { t: '' }, ...Array(20).fill({ ok: true, t: 'b' })] });
  assert.equal(r.titulo.length, 160); assert.equal(r.numero, null); assert.equal(r.puntos[0].ok, null); assert.equal(r.puntos.length, 8);
});
test('si no se puede leer nada, el veredicto lo dice y no inventa', () => {
  const r = resumenChequeo({ item: {}, datos: {} });
  assert.equal(r.puntos.length, 0); assert.match(r.veredicto, /No pude leer datos/);
});

// ═══ F0.1 — honestidad: nada de puntajes sobre poca evidencia ═══
// Objeto real que arma leerPublico() para MLA930748913 (publicación ajena, /items da 403): solo se lee la descripción
const AJENA = { id: 'MLA930748913', title: 'Lampara infrarroja calor erizo tortuga reptiles pajaros 75 w', price: null, status: undefined, available_quantity: null, sold_quantity: null,
  pictures: [], attributes: [], warranty: null, descripcion: 'x'.repeat(3347), _source: 'ml-api-publico', _titulo_del_link: true,
  _faltan: ['fotos', 'stock', 'estado', 'atributos', 'garantia', 'titulo'], _extras: { visitas: 163, preguntas: 0, opiniones: null, rating: null } };
// Publicación propia con datos completos (la de la cuenta de prueba): debe seguir dando 90
const PROPIA = { id: 'MLA1', title: 'Bajo Eléctrico Kramer Xl 1 Usado 4 Cuerdas Diestro Azul Petróleo Laqueado 4', status: 'active', available_quantity: 1,
  pictures: Array(6).fill({ secure_url: 'u' }), attributes: Array(14).fill({ value_name: 'v' }), descripcion: 'd'.repeat(262), warranty: 'Garantía del vendedor: 2 días' };

test('el 100/100 engañoso desapareció: 1 de 8 criterios → score null', () => {
  const s = scorePublicacion(AJENA);
  assert.equal(s.score, null);
  assert.deepEqual(s.cobertura, { verificados: 1, total: 8, peso: 20 });
  assert.equal(s.checks.descripcion, true);
  assert.equal(Object.values(s.checks).filter(v => v === null).length, 7);
  assert.deepEqual([s.problemas, s.mejoras], [[], []]);
});
test('regresión: con datos completos el score no cambia (90) y la cobertura es total', () => {
  const s = scorePublicacion(PROPIA);
  assert.equal(s.score, 90); assert.deepEqual(s.cobertura, { verificados: 8, total: 8, peso: 100 });
});
test('catálogo sin ganador (peso 55) sigue dando puntaje', () => {
  assert.notEqual(scorePublicacion({ ...PROPIA, available_quantity: null, _datos_parciales: true }).score, null);
});
test('planDeAccion sin puntaje no dice «Sin acciones necesarias» ni inventa potencial', () => {
  const s = scorePublicacion(AJENA), p = planDeAccion(AJENA, s.score, s.problemas, s.mejoras, s.cobertura);
  assert.match(p.resumen, /No se puede calificar/); assert.match(p.resumen, /verifiqué 1 de 8 controles/);
  assert.equal(p.score_potencial, null); assert.equal(p.tiempo_total, 'Sin acciones con esta evidencia');
  assert.doesNotMatch(JSON.stringify(p), /Sin acciones necesarias|puede llegar a|100\/100/);
});
test('planDeAccion: «Sin acciones necesarias» solo si la cobertura es total', () => {
  const perfecta = { ...PROPIA, title: 'x'.repeat(58), pictures: Array(7).fill({ secure_url: 'u' }), available_quantity: 20 };
  const s = scorePublicacion(perfecta);
  assert.equal(planDeAccion(perfecta, s.score, s.problemas, s.mejoras, s.cobertura).tiempo_total, 'Sin acciones necesarias');
  assert.equal(planDeAccion(perfecta, s.score, s.problemas, s.mejoras, { verificados: 5, total: 8 }).tiempo_total, 'Sin acciones para lo verificado');
});
test('el resumen público dice «parcial», lista lo que no vio y no declara que está bien', () => {
  const rapido = { rapido: true, v: 2, catalogo: false, item: { title: AJENA.title }, cobertura: { verificados: 1, total: 8 }, noVerificado: noVerificables(AJENA),
    datos: { fotos: null, atributos: null, descripcion: 3347, opiniones: null, preguntas: 0, visitas: 163 } };
  const r = limpiarResumen(resumenChequeo(rapido));
  assert.equal(r.etiqueta, 'Auditoría parcial'); assert.equal(r.numero, null); assert.deepEqual(r.cobertura, { verificados: 1, total: 8 });
  assert.match(r.veredicto, /Auditoría parcial: Mercado Libre me dejó verificar 1 de 8 criterios\. No doy puntaje/);
  assert.doesNotMatch(r.veredicto, /están bien\.$|^Los puntos/);
  assert.deepEqual(r.noVerificado.map(x => x.t), ['Fotos', 'Stock', 'Estado (activa o pausada)', 'Atributos', 'Garantía', 'Título real', 'Opiniones de compradores']);
  assert.ok(r.noVerificado.every(x => x.s.length > 10));
  assert.deepEqual(r.puntos.map(x => x.t), ['Descripción de 3347 caracteres', '163 visitas', '0 preguntas']);
  assert.deepEqual(limpiarResumen(r), r, 'limpiar es idempotente: lo mostrado en vivo == lo guardado');
  assert.match(textoResultado({ resumen: r }, 'https://x'), /Lo que no pude ver:\n- Fotos: Mercado Libre solo deja leer esto al dueño/);
});
