// js/architect/pack.js — Project Pack: todo lo que se necesita para arrancar, en un solo documento (Markdown) y en datos (JSON). Puro.
// Secciones: Resumen · Requisitos · Arquitectura · Blueprint · ADRs · Modelo de datos · Tecnologías · Estructura · Roadmap · Testing ·
//            Seguridad · QA · IA para desarrollar · Prompts · Definición de terminado · Riesgos · Preguntas abiertas.
import { buildBlueprints, toMermaid } from './blueprint.js';
import { buildADRs, adrToMarkdown } from './adr.js';
import { buildContext, aplica, NIVEL } from './context.js';
import { renderAll } from './prompts.js';
import { describeDiagram, DIAGRAM_PURPOSES } from './diagram.js';
import { validateCond } from './conditions.js';
import { PROFILE_KEYS, PROFILE_LABELS, EVIDENCE_TYPES } from './model.js';

export const PACK_SECTIONS = ['summary', 'requirements', 'architecture', 'blueprint', 'adrs', 'data_model', 'technology', 'structure', 'roadmap', 'testing', 'security', 'qa', 'ai_strategy', 'prompts', 'definition_of_done', 'risks', 'open_questions'];
const TITLES = { summary: 'Resumen del proyecto', requirements: 'Requisitos', architecture: 'Arquitectura', blueprint: 'Blueprint (diagramas)', adrs: 'Decisiones de arquitectura (ADR)', data_model: 'Modelo de datos de partida', technology: 'Recomendaciones de tecnología', structure: 'Estructura del proyecto', roadmap: 'Hoja de ruta', testing: 'Estrategia de pruebas', security: 'Lista de verificación de seguridad', qa: 'Lista de verificación de calidad (QA)', ai_strategy: 'Estrategia de desarrollo con IA', prompts: 'Prompts para Claude Code', definition_of_done: 'Definición de terminado', risks: 'Riesgos', open_questions: 'Preguntas abiertas' };
const bullets = (a, empty = '- (ninguno por ahora)') => a.length ? a.map(x => `- ${x}`).join('\n') : empty;
const shift = (md, n = 2) => md.replace(/^(#{1,5}) /gm, (_, h) => '#'.repeat(h.length + n) + ' ');

export function buildPack({ M, state, res, K, packData, promptsData, date = '' }) {
  const adrs = buildADRs(res, K, { summaryLine: `Proyecto: ${state.answers.idea || 'sin descripción'}` }, M);
  const ctx = buildContext(M, state, res, K, packData, adrs);
  const blueprints = buildBlueprints(res, K, { productName: ctx.product, users: state.answers.users ? undefined : undefined });
  const prompts = renderAll(promptsData, ctx);
  const productId = res.signals.product;

  const func = packData.functional[productId] || packData.functional.other;
  const nonFunc = res.quality.filter(q => q.weight >= 2).map(q => `${q.entity.name} (peso ${NIVEL[q.weight]}): definir un criterio medible y cómo se verifica. ${q.reasons[0] || ''}`.trim());

  const arch = res.decisions.filter(d => d.picks.length).map(d => {
    const lines = [`### ${d.title}`, `**Propuesta:** ${d.picks.map(p => p.name).join(', ')} · **Confianza:** ${d.confidence.level}${d.confidence.note ? ` — ${d.confidence.note}` : ''}`, ''];
    for (const p of d.picks) lines.push(`- **${p.name}**: ${p.reasons.join(' ')}`);
    if (d.alternatives.length) lines.push('', '_Alternativas y cuándo serían mejores:_', ...d.alternatives.map(a => `- ${a.name}: ${a.better_when}${a.why_not.length ? ` _(Hoy no, porque: ${a.why_not[0]})_` : ''}`));
    return lines.join('\n');
  }).join('\n\n');

  const bp = blueprints.map(b => `### ${b.title}\n_${DIAGRAM_PURPOSES[b.purpose]}_\n\n\`\`\`mermaid\n${toMermaid(b)}\n\`\`\`\n\nConexiones:\n${bullets(describeDiagram(b).connections)}\n${b.notes.length ? '\n' + bullets(b.notes) : ''}`).join('\n\n');

  const techSections = [];
  for (const d of res.decisions) for (const p of d.picks) {
    const techs = p.entity ? K.technologies(p.id) : [];
    if (!techs.length) continue;
    const t = techs.map(x => {
      const alts = x.alternatives.map(a => `${K.get(a.id).name} (${a.note})`).join('; ');
      return `- **${x.name}** — ${x.summary}\n${PROFILE_KEYS.map(k => `  - ${PROFILE_LABELS[k]}: ${x.profile[k].level} — ${x.profile[k].text}`).join('\n')}${alts ? `\n  - Alternativas: ${alts}` : ''}`;
    }).join('\n');
    techSections.push(`### Para «${p.name}» (${d.title})\n${t}`);
  }
  const tech = techSections.length ? techSections.join('\n\n') + `\n\n_Estas evaluaciones son criterio de este proyecto (${EVIDENCE_TYPES.recommendation.label.toLowerCase()}), no un estándar. Ninguna tecnología es la respuesta universal: primero se decide el patrón y después con qué se implementa._`
    : 'Las decisiones propuestas no dependen de una tecnología concreta todavía.';

  const sections = [
    ['summary', ctx.summary],
    ['requirements', `### Funcionales (punto de partida por tipo de producto: revisalos y completalos)\n${bullets(func)}\n\n### No funcionales (según el peso de cada atributo de calidad en este proyecto)\n${bullets(nonFunc)}\n\n### Restricciones\n${ctx.constraints}`],
    ['architecture', arch || 'Todavía no hay decisiones.'],
    ['blueprint', bp],
    ['adrs', adrs.map(a => shift(adrToMarkdown(a, { date }))).join('\n')],
    ['data_model', ctx.data_model + '\n\n_Es un punto de partida para conversar, no un modelo final: ajustalo con el dominio real._'],
    ['technology', tech],
    ['structure', `${ctx._structure.title}\n\n${ctx.structure}`],
    ['roadmap', ctx.roadmap],
    ['testing', ctx.testing],
    ['security', `Basada en el OWASP Top 10:2025 y en los riesgos específicos del proyecto. Para verificar con requisitos concretos, usá OWASP ASVS.\n\n${ctx.security}`],
    ['qa', bullets(packData.qa_checklist.filter(t => aplica(t, res)).map(t => t.text))],
    ['ai_strategy', ctx.ai_strategy],
    ['prompts', prompts.map(p => `### ${p.title}\n_${p.stage} · ${p.use_when}_\n\n\`\`\`\`text\n${p.text}\n\`\`\`\``).join('\n\n')],
    ['definition_of_done', ctx.definition_of_done],
    ['risks', ctx.risks],
    ['open_questions', ctx.open_questions],
  ].map(([id, markdown]) => ({ id, title: TITLES[id], markdown }));

  return {
    meta: { generated: date, version: 1, product: ctx.product, idea: state.answers.idea || '', note: 'Generado por Web Project Architect. Las recomendaciones salen de reglas de criterio propio apoyadas en las fuentes de cada concepto; revisalas antes de actuar.' },
    sections, adrs, blueprints, prompts, context: Object.fromEntries(Object.entries(ctx).filter(([k]) => !k.startsWith('_'))),
    decisions: res.decisions.map(d => ({ id: d.id, title: d.title, picks: d.picks.map(p => p.id), confidence: d.confidence.level })),
  };
}

export function packToMarkdown(pack) {
  const head = [`# Project Pack: ${pack.meta.product}`, '', pack.meta.idea ? `> ${pack.meta.idea}` : '', '', `_${pack.meta.note}_${pack.meta.generated ? ` Fecha: ${pack.meta.generated}.` : ''}`, '', '## Contenido', '', ...pack.sections.map((s, i) => `${i + 1}. ${s.title}`), ''];
  return head.concat(pack.sections.flatMap((s, i) => [`## ${i + 1}. ${s.title}`, '', s.markdown, ''])).join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** Valida los datos del pack: todas las condiciones sobre señales/decisiones reales y cobertura de todos los tipos de producto. */
export function validatePack(packData, signals, decisionIds) {
  const err = [];
  const cond = (c, at) => err.push(...validateCond(c, signals, decisionIds, `${at}: `));
  const items = (list, at) => list.forEach((t, i) => { if (!t.text) err.push(`${at}[${i}]: falta text`); if (t.when) cond(t.when, `${at}[${i}]`); });
  for (const prod of signals.product.values) {
    if (!packData.data_models[prod]) err.push(`data_models: falta «${prod}»`);
    if (!packData.functional[prod]?.length) err.push(`functional: falta «${prod}»`);
  }
  for (const [k, dm] of Object.entries(packData.data_models)) { if (!dm.entities?.length) err.push(`data_models.${k}: sin entidades`); for (const e of dm.entities) if (!e.name || !e.fields?.length) err.push(`data_models.${k}: entidad incompleta`); }
  packData.extra_entities.forEach((x, i) => cond(x.when, `extra_entities[${i}]`));
  packData.structures.forEach((s, i) => { if (s.when) cond(s.when, `structures[${i}]`); if (!s.tree || !s.title) err.push(`structures[${i}]: incompleta`); });
  if (packData.structures.at(-1).when) err.push('structures: la última debe ser la de respaldo (sin when)');
  packData.roadmap.forEach(ph => { items(ph.tasks, `roadmap.${ph.id}`); if (!ph.exit?.length || !ph.goal) err.push(`roadmap.${ph.id}: falta goal o exit`); });
  for (const k of ['definition_of_done', 'security_checklist', 'qa_checklist', 'ai_dev']) items(packData[k], k);
  return err;
}
