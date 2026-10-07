// js/architect/builder.js — Project Builder: preguntas ADAPTATIVAS y estado del proyecto. Puro (sin DOM).
// Las preguntas viven en data/architect/questions.json. Cada respuesta fija una «señal» (un hecho normalizado del proyecto);
// el Decision Engine decide a partir de señales, nunca de textos libres.
//
// Estado: { v: 1, answers: { [questionId]: valor | 'unknown' | texto }, skipped: [questionId], fine: boolean }
//   - Las preguntas son «core» (las que más cambian las decisiones) o «fine» (afinar). Las «fine» solo se hacen si la persona elige afinar.
//   - «unknown» = «no lo sé todavía»: queda registrado como pregunta abierta; no se inventa una respuesta.
//   - Si el tipo de producto es conocido, las señales que no se preguntaron toman un valor SUPUESTO (product_defaults). Se muestran como supuestos.
import { evalCond, validateCond } from './conditions.js';

export const UNKNOWN = 'unknown';
export const STATE_VERSION = 1;
export const emptyState = () => ({ v: STATE_VERSION, answers: {}, skipped: [], fine: false });

export function buildModel(json) {
  const signals = Object.fromEntries(Object.entries(json.signals).map(([k, s]) => [k, { ...s, values: s.values.map(v => v.id), labels: Object.fromEntries(s.values.map(v => [v.id, v.label])) }]));
  return { signals, defaults: json.product_defaults, questions: json.questions, byId: new Map(json.questions.map(q => [q.id, q])) };
}

/** Valida el modelo de preguntas. `known` (opcional): ids de entidades existentes, para las ayudas «aprender más». */
export function validateModel(M, known = null) {
  const err = [], ids = new Set(), provided = new Set(['product']);
  for (const [i, q] of M.questions.entries()) {
    const at = `pregunta «${q.id}»`;
    if (ids.has(q.id)) err.push(`${at} duplicada`); ids.add(q.id);
    if (!q.text || !q.why) err.push(`${at}: necesita text y why (por qué se pregunta)`);
    if (!['core', 'fine'].includes(q.tier)) err.push(`${at}: tier debe ser core o fine`);
    if (!['single', 'text'].includes(q.type)) err.push(`${at}: type inválido`);
    if (q.type === 'single') {
      const sig = M.signals[q.signal];
      if (!sig) err.push(`${at}: señal inexistente «${q.signal}»`);
      else {
        if (!Array.isArray(q.offer) || q.offer.length < 2) err.push(`${at}: offer necesita al menos 2 valores`);
        for (const v of q.offer || []) if (!sig.values.includes(v)) err.push(`${at}: ofrece «${v}», que no es un valor de «${q.signal}»`);
        for (const v of Object.keys(q.help || {})) if (!(q.offer || []).includes(v)) err.push(`${at}: help para un valor que no se ofrece: ${v}`);
      }
    }
    if (q.type === 'text' && !(q.max > 0)) err.push(`${at}: un texto necesita max`);
    // show_if solo puede mirar señales que ya se preguntaron antes (o el producto): así el flujo no es circular
    if (q.show_if) {
      err.push(...validateCond(q.show_if, M.signals, [], `${at}: show_if: `));
      for (const s of condSignals(q.show_if)) if (!provided.has(s)) err.push(`${at}: show_if mira «${s}», que todavía no se preguntó en ese punto`);
    }
    if (q.signal) provided.add(q.signal);
    if (q.learn && known && !known.has(q.learn)) err.push(`${at}: learn apunta a una entidad inexistente «${q.learn}»`);
    if (i === 0 && q.type !== 'text') err.push('la primera pregunta debería ser abierta (qué se quiere construir)');
  }
  for (const [prod, d] of Object.entries(M.defaults)) {
    if (!M.signals.product.values.includes(prod)) err.push(`product_defaults para un producto inexistente: ${prod}`);
    for (const [s, v] of Object.entries(d)) { if (!M.signals[s]) err.push(`default de «${prod}»: señal inexistente ${s}`); else if (!M.signals[s].values.includes(v)) err.push(`default de «${prod}»: «${s}» no admite «${v}»`); }
  }
  for (const v of M.signals.product.values) if (!(v in M.defaults)) err.push(`falta product_defaults para «${v}»`);
  return err;
}
function condSignals(c, out = new Set()) {
  if (!c) return out;
  if (c.all || c.any) (c.all || c.any).forEach(x => condSignals(x, out));
  else if ('not' in c && !('s' in c)) condSignals(c.not, out);
  else if ('s' in c) out.add(c.s);
  return out;
}

/** Recorre las preguntas EN ORDEN. Devuelve las aplicables, las señales efectivas y de dónde sale cada valor. */
export function resolve(M, state) {
  const answered = {}, applicable = [];
  let defaults = {};
  const ctx = () => ({ signals: { ...defaults, ...answered }, decided: {} });
  const fineAll = [];
  for (const q of M.questions) {
    if (q.show_if && !evalCond(q.show_if, ctx())) continue;
    if (q.tier === 'fine') fineAll.push(q);
    if (q.tier === 'fine' && !state.fine) {
      // aunque no se pregunte, una respuesta ya dada sigue valiendo (por ejemplo, tras volver atrás)
      const a0 = state.answers[q.id];
      if (q.type === 'single' && a0 !== undefined && (a0 === UNKNOWN || q.offer.includes(a0))) { answered[q.signal] = a0; }
      continue;
    }
    applicable.push(q);
    const a = state.answers[q.id];
    if (q.type === 'single' && a !== undefined && (a === UNKNOWN || (q.offer.includes(a)))) {
      answered[q.signal] = a;
      if (q.signal === 'product' && a !== UNKNOWN) defaults = M.defaults[a] || {};
    }
  }
  const signals = {}, source = {};
  for (const [name, def] of Object.entries(M.signals)) {
    if (name in answered) { signals[name] = answered[name]; source[name] = answered[name] === UNKNOWN ? 'unknown' : 'answered'; }
    else if (name in defaults) { signals[name] = defaults[name]; source[name] = 'assumed'; }
    else { signals[name] = UNKNOWN; source[name] = 'unknown'; }
  }
  applicable.sort((x, y) => (x.tier === 'fine') - (y.tier === 'fine'));   // lo central primero, el afinado después (sort estable)
  const askable = new Set(applicable.filter(q => q.signal).map(q => q.signal));   // señales que este flujo realmente pregunta
  const fineLeft = state.fine ? 0 : fineAll.length;                                   // preguntas de «afinar» que todavía no se hicieron
  return { applicable, signals, source, askable, fineLeft };
}

