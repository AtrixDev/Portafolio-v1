// js/architect/model.js — Modelo de conocimiento de Web Project Architect.
// Puro (sin DOM, sin red): lo cargan el navegador y los tests de Node. Define las dimensiones, los enums y las validaciones.
// Regla de fondo: cada dimensión es una cosa distinta (E-commerce ≠ Monolito · PostgreSQL ≠ Base relacional · SSR ≠ Next.js · Agente ≠ código asistido por IA).

// ── Dimensiones (tipos de entidad) ──
// «Source» y «Prompt» tienen su propio modelo (sources.json, prompts.json): no son entidades de conocimiento.
export const ENTITY_TYPES = Object.freeze({
  product_type:          { label: 'Tipo de producto',          plural: 'Tipos de producto',          group: 'Producto' },
  capability:            { label: 'Capacidad',                 plural: 'Capacidades',                group: 'Producto' },
  requirement:           { label: 'Requisito',                 plural: 'Requisitos',                 group: 'Producto' },
  domain:                { label: 'Dominio',                   plural: 'Dominios',                   group: 'Producto' },
  architecture_style:    { label: 'Estilo de arquitectura',    plural: 'Estilos de arquitectura',    group: 'Arquitectura' },
  architectural_pattern: { label: 'Patrón arquitectónico',     plural: 'Patrones arquitectónicos',   group: 'Arquitectura' },
  rendering_strategy:    { label: 'Estrategia de renderizado', plural: 'Estrategias de renderizado', group: 'Frontend' },
  frontend_pattern:      { label: 'Patrón de frontend',        plural: 'Patrones de frontend',       group: 'Frontend' },
  backend_pattern:       { label: 'Patrón de backend',         plural: 'Patrones de backend',        group: 'Backend y datos' },
  data_pattern:          { label: 'Patrón de datos',           plural: 'Patrones de datos',          group: 'Backend y datos' },
  communication_pattern: { label: 'Patrón de comunicación',    plural: 'Patrones de comunicación',   group: 'Backend y datos' },
  integration:           { label: 'Integración',               plural: 'Integraciones',              group: 'Backend y datos' },
  authn_authz:           { label: 'Autenticación y autorización', plural: 'Autenticación y autorización', group: 'Seguridad' },
  infrastructure:        { label: 'Infraestructura',           plural: 'Infraestructura',            group: 'Operación' },
  deployment:            { label: 'Despliegue',                plural: 'Despliegue',                 group: 'Operación' },
  quality_attribute:     { label: 'Atributo de calidad',       plural: 'Atributos de calidad',       group: 'Calidad' },
  security:              { label: 'Seguridad',                 plural: 'Seguridad',                  group: 'Seguridad' },
  testing:               { label: 'Testing',                   plural: 'Testing',                    group: 'Calidad' },
  observability:         { label: 'Observabilidad',            plural: 'Observabilidad',             group: 'Operación' },
  ai_workflow:           { label: 'Flujo de trabajo con IA',   plural: 'Flujos de trabajo con IA',   group: 'IA' },
  ai_agent_pattern:      { label: 'Patrón de agentes de IA',   plural: 'Patrones de agentes de IA',  group: 'IA' },
  technology:            { label: 'Tecnología',                plural: 'Tecnologías',                group: 'Tecnologías y herramientas' },
  tool:                  { label: 'Herramienta',               plural: 'Herramientas',               group: 'Tecnologías y herramientas' },
});
export const TYPE_IDS = Object.freeze(Object.keys(ENTITY_TYPES));

// Alternativas solo dentro de la misma «familia» (no se compara una base de datos con un estilo de arquitectura).
export const TYPE_FAMILY = Object.freeze({ ai_workflow: 'ai', ai_agent_pattern: 'ai', technology: 'tech', tool: 'tech' });
export const familyOf = type => TYPE_FAMILY[type] || type;

