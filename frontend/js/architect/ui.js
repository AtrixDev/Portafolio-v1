// js/architect/ui.js — Helpers de presentación (puros: devuelven strings HTML ya escapados). Sin acceso al DOM.
import { ENTITY_TYPES, EVIDENCE_TYPES, LEVELS, EXAMPLE_KINDS, JUSTIFICATION, FIT, NECESSITY, PRACTICAL_LEVELS, typeLabel } from './model.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const GROUP_ORDER = Object.freeze(['Producto', 'Arquitectura', 'Frontend', 'Backend y datos', 'Seguridad', 'Calidad', 'Operación', 'IA', 'Tecnologías y herramientas']);

export const href = (id) => `#/c/${encodeURIComponent(id)}`;

// Tono del badge de evidencia: lo respaldado por estándares y documentación es «ok»; lo propio se marca aparte, nunca como estándar.
const EVIDENCE_TONE = { standard: 'ok', official_documentation: 'info', official_framework: 'info', expert_source: '', industry_practice: '', recommendation: 'warn', example: 'warn', opinion: 'bad' };
export const evidenceBadge = (t, { help = false } = {}) => `<span class="ui-badge ${EVIDENCE_TONE[t] ? 'ui-badge--' + EVIDENCE_TONE[t] : ''}" ${help ? `title="${esc(EVIDENCE_TYPES[t]?.help || '')}"` : ''}>${esc(EVIDENCE_TYPES[t]?.label || t)}</span>`;
export const levelBadge = l => `<span class="ui-badge">${esc(LEVELS[l] || l)}</span>`;
const JUSTIFICATION_TONE = { baseline: 'ok', by_need: '', strong_reason: 'info' };
/** «Existe en la base» ≠ «recomendado»: cuánta justificación pide en un proyecto. Los tipos de producto y los atributos de calidad no lo llevan. */
export const justificationBadge = (a, { help = false } = {}) => JUSTIFICATION[a] ? `<span class="ui-badge ${JUSTIFICATION_TONE[a] ? 'ui-badge--' + JUSTIFICATION_TONE[a] : ''}" ${help ? `title="${esc(JUSTIFICATION[a].help)}"` : ''}>${esc(JUSTIFICATION[a].label)}</span>` : '';
/** Nivel práctico (1–4) de un concepto o de un proyecto: contextualiza la aplicación, no limita la teoría. */
export const practicalBadge = (n, { help = false } = {}) => PRACTICAL_LEVELS[n] ? `<span class="ui-badge ar-pl ar-pl-${n}" ${help ? `title="${esc(PRACTICAL_LEVELS[n].label + ': ' + PRACTICAL_LEVELS[n].summary)}"` : ''}>${esc(PRACTICAL_LEVELS[n].short)} práctico</span>` : '';
export const fitBadge = f => FIT[f] ? `<span class="ui-badge ${FIT[f].tone ? 'ui-badge--' + FIT[f].tone : ''}">${esc(FIT[f].label)}</span>` : '';
export const necessityBadge = n => NECESSITY[n] ? `<span class="ui-badge" title="${esc(NECESSITY[n].help)}">${esc(NECESSITY[n].label)}</span>` : '';
export const typeBadge = t => `<span class="ui-badge ar-type">${esc(typeLabel(t))}</span>`;
export const kindBadge = k => `<span class="ui-badge ${k === 'real_project' ? 'ui-badge--ok' : 'ui-badge--warn'}" title="${esc(EXAMPLE_KINDS[k]?.help || '')}">${esc(EXAMPLE_KINDS[k]?.label || k)}</span>`;

export const list = (items, cls = '') => items?.length ? `<ul class="ar-list ${cls}">${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
export const paras = items => (items || []).map(x => `<p>${esc(x)}</p>`).join('');

/** Tarjeta del Explorer: todo el recuadro es un enlace. */
export function card(e) {
  return `<li><a class="ar-card ui-card" href="${href(e.id)}">
    <span class="ar-card-kicker">${esc(typeLabel(e.type))}${e.diagram ? ' · con diagrama' : ''}</span>
    <h3>${esc(e.name)}</h3>
    <p>${esc(e.summary)}</p>
    <span class="ar-card-badges">${levelBadge(e.level)}${evidenceBadge(e.evidence_type)}${justificationBadge(e.justification)}${practicalBadge(e.practical_level)}</span>
  </a></li>`;
}

export const formatDate = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };

/** Parseo de «#/ruta?x=1&y=2» → { path: ['c','id'], q: URLSearchParams } */
export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#\/?/, ''), [p, qs = ''] = raw.split('?');
  return { path: p.split('/').filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(qs) };
}
export const typeGroup = t => ENTITY_TYPES[t]?.group;
