// js/architect/search.js — Búsqueda sobre entidades (puro). Sin acentos, sin mayúsculas, por prefijo y con peso por campo.
export const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
// plural simple: «colas» y «cola», «bases» y «base» se encuentran entre sí
const stem = t => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);
const tokens = s => norm(s).split(/[\s-]+/).filter(Boolean).map(stem);

// peso por campo: coincidir en el nombre vale más que coincidir en una explicación
const FIELDS = [['name', 8], ['id', 4], ['category', 2], ['summary', 3], ['problem_solved', 2], ['when_to_use', 1], ['explanation', 1], ['pros', .5], ['cons', .5]];
const text = v => Array.isArray(v) ? v.map(x => typeof x === 'string' ? x : x?.text || '').join(' ') : String(v ?? '');

/** Prepara un índice (una sola vez por conocimiento). */
export function buildIndex(entities) {
  return entities.map(e => ({
    e,
    fields: FIELDS.map(([k, w]) => ({ w, tk: tokens(text(e[k])), raw: norm(text(e[k])) })),
  }));
}

/** Puntaje de una entidad para una consulta: cada término debe aparecer (AND); el prefijo cuenta, la palabra exacta cuenta más. */
function score(entry, terms, phrase) {
  let total = 0;
  for (const t of terms) {
    let best = 0;
    for (const f of entry.fields) {
      let s = 0;
      for (const tk of f.tk) { if (tk === t) s = Math.max(s, f.w * 2); else if (tk.startsWith(t)) s = Math.max(s, f.w * 1.2); }
      if (!s && t.length >= 4 && f.raw.includes(t)) s = f.w * .5;
      best = Math.max(best, s);
    }
    if (!best) return 0;     // AND: un término sin coincidencia descarta la entidad
    total += best;
  }
  if (entry.fields[0].raw === phrase) total += 20;   // el nombre exacto sube primero
  return total;
}

/** search(index, query, filtros) → entidades ordenadas. Sin consulta, devuelve todas filtradas por nombre. */
export function search(index, query = '', filters = {}) {
  const terms = tokens(query), phrase = norm(query);
  const ok = e =>
    (!filters.types?.length || filters.types.includes(e.type)) &&
    (!filters.levels?.length || filters.levels.includes(e.level)) &&
    (!filters.evidence?.length || filters.evidence.includes(e.evidence_type)) &&
    (!filters.groups?.length || filters.groups.includes(e._group));
  const out = [];
  for (const entry of index) {
    if (!ok(entry.e)) continue;
    const s = terms.length ? score(entry, terms, phrase) : 1;
    if (s > 0) out.push({ entity: entry.e, score: s });
  }
  out.sort((a, b) => b.score - a.score || a.entity.name.localeCompare(b.entity.name, 'es'));
  return out;
}