// ── Evidencia: qué respalda lo que se afirma. NUNCA presentar una recomendación nuestra como estándar. ──
export const EVIDENCE_TYPES = Object.freeze({
  standard:               { label: 'Estándar',                  rank: 1, help: 'Norma o especificación publicada por un organismo (RFC, W3C, ISO, OWASP ASVS).' },
  official_documentation: { label: 'Documentación oficial',     rank: 2, help: 'Documentación de quien mantiene la tecnología o el servicio.' },
  official_framework:     { label: 'Framework oficial',         rank: 3, help: 'Guía de arquitectura o buenas prácticas publicada por un proveedor o proyecto de referencia.' },
  expert_source:          { label: 'Fuente experta',            rank: 4, help: 'Autor o equipo técnico reconocido, con argumento propio.' },
  industry_practice:      { label: 'Práctica de la industria',  rank: 5, help: 'Algo ampliamente usado, sin una norma que lo fije.' },
  recommendation:         { label: 'Recomendación propia',      rank: 6, help: 'Criterio de este proyecto. No es un estándar.' },
  example:                { label: 'Ejemplo',                   rank: 7, help: 'Un caso ilustrativo. No prueba nada por sí solo.' },
  opinion:                { label: 'Opinión',                   rank: 8, help: 'Punto de vista discutible.' },
});
export const EVIDENCE_IDS = Object.freeze(Object.keys(EVIDENCE_TYPES));
// Solo estos pueden respaldar una afirmación con una fuente externa.
export const SOURCE_EVIDENCE = Object.freeze(['standard', 'official_documentation', 'official_framework', 'expert_source', 'industry_practice']);
export const SOURCE_KINDS = Object.freeze(['specification', 'documentation', 'guide', 'article', 'book', 'tool_site']);

export const LEVELS = Object.freeze({ beginner: 'Inicial', intermediate: 'Intermedio', advanced: 'Avanzado' });

// ── Universo teórico vs. aplicación práctica ──
// La base cubre TODO lo que existe, aunque sea avanzado. Que algo exista en la base no lo vuelve una recomendación:
// «adoption» dice cuánta justificación pide en un proyecto (criterio de este proyecto, no un estándar). No mide a quién lo construye.
export const ADOPTION = Object.freeze({
  default:     { label: 'Punto de partida habitual', help: 'Suele ser razonable sin más información: no hace falta una razón especial para considerarlo.' },
  when_needed:{ label: 'Según necesidad',           help: 'Aporta cuando el proyecto tiene la necesidad que resuelve; sin ella, suma costo sin beneficio.' },
  specialized:{ label: 'Especializado',             help: 'Existe y conviene conocerlo, pero solo se recomienda con una razón fuerte y específica del proyecto.' },
});
export const ADOPTION_IDS = Object.freeze(Object.keys(ADOPTION));
/** Los tipos de producto y los atributos de calidad no se «adoptan»: no llevan este campo. */
export const NO_ADOPTION_TYPES = Object.freeze(['product_type', 'quality_attribute']);

// ── Decisión contextual: cuatro preguntas distintas ──
// 1) ¿Existe? → figura en la base.  2) ¿Puede servir? (fit «viable»)  3) ¿Se necesita? (necessity)  4) ¿Es apropiado para ESTE proyecto? (fit «appropriate»)
export const FIT = Object.freeze({
  appropriate: { label: 'Apropiado para este proyecto', tone: 'ok' },
  viable:      { label: 'Puede servir',                 tone: 'warn' },
  not_needed:  { label: 'No se necesita todavía',       tone: '' },
  not_fit:     { label: 'No es apropiado hoy',          tone: 'bad' },
});
export const NECESSITY = Object.freeze({
  required:     { label: 'Se necesita',                  help: 'Lo que se sabe del proyecto lo exige.' },
  justified:    { label: 'Se justifica por el proyecto', help: 'Es una opción avanzada y el proyecto muestra la necesidad que la justifica.' },
  proportional: { label: 'Proporcional',                 help: 'Es la opción más simple que cubre lo que el proyecto pide.' },
});

