// Pruebas del modelo de conocimiento de Web Project Architect (Fase 0).
// Correr: node --test backend/test/architect-modelo.test.mjs — puras y deterministas (leen los JSON del repo, sin red).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENTITY_TYPES, TYPE_IDS, EVIDENCE_TYPES, SOURCE_EVIDENCE, RELATIONS, EXAMPLE_KINDS, validateEntity, validateSource, validateKnowledge, SUMMARY_MAX } from '../../frontend/js/architect/model.js';
import { buildKnowledge, loadKnowledge } from '../../frontend/js/architect/content.js';
import { norm } from '../../frontend/js/architect/search.js';

const FRONT = join(dirname(fileURLToPath(import.meta.url)), '../../frontend/');
const leer = p => JSON.parse(readFileSync(FRONT + p, 'utf8'));
const raw = await loadKnowledge(async p => leer(p));
const K = buildKnowledge(raw);
const clon = x => structuredClone(x);
const E = id => clon(raw.entities.find(e => e.id === id));

// ═══ el contenido real es válido y coherente ═══
test('todo el contenido real pasa la validación del modelo', () => {
  assert.deepEqual(validateKnowledge(raw), []);
});

test('contenido inicial mínimo: los 30 conceptos pedidos existen, cada uno en su dimensión', () => {
  const pedido = {
    product_type: ['landing', 'institutional-site', 'ecommerce', 'saas', 'dashboard', 'management-system', 'marketplace'],
    architecture_style: ['monolith', 'modular-monolith', 'microservices', 'event-driven', 'web-queue-worker'],
    rendering_strategy: ['static-site', 'ssg', 'ssr', 'csr', 'hybrid-rendering'],
    data_pattern: ['relational-database', 'nosql-database', 'cache', 'object-storage', 'search-engine'],
    communication_pattern: ['http', 'rest-api', 'websocket', 'message-queue', 'pub-sub'],
    ai_workflow: ['ai-assisted-coding', 'ai-workflow'],
    ai_agent_pattern: ['ai-agent'],
  };
  for (const [tipo, ids] of Object.entries(pedido)) for (const id of ids) assert.equal(K.get(id)?.type, tipo, `${id} debería ser ${tipo}`);
  // y las demás piezas que el producto necesita para diferenciar enfoques de IA
  for (const id of ['ai-assistant', 'multi-agent']) assert.ok(K.get(id), id);
});

test('las dimensiones no se mezclan: tecnologías y conceptos son entidades distintas (PostgreSQL ≠ base relacional, SSR ≠ Next.js)', () => {
  assert.equal(K.get('postgresql').type, 'technology');
  assert.equal(K.get('relational-database').type, 'data_pattern');
  assert.equal(K.get('nextjs').type, 'technology');
  assert.equal(K.get('ssr').type, 'rendering_strategy');
  assert.equal(K.get('ecommerce').type, 'product_type');
  assert.equal(K.get('monolith').type, 'architecture_style');
  assert.equal(K.get('ai-agent').type, 'ai_agent_pattern');
  assert.equal(K.get('ai-assisted-coding').type, 'ai_workflow');
  assert.notEqual(K.get('ai-agent').type, K.get('ai-assisted-coding').type);
});

test('las tecnologías se derivan de «implements» y no al revés', () => {
  const ids = K.technologies('relational-database').map(t => t.id);
  assert.deepEqual(ids, ['postgresql']);
  assert.deepEqual(K.technologies('ssr').map(t => t.id), ['nextjs']);
  assert.ok(K.technologies('message-queue').some(t => t.id === 'rabbitmq'));
  assert.deepEqual(K.technologies('postgresql'), []);                       // una tecnología no tiene «tecnologías»
  assert.deepEqual(K.implementsOf('nextjs').map(c => c.id).sort(), ['hybrid-rendering', 'ssg', 'ssr']);
  for (const e of raw.entities) assert.ok(!('technologies' in e), `${e.id} no debe escribir technologies a mano`);
});

