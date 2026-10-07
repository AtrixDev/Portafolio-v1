// Barrido de coherencia: recorre miles de combinaciones de respuestas (semilla fija) por TODO el flujo
// (decisiones → blueprints → ADR → prompts → pack → Markdown) y comprueba que nunca se rompa y que no aparezcan
// recomendaciones incoherentes. Nació de un error real: SSR + cualquier producto lanzaba una excepción en los blueprints
// (una etiqueta de 45 caracteres) y ninguna prueba con valores a mano lo había tocado.
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

let seed = 20261007; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = a => a[Math.floor(rnd() * a.length)];
const PROPIOS = ['ecommerce', 'saas', 'dashboard', 'management-system', 'marketplace'];

function sesionAleatoria() {
  let st = rnd() < 0.5 ? B.enableFine(B.emptyState()) : B.emptyState();   // las preguntas de afinado (tiempo real, búsqueda, IA…) solo aparecen con «fine»
  for (let g = 0; g < 40; g++) {
    const q = B.nextQuestion(M, st); if (!q) break;
    if (q.type === 'text') { st = B.setAnswer(M, st, q.id, 'Una idea de prueba').state; continue; }
    if (rnd() < 0.2 && q.id !== 'product') { st = B.skip(M, st, q.id); continue; }
    const r = B.setAnswer(M, st, q.id, pick(M.signals[q.signal].values));
    assert.equal(r.error, null, `${q.id}: ${r.error}`); st = r.state;
  }
  return st;
}

