// Pruebas de blueprints, ADR, prompts y Project Pack (Fases 5–8). Puras y deterministas (semilla fija).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKnowledge, loadKnowledge } from '../../frontend/js/architect/content.js';
import * as B from '../../frontend/js/architect/builder.js';
import { decide } from '../../frontend/js/architect/decide.js';
import { buildBlueprints, toMermaid } from '../../frontend/js/architect/blueprint.js';
import { validateDiagram, renderDiagramSVG } from '../../frontend/js/architect/diagram.js';
import { buildADRs, adrToMarkdown, ADR_SECTIONS } from '../../frontend/js/architect/adr.js';
import { validatePrompts, renderTemplate, renderPrompt, renderAll, placeholders, KEYS } from '../../frontend/js/architect/prompts.js';
import { buildPack, packToMarkdown, validatePack, PACK_SECTIONS } from '../../frontend/js/architect/pack.js';
import { buildContext } from '../../frontend/js/architect/context.js';

const FRONT = join(dirname(fileURLToPath(import.meta.url)), '../../frontend/');
const J = p => JSON.parse(readFileSync(FRONT + p, 'utf8'));
const K = buildKnowledge(await loadKnowledge(async p => J(p)));
const M = B.buildModel(J('data/architect/questions.json')), RULES = J('data/architect/rules.json'), PACK = J('data/architect/pack.json'), PROMPTS = J('data/architect/prompts.json');

const estado = a => { let st = B.emptyState(); for (const [q, v] of Object.entries(a)) { const r = B.setAnswer(M, st, q, v); assert.equal(r.error, null, `${q}=${v}`); st = r.state; } return st; };
const resultado = a => decide(RULES, K, B.resolve(M, estado(a)));
const pack = a => { const st = estado(a); return buildPack({ M, state: st, res: decide(RULES, K, B.resolve(M, st)), K, packData: PACK, promptsData: PROMPTS, date: '2026-10-07' }); };
const ECOM = { idea: 'Una tienda online de artesanías', users: 'Gente que compra regalos', product: 'ecommerce', team: 'small', scale: 'medium', time: 'normal', ai: 'assist', dev_ai: 'coding' };
const LANDING = { idea: 'Página de mi estudio', product: 'landing', content_edit: 'never', team: 'solo', scale: 'small' };

// ═══ datos del pack y de los prompts ═══
test('los datos del pack son válidos: condiciones reales, todos los productos cubiertos, cada fase con objetivo y cierre', () => {
  assert.deepEqual(validatePack(PACK, M.signals, RULES.decisions.map(d => d.id)), []);
});
test('el validador del pack detecta datos rotos', () => {
  const rompe = fn => { const p = structuredClone(PACK); fn(p); return validatePack(p, M.signals, RULES.decisions.map(d => d.id)).join(' | '); };
  assert.match(rompe(p => { delete p.data_models.saas; }), /falta «saas»/);
  assert.match(rompe(p => { p.roadmap[0].tasks[0].when = { s: 'zzz', is: 'x' }; }), /señal desconocida/);
  assert.match(rompe(p => { p.structures.at(-1).when = { s: 'scale', is: 'small' }; }), /la última debe ser la de respaldo/);
  assert.match(rompe(p => { p.roadmap[1].exit = []; }), /falta goal o exit/);
  assert.match(rompe(p => { p.functional.landing = []; }), /functional: falta «landing»/);
});
test('prompts: las 16 etapas pedidas existen y solo usan variables conocidas', () => {
  assert.deepEqual(validatePrompts(PROMPTS), []);
  const pedidas = ['discovery', 'requirements', 'architecture', 'data-modeling', 'ux-spec', 'technical-spec', 'planning', 'implementation', 'testing', 'debugging', 'security-review', 'qa', 'refactoring', 'documentation', 'code-review', 'continuation'];
  assert.deepEqual(PROMPTS.prompts.map(p => p.id), pedidas);
  const rompe = fn => { const p = structuredClone(PROMPTS); fn(p); return validatePrompts(p).join(' | '); };
  assert.match(rompe(p => { p.prompts[0].template += ' {{inexistente}}'; }), /variable desconocida/);
  assert.match(rompe(p => { p.prompts[1].id = p.prompts[0].id; }), /duplicado/);
  assert.match(rompe(p => { delete p.prompts[2].goal; }), /falta goal/);
});