// ── Relaciones entre entidades (dirigidas; cada una tiene su lectura inversa para el panel «Relaciones») ──
export const RELATIONS = Object.freeze({
  alternative_to:   { label: 'es alternativa a',      inverse: 'es alternativa a',        symmetric: true },
  contrasts_with:   { label: 'se contrasta con',      inverse: 'se contrasta con',        symmetric: true },
  requires:         { label: 'requiere',              inverse: 'es requerido por' },
  enables:          { label: 'habilita',              inverse: 'se habilita con' },
  often_with:       { label: 'suele ir con',          inverse: 'suele ir con',            symmetric: true },
  part_of:          { label: 'es parte de',           inverse: 'incluye' },
  implements:       { label: 'implementa',            inverse: 'se implementa con' },
  addresses:        { label: 'atiende',               inverse: 'es atendido por' },
});

// ── Ejemplos: casos reales vs. demos. Nunca inferir experiencia profesional por la sola presencia de un ejemplo. ──
export const EXAMPLE_KINDS = Object.freeze({
  real_project:         { label: 'Proyecto real',          help: 'Un proyecto efectivamente construido y verificable (exige enlace).' },
  conceptual_example:   { label: 'Ejemplo conceptual',     help: 'Un caso imaginado para entender la idea.' },
  experiment:           { label: 'Experimento',            help: 'Una prueba hecha para explorar, no un producto.' },
  ai_generated_demo:    { label: 'Demo generada con IA',   help: 'Una demo producida por IA; no representa experiencia profesional.' },
  educational_example:  { label: 'Ejemplo educativo',      help: 'Un caso de manual para enseñar.' },
});

import { validateDiagram } from './diagram.js';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isStr = v => typeof v === 'string' && v.trim().length > 0;
const isStrArr = (v, min = 0) => Array.isArray(v) && v.length >= min && v.every(isStr);

// «full» = ficha completa (todo el modelo); «brief» = ficha de apoyo (tecnologías, atributos de calidad…).
export const DEPTHS = Object.freeze(['full', 'brief']);
export const PROFILE_KEYS = Object.freeze(['complexity', 'cost', 'ecosystem', 'scalability', 'maintenance', 'lock_in']);
export const PROFILE_LABELS = Object.freeze({ complexity: 'Complejidad', cost: 'Costo', ecosystem: 'Ecosistema', scalability: 'Escalabilidad', maintenance: 'Mantenimiento', lock_in: 'Dependencia del proveedor (lock-in)' });
const MIN = {
  full:  { explanation: 2, how_it_works: 1, when_to_use: 2, when_not_to_use: 1, pros: 2, cons: 2, tradeoffs: 1, common_mistakes: 1, decision_questions: 1, examples: 1 },
  brief: { explanation: 1, how_it_works: 0, when_to_use: 1, when_not_to_use: 0, pros: 0, cons: 0, tradeoffs: 0, common_mistakes: 0, decision_questions: 0, examples: 0 },
};
export const SUMMARY_MAX = 300;