test('ninguna recomendación propia se presenta como estándar y cada afirmación respaldada tiene una fuente de ese tipo', () => {
  const srcById = new Map(raw.sources.map(s => [s.id, s]));
  for (const e of raw.entities) {
    if (SOURCE_EVIDENCE.includes(e.evidence_type)) assert.ok(e.sources.some(s => srcById.get(s).evidence_type === e.evidence_type), `${e.id}: ${e.evidence_type} sin fuente de ese tipo`);
  }
  // los tipos de producto son criterio propio: nunca «standard» ni «official_*»
  for (const e of K.byType('product_type')) assert.equal(e.evidence_type, 'recommendation', `${e.id} debe declararse como recomendación`);
  // los estándares reales son los que lo dicen sus fuentes (RFC, W3C, OWASP ASVS, ISO)
  for (const id of ['http', 'websocket', 'owasp-asvs', 'quality-accessibility']) assert.equal(K.get(id).evidence_type, 'standard', id);
});

test('ejemplos: ninguno se hace pasar por proyecto real (no se infiere experiencia)', () => {
  for (const e of raw.entities) for (const x of e.examples) {
    assert.ok(EXAMPLE_KINDS[x.kind], `${e.id}: kind inválido`);
    assert.notEqual(x.kind, 'real_project', `${e.id}: un ejemplo del modelo no puede declararse proyecto real sin verificación`);
  }
});

test('grafo conectado: ninguna entidad queda huérfana (todas se descubren desde otra)', () => {
  for (const e of K.entities) {
    const vecinos = K.neighbors(e.id).length + K.alternatives(e.id).length;
    assert.ok(vecinos > 0, `${e.id} no tiene ninguna relación ni alternativa`);
  }
});

test('las relaciones tienen lectura inversa y las simétricas no se duplican', () => {
  const rel = K.relations('message-queue').flatMap(g => g.items.map(i => [g.label, i.entity.id]));
  assert.ok(rel.some(([l, id]) => l === 'se contrasta con' && id === 'pub-sub'));
  assert.ok(rel.some(([l, id]) => l === 'habilita' && id === 'web-queue-worker'));
  // web-queue-worker «requires» message-queue → desde la cola se lee «es requerido por»
  assert.ok(rel.some(([l, id]) => l === 'es requerido por' && id === 'web-queue-worker'));
  assert.ok(rel.some(([l, id]) => l === 'se implementa con' && id === 'rabbitmq'));
  // contrasts_with es simétrica: pub-sub la declara y message-queue también; cada par aparece una sola vez
  const pares = rel.filter(([l, id]) => l === 'se contrasta con' && id === 'pub-sub');
  assert.equal(pares.length, 1);
});

test('las alternativas son simétricas aunque se declaren de un solo lado', () => {
  assert.ok(K.alternatives('csr').some(a => a.entity.id === 'ssr'));
  const a = K.alternatives('http').find(x => x.entity.id === 'message-queue');
  assert.ok(a && a.note.length > 10);                      // siempre explica EN QUÉ se diferencia
  for (const e of K.entities) for (const alt of K.alternatives(e.id)) assert.ok(alt.note.trim().length > 10, `${e.id}→${alt.entity.id} sin nota`);
});

test('library_refs apuntan a fichas reales de la Biblioteca web', () => {
  const idx = leer('data/weblab/index.json').entries.map(r => r[1]);
  for (const e of raw.entities) for (const ref of e.library_refs || []) assert.ok(idx.includes(ref), `${e.id}: «${ref}» no existe en la Biblioteca web`);
});

test('las fuentes son únicas, https y se usan; las que no se pudieron verificar quedan marcadas', () => {
  const usadas = new Set(raw.entities.flatMap(e => e.sources));
  for (const s of raw.sources) {
    assert.deepEqual(validateSource(s), [], s.id);
    assert.ok(usadas.has(s.id) || s.reserved_for, `fuente sin usar ni reservada para una función: ${s.id}`);
    assert.ok(s.verification === 'ok' ? !!s.checked : s.verification === 'blocked', `${s.id}: o está verificada (con fecha) o declara que no se pudo verificar`);
  }
  assert.equal(new Set(raw.sources.map(s => s.url)).size, raw.sources.length, 'URLs repetidas');
});

