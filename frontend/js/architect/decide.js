// js/architect/decide.js — Decision Engine. Determinista y explicable: reglas en data/architect/rules.json, sin LLM.
// Nunca devuelve solo «usá X»: cada decisión trae las razones (con los hechos del proyecto que las motivan), las alternativas y
// por qué no son la primera opción, los trade-offs, los riesgos, cuándo reconsiderar y cuánta confianza hay (con lo que falta saber).
import { evalCond, validateCond } from './conditions.js';
import { UNKNOWN } from './builder.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/** Valida las reglas contra las señales y las entidades (que existan, que las condiciones tengan sentido). */
export function validateRules(rules, signals, K) {
  const err = [], dims = rules.decisions.map(d => d.id), seen = new Set();
  for (const d of rules.decisions) {
    const at = `decisión «${d.id}»`;
    if (seen.has(d.id)) err.push(`${at} duplicada`); seen.add(d.id);
    if (!['choice', 'set'].includes(d.kind)) err.push(`${at}: kind inválido`);
    if (!d.title) err.push(`${at}: falta title`);
    for (const n of d.needs || []) if (!signals[n]) err.push(`${at}: needs menciona una señal inexistente «${n}»`);
    if (d.applies_if) err.push(...validateCond(d.applies_if, signals, dims, `${at}: applies_if: `));
    // una condición de decisión solo puede mirar decisiones anteriores
    const before = dims.slice(0, dims.indexOf(d.id));
    const cids = new Set();
    for (const c of d.candidates) {
      const cat = `${at}/${c.id}`;
      if (cids.has(c.id)) err.push(`${cat} duplicado`); cids.add(c.id);
      if (c.pseudo) { if (!c.name || !c.summary) err.push(`${cat}: una opción sin ficha necesita name y summary`); }
      else if (!K.get(c.id)) err.push(`${cat}: la entidad no existe`);
      if (!c.better_when) err.push(`${cat}: falta better_when (cuándo sería mejor)`);
      if (!Array.isArray(c.revisit)) err.push(`${cat}: revisit debe ser una lista`);
      if (d.kind === 'set' && c.base < (d.threshold ?? rules.threshold_default) && !c.not_needed) err.push(`${cat}: una opción de un conjunto que puede quedar afuera necesita not_needed`);
      for (const r of c.rules) {
        err.push(...validateCond(r.when, signals, before, `${cat}: regla: `));
        if (!Number.isFinite(r.delta) || !r.delta) err.push(`${cat}: delta inválido`);
        if (!r.reason) err.push(`${cat}: una regla necesita reason`);
      }
    }
    if (d.kind === 'choice' && d.candidates.length < 2) err.push(`${at}: una elección necesita al menos 2 opciones`);
  }
  for (const q of rules.quality) { if (!K.get(q.id)) err.push(`calidad «${q.id}»: la entidad no existe`); for (const r of q.rules) err.push(...validateCond(r.when, signals, dims, `calidad «${q.id}»: `)); }
  for (const r of rules.risks) { err.push(...validateCond(r.when, signals, dims, 'riesgo: ')); if (!r.text) err.push('riesgo sin text'); }
  return err;
}

function score(c, ctx) {
  let total = c.base; const pos = [], neg = [];
  for (const r of c.rules) if (evalCond(r.when, ctx)) { total += r.delta; (r.delta > 0 ? pos : neg).push(r.reason); }
  return { total, pos, neg };
}