/** Valida UNA entidad en sí misma (sin mirar las demás). Devuelve una lista de errores legibles. */
export function validateEntity(e, where = '') {
  const err = [], id = e && e.id, at = `${where}${id ? `«${id}»` : '(sin id)'}`;
  const bad = m => err.push(`${at}: ${m}`);
  if (!e || typeof e !== 'object') return [`${at}: no es un objeto`];
  if (!isStr(e.id) || !SLUG.test(e.id)) bad('id debe ser un slug en minúsculas con guiones');
  if (e.slug !== e.id) bad('slug debe ser igual a id');
  if (!isStr(e.name)) bad('falta name');
  if (!TYPE_IDS.includes(e.type)) bad(`type inválido: ${e.type}`);
  if (!isStr(e.category)) bad('falta category');
  if (!isStr(e.summary)) bad('falta summary'); else if (e.summary.length > SUMMARY_MAX) bad(`summary supera ${SUMMARY_MAX} caracteres`);
  if (!DEPTHS.includes(e.depth)) bad(`depth debe ser ${DEPTHS.join(' o ')}`);
  if (!Object.keys(LEVELS).includes(e.level)) bad(`level inválido: ${e.level}`);
  if (!EVIDENCE_IDS.includes(e.evidence_type)) bad(`evidence_type inválido: ${e.evidence_type}`);
  if (NO_ADOPTION_TYPES.includes(e.type)) { if (e.adoption !== undefined) bad(`un ${e.type} no lleva adoption`); }
  else if (!ADOPTION_IDS.includes(e.adoption)) bad(`adoption debe ser ${ADOPTION_IDS.join(', ')}`);
  const min = MIN[e.depth] || MIN.full;
  for (const k of ['explanation', 'how_it_works', 'when_to_use', 'when_not_to_use', 'pros', 'cons', 'tradeoffs', 'common_mistakes', 'decision_questions']) {
    if (!isStrArr(e[k], min[k])) bad(`${k} debe ser una lista de textos${min[k] ? ` (mínimo ${min[k]})` : ''}`);
  }
  if (!isStr(e.problem_solved)) bad('falta problem_solved');
  // alternatives / related / examples
  if (!Array.isArray(e.alternatives)) bad('alternatives debe ser una lista'); else e.alternatives.forEach((a, i) => { if (!a || !isStr(a.id) || !isStr(a.note)) bad(`alternatives[${i}] necesita id y note (en qué se diferencia)`); });
  if (!Array.isArray(e.related_entities)) bad('related_entities debe ser una lista'); else e.related_entities.forEach((r, i) => {
    if (!r || !isStr(r.id)) bad(`related_entities[${i}] necesita id`);
    else if (!RELATIONS[r.rel]) bad(`related_entities[${i}].rel inválida: ${r.rel}`);
  });
  if (!Array.isArray(e.examples) || e.examples.length < min.examples) bad(`examples debe tener al menos ${min.examples}`);
  else e.examples.forEach((x, i) => {
    if (!x || !EXAMPLE_KINDS[x.kind]) bad(`examples[${i}].kind inválido`);
    else {
      if (!isStr(x.label) || !isStr(x.text)) bad(`examples[${i}] necesita label y text`);
      if (x.kind === 'real_project' && !(isStr(x.url) && /^https:\/\//.test(x.url))) bad(`examples[${i}]: un proyecto real exige url https (no se infiere experiencia)`);
    }
  });
  if (!isStrArr(e.sources)) bad('sources debe ser una lista de ids de fuentes');
  if (e.library_refs !== undefined && !isStrArr(e.library_refs)) bad('library_refs debe ser una lista de ids de la Biblioteca web');
  if ('technologies' in e) bad('technologies no se escribe a mano: se deriva de las relaciones «implements»');
  if (e.diagram !== undefined) err.push(...validateDiagram(e.diagram, `${at}: `));
  // Tecnologías y herramientas llevan un perfil comparable (complejidad, costo, ecosistema, escalabilidad, mantenimiento, lock-in): evaluación de este proyecto, no un estándar.
  if (['technology', 'tool'].includes(e.type)) {
    if (!e.profile || typeof e.profile !== 'object') bad('una tecnología o herramienta necesita profile');
    else for (const k of PROFILE_KEYS) { const x = e.profile[k]; if (!x || !['bajo', 'medio', 'alto'].includes(x.level) || !isStr(x.text)) bad(`profile.${k} necesita level (bajo, medio o alto) y text`); }
  } else if (e.profile !== undefined) bad('solo una tecnología o herramienta lleva profile');
  return err;
}

/** Valida una fuente. */
export function validateSource(s) {
  const err = [], at = `fuente «${s && s.id}»`;
  if (!s || typeof s !== 'object') return [`${at}: no es un objeto`];
  if (!isStr(s.id) || !SLUG.test(s.id)) err.push(`${at}: id inválido`);
  for (const k of ['name', 'organization', 'topic']) if (!isStr(s[k])) err.push(`${at}: falta ${k}`);
  if (!isStr(s.url) || !/^https:\/\/[^\s]+$/.test(s.url)) err.push(`${at}: url https inválida`);
  if (!SOURCE_KINDS.includes(s.source_type)) err.push(`${at}: source_type inválido (${s.source_type})`);
  if (!SOURCE_EVIDENCE.includes(s.evidence_type)) err.push(`${at}: evidence_type de una fuente debe ser uno de ${SOURCE_EVIDENCE.join(', ')} (no «${s.evidence_type}»)`);
  if (s.checked !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(s.checked)) err.push(`${at}: checked debe ser AAAA-MM-DD`);
  if (s.verification !== undefined && !['ok', 'blocked', 'unverified'].includes(s.verification)) err.push(`${at}: verification inválida`);
  if (s.reserved_for !== undefined && !['adr', 'blueprint', 'prompts', 'pack'].includes(s.reserved_for)) err.push(`${at}: reserved_for inválido`);
  return err;
}

/** Valida todo el conocimiento junto: unicidad, referencias, evidencia coherente. */
export function validateKnowledge({ entities, sources }) {
  const err = [];
  const byId = new Map(), srcById = new Map();
  for (const s of sources) { err.push(...validateSource(s)); if (srcById.has(s.id)) err.push(`fuente duplicada: ${s.id}`); srcById.set(s.id, s); }
  for (const e of entities) { err.push(...validateEntity(e)); if (byId.has(e.id)) err.push(`entidad duplicada: ${e.id}`); byId.set(e.id, e); }
  for (const e of entities) {
    const at = `«${e.id}»`;
    for (const sid of e.sources || []) if (!srcById.has(sid)) err.push(`${at}: fuente inexistente «${sid}»`);
    // Evidencia coherente: lo que se declara respaldado por una fuente externa necesita una fuente de ESE tipo.
    if (SOURCE_EVIDENCE.includes(e.evidence_type)) {
      const ok = (e.sources || []).some(sid => srcById.get(sid)?.evidence_type === e.evidence_type);
      if (!ok) err.push(`${at}: declara evidence_type «${e.evidence_type}» pero ninguna de sus fuentes es de ese tipo`);
    } else if ((e.sources || []).length && e.evidence_type === 'opinion') err.push(`${at}: una opinión no se presenta con fuentes como respaldo`);
    for (const a of e.alternatives || []) {
      const t = byId.get(a.id);
      if (!t) err.push(`${at}: alternativa inexistente «${a.id}»`);
      else if (t.id === e.id) err.push(`${at}: es alternativa de sí misma`);
      else if (familyOf(t.type) !== familyOf(e.type)) err.push(`${at}: alternativa «${a.id}» es de otra dimensión (${t.type}); las alternativas se comparan dentro de la misma familia`);
    }
    for (const r of e.related_entities || []) {
      const t = byId.get(r.id);
      if (!t) err.push(`${at}: relación a entidad inexistente «${r.id}»`);
      else if (t.id === e.id) err.push(`${at}: relación consigo misma`);
      else if (r.rel === 'implements' && !['technology', 'tool'].includes(e.type)) err.push(`${at}: solo una tecnología o herramienta «implements» (no un ${e.type})`);
      else if (r.rel === 'implements' && ['technology', 'tool'].includes(t.type)) err.push(`${at}: una tecnología no implementa otra tecnología`);
    }
    for (const x of e.library_refs || []) if (!/^[a-z0-9-]+$/.test(x)) err.push(`${at}: library_ref inválida «${x}»`);
  }
  // Toda tecnología/herramienta debe implementar al menos un concepto (si no, no se la puede descubrir desde ninguno).
  for (const e of entities) if (['technology', 'tool'].includes(e.type) && !(e.related_entities || []).some(r => r.rel === 'implements')) err.push(`«${e.id}»: la ${ENTITY_TYPES[e.type].label.toLowerCase()} no implementa ningún concepto`);
  return err;
}

export const typeLabel = t => ENTITY_TYPES[t]?.label || t;
export const evidenceLabel = t => EVIDENCE_TYPES[t]?.label || t;
