// Piso de calidad de la primera tanda de contenido real: 9 tipos de producto y 5 estilos de arquitectura.
// No cuenta fichas: exige que cada una explique lo que debe, separe lo documentado de lo que es criterio propio
// y no declare a ninguna arquitectura «la mejor» en abstracto.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKnowledge, loadKnowledge } from '../../frontend/js/architect/content.js';
import * as B from '../../frontend/js/architect/builder.js';
import { decide } from '../../frontend/js/architect/decide.js';
import { buildPack, packToMarkdown } from '../../frontend/js/architect/pack.js';

const FRONT = join(dirname(fileURLToPath(import.meta.url)), '../../frontend/');
const J = p => JSON.parse(readFileSync(FRONT + p, 'utf8'));
const K = buildKnowledge(await loadKnowledge(async p => J(p)));
const M = B.buildModel(J('data/architect/questions.json')), RULES = J('data/architect/rules.json'), PACK = J('data/architect/pack.json'), PROMPTS = J('data/architect/prompts.json');

const PRODUCTOS = ['landing', 'institutional-site', 'portfolio', 'ecommerce', 'booking', 'saas', 'dashboard', 'management-system', 'marketplace'];
const ARQUITECTURAS = ['monolith', 'modular-monolith', 'microservices', 'event-driven', 'web-queue-worker'];
const TANDA = [...PRODUCTOS, ...ARQUITECTURAS];
const todasLasFuentes = new Map(K.sources.map(s => [s.id, s]));

test('la primera tanda existe completa y cada concepto está en su dimensión', () => {
  for (const id of PRODUCTOS) assert.equal(K.get(id)?.type, 'product_type', id);
  for (const id of ARQUITECTURAS) assert.equal(K.get(id)?.type, 'architecture_style', id);
});

test('Portfolio es un tipo de producto propio: no es un sinónimo de Institucional ni de Landing', () => {
  const p = K.get('portfolio'), i = K.get('institutional-site'), l = K.get('landing');
  assert.notEqual(p.summary, i.summary); assert.notEqual(p.summary, l.summary);
  const alts = p.alternatives.map(a => a.id);
  assert.ok(alts.includes('institutional-site') && alts.includes('landing'), 'explica en qué se diferencia de ambos');
  assert.ok(i.alternatives.some(a => a.id === 'portfolio') && l.alternatives.some(a => a.id === 'portfolio'), 'los otros lo mencionan como alternativa');
  assert.ok(M.signals.product.values.includes('portfolio') && M.signals.product.values.includes('booking'));
});

test('cada concepto de la tanda cubre todo lo pedido (qué es, problema, cómo funciona, cuándo sí y no, pros, contras, trade-offs, alternativas, dos ejemplos, relaciones, niveles, fuentes)', () => {
  for (const id of TANDA) {
    const e = K.get(id), at = id;
    assert.equal(e.depth, 'full', at);
    assert.ok(e.summary.length > 40 && e.problem_solved.length > 40, `${at}: resumen y problema`);
    assert.ok(e.explanation.length >= 3 && e.explanation.every(t => t.length > 80), `${at}: explicación`);
    assert.ok(e.how_it_works.length >= 3, `${at}: cómo funciona`);
    assert.ok(e.when_to_use.length >= 3 && e.when_not_to_use.length >= 2, `${at}: cuándo sí y cuándo no`);
    assert.ok(e.pros.length >= 3 && e.cons.length >= 3, `${at}: ventajas y desventajas`);
    assert.ok(e.tradeoffs.length >= 2, `${at}: trade-offs`);
    assert.ok(e.alternatives.length >= 2 && e.alternatives.every(a => a.note.length > 40), `${at}: alternativas con su nota`);
    assert.ok(e.common_mistakes.length >= 3 && e.decision_questions.length >= 3, `${at}: errores y preguntas`);
    assert.ok(e.related_entities.length >= 4, `${at}: relaciones`);
    const kinds = e.examples.map(x => x.kind);
    assert.ok(kinds.includes('educational_example') && kinds.includes('conceptual_example'), `${at}: ejemplo sencillo y ejemplo aplicado a un proyecto realista`);
    assert.ok(!kinds.includes('real_project'), `${at}: no se inventan proyectos reales`);
    assert.ok([1, 2, 3, 4].includes(e.practical_level) && ['beginner', 'intermediate', 'advanced'].includes(e.level), `${at}: niveles`);
  }
});