/** decide(rules, K, { signals, source }) → resultado completo. `signals` y `source` salen de builder.resolve(). */
export function decide(rules, K, { signals, source, askable }) {
  const decided = {}, out = [];
  const ctx = () => ({ signals, decided });
  // solo cuenta como «falta» lo que este flujo pregunta (si no se pregunta para este producto, no es una incógnita)
  const isMissing = n => source[n] === 'unknown' && (!askable || askable.has(n));
  const isAssumed = n => source[n] === 'assumed';

  for (const d of rules.decisions) {
    if (d.applies_if && !evalCond(d.applies_if, ctx())) { decided[d.id] = []; continue; }
    const scored = d.candidates.map((c, i) => ({ c, i, ...score(c, ctx()) }));
    const entry = ({ c, total, pos, neg }) => {
      const e = c.pseudo ? null : K.get(c.id);
      return { id: c.id, entity: e, name: c.pseudo ? c.name : e.name, summary: c.pseudo ? c.summary : e.summary, score: total };
    };
    const missing = (d.needs || []).filter(isMissing), assumed = (d.needs || []).filter(isAssumed);
    let picks, alternatives, margin = null;

    if (d.kind === 'choice') {
      scored.sort((a, b) => b.total - a.total || b.c.base - a.c.base || a.i - b.i);
      const top = scored[0];
      margin = top.total - (scored[1]?.total ?? top.total - 3);
      picks = [{
        ...entry(top),
        reasons: top.pos.length ? top.pos : [top.c.default_reason || 'Es el punto de partida más simple con la información disponible.'],
        against: top.neg,
        tradeoffs: top.c.pseudo ? [] : (K.get(top.c.id).tradeoffs || []).slice(0, 2),
        revisit: top.c.revisit,
      }];
      alternatives = scored.slice(1).map(s => ({ ...entry(s), better_when: s.c.better_when, why_not: s.neg.length ? s.neg : (s.total < top.total ? [top.pos.length ? `Con lo que se sabe del proyecto, la elegida responde mejor: ${top.pos[0].charAt(0).toLowerCase()}${top.pos[0].slice(1)}` : 'Tiene menos respaldo que la opción elegida con lo que se sabe del proyecto.'] : []), close: top.total - s.total <= 2 }));
    } else {
      const th = d.threshold ?? rules.threshold_default;
      const inc = scored.filter(s => s.total >= th).sort((a, b) => b.total - a.total || a.i - b.i);
      picks = inc.map(s => ({ ...entry(s), reasons: s.pos.length ? s.pos : [s.c.default_reason || 'Aplica a todo proyecto de este tipo.'], against: s.neg, tradeoffs: s.c.pseudo ? [] : (K.get(s.c.id).tradeoffs || []).slice(0, 2), revisit: s.c.revisit }));
      alternatives = scored.filter(s => s.total < th).map(s => ({ ...entry(s), better_when: s.c.better_when, why_not: [s.c.not_needed].filter(Boolean), close: th - s.total <= 1 }));
    }
    decided[d.id] = picks.map(p => p.id);

    // confianza: lo que falta saber y lo que se está suponiendo bajan la certeza; un margen chico también
    let level = 'alta';
    if (assumed.length) level = 'media';
    if (d.kind === 'choice' && margin <= 2) level = level === 'alta' ? 'media' : level;
    if (missing.length || (d.kind === 'choice' && margin <= 1)) level = 'baja';
    out.push({
      id: d.id, kind: d.kind, title: d.title, needs: d.needs || [], picks, alternatives,
      confidence: { level, missing, assumed, margin, note: missing.length ? 'Falta información que podría cambiar esta decisión.' : assumed.length ? 'Se apoya en suposiciones por el tipo de producto: confirmalas.' : d.kind === 'choice' && margin <= 1 ? 'Dos opciones quedaron casi empatadas: es una decisión que merece una conversación.' : '' },
    });
  }

  const quality = rules.quality.map(q => {
    let w = q.base; const reasons = [];
    for (const r of q.rules) if (evalCond(r.when, ctx())) { w += r.delta; reasons.push(r.reason); }
    return { id: q.id, entity: K.get(q.id), weight: clamp(w, 1, q.max), reasons };
  }).sort((a, b) => b.weight - a.weight);

  const risks = rules.risks.filter(r => evalCond(r.when, ctx())).map(r => r.text);
  const openQuestions = [];
  for (const d of out) for (const m of d.confidence.missing) openQuestions.push({ signal: m, why: `Cambia la decisión «${d.title}».` });
  const merged = new Map(); for (const o of openQuestions) merged.set(o.signal, merged.has(o.signal) ? { ...o, why: merged.get(o.signal).why + ' ' + o.why } : o);
  return { signals, source, decisions: out, quality, risks, open: [...merged.values()], decided };
}