export const isAnswered = (q, state) => state.answers[q.id] !== undefined || state.skipped.includes(q.id);

/** Próxima pregunta aplicable sin responder (o null si ya no queda ninguna). */
export function nextQuestion(M, state) {
  return resolve(M, state).applicable.find(q => !isAnswered(q, state)) || null;
}

export function progress(M, state) {
  const { applicable } = resolve(M, state);
  const done = applicable.filter(q => isAnswered(q, state)).length;
  return { done, total: applicable.length, finished: done === applicable.length };
}

/** Con el producto ya elegido hay base suficiente para recomendar (el resto se asume y se marca como supuesto). */
export const canRecommend = state => state.answers.product !== undefined;

/** Registra una respuesta (inmutable). Devuelve { state, error }. */
export function setAnswer(M, state, qid, value) {
  const q = M.byId.get(qid);
  if (!q) return { state, error: 'Pregunta inexistente.' };
  if (q.type === 'text') {
    const t = String(value ?? '').trim().slice(0, q.max);
    const answers = { ...state.answers }; if (t) answers[qid] = t; else delete answers[qid];
    return { state: { ...state, answers, skipped: t ? state.skipped.filter(x => x !== qid) : state.skipped }, error: null };
  }
  if (value !== UNKNOWN && !q.offer.includes(value)) return { state, error: 'Esa opción no corresponde a la pregunta.' };
  return { state: { ...state, answers: { ...state.answers, [qid]: value }, skipped: state.skipped.filter(x => x !== qid) }, error: null };
}
export function skip(M, state, qid) {
  if (!M.byId.has(qid)) return state;
  const answers = { ...state.answers }; delete answers[qid];
  return { ...state, answers, skipped: [...new Set([...state.skipped, qid])] };
}
/** Vuelve a una pregunta anterior (borra su respuesta y las posteriores que dependían de ella dejan de contar solas). */
export function reopen(M, state, qid) {
  const answers = { ...state.answers }; delete answers[qid];
  return { ...state, answers, skipped: state.skipped.filter(x => x !== qid) };
}

/** Resumen legible: una fila por pregunta aplicable, con el valor y si es supuesto. */
export function summarize(M, state) {
  const { applicable, signals, source } = resolve(M, state);
  const rows = [];
  for (const q of applicable) {
    if (q.type === 'text') { if (state.answers[q.id]) rows.push({ id: q.id, label: q.text, value: state.answers[q.id], kind: 'text' }); continue; }
    const s = M.signals[q.signal], v = signals[q.signal];
    rows.push({ id: q.id, signal: q.signal, label: s.label, value: v === UNKNOWN ? 'Todavía no lo sé' : s.labels[v], raw: v, kind: source[q.signal] });
  }
  // señales que no se preguntaron pero se asumieron por el tipo de producto
  const asked = new Set(applicable.map(q => q.signal));
  for (const [name, src] of Object.entries(source)) if (src === 'assumed' && !asked.has(name)) rows.push({ id: `assumed-${name}`, signal: name, label: M.signals[name].label, value: M.signals[name].labels[signals[name]], raw: signals[name], kind: 'assumed' });
  return rows;
}

// ═══ Estado ⇄ URL (compartir un proyecto con un enlace) ═══
const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function encodeState(state) {
  const compact = { v: state.v, a: state.answers, s: state.skipped, ...(state.fine ? { f: 1 } : {}) };
  return b64(JSON.stringify(compact));
}
/** Nunca lanza: un enlace roto o manipulado devuelve un estado vacío y la lista de problemas. */
export function decodeState(M, str) {
  const problems = [];
  let raw;
  try { raw = JSON.parse(unb64(String(str || ''))); } catch { return { state: emptyState(), problems: ['El enlace del proyecto no se pudo leer.'] }; }
  if (!raw || typeof raw !== 'object' || raw.v !== STATE_VERSION) return { state: emptyState(), problems: ['El enlace es de otra versión o está dañado.'] };
  const state = emptyState();
  for (const [qid, val] of Object.entries(raw.a && typeof raw.a === 'object' ? raw.a : {})) {
    const q = M.byId.get(qid);
    if (!q) { problems.push(`Se ignoró una respuesta a una pregunta que ya no existe (${String(qid).slice(0, 30)}).`); continue; }
    const r = setAnswer(M, state, qid, val); if (r.error) { problems.push(`Se ignoró una respuesta inválida a «${qid}».`); continue; }
    state.answers = r.state.answers;
  }
  for (const qid of Array.isArray(raw.s) ? raw.s : []) if (M.byId.has(qid) && !(qid in state.answers)) state.skipped.push(qid);
  state.fine = raw.f === 1;
  return { state, problems };
}

/** Activa las preguntas de afinado (opcionales). */
export const enableFine = state => ({ ...state, fine: true });
