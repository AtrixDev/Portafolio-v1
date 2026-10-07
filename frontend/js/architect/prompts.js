// js/architect/prompts.js — Generador de prompts reutilizables para Claude Code (o cualquier asistente), con el contexto del proyecto.
// Las plantillas viven en data/architect/prompts.json y usan {{variables}}; renderizar con una variable inexistente es un ERROR (no se deja pasar en silencio).
export const KEYS = ['idea', 'users', 'product', 'summary', 'decisions', 'adrs', 'risks', 'open_questions', 'quality', 'constraints', 'data_model', 'structure', 'roadmap', 'testing', 'security', 'definition_of_done', 'ai_strategy'];

export function placeholders(text) { return [...new Set([...String(text).matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map(m => m[1]))]; }

export function validatePrompts(P) {
  const err = [], ids = new Set();
  if (!P.preamble || !P.rules) err.push('faltan preamble o rules');
  for (const t of [P.preamble, P.rules]) for (const k of placeholders(t)) if (!KEYS.includes(k)) err.push(`preámbulo/reglas: variable desconocida {{${k}}}`);
  for (const p of P.prompts) {
    if (ids.has(p.id)) err.push(`prompt duplicado: ${p.id}`); ids.add(p.id);
    for (const f of ['title', 'stage', 'goal', 'use_when', 'template']) if (!p[f]) err.push(`prompt «${p.id}»: falta ${f}`);
    for (const k of placeholders(p.template)) if (!KEYS.includes(k)) err.push(`prompt «${p.id}»: variable desconocida {{${k}}}`);
  }
  return err;
}

export function renderTemplate(text, ctx) {
  return String(text).replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, k) => { if (!(k in ctx)) throw new Error(`Variable de prompt inexistente: ${k}`); return ctx[k]; });
}

/** Prompt completo: contexto del proyecto + tarea + reglas de trabajo. */
export function renderPrompt(P, id, ctx) {
  const p = P.prompts.find(x => x.id === id);
  if (!p) throw new Error(`Prompt inexistente: ${id}`);
  const text = [renderTemplate(P.preamble, ctx), renderTemplate(p.template, ctx), renderTemplate(P.rules, ctx)].join('\n\n');
  return { id: p.id, stage: p.stage, title: p.title, goal: p.goal, use_when: p.use_when, text };
}
export const renderAll = (P, ctx) => P.prompts.map(p => renderPrompt(P, p.id, ctx));
