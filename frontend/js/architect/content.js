// js/architect/content.js — Arma el conocimiento a partir de los JSON: índices, relaciones (con sus inversas), alternativas, tecnologías derivadas y búsqueda.
// Puro: no toca el DOM ni la red. `loadKnowledge` recibe una función que lee JSON (fetch en el navegador, fs en los tests).
import { ENTITY_TYPES, RELATIONS, validateKnowledge, familyOf } from './model.js';
import { buildIndex, search as runSearch } from './search.js';

export async function loadKnowledge(readJson, base = 'data/architect/') {
  const manifest = await readJson(base + 'index.json');
  const parts = await Promise.all(manifest.entities.map(p => readJson(base + p)));
  const sources = await readJson(base + manifest.sources);
  return { entities: parts.flat(), sources, manifest };
}

export function buildKnowledge({ entities, sources }, { validate = true } = {}) {
  if (validate) { const err = validateKnowledge({ entities, sources }); if (err.length) throw new Error('Conocimiento inválido:\n' + err.join('\n')); }
  const list = entities.map(e => ({ ...e, _group: ENTITY_TYPES[e.type].group }));
  const byId = new Map(list.map(e => [e.id, e]));
  const srcById = new Map(sources.map(s => [s.id, s]));
  const out = new Map(list.map(e => [e.id, []])), inc = new Map(list.map(e => [e.id, []]));
  for (const e of list) for (const r of e.related_entities) {
    out.get(e.id).push({ rel: r.rel, to: r.id, note: r.note || '' });
    inc.get(r.id).push({ rel: r.rel, from: e.id, note: r.note || '' });
  }
  // alternativas: las declaradas por la entidad + las que otras declaran sobre ella (la comparación es simétrica)
  const altOf = id => {
    const seen = new Map();
    for (const a of byId.get(id).alternatives) seen.set(a.id, { entity: byId.get(a.id), note: a.note });
    for (const e of list) if (e.id !== id && !seen.has(e.id)) { const back = e.alternatives.find(a => a.id === id); if (back) seen.set(e.id, { entity: e, note: back.note, reverse: true }); }
    return [...seen.values()];
  };
  const index = buildIndex(list);

  const api = {
    entities: list, sources, index,
    get: id => byId.get(id) || null,
    source: id => srcById.get(id) || null,
    sourcesOf: id => (byId.get(id)?.sources || []).map(s => srcById.get(s)),
    byType: type => list.filter(e => e.type === type),
    /** Relaciones salientes, ya con la entidad destino resuelta y la etiqueta de lectura. */
    outgoing: id => out.get(id).map(r => ({ ...r, label: RELATIONS[r.rel].label, entity: byId.get(r.to) })),
    /** Relaciones entrantes con la lectura inversa («es requerido por»…). Las simétricas ya figuran en outgoing. */
    incoming: id => inc.get(id).filter(r => !RELATIONS[r.rel].symmetric).map(r => ({ ...r, label: RELATIONS[r.rel].inverse, entity: byId.get(r.from) })),
    /** Todas las relaciones de una entidad agrupadas por lectura, sin repetir pares simétricos. */
    relations(id) {
      const rows = [...api.outgoing(id), ...api.incoming(id)];
      for (const r of inc.get(id)) if (RELATIONS[r.rel].symmetric && !out.get(id).some(o => o.to === r.from && o.rel === r.rel)) rows.push({ ...r, label: RELATIONS[r.rel].label, entity: byId.get(r.from) });
      const g = new Map();
      for (const r of rows) (g.get(r.label) || g.set(r.label, []).get(r.label)).push(r);
      return [...g.entries()].map(([label, items]) => ({ label, items }));
    },
    alternatives: altOf,
    /** Tecnologías y herramientas que implementan un concepto (derivado de las relaciones «implements»). */
    technologies: id => inc.get(id).filter(r => r.rel === 'implements').map(r => byId.get(r.from)),
    /** Conceptos que una tecnología implementa. */
    implementsOf: id => out.get(id).filter(r => r.rel === 'implements').map(r => byId.get(r.to)),
    /** Conceptos que se vinculan con este por «often_with», «requires», etc. (para «descubrir» a partir de uno). */
    neighbors: id => [...new Set([...out.get(id).map(r => r.to), ...inc.get(id).map(r => r.from)])].map(x => byId.get(x)),
    counts: () => { const c = {}; for (const e of list) c[e.type] = (c[e.type] || 0) + 1; return c; },
    groups: () => [...new Set(list.map(e => e._group))],
    search: (q, filters) => runSearch(index, q, filters),
    family: familyOf,
  };
  return api;
}
