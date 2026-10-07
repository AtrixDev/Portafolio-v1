// js/architect/adr.js — Architecture Decision Records generados a partir de las decisiones del Decision Engine. Puro.
// Estructura: Título · Estado · Contexto · Problema · Opciones · Decisión · Razones · Trade-offs · Consecuencias · Alternativas rechazadas · Cuándo reconsiderar · Fuentes.
// Un ADR generado es una PROPUESTA (criterio de este proyecto, basado en reglas y en las fuentes de cada concepto): se revisa antes de aceptarlo.
import { EVIDENCE_TYPES } from './model.js';

export const ADR_SECTIONS = ['context', 'problem', 'options', 'decision', 'rationale', 'tradeoffs', 'consequences', 'rejected', 'revisit', 'sources'];

/** Un ADR por decisión que tenga al menos una opción elegida. `project` = { signalsLabels } para describir el contexto. */
export function buildADRs(res, K, project = {}, M = null) {
  const out = [];
  for (const d of res.decisions) {
    if (!d.picks.length || d.picks.length + d.alternatives.length < 2) continue;   // sin una elección real entre opciones no hay ADR que escribir
    const n = out.length + 1, id = `ADR-${String(n).padStart(3, '0')}`;
    const picks = d.picks;
    const names = picks.map(p => p.name);
    const context = [];
    if (project.summaryLine) context.push(project.summaryLine);
    for (const sig of d.needs) {
      const v = res.signals[sig], src = res.source[sig];
      if (M && M.signals[sig]) context.push(`${M.signals[sig].label}: ${v === 'unknown' ? 'todavía no se sabe' : M.signals[sig].labels[v]}${src === 'assumed' ? ' (supuesto por el tipo de producto)' : ''}.`);
    }
    const consequences = [];
    for (const p of picks) {
      for (const t of p.tradeoffs) consequences.push(`${p.name}: ${t}`);
      const e = p.entity; if (e && e.cons?.length) consequences.push(`${p.name}, desventaja conocida: ${e.cons[0]}`);
    }
    const rejected = d.alternatives.map(a => ({ name: a.name, why: a.why_not.length ? a.why_not : ['No quedó entre las opciones recomendadas con lo que se sabe del proyecto.'], better_when: a.better_when }));
    const revisit = [...new Set(picks.flatMap(p => p.revisit))];
    for (const a of d.alternatives.filter(x => x.close)) revisit.push(`Reconsiderar a favor de «${a.name}» si: ${a.better_when}`);
    const srcs = new Map();
    for (const p of picks) for (const s of p.entity ? K.sourcesOf(p.id) : []) srcs.set(s.id, { name: s.name, organization: s.organization, url: s.url, evidence: EVIDENCE_TYPES[s.evidence_type].label });
    out.push({
      id, decision_id: d.id, title: d.kind === 'choice' ? `${d.title}: ${names[0]}` : `${d.title}: ${names.join(', ')}`,
      status: 'Propuesta',
      status_note: 'Generada por Web Project Architect con reglas de criterio propio (no es un estándar). Revisala y ajustala antes de aceptarla.',
      context, problem: `Decidir ${d.title.charAt(0).toLowerCase()}${d.title.slice(1)}.`,
      options: [...picks.map(p => ({ name: p.name, chosen: true, summary: p.summary })), ...d.alternatives.map(a => ({ name: a.name, chosen: false, summary: a.summary }))],
      decision: d.kind === 'choice' ? `Se propone «${names[0]}».` : `Se proponen: ${names.join(', ')}.`,
      rationale: picks.flatMap(p => d.kind === 'choice' ? p.reasons : p.reasons.map(r => `${p.name}: ${r}`)),
      tradeoffs: picks.flatMap(p => p.tradeoffs.map(t => (d.kind === 'choice' ? t : `${p.name}: ${t}`))),
      consequences, rejected, revisit, sources: [...srcs.values()],
      confidence: d.confidence,
    });
  }
  return out;
}

export function adrToMarkdown(a, { date = '' } = {}) {
  const L = [`# ${a.id}: ${a.title}`, '', `- **Estado:** ${a.status}${a.status_note ? ` — ${a.status_note}` : ''}`, ...(date ? [`- **Fecha:** ${date}`] : []), `- **Confianza:** ${a.confidence.level}${a.confidence.note ? ` — ${a.confidence.note}` : ''}`, ''];
  const sec = (t, items, num = false) => { if (!items.length) return; L.push(`## ${t}`, '', ...items.map((x, i) => (num ? `${i + 1}. ${x}` : `- ${x}`)), ''); };
  sec('Contexto', a.context);
  L.push('## Problema', '', a.problem, '');
  sec('Opciones consideradas', a.options.map(o => `${o.chosen ? '**' + o.name + '** (elegida)' : o.name}: ${o.summary}`));
  L.push('## Decisión', '', a.decision, '');
  sec('Razones', a.rationale);
  sec('Trade-offs', a.tradeoffs);
  sec('Consecuencias', a.consequences);
  if (a.rejected.length) { L.push('## Alternativas rechazadas', ''); for (const r of a.rejected) L.push(`- **${r.name}**: ${r.why.join(' ')} _Sería mejor si:_ ${r.better_when}`); L.push(''); }
  sec('Condiciones para reconsiderar', a.revisit);
  sec('Fuentes', a.sources.map(s => `[${s.name}](${s.url}) — ${s.organization} (${s.evidence})`));
  return L.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
