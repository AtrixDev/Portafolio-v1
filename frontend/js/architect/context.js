// js/architect/context.js — Convierte estado + resultado en el CONTEXTO de texto que usan los prompts y el pack. Puro.
import { summarize, resolve } from './builder.js';
import { EVIDENCE_TYPES } from './model.js';
import { evalCond } from './conditions.js';
import { complexityLine, complexityMarkdown } from './complexity.js';

export const NIVEL = { 1: 'bajo', 2: 'medio', 3: 'alto' };
const bullets = (items, empty = '- (ninguno por ahora)') => items.length ? items.map(x => `- ${x}`).join('\n') : empty;
const PRODUCT_NAME = (M, v) => (M.signals.product.labels[v] || 'Proyecto web');

/** Evalúa las condiciones de un ítem del pack sobre señales y decisiones. */
export const aplica = (item, res) => !item.when || evalCond(item.when, { signals: res.signals, decided: res.decided });

export function buildContext(M, state, res, K, pack, adrs = []) {
  const rows = summarize(M, state);
  const idea = state.answers.idea || '', users = state.answers.users || '';
  const productId = res.signals.product, productName = productId === 'unknown' ? 'Proyecto web (tipo todavía no definido)' : PRODUCT_NAME(M, productId);
  const sigRows = rows.filter(r => r.kind !== 'text' && r.signal !== 'product');   // el producto ya figura arriba
  const signalsMd = sigRows.map(r => `- ${r.label}: ${r.value}${r.kind === 'assumed' ? ' _(supuesto)_' : r.kind === 'unknown' ? ' _(abierto)_' : ''}`).join('\n');
  const summary = [`- **Qué se quiere construir:** ${idea || '(no definido)'}`, `- **Usuarios y problema:** ${users || '(no definido)'}`, `- **Tipo de producto:** ${productName}`, ...(res.complexity ? [`- **Complejidad práctica:** ${complexityLine(res.complexity)}`] : []), '', signalsMd].join('\n');
  const decisions = res.decisions.filter(d => d.picks.length).map(d => `- **${d.title}:** ${d.picks.map(p => p.name).join(', ')}${d.confidence.level === 'baja' ? ' _(confianza baja)_' : ''}`).join('\n');
  const risks = bullets(res.risks);
  const open = bullets(res.open.map(o => `${M.signals[o.signal]?.label || o.signal}: ${o.why}`));
  const quality = bullets(res.quality.map(q => `${q.entity.name}: ${NIVEL[q.weight]}`));
  const dm = pack.data_models[productId] || pack.data_models.other;
  const entities = [...dm.entities, ...pack.extra_entities.filter(x => aplica(x, res)).map(x => x.entity)].filter((e, i, a) => a.findIndex(y => y.name === e.name) === i);
  const dataModel = entities.map(e => `- **${e.name}**: ${e.fields.join(', ')}${e.note ? ` _(${e.note})_` : ''}`).join('\n') + (dm.relations.length ? `\n\nRelaciones: ${dm.relations.join('; ')}.` : '');
  const struct = (pack.structures.find(s => !s.when || evalCond(s.when, { signals: res.signals, decided: res.decided })) || pack.structures.at(-1));
  const structure = '```\n' + struct.tree + '\n```';
  const roadmap = pack.roadmap.map(ph => `### ${ph.title}\nObjetivo: ${ph.goal}\n${bullets(ph.tasks.filter(t => aplica(t, res)).map(t => t.text))}\nSe da por terminada cuando:\n${bullets(ph.exit)}`).join('\n\n');
  const testing = bullets(res.decisions.find(d => d.id === 'testing').picks.map(p => `${p.name}: ${p.reasons[0]}`));
  const security = bullets(pack.security_checklist.filter(t => aplica(t, res)).map(t => `${t.ref ? `[${t.ref}] ` : ''}${t.text}`));
  const dod = bullets(pack.definition_of_done.filter(t => aplica(t, res)).map(t => t.text));
  const ai = bullets(pack.ai_dev.filter(t => aplica(t, res)).map(t => t.text));
  const constraints = ['team', 'time', 'scale'].map(s => `- ${M.signals[s].label}: ${res.signals[s] === 'unknown' ? 'todavía no se sabe' : M.signals[s].labels[res.signals[s]]}${res.source[s] === 'assumed' ? ' (supuesto)' : ''}`).join('\n');
  return {
    idea: idea || '(no definido)', users: users || '(no definido)', product: productName, summary, decisions: decisions || '- (todavía no hay decisiones)',
    adrs: bullets(adrs.map(a => `${a.id} · ${a.title} (${a.status.toLowerCase()})`)), risks, open_questions: open, quality, constraints, data_model: dataModel, structure, roadmap,
    testing, security, definition_of_done: dod, ai_strategy: ai, complexity_md: complexityMarkdown(res.complexity),
    _entities: entities, _structure: struct,
  };
}
