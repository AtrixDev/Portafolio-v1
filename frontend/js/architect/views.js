// js/architect/views.js — Vistas del Explorer y de la ficha de concepto. Devuelven HTML (string); app.js lo inserta y conecta eventos.
import { LEVELS, EVIDENCE_TYPES, EVIDENCE_IDS, EXAMPLE_KINDS, JUSTIFICATION, typeLabel } from './model.js';
import { renderDiagramSVG, describeDiagram } from './diagram.js';
import { esc, GROUP_ORDER, href, card, evidenceBadge, justificationBadge, practicalBadge, levelBadge, typeBadge, kindBadge, list, paras, formatDate } from './ui.js';

// ═══ Explorer ═══
const filtrosDe = f => ({ types: f.types || [], levels: f.level ? [f.level] : [], evidence: f.evidence ? [f.evidence] : [], groups: f.groups || [] });

/** Resultados + contador: es la parte que se vuelve a pintar al escribir (sin perder el foco del buscador). */
export function resultsView(K, f) {
  const filtros = filtrosDe(f), total = K.entities.length;
  const hay = !!(f.q || filtros.groups.length || f.level || f.evidence);
  const res = K.search(f.q || '', filtros).map(r => r.entity);
  const grupos = GROUP_ORDER.filter(g => K.groups().includes(g));
  let body;
  if (!res.length) {
    body = `<div class="ar-empty ui-card" role="status"><h2>No encontré conceptos${f.q ? ` para «${esc(f.q)}»` : ' con esos filtros'}.</h2><p>Probá con una palabra más corta, sin los filtros, o con el nombre de una tecnología (por ejemplo «postgresql») o de un problema («colas», «caché»).</p><button type="button" class="btn-secondary" data-limpiar>Quitar filtros y búsqueda</button></div>`;
  } else if (hay) {
    body = `<ul class="ar-grid">${res.map(card).join('')}</ul>`;
  } else {
    body = grupos.map(g => {
      const items = res.filter(e => e._group === g);
      return items.length ? `<section class="ar-group" aria-labelledby="g-${esc(g)}"><h2 id="g-${esc(g)}">${esc(g)} <small>${items.length}</small></h2><ul class="ar-grid">${items.map(card).join('')}</ul></section>` : '';
    }).join('');
  }
  const count = `${hay ? `${res.length} ${res.length === 1 ? 'resultado' : 'resultados'}${f.q ? ` para «${esc(f.q)}»` : ''}` : `${total} conceptos, agrupados por área`}${hay ? ' · <button type="button" class="ar-link" data-limpiar>Quitar filtros</button>' : ''}`;
  return { count, body, n: res.length };
}

