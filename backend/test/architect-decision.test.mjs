// Pruebas del Project Builder (preguntas adaptativas, estado, enlaces) y del Decision Engine (reglas explicables).
// Correr: node --test backend/test/architect-decision.test.mjs — puras y deterministas (sin red; las «aleatorias» usan semilla fija).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKnowledge, loadKnowledge } from '../../frontend/js/architect/content.js';
import * as B from '../../frontend/js/architect/builder.js';
import { evalCond, validateCond } from '../../frontend/js/architect/conditions.js';
import { decide, validateRules } from '../../frontend/js/architect/decide.js';

const FRONT = join(dirname(fileURLToPath(import.meta.url)), '../../frontend/');
const J = p => JSON.parse(readFileSync(FRONT + p, 'utf8'));
const K = buildKnowledge(await loadKnowledge(async p => J(p)));
const M = B.buildModel(J('data/architect/questions.json'));
const RULES = J('data/architect/rules.json');
const clon = x => structuredClone(x);

const estado = answers => { let st = B.emptyState(); for (const [q, v] of Object.entries(answers)) { const r = B.setAnswer(M, st, q, v); assert.equal(r.error, null, `${q}=${v}: ${r.error}`); st = r.state; } return st; };
const correr = answers => decide(RULES, K, B.resolve(M, estado(answers)));
const dec = (res, id) => res.decisions.find(d => d.id === id);
const top = (res, id) => dec(res, id).picks[0]?.id;
const incluidos = (res, id) => dec(res, id).picks.map(p => p.id);

// ═══ el contenido de preguntas y reglas es consistente con el modelo ═══
test('el modelo de preguntas es válido (señales, ofertas, defaults, ayudas «aprender más»)', () => {
  assert.deepEqual(B.validateModel(M, new Set(K.entities.map(e => e.id))), []);
});
test('las reglas son válidas: condiciones sobre señales reales, entidades que existen, cada opción dice cuándo sería mejor', () => {
  assert.deepEqual(validateRules(RULES, M.signals, K), []);
});
test('el validador detecta reglas rotas', () => {
  const rompe = fn => { const r = clon(RULES); fn(r); return validateRules(r, M.signals, K).join(' | '); };
  const cand = (r, d, c) => r.decisions.find(x => x.id === d).candidates.find(x => x.id === c);
  assert.match(rompe(r => { cand(r, 'rendering', 'ssr').rules[0].when = { s: 'inventada', is: 'x' }; }), /señal desconocida: inventada/);
  assert.match(rompe(r => { cand(r, 'rendering', 'ssr').rules[0].when = { s: 'scale', is: 'enorme' }; }), /no admite el valor «enorme»/);
  assert.match(rompe(r => { cand(r, 'rendering', 'ssr').better_when = ''; }), /falta better_when/);
  assert.match(rompe(r => { cand(r, 'rendering', 'ssr').id = 'no-existe'; }), /la entidad no existe/);
  assert.match(rompe(r => { cand(r, 'rendering', 'ssr').rules[0].reason = ''; }), /necesita reason/);
  assert.match(rompe(r => { cand(r, 'communication', 'rest-api').rules[0].when = { d: 'testing', is: 'x' }; }), /dimensión de decisión desconocida/);
  assert.match(rompe(r => { r.decisions[0].needs.push('zz'); }), /señal inexistente «zz»/);
  assert.match(rompe(r => { cand(r, 'data_layers', 'cache').not_needed = ''; }), /necesita not_needed/);
});

// ═══ mini lenguaje de condiciones ═══
test('condiciones: is, in, not, known, all, any, not compuesto y decisiones previas', () => {
  const ctx = { signals: { scale: 'large', auth: 'unknown', team: 'solo' }, decided: { rendering: ['ssr'] } };
  assert.equal(evalCond({ s: 'scale', is: 'large' }, ctx), true);
  assert.equal(evalCond({ s: 'scale', in: ['small', 'medium'] }, ctx), false);
  assert.equal(evalCond({ s: 'team', not: 'large' }, ctx), true);
  assert.equal(evalCond({ s: 'auth', not: 'none' }, ctx), false, 'una señal desconocida no cuenta como «distinta de»');
  assert.equal(evalCond({ known: 'auth' }, ctx), false);
  assert.equal(evalCond({ known: 'scale' }, ctx), true);
  assert.equal(evalCond({ all: [{ s: 'scale', is: 'large' }, { s: 'team', is: 'solo' }] }, ctx), true);
  assert.equal(evalCond({ any: [{ s: 'scale', is: 'small' }, { s: 'team', is: 'solo' }] }, ctx), true);
  assert.equal(evalCond({ not: { s: 'scale', is: 'large' } }, ctx), false);
  assert.equal(evalCond({ d: 'rendering', is: 'ssr' }, ctx), true);
  assert.equal(evalCond({ d: 'rendering', in: ['csr', 'ssg'] }, ctx), false);
  assert.equal(evalCond(undefined, ctx), true);
  assert.throws(() => evalCond({ raro: 1 }, ctx));
});
test('condiciones: la validación rechaza señales, valores y operadores inexistentes', () => {
  const v = c => validateCond(c, M.signals, ['rendering']).join('|');
  assert.equal(v({ s: 'scale', is: 'large' }), '');
  assert.match(v({ s: 'nada', is: 'x' }), /señal desconocida/);
  assert.match(v({ s: 'scale', is: 'gigante' }), /no admite/);
  assert.match(v({ s: 'scale' }), /sin is \/ in \/ not \/ has/);
  assert.match(v({ all: [] }), /lista no vacía/);
  assert.match(v({ d: 'otra' }), /desconocida/);
});