test('las arquitecturas declaran su justificación y los tipos de producto no', () => {
  for (const id of ARQUITECTURAS) assert.ok(['baseline', 'by_need', 'strong_reason'].includes(K.get(id).justification), id);
  for (const id of PRODUCTOS) assert.equal(K.get(id).justification, undefined, id);
});

test('hechos vs. criterio propio: cada fuente de la tanda es oficial, estándar o técnica reconocida y dice qué respalda', () => {
  const permitidas = ['standard', 'official_documentation', 'official_framework', 'expert_source', 'industry_practice'];
  for (const id of TANDA) {
    const e = K.get(id);
    assert.ok(e.sources.length >= 2, `${id}: necesita fuentes`);
    assert.deepEqual(Object.keys(e.source_notes || {}).sort(), [...e.sources].sort(), `${id}: cada fuente debe decir qué respalda y no sobrar notas`);
    for (const sid of e.sources) { assert.ok(permitidas.includes(todasLasFuentes.get(sid).evidence_type), `${id}/${sid}`); assert.ok(e.source_notes[sid].length > 40, `${id}/${sid}: nota`); }
  }
  // un tipo de producto es una recomendación propia aunque cite fuentes: nunca se presenta como estándar
  for (const id of PRODUCTOS) assert.equal(K.get(id).evidence_type, 'recommendation', id);
  assert.match(K.get('ecommerce').source_notes['pci-dss'], /recomendación nuestra/);
});

test('arquitecturas: «por qué elegirlo», «por qué NO elegirlo» y «cuándo una alternativa sería mejor», sin rankings', () => {
  for (const id of ARQUITECTURAS) {
    const e = K.get(id);
    assert.ok(e.when_to_use.length >= 3 && e.when_not_to_use.length >= 3, `${id}: razones a favor y en contra`);
    for (const a of e.alternatives) assert.match(a.note, /^Sería (mejor|un complemento)/, `${id} → ${a.id}: la nota debe decir cuándo esa alternativa sería mejor`);
    const texto = JSON.stringify(e).toLowerCase();
    assert.doesNotMatch(texto, /\bla mejor arquitectura\b|\bel mejor estilo\b|\branking\b|\bpuntaje\b|\b\d+\s*\/\s*10\b/, `${id}: sin rankings arbitrarios`);
    assert.doesNotMatch(texto, /\bsiempre (es|conviene|elegí)\b/, `${id}: sin verdades universales`);
  }
  // el contenido de «microservicios» se queda en la base aunque no se recomiende por defecto
  assert.equal(K.get('microservices').justification, 'strong_reason');
});

test('los tipos de producto nuevos funcionan de punta a punta en el Project Builder, con complejidad y pack coherentes', () => {
  const correr = a => { let st = B.emptyState(); for (const [q, v] of Object.entries({ idea: 'x', users: 'y', team: 'solo', scale: 'small', ...a })) { const r = B.setAnswer(M, st, q, v); assert.equal(r.error, null, `${q}=${v}`); st = r.state; } const res = decide(RULES, K, B.resolve(M, st)); return { st, res, d: id => res.decisions.find(x => x.id === id).picks.map(p => p.id) }; };
  const por = correr({ product: 'portfolio' });
  assert.equal(por.res.complexity.level, 1); assert.equal(por.d('architecture')[0], 'no-backend'); assert.ok(['ssg', 'static-site'].includes(por.d('rendering')[0]));
  const res = correr({ product: 'booking' });
  assert.equal(res.res.signals.capture, 'bookings'); assert.equal(res.res.source.capture, 'assumed');
  assert.equal(res.res.complexity.level, 2); assert.equal(res.d('architecture')[0], 'monolith'); assert.equal(res.d('data_store')[0], 'relational-database');
  assert.equal(res.res.decisions.find(x => x.id === 'architecture').alternatives.find(a => a.id === 'microservices').fit, 'not_needed');
  for (const x of [por, res]) {
    const md = packToMarkdown(buildPack({ M, state: x.st, res: x.res, K, packData: PACK, promptsData: PROMPTS, date: '2026-10-07' }));
    assert.doesNotMatch(md, /undefined|\[object|\{\{|NaN/);
  }
  assert.match(packToMarkdown(buildPack({ M, state: res.st, res: res.res, K, packData: PACK, promptsData: PROMPTS, date: '2026-10-07' })), /\*\*Reserva\*\*: servicio, recurso, cliente/);
});