test('los textos largos son legibles: resumen acotado y fichas completas con profundidad', () => {
  for (const e of raw.entities) {
    assert.ok(e.summary.length <= SUMMARY_MAX, e.id);
    if (e.depth === 'full') { assert.ok(e.explanation.length >= 2 && e.pros.length >= 2 && e.cons.length >= 2 && e.examples.length >= 1, e.id); }
  }
  const total = K.entities.filter(e => e.depth === 'full').length;
  assert.ok(total >= 30, `fichas completas: ${total}`);
});

test('toda dimensión del modelo tiene rótulo en español y cada tipo usado existe', () => {
  for (const t of TYPE_IDS) { assert.ok(ENTITY_TYPES[t].label && ENTITY_TYPES[t].plural && ENTITY_TYPES[t].group, t); }
  for (const e of raw.entities) assert.ok(TYPE_IDS.includes(e.type));
  for (const k of Object.keys(EVIDENCE_TYPES)) assert.ok(EVIDENCE_TYPES[k].label && EVIDENCE_TYPES[k].help);
  assert.deepEqual(Object.keys(EVIDENCE_TYPES), ['standard', 'official_documentation', 'official_framework', 'expert_source', 'industry_practice', 'recommendation', 'example', 'opinion']);
  for (const r of Object.values(RELATIONS)) assert.ok(r.label && r.inverse);
});

// ═══ el validador rechaza lo que debe rechazar (cada caso rompe UNA cosa a propósito) ═══
const romper = (id, fn) => { const e = E(id); fn(e); return validateEntity(e).join(' | '); };
test('rechaza una entidad con id inválido, slug distinto, tipo desconocido o campos faltantes', () => {
  assert.match(romper('http', e => { e.id = 'HTTP raro'; }), /id debe ser un slug/);
  assert.match(romper('http', e => { e.slug = 'otro'; }), /slug debe ser igual a id/);
  assert.match(romper('http', e => { e.type = 'framework'; }), /type inválido/);
  assert.match(romper('http', e => { delete e.summary; }), /falta summary/);
  assert.match(romper('http', e => { e.summary = 'x'.repeat(SUMMARY_MAX + 1); }), /summary supera/);
  assert.match(romper('http', e => { e.pros = ['uno']; }), /pros debe ser una lista.*mínimo 2/);
  assert.match(romper('http', e => { e.level = 'experto'; }), /level inválido/);
  assert.match(romper('http', e => { e.evidence_type = 'verdad'; }), /evidence_type inválido/);
  assert.match(romper('http', e => { e.technologies = []; }), /technologies no se escribe a mano/);
});

test('rechaza relaciones mal formadas y ejemplos que fingen ser proyectos reales', () => {
  assert.match(romper('http', e => { e.related_entities[0].rel = 'inventada'; }), /rel inválida/);
  assert.match(romper('http', e => { e.alternatives[0] = { id: 'websocket' }; }), /necesita id y note/);
  assert.match(romper('http', e => { e.examples[0] = { kind: 'real_project', label: 'X', text: 'Y' }; }), /proyecto real exige url/);
  assert.match(romper('http', e => { e.examples[0] = { kind: 'caso_de_exito', label: 'X', text: 'Y' }; }), /kind inválido/);
  assert.equal(validateEntity((() => { const e = E('http'); e.examples[0] = { kind: 'real_project', label: 'X', text: 'Y', url: 'https://ejemplo.org/p' }; return e; })()).length, 0);
});