// ═══ prompts renderizados con el contexto del proyecto ═══
test('los prompts se construyen con el contexto: incluyen la idea, las decisiones y las reglas de trabajo, sin variables sin resolver', () => {
  const st = estado(ECOM), res = decide(RULES, K, B.resolve(M, st)), ctx = buildContext(M, st, res, K, PACK, buildADRs(res, K, {}, M));
  const todos = renderAll(PROMPTS, ctx);
  assert.equal(todos.length, 16);
  for (const p of todos) {
    assert.ok(!/\{\{/.test(p.text), `${p.id}: variable sin resolver`);
    assert.ok(!/undefined|\[object Object\]|NaN/.test(p.text), `${p.id}: valor roto`);
    assert.ok(p.text.includes('Una tienda online de artesanías'), `${p.id}: falta la idea`);
    assert.ok(p.text.includes('Renderizado híbrido') || p.text.includes('Monolito'), `${p.id}: faltan las decisiones`);
    assert.match(p.text, /No inventes requisitos/);
    assert.match(p.text, /## Tarea|## Proyecto/);
  }
  assert.match(renderPrompt(PROMPTS, 'security-review', ctx).text, /A01:2025 Broken Access Control/);
  assert.match(renderPrompt(PROMPTS, 'data-modeling', ctx).text, /\*\*Pedido\*\*/);
  assert.match(renderPrompt(PROMPTS, 'continuation', ctx).text, /Desarrollo asistido por IA|asistente/i);
});
test('renderizar con una variable inexistente es un error, no un hueco silencioso', () => {
  assert.throws(() => renderTemplate('Hola {{nada}}', { x: 1 }), /Variable de prompt inexistente: nada/);
  assert.throws(() => renderPrompt(PROMPTS, 'no-existe', {}), /Prompt inexistente/);
  assert.deepEqual(placeholders('{{a}} y {{ b }} y {{a}}'), ['a', 'b']);
  assert.equal(renderTemplate('{{x}}-{{ x }}', { x: 'ok' }), 'ok-ok');
  for (const k of KEYS) assert.match(k, /^[a-z_]+$/);
});

// ═══ blueprints ═══
const bp = a => buildBlueprints(resultado(a), K, { productName: 'Proyecto' });
const ids = bps => bps.map(b => b.id);
test('un sitio estático solo tiene los diagramas que le corresponden (no un diagrama de todo)', () => {
  const b = bp(LANDING);
  assert.deepEqual(ids(b), ['system-context', 'application', 'deployment']);
  const app = b.find(x => x.id === 'application');
  assert.ok(app.nodes.every(n => n.kind !== 'data'), 'sin base de datos propia');
  assert.match(app.notes[0], /No hay un backend propio/);
});
test('un e-commerce separa los diagramas por propósito: contexto, aplicación, flujo de datos, autenticación, despliegue y IA', () => {
  const b = bp(ECOM);
  assert.deepEqual(ids(b), ['system-context', 'application', 'data-flow', 'authentication', 'deployment', 'ai-workflow']);
  assert.equal(new Set(b.map(x => x.purpose)).size, b.length, 'un propósito por diagrama');
  for (const x of b) assert.ok(x.nodes.length <= 13, `${x.id}: ${x.nodes.length} nodos`);
  const ctx = b.find(x => x.id === 'system-context');
  assert.ok(ctx.nodes.some(n => /pagos/i.test(n.label)), 'el contexto muestra al proveedor de pagos');
  const app = b.find(x => x.id === 'application');
  assert.ok(app.nodes.some(n => n.kind === 'queue') && app.nodes.some(n => n.kind === 'data') && app.nodes.some(n => n.kind === 'security'));
  assert.ok(app.edges.some(e => e.async), 'lo asíncrono se marca');
});
test('el flujo de IA cambia según el enfoque: asistente, workflow o agente con límites y aprobación humana', () => {
  const f = ai => bp({ ...ECOM, ai }).find(x => x.id === 'ai-workflow');
  assert.ok(f('assist').nodes.some(n => /Asistente/.test(n.label)));
  assert.ok(f('automate').nodes.some(n => /validá|valida la salida/.test(n.label)));
  const ag = f('open_ended'); assert.ok(ag.nodes.some(n => /Límites/.test(n.label)) && ag.nodes.some(n => /aprueba/.test(n.label)));
  assert.equal(bp({ ...ECOM, ai: 'none' }).find(x => x.id === 'ai-workflow'), undefined);
});
test('los nodos con enlace llevan a conceptos que existen y se dibujan como enlaces accesibles', () => {
  for (const x of bp(ECOM)) for (const n of x.nodes) if (n.link) assert.ok(K.get(n.link.replace('#/c/', '')), `${x.id}/${n.id}: ${n.link}`);
  const svg = renderDiagramSVG(bp(ECOM).find(x => x.id === 'application'), { id: 't' });
  assert.match(svg, /<a href="#\/c\/[a-z-]+" aria-label="[^"]+: ver el concepto">/);
  assert.deepEqual(validateDiagram({ purpose: 'concept', title: 'T', nodes: [{ id: 'a', label: 'A', kind: 'actor', layer: 0, link: 'http://x' }, { id: 'b', label: 'B', kind: 'actor', layer: 1 }], edges: [{ from: 'a', to: 'b' }] }).length, 1);
});
test('Mermaid equivalente: un nodo por componente y una flecha por conexión (punteada si es asíncrona)', () => {
  const x = bp(ECOM).find(b => b.id === 'application'), m = toMermaid(x);
  assert.ok(m.startsWith('flowchart LR'));
  assert.equal(m.split('\n').filter(l => /\["/.test(l)).length, x.nodes.length);
  assert.equal(m.split('\n').filter(l => /-->|-\.->/.test(l)).length, x.edges.length);
  assert.ok(m.includes('-.->') && !/[-]{2}[a-z]/.test(m.replace(/-->|-\.->/g, '')));
  assert.ok(!m.includes('"" '), 'las comillas internas se escapan');
});

// ═══ ADR ═══
test('cada decisión genera un ADR completo: contexto, opciones, razones, trade-offs, rechazadas, cuándo reconsiderar y fuentes', () => {
  const res = resultado({ ...ECOM, team: 'solo' }), adrs = buildADRs(res, K, { summaryLine: 'Proyecto: tienda' }, M);
  assert.ok(adrs.length >= 8);
  assert.deepEqual(adrs.map(a => a.id), adrs.map((_, i) => `ADR-${String(i + 1).padStart(3, '0')}`));
  for (const a of adrs) {
    assert.equal(a.status, 'Propuesta'); assert.match(a.status_note, /no es un estándar/);
    assert.ok(a.context.length >= 1 && a.problem && a.decision && a.rationale.length >= 1, a.id);
    assert.ok(a.options.length >= 2 && a.options.filter(o => o.chosen).length >= 1, `${a.id}: opciones`);
    assert.ok(a.revisit.length >= 1, `${a.id}: cuándo reconsiderar`);
    for (const r of a.rejected) { assert.ok(r.why.length && r.better_when.length > 15, `${a.id}: rechazada sin explicación`); }
  }
  const arq = adrs.find(a => a.decision_id === 'architecture');
  assert.match(arq.title, /Monolito/); assert.ok(arq.rejected.some(r => r.name === 'Microservicios'));
  assert.ok(arq.sources.length >= 1 && arq.sources.every(s => /^https:\/\//.test(s.url) && s.evidence));
});
test('un ADR en Markdown tiene todas sus secciones y cita las fuentes con su tipo de evidencia', () => {
  const a = buildADRs(resultado(ECOM), K, {}, M).find(x => x.decision_id === 'architecture'), md = adrToMarkdown(a, { date: '2026-10-07' });
  for (const h of ['# ADR-', '**Estado:** Propuesta', '**Fecha:** 2026-10-07', '## Contexto', '## Problema', '## Opciones consideradas', '## Decisión', '## Razones', '## Trade-offs', '## Consecuencias', '## Alternativas rechazadas', '## Condiciones para reconsiderar', '## Fuentes']) assert.ok(md.includes(h), `falta ${h}`);
  assert.match(md, /\]\(https:\/\/.+\) — .+ \((Estándar|Documentación oficial|Framework oficial|Fuente experta|Práctica de la industria)\)/);
  assert.ok(!/undefined|\[object Object\]/.test(md) && !/\n{3,}/.test(md));
  assert.equal(ADR_SECTIONS.length, 10);
});
test('las decisiones inciertas lo dicen en su ADR (la incertidumbre no se esconde)', () => {
  const a = buildADRs(resultado({ product: 'ecommerce', team: B.UNKNOWN, scale: B.UNKNOWN }), K, {}, M).find(x => x.decision_id === 'architecture');
  assert.equal(a.confidence.level, 'baja'); assert.ok(a.context.some(c => /todavía no se sabe/.test(c)));
  assert.match(adrToMarkdown(a), /\*\*Confianza:\*\* baja/);
});

// ═══ Project Pack ═══
test('el pack trae las 17 secciones en orden, con contenido y numeradas', () => {
  const p = pack(ECOM);
  assert.deepEqual(p.sections.map(s => s.id), PACK_SECTIONS);
  assert.equal(PACK_SECTIONS.length, 17);
  for (const s of p.sections) assert.ok(s.markdown.trim().length > 20 && s.title, s.id);
  const md = packToMarkdown(p);
  assert.match(md, /^# Project Pack: E-commerce/);
  for (const [i, s] of p.sections.entries()) assert.ok(md.includes(`## ${i + 1}. ${s.title}`), s.title);
  assert.equal(p.prompts.length, 16); assert.equal(p.blueprints.length, 6); assert.ok(p.adrs.length >= 8);
  assert.doesNotThrow(() => JSON.stringify(p));
});
test('el pack es honesto: marca supuestos, dice que son recomendaciones propias y no estándares', () => {
  const md = packToMarkdown(pack({ product: 'ecommerce' }));
  assert.match(md, /_\(supuesto\)_/); assert.match(md, /_\(abierto\)_/);
  assert.match(md, /criterio de este proyecto \(recomendación propia\), no un estándar/);
  assert.match(md, /punto de partida para conversar, no un modelo final/);
  assert.match(md, /revisalas antes de actuar/);
});
test('el pack se adapta al proyecto: lo que no aplica no aparece', () => {
  const l = packToMarkdown(pack(LANDING)), e = packToMarkdown(pack(ECOM));
  assert.ok(!/Integrar el proveedor de pagos/.test(l) && /Integrar el proveedor de pagos/.test(e));
  assert.ok(!/A07:2025 Authentication Failures/.test(l) && /A07:2025 Authentication Failures/.test(e));
  assert.ok(!/A05:2025 Injection/.test(l), 'sin backend propio no hay inyección que listar');
  assert.ok(!/Pedido 1—N Línea de pedido/.test(l) && /Pedido 1—N Línea de pedido/.test(e));
  assert.match(l, /Sitio estático/); assert.match(e, /Monolito/);
  assert.ok(!/Aislamiento entre organizaciones/.test(e) && /Aislamiento entre organizaciones/.test(packToMarkdown(pack({ product: 'saas' }))));
});
test('seguridad del pack: las diez categorías del OWASP Top 10:2025 verificadas aparecen cuando el proyecto tiene cuentas y pagos', () => {
  const md = packToMarkdown(pack(ECOM));
  const owasp2025 = ['A01:2025 Broken Access Control', 'A02:2025 Security Misconfiguration', 'A03:2025 Software Supply Chain Failures', 'A04:2025 Cryptographic Failures', 'A05:2025 Injection', 'A06:2025 Insecure Design', 'A07:2025 Authentication Failures', 'A08:2025 Software or Data Integrity Failures', 'A09:2025 Security Logging and Alerting Failures', 'A10:2025 Mishandling of Exceptional Conditions'];
  for (const c of owasp2025) assert.ok(md.includes(`[${c}]`), c);
});
test('tecnologías: se separan concepto y herramienta, con perfil comparable y alternativas; nunca como verdad universal', () => {
  const md = pack(ECOM).sections.find(s => s.id === 'technology').markdown;
  assert.match(md, /Para «Base de datos relacional»/); assert.match(md, /\*\*PostgreSQL\*\*/);
  for (const k of ['Complejidad', 'Costo', 'Ecosistema', 'Escalabilidad', 'Mantenimiento', 'Dependencia del proveedor (lock-in)']) assert.ok(md.includes(k), k);
  assert.match(md, /Alternativas: MongoDB/); assert.match(md, /primero se decide el patrón y después con qué se implementa/);
  assert.match(pack(LANDING).sections.find(s => s.id === 'technology').markdown, /Astro|no dependen de una tecnología|\*\*Astro\*\*/);
});

// ═══ propiedades para cualquier combinación ═══
test('para cualquier combinación de respuestas todo se genera sin errores y sin valores rotos (300 casos)', () => {
  let semilla = 11; const rnd = n => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla % n; };
  for (let i = 0; i < 300; i++) {
    const a = { product: M.signals.product.values[rnd(8)] };
    if (rnd(2)) a.idea = 'Idea ' + i; if (rnd(2)) a.users = 'Usuarios ' + i;
    for (const q of M.questions) if (q.type === 'single' && q.id !== 'product' && rnd(3)) a[q.id] = rnd(6) === 0 ? B.UNKNOWN : q.offer[rnd(q.offer.length)];
    let p;
    assert.doesNotThrow(() => { p = pack(a); }, JSON.stringify(a));
    const md = packToMarkdown(p);
    assert.ok(!/undefined|\[object Object\]|NaN|\{\{/.test(md), `valor roto con ${JSON.stringify(a)}: ${(md.match(/.{30}(undefined|\[object Object\]|NaN|\{\{).{30}/) || [''])[0]}`);
    assert.equal(p.sections.length, 17);
    for (const b of p.blueprints) assert.deepEqual(validateDiagram(b), [], b.id);
    assert.equal(new Set(p.adrs.map(x => x.id)).size, p.adrs.length);
  }
});