test('barrido: 1500 proyectos aleatorios recorren decisiones, blueprints, ADR, prompts y pack sin romperse ni dejar basura en el Markdown', () => {
  const stats = { hechos: 0, productos: new Set(), render: new Set() };
  for (let i = 0; i < 1500; i++) {
    const st = sesionAleatoria(); if (!B.canRecommend(st)) continue;
    const res = decide(RULES, K, B.resolve(M, st));
    const pack = buildPack({ M, state: st, res, K, packData: PACK, promptsData: PROMPTS, date: '2026-10-07' });   // lanza si un blueprint es inválido
    const md = packToMarkdown(pack);
    const sucio = md.match(/.{0,30}(undefined|\[object|\{\{|NaN).{0,30}/);
    assert.equal(sucio, null, `Markdown con basura: ${sucio?.[0]} · ${JSON.stringify(st.answers)}`);
    const s = res.signals, d = res.decided, ctx = JSON.stringify(st.answers);
    stats.hechos++; stats.productos.add(s.product); d.rendering?.forEach(x => stats.render.add(x)); for (const dd of Object.values(d)) dd.forEach(x => stats.render.add(x));

    // ── coherencia de las recomendaciones ──
    if (d.rendering.includes('static-site')) {
      assert.ok(!PROPIOS.includes(s.product), `sitio estático para un producto con lógica propia (${s.product}) · ${ctx}`);
      assert.ok(!['users', 'roles', 'multi_tenant'].includes(s.auth) && !['simple', 'split'].includes(s.payments), `sitio estático con cuentas o pagos · ${ctx}`);
    }
    if (d.data_store?.[0] === 'none') assert.ok(!['users', 'roles', 'multi_tenant'].includes(s.auth) && !['simple', 'split'].includes(s.payments) && s.capture !== 'bookings', `sin base de datos pero con cuentas, pagos o reservas · ${ctx}`);
    if (d.architecture?.[0] === 'microservices') assert.ok(s.team === 'large' && s.scale === 'large', `microservicios sin equipo y escala grandes · ${ctx}`);
    if (d.communication?.includes('message-queue')) assert.ok(s.background !== 'none' || d.architecture[0] === 'web-queue-worker', `cola sin tareas en segundo plano · ${ctx}`);
    if (d.communication?.includes('websocket')) assert.ok(s.realtime === 'core' || s.realtime === 'occasional', `WebSocket sin tiempo real · ${ctx}`);
    if (d.rendering.includes('csr')) assert.notEqual(s.public_seo, 'yes', `CSR con SEO requerido · ${ctx}`);
    if (d.architecture?.[0] === 'no-backend') assert.ok(s.auth !== 'users' && s.auth !== 'roles' && s.auth !== 'multi_tenant', `sin backend pero con cuentas · ${ctx}`);

    // ── complejidad práctica: siempre presente, coherente y sin bloquear ──
    const cx = res.complexity, base = K.get(s.product)?.practical_level ?? 2;
    assert.ok(cx && cx.level >= base && cx.level <= 4, `nivel fuera de rango · ${ctx}`);
    assert.equal(cx.within_zone, cx.level <= 3); assert.equal(cx.supervision === 'close', cx.level === 4);
    assert.ok(cx.drivers.length >= 1 && /Complejidad práctica/.test(md), `la complejidad no figura en el pack · ${ctx}`);
    for (const dd of res.decisions) for (const p of dd.picks) if (p.entity?.practical_level === 4) assert.equal(cx.level, 4, `«${p.id}» es de nivel 4 pero el proyecto quedó en nivel ${cx.level} · ${ctx}`);
    // ── toda decisión se explica ──
    for (const dec of res.decisions) {
      for (const p of dec.picks) if (p.entity?.justification === 'strong_reason') assert.ok(p.necessity === 'justified' && p.fit === 'appropriate', `«${p.id}» requiere razón fuerte y se propuso sin justificación · ${ctx}`);
      for (const x of dec.alternatives) assert.ok(['viable', 'not_needed', 'not_fit'].includes(x.fit), `«${x.id}» sin fit · ${ctx}`);
      for (const p of dec.picks) assert.ok(p.reasons.length, `«${dec.id}»: la propuesta «${p.id}» no explica por qué · ${ctx}`);
      for (const a of dec.alternatives) assert.ok(a.better_when, `«${dec.id}»: la alternativa «${a.id}» no dice cuándo sería mejor`);
    }
  }
  assert.ok(stats.hechos > 1000, 'el barrido debe ejercitar la mayoría de las sesiones');
  assert.equal(stats.productos.size, 8, 'deben aparecer los 8 tipos de producto');
  for (const r of ['static-site', 'ssg', 'ssr', 'csr', 'hybrid-rendering', 'websocket', 'message-queue', 'web-queue-worker', 'search-engine', 'cache', 'object-storage', 'ai-workflow', 'none', 'no-backend']) assert.ok(stats.render.has(r), `el barrido nunca llegó a «${r}»: aflojar o ampliar las combinaciones`);
});

test('regresión: SSR con cada tipo de producto genera blueprints válidos', () => {
  for (const product of M.signals.product.values) {
    let st = B.setAnswer(M, B.emptyState(), 'product', product).state;
    st = B.setAnswer(M, st, 'team', 'solo').state;
    const res = decide(RULES, K, B.resolve(M, st));
    assert.doesNotThrow(() => buildPack({ M, state: st, res, K, packData: PACK, promptsData: PROMPTS, date: '2026-10-07' }), product);
  }
});

test('ramas poco frecuentes: forzando microservicios, eventos, pub/sub y agentes, todos los blueprints, ADR y el pack siguen siendo válidos', () => {
  // Con las reglas reales estas opciones casi nunca ganan (es lo buscado), así que sus diagramas no se ejercitan solos: se fuerzan.
  const forzadas = structuredClone(RULES);
  for (const [dim, id] of [['architecture', 'microservices'], ['architecture', 'event-driven'], ['communication', 'pub-sub'], ['ai_product', 'multi-agent'], ['ai_product', 'ai-agent'], ['ai_dev', 'multi-agent']]) {
    const c = forzadas.decisions.find(d => d.id === dim).candidates.find(x => x.id === id);
    delete c.justified_when; c.rules.push({ when: { s: 'product', not: 'none' }, delta: 60, reason: 'forzada por la prueba' });
  }
  const vistos = new Set();
  for (const a of [{ product: 'marketplace', ai: 'open_ended', dev_ai: 'coding', realtime: 'core', background: 'heavy' }, { product: 'saas', ai: 'automate', scale: 'large', team: 'large' }, { product: 'ecommerce', ai: 'assist' }, { product: 'dashboard', realtime: 'occasional' }]) {
    let st = B.enableFine(B.emptyState()); for (const [q, v] of Object.entries({ idea: 'x', users: 'y', ...a })) { const r = B.setAnswer(M, st, q, v); assert.equal(r.error, null, q); st = r.state; }
    const res = decide(forzadas, K, B.resolve(M, st));
    for (const d of Object.values(res.decided)) d.forEach(x => vistos.add(x));
    const md = packToMarkdown(buildPack({ M, state: st, res, K, packData: PACK, promptsData: PROMPTS, date: '2026-10-07' }));
    assert.doesNotMatch(md, /undefined|\[object|\{\{|NaN/);
    assert.equal(res.complexity.level, 4, JSON.stringify(a));
  }
  for (const x of ['microservices', 'event-driven', 'pub-sub', 'multi-agent', 'ai-agent']) assert.ok(vistos.has(x), `la prueba no llegó a «${x}»`);
});