// ═══ Project Builder: preguntas adaptativas ═══
const ids = st => B.resolve(M, st).applicable.map(q => q.id);
test('las preguntas se adaptan al tipo de producto: no se muestra un formulario gigante', () => {
  const inicial = ids(B.emptyState());
  assert.deepEqual(inicial.slice(0, 3), ['idea', 'users', 'product']);
  const landing = ids(estado({ product: 'landing' })), ecom = ids(estado({ product: 'ecommerce' }));
  assert.ok(landing.includes('content_edit') && landing.includes('capture'));
  assert.ok(!landing.includes('payments') && !landing.includes('catalog') && !landing.includes('search') && !landing.includes('sensitive_data'));
  assert.ok(ecom.includes('catalog') && ecom.includes('payments') && ecom.includes('sensitive_data') && !ecom.includes('content_edit'));
  assert.ok(landing.length <= 8, `una landing: ${landing.length} preguntas`);
  assert.ok(ecom.length <= 12, `un e-commerce: ${ecom.length} preguntas`);
  assert.ok(landing.length < ecom.length);
});
test('preguntas de «afinar»: opcionales, van después de las centrales y solo cuentan si la persona las activa', () => {
  const st = estado({ product: 'ecommerce' }), fino = B.enableFine(st);
  const core = B.resolve(M, st), full = B.resolve(M, fino);
  assert.equal(core.fineLeft, full.applicable.length - core.applicable.length);
  assert.ok(core.fineLeft >= 5, 'hay bastante para afinar');
  assert.ok(full.applicable.length >= 17, `con afinado: ${full.applicable.length}`);
  const orden = full.applicable.map(q => q.tier); assert.equal(orden.indexOf('fine') > orden.lastIndexOf('core'), true, 'las centrales van primero');
  assert.equal(full.fineLeft, 0);
  assert.ok(core.applicable.every(q => q.tier === 'core'));
  // una respuesta de afinado ya dada sigue valiendo aunque se desactive el afinado
  const conRespuesta = { ...fino, answers: { ...fino.answers, ai: 'automate' } }, sinFino = { ...conRespuesta, fine: false };
  assert.equal(B.resolve(M, sinFino).signals.ai, 'automate');
  // el flag viaja en el enlace
  assert.equal(B.decodeState(M, B.encodeState(fino)).state.fine, true);
  assert.equal(B.decodeState(M, B.encodeState(st)).state.fine, false);
});
test('preguntas dependientes: «datos sensibles» aparece solo si hay cuentas o pagos; «reservas» abre las cuentas', () => {
  assert.ok(!ids(estado({ product: 'landing', capture: 'contact' })).includes('auth'));
  assert.ok(ids(estado({ product: 'landing', capture: 'bookings' })).includes('auth'));
  assert.ok(!ids(estado({ product: 'landing', capture: 'bookings' })).includes('sensitive_data'), 'mientras las cuentas estén asumidas como «none», no se pregunta por datos sensibles');
  assert.ok(ids(estado({ product: 'landing', capture: 'bookings', auth: 'users' })).includes('sensitive_data'));
  assert.ok(!ids(estado({ product: 'dashboard', auth: 'none', payments: 'none' })).includes('sensitive_data'));
});
test('nextQuestion recorre en orden y termina; progress cuenta lo aplicable', () => {
  let st = B.emptyState(), n = 0, guard = 0;
  assert.equal(B.nextQuestion(M, st).id, 'idea');
  while (B.nextQuestion(M, st) && guard++ < 60) {
    const q = B.nextQuestion(M, st);
    st = q.type === 'text' ? B.setAnswer(M, st, q.id, 'x').state : B.setAnswer(M, st, q.id, q.id === 'product' ? 'landing' : q.offer[0]).state; n++;
  }
  assert.equal(B.nextQuestion(M, st), null);
  const p = B.progress(M, st); assert.equal(p.finished, true); assert.equal(p.done, p.total); assert.equal(p.total, n);
});
test('responder valida: una opción que no corresponde se rechaza, «no lo sé» siempre se acepta, un texto se recorta', () => {
  const st = B.emptyState();
  assert.ok(B.setAnswer(M, st, 'product', 'cohete').error);
  assert.ok(B.setAnswer(M, st, 'pregunta-que-no-existe', 'x').error);
  assert.equal(B.setAnswer(M, st, 'product', B.UNKNOWN).error, null);
  const largo = 'a'.repeat(1000); assert.equal(B.setAnswer(M, st, 'idea', largo).state.answers.idea.length, 400);
  assert.equal('idea' in B.setAnswer(M, B.setAnswer(M, st, 'idea', 'hola').state, 'idea', '   ').state.answers, false, 'un texto vacío borra la respuesta');
  assert.equal(st.answers.product, undefined, 'el estado original no se muta');
});
test('«no lo sé» y «omitir» no inventan respuestas: quedan como incógnitas y bajan la confianza', () => {
  const base = { product: 'ecommerce', team: 'solo', scale: 'small', time: 'urgent' };
  const sin = correr({ ...base, scale: B.UNKNOWN });
  assert.equal(sin.source.scale, 'unknown');
  assert.equal(dec(sin, 'architecture').confidence.level, 'baja');
  assert.ok(sin.open.some(o => o.signal === 'scale'));
  const con = correr(base);
  assert.notEqual(dec(con, 'architecture').confidence.level, 'baja');
  assert.ok(!con.open.some(o => o.signal === 'scale'));
  let st = estado({ product: 'ecommerce' }); st = B.skip(M, st, 'scale');
  assert.ok(st.skipped.includes('scale') && !('scale' in st.answers));
  assert.equal(B.nextQuestion(M, st).id !== 'scale', true);
});
test('supuestos por tipo de producto: se marcan como «assumed» y lo respondido los pisa', () => {
  const r = B.resolve(M, estado({ product: 'ecommerce' }));
  assert.equal(r.source.payments, 'assumed'); assert.equal(r.signals.payments, 'simple');
  const r2 = B.resolve(M, estado({ product: 'ecommerce', payments: 'none' }));
  assert.equal(r2.source.payments, 'answered'); assert.equal(r2.signals.payments, 'none');
  const r3 = B.resolve(M, estado({ product: 'other' }));
  assert.equal(r3.source.auth, 'unknown');
  const filas = B.summarize(M, estado({ product: 'ecommerce' }));
  assert.ok(filas.some(f => f.signal === 'payments' && f.kind === 'assumed'));
});
test('reabrir una respuesta anterior hace que las dependientes dejen de contar sin romper el estado', () => {
  let st = estado({ product: 'ecommerce', catalog: 'large' });
  assert.equal(B.resolve(M, st).signals.catalog, 'large');
  st = B.setAnswer(M, st, 'product', 'landing').state;                 // cambia de idea: el catálogo ya no aplica
  assert.ok(!ids(st).includes('catalog'));
  assert.equal(B.resolve(M, st).signals.catalog, B.UNKNOWN);
  assert.equal(B.reopen(M, st, 'product').answers.product, undefined);
});

