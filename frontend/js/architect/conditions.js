// js/architect/conditions.js — Mini lenguaje de condiciones, compartido por el Project Builder (¿se muestra esta pregunta?)
// y el Decision Engine (¿aplica esta regla?). Las condiciones viven en JSON, no en código: se validan contra las señales definidas.
//
//   hoja de señal:   { "s": "scale", "is": "large" }  ·  { "s": "auth", "in": ["roles", "multi_tenant"] }  ·  { "s": "auth", "not": "none" }
//   hoja de decisión (solo en reglas): { "d": "rendering", "is": "csr" }  — mira lo que ya se decidió en otra dimensión
//   hoja de respuesta: { "known": "scale" }  — la señal fue respondida o asumida (no está «desconocida»)
//   compuestas:      { "all": [...] } · { "any": [...] } · { "not": cond }
//   vacía/ausente:   siempre verdadera

/** ctx = { signals: {nombre: valor}, decided: {dimensión: [ids elegidos]} } */
export function evalCond(c, ctx) {
  if (c === undefined || c === null) return true;
  if (c.all) return c.all.every(x => evalCond(x, ctx));
  if (c.any) return c.any.some(x => evalCond(x, ctx));
  if ('not' in c && !('s' in c)) return !evalCond(c.not, ctx);
  if ('known' in c) { const v = ctx.signals[c.known]; return v !== undefined && v !== 'unknown'; }
  if ('d' in c) { const got = ctx.decided?.[c.d] || []; return 'is' in c ? got.includes(c.is) : 'in' in c ? c.in.some(x => got.includes(x)) : got.length > 0; }
  if ('s' in c) {
    const v = ctx.signals[c.s];
    if ('is' in c) return v === c.is;
    if ('in' in c) return c.in.includes(v);
    if ('not' in c) return v !== c.not && v !== undefined && v !== 'unknown';   // «distinto de»: una señal desconocida no cuenta como distinta
    if ('has' in c) return Array.isArray(v) && v.includes(c.has);
  }
  throw new Error('Condición desconocida: ' + JSON.stringify(c));
}

/** Valida una condición contra las señales (nombre y valores permitidos) y las dimensiones de decisión. Devuelve errores. */
export function validateCond(c, signals, decisions = [], where = '') {
  const err = [], bad = m => err.push(`${where}${m}`);
  if (c === undefined || c === null) return err;
  if (typeof c !== 'object') { bad('condición inválida'); return err; }
  if (c.all || c.any) { const l = c.all || c.any; if (!Array.isArray(l) || !l.length) bad('all/any necesita una lista no vacía'); else l.forEach(x => err.push(...validateCond(x, signals, decisions, where))); return err; }
  if ('not' in c && !('s' in c)) return validateCond(c.not, signals, decisions, where);
  if ('known' in c) { if (!signals[c.known]) bad(`señal desconocida: ${c.known}`); return err; }
  if ('d' in c) { if (!decisions.includes(c.d)) bad(`dimensión de decisión desconocida: ${c.d}`); return err; }
  if ('s' in c) {
    const def = signals[c.s]; if (!def) { bad(`señal desconocida: ${c.s}`); return err; }
    const vals = [c.is, ...(c.in || []), c.not, c.has].filter(x => x !== undefined);
    if (!vals.length) bad(`condición sobre «${c.s}» sin is / in / not / has`);
    for (const v of vals) if (!def.values.includes(v)) bad(`«${c.s}» no admite el valor «${v}»`);
    if (c.has !== undefined && !def.multi) bad(`«${c.s}» no es de selección múltiple`);
    return err;
  }
  bad('condición no reconocida: ' + JSON.stringify(c)); return err;
}