export function explorerView(K, f) {
  const filtros = filtrosDe(f);
  const grupos = GROUP_ORDER.filter(g => K.groups().includes(g));
  const chips = grupos.map(g => `<button type="button" class="ar-chip" data-grupo="${esc(g)}" aria-pressed="${filtros.groups.includes(g)}">${esc(g)}</button>`).join('');
  const sel = (id, label, opts, val) => `<div class="ui-field"><label class="ui-label" for="${id}">${label}</label><select class="ui-select" id="${id}"><option value="">Todos</option>${opts.map(([v, t]) => `<option value="${esc(v)}"${val === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
  const total = K.entities.length, full = K.entities.filter(e => e.depth === 'full').length;
  const r = resultsView(K, f);
  return `
<header class="ar-hero ui-sh ui-sh--page">
  <p class="ui-eyebrow">Desarrollo web</p>
  <h1 class="ui-sh__title" id="ar-h1" tabindex="-1">Web Project Architect</h1>
  <p class="ui-sh__lead">De una idea a una arquitectura y un plan de desarrollo implementable.</p>
  <p class="ar-hero-note">Una base de conocimiento <b>conectada</b>: cada concepto explica qué problema resuelve, cuándo conviene, cuándo no, qué alternativas hay y de dónde sale lo que afirma. ${total} conceptos (${full} fichas completas), ${K.sources.length} fuentes.</p>
  <p class="ar-hero-cta"><a class="btn-primary" href="#/proyecto">Armar un proyecto</a><span>Respondé unas preguntas y obtené decisiones explicadas, diagramas, ADR y prompts.</span></p>
</header>
<section class="ar-tools" aria-label="Buscar y filtrar">
  <div class="ui-field ar-search"><label class="ui-label" for="ar-q">Buscar un concepto, una tecnología o un problema</label><input class="ui-input" id="ar-q" type="search" value="${esc(f.q || '')}" placeholder="Por ejemplo: colas, caché, SSR, autenticación…" autocomplete="off" spellcheck="false"></div>
  <div class="ar-filters">
    ${sel('ar-nivel', 'Nivel', Object.entries(LEVELS), f.level)}
    ${sel('ar-evid', 'Respaldo', EVIDENCE_IDS.map(k => [k, EVIDENCE_TYPES[k].label]), f.evidence)}
  </div>
  <div class="ar-chips" role="group" aria-label="Filtrar por área">${chips}</div>
  <p class="ar-count" id="ar-count" aria-live="polite">${r.count}</p>
</section>
<div class="ar-results" id="ar-results">${r.body}</div>
<details class="ar-legend ui-card">
  <summary>¿Qué significa cada nivel de respaldo?</summary>
  <p>Cada ficha dice en qué se apoya. Una recomendación de este proyecto nunca se presenta como un estándar.</p>
  <dl>${EVIDENCE_IDS.map(k => `<div><dt>${evidenceBadge(k)}</dt><dd>${esc(EVIDENCE_TYPES[k].help)}</dd></div>`).join('')}</dl>
</details>`;
}

// ═══ Ficha de concepto ═══
const mkSec = P => (id, title, body, cls = '') => body ? `<section class="ar-sec ${cls}" id="${P}s-${id}" aria-labelledby="${P}h-${id}"><h2 id="${P}h-${id}">${title}</h2>${body}</section>` : '';
const tecnologia = e => ['technology', 'tool'].includes(e.type);

export function conceptView(K, id, biblioteca = new Map(), { idp = '', compact = false } = {}) {
  const e = K.get(id);
  if (!e) return notFoundView(id);
  const sec = mkSec(idp);
  const rels = K.relations(id), techs = K.technologies(id), alts = K.alternatives(id), srcs = K.sourcesOf(id);
  const full = e.depth === 'full';

  const toc = [
    ['s-resumen', 'En 30 segundos'], e.diagram && ['s-diagrama', 'Diagrama'], ['s-explicacion', 'Explicación'], e.how_it_works.length && ['s-funciona', 'Cómo funciona'],
    (e.when_to_use.length || e.when_not_to_use.length) && ['s-cuando', 'Cuándo usarlo y cuándo evitarlo'], (e.pros.length || e.cons.length) && ['s-vc', 'Ventajas y desventajas'], e.tradeoffs.length && ['s-tradeoffs', 'Trade-offs'],
    alts.length && ['s-alternativas', 'Alternativas'], e.examples.length && ['s-ejemplos', 'Ejemplos'], e.common_mistakes.length && ['s-errores', 'Errores comunes'], e.decision_questions.length && ['s-preguntas', 'Preguntas para decidir'],
    rels.length && ['s-relaciones', 'Relaciones'], techs.length && ['s-tecnologias', 'Tecnologías'], ['s-fuentes', 'Fuentes'],
  ].filter(Boolean);

  const diagram = e.diagram ? (() => { const d = describeDiagram(e.diagram); return sec('diagrama', 'Diagrama',
    `<figure class="ar-fig"><div class="ar-diagram" tabindex="0" role="group" aria-label="${esc(e.diagram.title)} (se puede desplazar)">${renderDiagramSVG(e.diagram, { id: `${idp}d-${e.id}` })}</div>
     <figcaption>${esc(e.diagram.title)}. Línea punteada: comunicación asíncrona.</figcaption>
     <details class="ar-textual"><summary>Ver el diagrama como texto</summary><p><b>Componentes:</b> ${esc(d.components)}.</p><ul>${d.connections.map(c => `<li>${esc(c)}</li>`).join('')}</ul></details></figure>`, 'ar-wide'); })() : '';

  const evid = EVIDENCE_TYPES[e.evidence_type];
  const aviso = ['recommendation', 'opinion', 'example'].includes(e.evidence_type)
    ? `<p class="ar-evidence ar-evidence--own"><b>Criterio de este proyecto, no un estándar.</b> ${esc(evid.help)} ${srcs.length ? 'Las fuentes de abajo son lecturas relacionadas.' : ''}</p>`
    : `<p class="ar-evidence"><b>Base de esta ficha: ${esc(evid.label.toLowerCase())}.</b> ${esc(evid.help)}</p>`;

  const lib = (e.library_refs || []).length ? `<p class="ar-lib">En la Biblioteca web: ${e.library_refs.map(r => `<a href="programacion.html#/f/${encodeURIComponent(r)}">${esc(biblioteca.get(r) || r)}</a>`).join(' · ')}</p>` : '';

  const relBody = rels.map(g => `<div class="ar-rel"><h3>${esc(g.label)}</h3><ul>${g.items.map(r => `<li><a href="${href(r.entity.id)}">${esc(r.entity.name)}</a> <span class="ar-rel-type">${esc(typeLabel(r.entity.type))}</span>${r.note ? `<span class="ar-note">${esc(r.note)}</span>` : ''}</li>`).join('')}</ul></div>`).join('');
  const altBody = alts.map(a => `<li class="ar-alt ui-card"><a href="${href(a.entity.id)}"><b>${esc(a.entity.name)}</b> <span class="ar-rel-type">${esc(typeLabel(a.entity.type))}</span></a><p>${esc(a.note)}</p></li>`).join('');
  const exBody = e.examples.map(x => `<li class="ar-ex ui-card">${kindBadge(x.kind)}<h3>${esc(x.label)}</h3><p>${esc(x.text)}</p>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">Ver el proyecto</a>` : ''}</li>`).join('');
  const srcBody = srcs.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}<span class="sr-only"> (se abre en otra pestaña)</span></a> <span class="ar-src-org">${esc(s.organization)}</span> ${evidenceBadge(s.evidence_type)}
      <span class="ar-src-chk">${s.verification === 'ok' ? `Verificada el ${formatDate(s.checked)}` : 'No se pudo verificar automáticamente: revisá el enlace'}</span></li>`).join('');

  return `
${compact ? '' : `<nav class="ar-crumbs" aria-label="Ruta"><a href="#/">Explorar</a><span aria-hidden="true">/</span><a href="#/?g=${encodeURIComponent(e._group)}">${esc(e._group)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(e.name)}</span></nav>`}
<header class="ar-head ui-sh ui-sh--page">
  <p class="ui-eyebrow">${esc(typeLabel(e.type))}</p>
  <h1 class="ui-sh__title" id="${idp}ar-h1" tabindex="-1">${esc(e.name)}</h1>
  <p class="ui-sh__lead">${esc(e.summary)}</p>
  <p class="ar-badges">${levelBadge(e.level)}${evidenceBadge(e.evidence_type, { help: true })}${justificationBadge(e.justification, { help: true })}${practicalBadge(e.practical_level, { help: true })}${full ? '' : '<span class="ui-badge" title="Ficha de apoyo: más breve que una ficha completa">Ficha de apoyo</span>'}</p>
  ${e.justification ? `<p class="ar-just">${esc(JUSTIFICATION[e.justification].help)} <em>Que esté en la base no significa que se recomiende: depende de cada proyecto.</em></p>` : ''}
  ${lib}
</header>
<div class="ar-layout">
  <article class="ar-main">
    <nav class="ar-toc" aria-label="En esta ficha"><ul>${toc.map(([i, t]) => `<li><button type="button" class="ar-link" data-scroll="${idp}${i}">${esc(t)}</button></li>`).join('')}</ul></nav>
    ${sec('resumen', 'En 30 segundos', `<div class="ar-quick ui-card"><div><h3>Qué problema resuelve</h3><p>${esc(e.problem_solved)}</p></div>${e.when_to_use[0] ? `<div><h3>Conviene cuando</h3><p>${esc(e.when_to_use[0])}</p></div>` : ''}${e.when_not_to_use[0] ? `<div><h3>Conviene evitarlo cuando</h3><p>${esc(e.when_not_to_use[0])}</p></div>` : ''}</div>${aviso}`)}
    ${diagram}
    ${sec('explicacion', 'Explicación', `<div class="ar-prose">${paras(e.explanation)}</div>`)}
    ${sec('funciona', 'Cómo funciona', e.how_it_works.length ? `<ol class="ar-steps">${e.how_it_works.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '')}
    ${sec('cuando', 'Cuándo usarlo y cuándo evitarlo', `<div class="ar-two"><div><h3>Conviene si…</h3>${list(e.when_to_use, 'is-ok')}</div><div><h3>Conviene evitarlo si…</h3>${list(e.when_not_to_use, 'is-bad')}</div></div>`)}
    ${sec('vc', 'Ventajas y desventajas', `<div class="ar-two"><div><h3>Ventajas</h3>${list(e.pros, 'is-ok')}</div><div><h3>Desventajas</h3>${list(e.cons, 'is-bad')}</div></div>`)}
    ${sec('tradeoffs', 'Trade-offs', `<p class="ar-sub">Lo que se gana y lo que se paga al elegirlo.</p>${list(e.tradeoffs)}`)}
    ${sec('alternativas', 'Alternativas', `<p class="ar-sub">Opciones de la misma dimensión y en qué se diferencian. Ninguna es mejor en abstracto.</p><ul class="ar-alts">${altBody}</ul>`)}
    ${sec('ejemplos', 'Ejemplos', `<p class="ar-sub">Los ejemplos son ilustrativos. Que haya uno acá no significa que sea un proyecto real ni que implique experiencia profesional.</p><ul class="ar-exs">${exBody}</ul>`)}
    ${sec('errores', 'Errores comunes', list(e.common_mistakes))}
    ${sec('preguntas', 'Preguntas para decidir', `<p class="ar-sub">Si no podés responderlas todavía, es una señal de que falta información antes de decidir.</p>${list(e.decision_questions)}`)}
    ${sec('relaciones', 'Relaciones', `<div class="ar-rels">${relBody}</div>`)}
    ${sec('tecnologias', 'Tecnologías que lo implementan', `<p class="ar-sub">El concepto y la tecnología son cosas distintas: primero se decide el patrón, después con qué se implementa.</p><ul class="ar-techs">${techs.map(t => `<li class="ar-alt ui-card"><a href="${href(t.id)}"><b>${esc(t.name)}</b> <span class="ar-rel-type">${esc(typeLabel(t.type))}</span></a><p>${esc(t.summary)}</p></li>`).join('')}</ul>`)}
    ${sec('fuentes', 'Fuentes', srcs.length ? `<ul class="ar-srcs">${srcBody}</ul>` : '<p class="ar-sub">Esta ficha no cita fuentes externas: es criterio de este proyecto.</p>')}
  </article>
</div>
${compact ? '' : '<p class="ar-back"><a class="link-arrow" href="#/">← Volver al Explorer</a></p>'}`;
}

export function notFoundView(id) {
  return `<header class="ar-head ui-sh ui-sh--page"><p class="ui-eyebrow">Web Project Architect</p><h1 class="ui-sh__title" id="ar-h1" tabindex="-1">No encontré ese concepto</h1>
  <p class="ui-sh__lead">«${esc(id)}» no existe en la base. Puede que el enlace sea viejo.</p><p><a class="btn-primary" href="#/">Ir al Explorer</a></p></header>`;
}