// ═══ Estado ⇄ enlace ═══
test('el estado viaja en un enlace y vuelve idéntico (incluye tildes y emojis)', () => {
  const st = estado({ idea: 'Una tienda para vender artesanías ñandú ✨', users: 'Gente que compra regalos', product: 'ecommerce', scale: 'medium', team: B.UNKNOWN });
  const { state, problems } = B.decodeState(M, B.encodeState(st));
  assert.deepEqual(problems, []);
  assert.deepEqual(state.answers, st.answers);
  assert.ok(!B.encodeState(st).match(/[+/=]/), 'es seguro para URL');
});
test('un enlace roto, de otra versión o manipulado nunca rompe: se ignora lo inválido y se avisa', () => {
  assert.equal(B.decodeState(M, '###').problems.length, 1);
  assert.equal(B.decodeState(M, '').problems.length, 1);
  const enc = o => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  assert.match(B.decodeState(M, enc({ v: 99, a: {} })).problems[0], /otra versión/);
  const r = B.decodeState(M, enc({ v: 1, a: { product: 'ecommerce', scale: 'enorme', fantasma: 'x', team: 'small' }, s: ['time', 'nada'] }));
  assert.deepEqual(r.state.answers, { product: 'ecommerce', team: 'small' });
  assert.equal(r.problems.length, 2);
  assert.deepEqual(r.state.skipped, ['time']);
  assert.deepEqual(B.decodeState(M, enc({ v: 1, a: 5, s: 'x' })).state.answers, {});
});