const conocimiento = fn => { const r = { entities: clon(raw.entities), sources: clon(raw.sources) }; fn(r); return validateKnowledge(r).join(' | '); };
const ent = (r, id) => r.entities.find(e => e.id === id);
test('rechaza referencias rotas, duplicados y alternativas entre dimensiones distintas', () => {
  assert.match(conocimiento(r => { ent(r, 'http').sources.push('no-existe'); }), /fuente inexistente/);
  assert.match(conocimiento(r => { ent(r, 'http').related_entities.push({ id: 'fantasma', rel: 'often_with' }); }), /entidad inexistente/);
  assert.match(conocimiento(r => { r.entities.push(clon(ent(r, 'http'))); }), /entidad duplicada/);
  assert.match(conocimiento(r => { r.sources.push(clon(r.sources[0])); }), /fuente duplicada/);
  assert.match(conocimiento(r => { ent(r, 'http').alternatives.push({ id: 'postgresql', note: 'x'.repeat(20) }); }), /otra dimensión/);
  assert.match(conocimiento(r => { ent(r, 'http').alternatives.push({ id: 'http', note: 'x'.repeat(20) }); }), /de sí misma/);
  assert.match(conocimiento(r => { ent(r, 'http').related_entities.push({ id: 'http', rel: 'often_with' }); }), /consigo misma/);
});

test('rechaza evidencia no respaldada: «estándar» sin fuente estándar, opinión con fuentes, fuente con evidencia propia', () => {
  assert.match(conocimiento(r => { const e = ent(r, 'ecommerce'); e.evidence_type = 'standard'; }), /declara evidence_type «standard» pero ninguna de sus fuentes/);
  assert.match(conocimiento(r => { const e = ent(r, 'microservices'); e.evidence_type = 'standard'; }), /ninguna de sus fuentes es de ese tipo/);
  assert.match(conocimiento(r => { const e = ent(r, 'ecommerce'); e.evidence_type = 'opinion'; e.sources = ['rfc-9110']; }), /una opinión no se presenta con fuentes/);
  assert.match(conocimiento(r => { r.sources[0].evidence_type = 'recommendation'; }), /evidence_type de una fuente debe ser uno de/);
  assert.match(conocimiento(r => { r.sources[0].url = 'http://inseguro.org'; }), /url https inválida/);
});

test('rechaza una tecnología que no implementa ningún concepto, o un concepto que «implementa»', () => {
  assert.match(conocimiento(r => { ent(r, 'redis').related_entities = []; }), /no implementa ningún concepto/);
  assert.match(conocimiento(r => { ent(r, 'cache').related_entities.push({ id: 'redis', rel: 'implements' }); }), /solo una tecnología o herramienta «implements»/);
  assert.match(conocimiento(r => { ent(r, 'redis').related_entities.push({ id: 'postgresql', rel: 'implements' }); }), /no implementa otra tecnología/);
});

// ═══ búsqueda ═══
test('búsqueda: sin acentos, por prefijo, con todos los términos y el nombre exacto primero', () => {
  const top = q => K.search(q).map(r => r.entity.id);
  assert.equal(norm('Autenticación'), 'autenticacion');
  assert.equal(top('base relacional')[0], 'relational-database');
  assert.equal(top('SSR')[0], 'ssr');
  assert.equal(top('monolito')[0], 'monolith');
  assert.ok(top('monolito').includes('modular-monolith'));
  assert.equal(top('autenticacion')[0], 'authentication-and-authorization');
  assert.equal(top('colas')[0], 'message-queue');
  assert.deepEqual(top('zzzzqq'), []);                                    // sin coincidencias: lista vacía (estado vacío en la UI)
  assert.deepEqual(top('monolito cache'), []);                            // AND: un término sin coincidencia descarta
  assert.equal(K.search('').length, K.entities.length);                   // sin consulta: todo
});

test('búsqueda: filtros por tipo, nivel, evidencia y grupo se combinan', () => {
  const r = K.search('', { types: ['data_pattern'] }); assert.equal(r.length, 5); assert.ok(r.every(x => x.entity.type === 'data_pattern'));
  assert.ok(K.search('', { levels: ['beginner'] }).every(x => x.entity.level === 'beginner'));
  const std = K.search('', { evidence: ['standard'] }).map(x => x.entity.id);
  assert.ok(std.includes('http') && !std.includes('microservices'));
  assert.ok(K.search('', { groups: ['IA'] }).every(x => ['ai_workflow', 'ai_agent_pattern'].includes(x.entity.type)));
  assert.equal(K.search('cola', { types: ['rendering_strategy'] }).length, 0);
});
