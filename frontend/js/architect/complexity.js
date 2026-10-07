// js/architect/complexity.js — Complejidad práctica de un proyecto (niveles 1–4). Puro.
// Contextualiza la aplicación; NO cambia qué se recomienda ni limita la teoría. Un proyecto de nivel 4 no se bloquea:
// se hace visible su complejidad, cuánto se aparta de la zona práctica habitual, qué partes piden más cuidado y qué opción más simple la reduciría.
import { evalCond, validateCond } from './conditions.js';
import { PRACTICAL_LEVELS, PRACTICAL_LEVEL_IDS, PRACTICAL_ZONE_MAX } from './model.js';

export function validateComplexity(cx, signals, decisions) {
  const err = [];
  if (!cx || typeof cx !== 'object') return ['falta el bloque «complexity» de las reglas'];
  if (!PRACTICAL_LEVEL_IDS.includes(cx.unknown_product_base)) err.push('complexity: unknown_product_base debe ser un nivel de 1 a 4');
  if (!Array.isArray(cx.bumps) || !cx.bumps.length) err.push('complexity: bumps debe ser una lista no vacía');
  for (const [i, b] of (cx.bumps || []).entries()) {
    const at = `complexity.bumps[${i}]`;
    if (![2, 3, 4].includes(b.to)) err.push(`${at}: to debe ser 2, 3 o 4 (el nivel 1 es el piso)`);
    if (!b.reason) err.push(`${at}: falta reason`);
    err.push(...validateCond(b.when, signals, decisions, `${at}: `));
    if (b.to === 4 && !b.simpler) err.push(`${at}: un salto al nivel 4 necesita «simpler» (qué alternativa más simple lo reduciría)`);
  }
  return err;
}

/** res = { signals, decided, decisions } (lo que arma decide() antes de cerrar). */
export function assessComplexity(cx, K, res) {
  if (!cx) return null;
  const ctx = { signals: res.signals, decided: res.decided };
  const product = res.signals.product, ent = K.get(product);
  const known = !!ent && ent.practical_level;
  const base = known ? ent.practical_level : cx.unknown_product_base;
  const fired = cx.bumps.filter(b => evalCond(b.when, ctx));
  const level = Math.max(base, ...fired.map(b => b.to));
  const raises = fired.filter(b => b.to > base);
  const drivers = [known ? { reason: `${ent.name} suele ser de ${PRACTICAL_LEVELS[base].short.toLowerCase()}.`, to: base } : { reason: 'El tipo de producto no está definido: se parte de un nivel 2 (web con backend y persistencia).', to: base }, ...raises.map(b => ({ reason: b.reason, to: b.to }))];
  // «qué alternativa más simple reduciría la complejidad»: solo para lo que subió el nivel
  const simpler = raises.filter(b => b.simpler).sort((a, b) => b.to - a.to).map(b => ({ reason: b.reason, simpler: b.simpler, to: b.to }));
  // partes de la propuesta que piden más cuidado, con la opción más simple que la reemplazaría
  const parts = [];
  for (const d of res.decisions) for (const p of d.picks) {
    const lv = p.entity?.practical_level; if (!lv || lv < 3) continue;
    // en una elección las alternativas son sustitutas; en un conjunto no (una caché no reemplaza a una cola): ahí la opción más simple la escribe la regla
    const alts = d.kind !== 'choice' ? [] : d.alternatives.filter(a => a.entity?.practical_level && a.entity.practical_level < lv && a.fit !== 'not_fit').sort((a, b) => a.entity.practical_level - b.entity.practical_level);
    parts.push({ id: p.id, name: p.name, decision: d.id, title: d.title, level: lv, attention: lv >= 4 ? 'advanced' : 'review', simpler_option: alts[0] ? { id: alts[0].id, name: alts[0].name, level: alts[0].entity.practical_level } : null, simpler_text: p.simpler || null });
  }
  parts.sort((a, b) => b.level - a.level);
  return {
    level, ...PRACTICAL_LEVELS[level], base, zone_max: PRACTICAL_ZONE_MAX,
    within_zone: level <= PRACTICAL_ZONE_MAX,
    supervision: level >= 4 ? 'close' : level === 3 ? 'review' : 'none',
    uncertain: !known, drivers, simpler, parts,
  };
}

const ZONE_TXT = c => c.within_zone ? `dentro de la zona práctica habitual (niveles 1 a ${c.zone_max})` : `fuera de la zona práctica habitual (niveles 1 a ${c.zone_max})`;
/** Qué implica el nivel, sin bloquear nada. */
export const SUPERVISION_TXT = Object.freeze({
  none: 'Se puede encarar con el flujo habitual de desarrollo asistido por IA.',
  review: 'Dentro de lo habitual, con partes que merecen una revisión cuidadosa de lo que se genera.',
  close: 'No está bloqueado, pero conviene supervisión cercana: revisión de arquitectura y de seguridad por quien conozca estas piezas, pruebas más exigentes y avanzar por etapas.',
});
/** Una línea para el resumen (y por eso para todos los prompts). */
export const complexityLine = c => c ? `Nivel práctico ${c.level} de 4 (${c.label.split(' · ')[1]}), ${ZONE_TXT(c)}${c.uncertain ? '; estimado: el tipo de producto no está definido' : ''}` : '';
/** Bloque completo para el Project Pack. */
export function complexityMarkdown(c) {
  if (!c) return '';
  const L = [`**${c.label}** — ${ZONE_TXT(c)}${c.uncertain ? ' _(estimado: falta definir el tipo de producto)_' : ''}.`, '', SUPERVISION_TXT[c.supervision], '', '_Los niveles contextualizan la aplicación práctica; no limitan lo que la base explica._', '', '**Por qué este nivel**', ...c.drivers.map(d => `- ${d.reason}`)];
  if (c.parts.length) L.push('', '**Partes que piden más cuidado**', ...c.parts.map(p => `- ${p.name} (${p.title}) — ${PRACTICAL_LEVELS[p.level].short}${p.level >= 4 ? ': conocimiento avanzado y supervisión cercana' : ': revisión cuidadosa'}.${p.simpler_option ? ` Más simple: ${p.simpler_option.name} (${PRACTICAL_LEVELS[p.simpler_option.level].short}).` : p.simpler_text ? ` Más simple: ${p.simpler_text}` : ''}`));
  if (c.simpler.length) L.push('', '**Qué lo haría más simple**', ...c.simpler.map(s => `- ${s.reason} → ${s.simpler}`));
  return L.join('\n');
}