// ═══ Decision Engine: escenarios con resultado esperado y explicable ═══
test('landing que casi no cambia: archivos estáticos, sin backend ni base de datos', () => {
  const r = correr({ product: 'landing', content_edit: 'never', team: 'solo', scale: 'small', time: 'normal' });
  assert.equal(top(r, 'rendering'), 'static-site'); assert.equal(top(r, 'architecture'), 'no-backend'); assert.equal(top(r, 'data_store'), 'none');
  assert.deepEqual(incluidos(r, 'communication'), []); assert.deepEqual(incluidos(r, 'data_layers'), []);
  assert.deepEqual(incluidos(r, 'testing'), ['unit-testing']);
});
test('landing con contenido que cambia: generación estática (SSG), no servidor', () => {
  const r = correr({ product: 'landing', content_edit: 'sometimes' });
  assert.equal(top(r, 'rendering'), 'ssg'); assert.equal(top(r, 'architecture'), 'no-backend');
});
test('sitio institucional con reservas propias: ya necesita backend y base de datos', () => {
  const r = correr({ product: 'institutional-site', capture: 'bookings', auth: 'users' });
  assert.notEqual(top(r, 'architecture'), 'no-backend'); assert.equal(top(r, 'data_store'), 'relational-database');
  assert.notEqual(top(r, 'rendering'), 'static-site'); assert.ok(incluidos(r, 'identity_security').includes('authentication-and-authorization'));
});
test('e-commerce: base relacional, almacenamiento de objetos, cola, pruebas E2E y seguridad con ASVS; el renderizado depende del equipo', () => {
  const chico = correr({ product: 'ecommerce', team: 'small', scale: 'medium', time: 'normal' });
  assert.equal(top(chico, 'data_store'), 'relational-database'); assert.equal(top(chico, 'architecture'), 'monolith');
  assert.equal(top(chico, 'rendering'), 'hybrid-rendering');
  for (const id of ['object-storage']) assert.ok(incluidos(chico, 'data_layers').includes(id));
  assert.ok(incluidos(chico, 'communication').includes('message-queue'));
  assert.ok(incluidos(chico, 'testing').includes('e2e-testing'));
  assert.ok(incluidos(chico, 'identity_security').includes('owasp-asvs'));
  assert.ok(chico.risks.some(t => /datos de tarjetas/.test(t)));
  const solo = correr({ product: 'ecommerce', team: 'solo' });
  assert.equal(top(solo, 'rendering'), 'ssr', 'una sola persona: una regla simple (SSR) en vez de híbrido');
});
test('dashboard tras un login: renderizado en el cliente; si es público e indexable, no', () => {
  assert.equal(top(correr({ product: 'dashboard' }), 'rendering'), 'csr');
  assert.notEqual(top(correr({ product: 'saas', public_seo: 'yes' }), 'rendering'), 'csr');
  assert.equal(top(correr({ product: 'saas', public_seo: 'no' }), 'rendering'), 'csr');
});
test('microservicios nunca salen primeros por moda: aparecen como alternativa con «cuándo sería mejor»', () => {
  for (const a of [{ product: 'saas', team: 'large', scale: 'large' }, { product: 'marketplace', team: 'small', scale: 'medium' }, { product: 'saas', team: 'solo' }]) {
    const r = correr(a); assert.notEqual(top(r, 'architecture'), 'microservices', JSON.stringify(a));
    const alt = dec(r, 'architecture').alternatives.find(x => x.id === 'microservices');
    assert.ok(alt.better_when.length > 20);
  }
  const chico = correr({ product: 'saas', team: 'solo', time: 'urgent', scale: 'small' });
  const micro = dec(chico, 'architecture').alternatives.find(x => x.id === 'microservices');
  assert.ok(micro.why_not.some(t => /equipo chico/.test(t)));      // explica POR QUÉ no
});
test('tareas pesadas en segundo plano: trabajador con cola; tiempo real central: WebSocket; ocasional: se explica por qué no', () => {
  const pesado = correr({ product: 'saas', background: 'heavy', team: 'small' });
  assert.equal(top(pesado, 'architecture'), 'web-queue-worker'); assert.ok(incluidos(pesado, 'communication').includes('message-queue'));
  const vivo = correr({ product: 'dashboard', realtime: 'core' });
  assert.ok(incluidos(vivo, 'communication').includes('websocket'));
  const ocasional = correr({ product: 'dashboard', realtime: 'occasional' });
  assert.ok(!incluidos(ocasional, 'communication').includes('websocket'));
  const ws = dec(ocasional, 'communication').alternatives.find(a => a.id === 'websocket');
  assert.match(ws.why_not[0], /consultar cada pocos segundos/);
});
test('búsqueda: simple → base de datos (no motor dedicado, y lo explica); central → motor dedicado', () => {
  const basica = correr({ product: 'ecommerce', search: 'basic', catalog: 'small' });
  assert.ok(!incluidos(basica, 'data_layers').includes('search-engine'));
  assert.match(dec(basica, 'data_layers').alternatives.find(a => a.id === 'search-engine').why_not[0], /base de datos/);
  assert.ok(incluidos(correr({ product: 'marketplace' }), 'data_layers').includes('search-engine'));
});
test('IA en el producto: asistente / workflow / agente según el caso; multiagente jamás primero; sin IA no hay decisión', () => {
  assert.equal(top(correr({ product: 'saas', ai: 'assist' }), 'ai_product'), 'ai-assistant');
  assert.equal(top(correr({ product: 'saas', ai: 'automate' }), 'ai_product'), 'ai-workflow');
  const abierta = correr({ product: 'saas', ai: 'open_ended', scale: 'large' });
  assert.equal(top(abierta, 'ai_product'), 'ai-agent');
  assert.notEqual(top(abierta, 'ai_product'), 'multi-agent');
  assert.ok(dec(abierta, 'ai_product').picks[0].revisit.some(t => /workflow|una sola llamada/.test(t)), 'recomienda medir antes de usar un agente');
  assert.equal(dec(correr({ product: 'saas', ai: 'none' }), 'ai_product'), undefined, 'sin IA en el producto, esa decisión no existe');
  assert.ok(correr({ product: 'saas', ai: 'automate' }).risks.some(t => /validá su salida/.test(t)));
});
test('IA para construir: asistida por IA con tests, asistente, o ninguna; «más agentes» no es mejor', () => {
  const c = correr({ product: 'saas', dev_ai: 'coding', team: 'small', time: 'urgent' });
  assert.equal(top(c, 'ai_dev'), 'ai-assisted-coding'); assert.ok(c.risks.some(t => /tests y revisión humana/.test(t)));
  assert.equal(top(correr({ product: 'saas', dev_ai: 'assistant' }), 'ai_dev'), 'ai-assistant');
  assert.equal(top(correr({ product: 'saas', dev_ai: 'none' }), 'ai_dev'), 'none');
  for (const dv of ['none', 'assistant', 'coding']) assert.notEqual(top(correr({ product: 'saas', dev_ai: dv, team: 'large', scale: 'large' }), 'ai_dev'), 'multi-agent');
});
test('calidad: los pesos cambian según el proyecto (no todos los atributos pesan igual)', () => {
  const w = (r, id) => r.quality.find(q => q.id === id).weight;
  const pagos = correr({ product: 'ecommerce', scale: 'small' }), landing = correr({ product: 'landing', scale: 'small', team: 'solo' });
  assert.equal(w(pagos, 'quality-security'), 3); assert.equal(w(landing, 'quality-security'), 1);
  assert.equal(w(landing, 'quality-seo'), 3); assert.equal(w(correr({ product: 'dashboard' }), 'quality-seo'), 1);
  assert.equal(w(correr({ product: 'saas', scale: 'large' }), 'quality-scalability'), 3); assert.equal(w(landing, 'quality-scalability'), 1);
  for (const q of pagos.quality) assert.ok(q.weight >= 1 && q.weight <= 3 && q.entity);
});

// ═══ propiedades que valen para CUALQUIER combinación ═══
test('nunca «usá X» a secas: toda elección trae razones, alternativas con «cuándo sería mejor», trade-offs y cuándo reconsiderar', () => {
  let semilla = 7; const rnd = n => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla % n; };
  const productos = M.signals.product.values;
  let casos = 0;
  for (let i = 0; i < 250; i++) {
    const a = { product: productos[rnd(productos.length)] };
    for (const q of M.questions) if (q.type === 'single' && q.id !== 'product' && rnd(3)) a[q.id] = rnd(5) === 0 ? B.UNKNOWN : q.offer[rnd(q.offer.length)];
    const st = B.emptyState(); let s2 = st;
    for (const [k, v] of Object.entries(a)) { const r = B.setAnswer(M, s2, k, v); if (!r.error) s2 = r.state; }
    const res = decide(RULES, K, B.resolve(M, s2)); casos++;
    for (const d of res.decisions) {
      if (d.kind === 'choice' && d.picks.length) {
        assert.equal(d.picks.length, 1, d.id);
        const p = d.picks[0]; assert.ok(p.reasons.length >= 1 && p.reasons.every(t => t.length > 15), `${d.id}: razones`);
        assert.ok(Array.isArray(p.revisit) && Array.isArray(p.tradeoffs));
        assert.ok(d.alternatives.length >= 1, `${d.id}: sin alternativas`);
        for (const alt of d.alternatives) { assert.ok(alt.better_when.length > 15); assert.ok(Number.isFinite(alt.score)); assert.ok(alt.fit === 'not_needed' || alt.score <= p.score, `${d.id}: la elegida debe tener el mayor puntaje entre las opciones justificadas`); }
        if (!p.entity) assert.ok(p.name && p.summary);
      }
      if (d.kind === 'set') for (const p of d.picks) assert.ok(p.reasons.length >= 1);
      assert.ok(['alta', 'media', 'baja'].includes(d.confidence.level));
      if (d.confidence.level === 'baja' && d.kind === 'choice') assert.ok(d.confidence.note.length > 10, 'si hay incertidumbre, se muestra');
    }
    for (const q of res.quality) assert.ok(q.weight >= 1 && q.weight <= 3);
  }
  assert.equal(casos, 250);
});
test('determinismo: mismas respuestas → mismo resultado, sin importar el orden en que se contestaron', () => {
  const a = { product: 'marketplace', team: 'small', scale: 'medium', ai: 'automate', dev_ai: 'coding', time: 'urgent' };
  const r1 = correr(a), r2 = correr(Object.fromEntries(Object.entries(a).reverse().sort((x, y) => (x[0] === 'product' ? -1 : y[0] === 'product' ? 1 : 0))));
  assert.deepEqual(JSON.parse(JSON.stringify(r1.decisions)), JSON.parse(JSON.stringify(r2.decisions)));
  assert.deepEqual(r1.risks, r2.risks);
});
test('lo que se decide antes condiciona lo posterior (comunicación depende del renderizado y de la arquitectura)', () => {
  const csr = correr({ product: 'dashboard' });                           // CSR → necesita API
  assert.ok(incluidos(csr, 'communication').includes('rest-api'));
  const wqw = correr({ product: 'saas', background: 'heavy', team: 'small' });
  assert.ok(dec(wqw, 'communication').picks.find(p => p.id === 'message-queue').reasons.some(t => /trabajador conectado por una cola/.test(t) || /tareas largas/.test(t)));
});

// ═══ Universo teórico vs. aplicación práctica ═══
import { JUSTIFICATION_IDS, NO_JUSTIFICATION_TYPES, FIT, NECESSITY } from '../../frontend/js/architect/model.js';
{
  const E = K.entities, R2 = JSON.parse(readFileSync(new URL('../../frontend/data/architect/rules.json', import.meta.url), 'utf8'));
  const dec2 = a => { let st = B.emptyState(); for (const [q, v] of Object.entries(a)) st = B.setAnswer(M, st, q, v).state; return decide(R2, K, B.resolve(M, st)); };
  const d = (res, id) => res.decisions.find(x => x.id === id);

  test('todo concepto de práctica declara su «justification» y los tipos de producto y calidad no', () => {
    for (const e of E) NO_JUSTIFICATION_TYPES.includes(e.type) ? assert.equal(e.justification, undefined, e.id) : assert.ok(JUSTIFICATION_IDS.includes(e.justification), `${e.id}: ${e.justification}`);
    assert.equal(K.get('microservices').justification, 'strong_reason');
    assert.equal(K.get('monolith').justification, 'baseline');
  });
  test('lo que requiere razón fuerte existe en la base pero no puede recomendarse sin una condición de justificación (lo valida el esquema de reglas)', () => {
    for (const dd of R2.decisions) for (const c of dd.candidates) if (!c.pseudo && K.get(c.id).justification === 'strong_reason') assert.ok(c.justified_when && c.unjustified, `${dd.id}/${c.id}`);
    const roto = structuredClone(R2); delete roto.decisions.find(x => x.id === 'architecture').candidates.find(c => c.id === 'microservices').justified_when;
    assert.match(validateRules(roto, M.signals, K).join(' | '), /microservices: es una opción que requiere razón fuerte: necesita justified_when/);
  });
  test('microservicios están explicados en la base pero un proyecto chico o mediano recibe un monolito (modular si hace falta) y se le dice que no se necesita todavía', () => {
    for (const a of [{ product: 'saas', team: 'small', scale: 'medium' }, { product: 'ecommerce', team: 'solo', scale: 'small' }, { product: 'saas', team: 'large', scale: 'small' }]) {
      const arq = d(dec2(a), 'architecture'), ms = arq.alternatives.find(x => x.id === 'microservices');
      assert.notEqual(arq.picks[0].id, 'microservices');
      assert.equal(ms.fit, 'not_needed'); assert.match(ms.why_not[0], /no muestra la necesidad que lo justificaría/);
    }
    assert.ok(K.get('microservices').explanation.length >= 2, 'la ficha sigue completa');
  });
  test('una opción avanzada se propone solo cuando el proyecto la justifica, y entonces se marca como «justificada»', () => {
    const grande = d(dec2({ product: 'saas', team: 'large', scale: 'large', background: 'heavy', realtime: 'core', integrations: 'many', ai: 'open_ended' }), 'ai_product');
    assert.ok(grande.picks.some(p => p.id === 'ai-agent' || p.id === 'ai-workflow'));
    const hy = d(dec2({ product: 'saas', team: 'large', scale: 'large' }), 'rendering');
    assert.equal(hy.picks[0].id, 'hybrid-rendering'); assert.equal(hy.picks[0].necessity, 'justified');
    const chico = d(dec2({ product: 'landing', team: 'solo', scale: 'small' }), 'rendering');
    assert.equal(chico.alternatives.find(x => x.id === 'hybrid-rendering').fit, 'not_needed');
  });
  test('ante la duda no se recomienda complejidad: con la información desconocida una opción avanzada no se justifica', () => {
    const r = dec2({ product: 'other' });
    for (const [dim, id] of [['architecture', 'microservices'], ['architecture', 'event-driven'], ['data_layers', 'search-engine'], ['data_layers', 'cache']]) {
      const x = d(r, dim); assert.ok(!x.picks.some(p => p.id === id), `${dim}/${id}`);
    }
  });
  test('cada propuesta dice si es apropiada y por qué se necesita; cada alternativa, si puede servir, no se necesita o no es apropiada', () => {
    for (const a of [{ product: 'ecommerce', team: 'small', scale: 'medium' }, { product: 'marketplace', team: 'large', scale: 'large' }, { product: 'landing' }]) {
      for (const dd of dec2(a).decisions) {
        for (const p of dd.picks) { assert.equal(p.fit, 'appropriate'); assert.ok(NECESSITY[p.necessity], `${dd.id}/${p.id}`); }
        for (const x of dd.alternatives) { assert.ok(FIT[x.fit] && x.fit !== 'appropriate', `${dd.id}/${x.id}: ${x.fit}`); assert.ok(x.why_not.length || x.fit === 'viable', `${dd.id}/${x.id} sin explicación`); }
      }
    }
  });
  test('lo que exige el proyecto se marca «se necesita» (pagos → base relacional; archivos → almacenamiento de objetos)', () => {
    const r = dec2({ product: 'ecommerce', team: 'solo', scale: 'small' });
    assert.equal(d(r, 'data_store').picks[0].necessity, 'required');
    assert.equal(d(r, 'data_layers').picks.find(p => p.id === 'object-storage').necessity, 'required');
  });
  test('el criterio es el proyecto, no la capacidad de quien lo construye: ninguna regla ni riesgo habla de «práctica», «experiencia» o «nivel» de la persona', () => {
    assert.doesNotMatch(JSON.stringify(R2), /exige práctica|tu nivel|sin experiencia|principiante/i);
  });
}

// ═══ Complejidad práctica (niveles 1–4) ═══
import { PRACTICAL_LEVELS, PRACTICAL_ZONE_MAX } from '../../frontend/js/architect/model.js';
import { validateComplexity } from '../../frontend/js/architect/complexity.js';
{
  const RX = JSON.parse(readFileSync(new URL('../../frontend/data/architect/rules.json', import.meta.url), 'utf8'));
  const run2 = (a, rules = RX) => { let st = B.emptyState(); for (const [q, v] of Object.entries(a)) st = B.setAnswer(M, st, q, v).state; return decide(rules, K, B.resolve(M, st)); };
  const nivel = a => run2(a).complexity.level;

  test('la clasificación 1–4 existe con sus ejemplos y todo concepto de práctica declara su nivel práctico (los atributos de calidad no)', () => {
    assert.deepEqual(Object.keys(PRACTICAL_LEVELS), ['1', '2', '3', '4']);
    assert.equal(PRACTICAL_ZONE_MAX, 3);
    for (const e of K.entities) e.type === 'quality_attribute' ? assert.equal(e.practical_level, undefined, e.id) : assert.ok([1, 2, 3, 4].includes(e.practical_level), `${e.id}: ${e.practical_level}`);
    assert.equal(K.get('microservices').practical_level, 4, 'la teoría cubre el nivel 4: la ficha existe y lo declara');
    assert.ok(K.get('microservices').explanation.length >= 2);
  });
  test('cada tipo de proyecto cae en su nivel: landing e institucional 1 · e-commerce y reservas 2 · gestión, dashboard y SaaS 3 · distribuido o de alta criticidad 4', () => {
    assert.equal(nivel({ product: 'landing' }), 1);
    assert.equal(nivel({ product: 'institutional-site' }), 1);
    assert.equal(nivel({ product: 'institutional-site', capture: 'bookings' }), 2, 'reservas');
    assert.equal(nivel({ product: 'institutional-site', content_edit: 'often' }), 2, 'CMS');
    assert.equal(nivel({ product: 'ecommerce', team: 'solo', scale: 'small' }), 2);
    for (const product of ['management-system', 'dashboard', 'saas']) assert.equal(nivel({ product, team: 'small', scale: 'small' }), 3, product);
    assert.equal(nivel({ product: 'saas', team: 'large', scale: 'large', background: 'heavy', realtime: 'core', integrations: 'many' }), 4);
    assert.equal(nivel({ product: 'management-system', sensitive_data: 'regulated' }), 4, 'alta criticidad');
    assert.equal(nivel({ product: 'marketplace', payments: 'split', scale: 'medium', team: 'large' }), 4);
  });
  test('un proyecto de nivel 4 no se bloquea: se recomienda igual, queda fuera de la zona habitual y pide supervisión cercana', () => {
    const r = run2({ product: 'saas', team: 'large', scale: 'large', background: 'heavy', realtime: 'core', integrations: 'many' });
    assert.equal(r.complexity.within_zone, false); assert.equal(r.complexity.supervision, 'close');
    assert.ok(r.decisions.every(d => d.picks.length || d.alternatives.length) && r.decisions.find(d => d.id === 'architecture').picks.length === 1);
    assert.ok(r.complexity.parts.length && r.complexity.simpler.length, 'muestra qué partes pesan y qué alternativa más simple las reduciría');
  });
  test('el nivel contextualiza pero NO cambia lo que se recomienda: con o sin el bloque de complejidad las decisiones son idénticas', () => {
    const sin = structuredClone(RX); delete sin.complexity;
    for (const a of [{ product: 'saas', team: 'large', scale: 'large' }, { product: 'ecommerce' }, { product: 'landing' }]) {
      assert.deepEqual(run2(a, sin).decided, run2(a).decided);
      assert.equal(run2(a, sin).complexity, null);
    }
  });
  test('lo que sube el nivel viene con su explicación y su alternativa más simple; las partes avanzadas indican qué opción más simple hay', () => {
    const c = run2({ product: 'ecommerce', payments: 'split', scale: 'medium', team: 'large' }).complexity;
    assert.ok(c.drivers.length >= 2 && c.drivers.every(d => d.reason));
    assert.ok(c.simpler.every(s => s.simpler && s.reason));
    const saas = run2({ product: 'saas', team: 'large', scale: 'large' }).complexity.parts;
    assert.ok(saas.some(p => p.simpler_option || p.simpler_text), 'alguna parte avanzada ofrece una opción más simple');
    assert.ok(saas.every(p => p.level >= 3));
  });
  test('producto sin definir: nivel estimado y marcado como incierto', () => {
    const c = run2({ product: 'other' }).complexity; assert.equal(c.uncertain, true); assert.equal(c.level, 2);
  });
  test('el validador de complejidad detecta reglas rotas', () => {
    const rompe = fn => { const x = structuredClone(RX.complexity); fn(x); return validateComplexity(x, M.signals, RX.decisions.map(d => d.id)).join(' | '); };
    assert.match(rompe(x => { x.bumps[0].to = 1; }), /to debe ser 2, 3 o 4/);
    assert.match(rompe(x => { delete x.bumps[0].reason; }), /falta reason/);
    assert.match(rompe(x => { x.bumps[0].when = { s: 'zzz', is: 'a' }; }), /señal desconocida/);
    assert.match(rompe(x => { x.bumps.find(b => b.to === 4).simpler = ''; }), /necesita «simpler»/);
    assert.match(rompe(x => { x.unknown_product_base = 9; }), /unknown_product_base/);
    assert.deepEqual(validateComplexity(RX.complexity, M.signals, RX.decisions.map(d => d.id)), []);
  });
}
