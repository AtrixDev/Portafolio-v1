// js/architect/views-project.js — Vistas del Project Builder y de sus resultados (decisiones, blueprint, ADR, prompts, pack). Devuelven HTML.
import * as B from './builder.js';
import { renderDiagramSVG, describeDiagram, DIAGRAM_PURPOSES, KIND_LABEL } from './diagram.js';
import { toMermaid } from './blueprint.js';
import { adrToMarkdown } from './adr.js';
import { esc, href, fitBadge, necessityBadge, practicalBadge } from './ui.js';
import { PRACTICAL_LEVELS } from './model.js';
import { SUPERVISION_TXT } from './complexity.js';
import { NIVEL } from './context.js';

export const TABS = [['decisiones', 'Decisiones'], ['blueprint', 'Blueprint'], ['adr', 'ADR'], ['prompts', 'Prompts'], ['pack', 'Project Pack']];
const CONF = { alta: 'ok', media: 'warn', baja: 'bad' };
const confBadge = c => `<span class="ui-badge ui-badge--${CONF[c.level]}" title="${esc(c.note || '')}">Confianza ${esc(c.level)}</span>`;
const sel = (id, hash) => `${hash}${id}`;

/** Barra de pestañas de resultados. `q` = parámetro del proyecto (?p=…) para no perderlo al cambiar de pestaña. */
export function tabsView(actual, q) {
  return `<nav class="ar-tabs" aria-label="Resultados del proyecto"><ul>${TABS.map(([id, t]) => `<li><a href="#/proyecto/${id}${q}"${id === actual ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('')}</ul></nav>`;
}

// ═══ Builder ═══
export function builderView(M, state, K, { editing = null, q = '' } = {}) {
  const R0 = B.resolve(M, state), { applicable } = R0;
  const pr = B.progress(M, state);
  const next = editing ? M.byId.get(editing) : B.nextQuestion(M, state);
  const rows = B.summarize(M, state);
  const resumen = rows.length ? `<ul class="ar-sum">${rows.map(r => `<li><span class="ar-sum-k">${esc(r.label)}</span><span class="ar-sum-v${r.kind === 'assumed' ? ' is-assumed' : ''}${r.kind === 'unknown' ? ' is-open' : ''}">${esc(r.value)}${r.kind === 'assumed' ? ' <em>(supuesto)</em>' : ''}</span>${r.id && !String(r.id).startsWith('assumed-') ? `<button type="button" class="ar-link" data-editar="${esc(r.id)}">Cambiar</button>` : ''}</li>`).join('')}</ul>` : '<p class="ar-sub">Todavía no respondiste nada.</p>';
  const lado = `<aside class="ar-aside" aria-label="Lo que sé del proyecto"><details class="ar-sumbox ui-card" open><summary>Lo que sé hasta ahora</summary>${resumen}<p class="ar-sub">Los <em>supuestos</em> salen del tipo de producto: se pueden cambiar respondiendo la pregunta correspondiente.</p></details></aside>`;

  let cuerpo;
  if (!next) {
    cuerpo = `<section class="ar-q ui-card" aria-labelledby="ar-h1"><h2 id="ar-h1" tabindex="-1">Listo: ya tengo lo que necesito</h2><p class="ar-sub">Respondiste ${pr.done} de ${pr.total} preguntas. Con eso armé decisiones de arquitectura, diagramas, ADR, prompts y un Project Pack. Lo que no sabés quedó marcado como pregunta abierta.</p><p class="ar-actions"><a class="btn-primary" href="#/proyecto/decisiones${q}">Ver las decisiones</a>${R0.fineLeft ? `<button type="button" class="btn-secondary" data-afinar>Afinar con ${R0.fineLeft} preguntas más (opcional)</button>` : ''}<button type="button" class="ar-link" data-atras>← Volver a la última pregunta</button></p>${R0.fineLeft ? '<p class="ar-sub">Afinar mejora la precisión: realtime, archivos, búsqueda, integraciones, IA y plazo. Sin eso se usan supuestos marcados.</p>' : ''}</section>`;
  } else {
    const a = state.answers[next.id];
    const idx = applicable.findIndex(x => x.id === next.id) + 1;
    const learn = next.learn && K.get(next.learn) ? `<button type="button" class="ar-learn" data-aprender="${esc(next.learn)}">¿Qué es esto? Aprender: ${esc(K.get(next.learn).name)}</button>` : '';
    let campo;
    if (next.type === 'text') {
      campo = `<div class="ui-field"><label class="ui-label" for="ar-ans">Tu respuesta <span class="ar-opt">(opcional)</span></label><textarea class="ui-textarea" id="ar-ans" maxlength="${next.max}" rows="4" placeholder="${esc(next.placeholder || '')}">${esc(a || '')}</textarea><p class="ui-hint"><span id="ar-cnt">${(a || '').length}</span> / ${next.max}</p></div>`;
    } else {
      const sig = M.signals[next.signal];
      campo = `<fieldset class="ar-opts"><legend class="sr-only">${esc(next.text)}</legend>${next.offer.map(v => `<label class="ar-opt-card"><input type="radio" name="ar-opt" value="${esc(v)}"${a === v ? ' checked' : ''}><span class="ar-opt-body"><b>${esc(sig.labels[v])}</b>${next.help?.[v] ? `<span>${esc(next.help[v])}</span>` : ''}</span></label>`).join('')}
        <label class="ar-opt-card ar-opt-unknown"><input type="radio" name="ar-opt" value="${B.UNKNOWN}"${a === B.UNKNOWN ? ' checked' : ''}><span class="ar-opt-body"><b>No lo sé todavía</b><span>Queda como pregunta abierta: no invento una respuesta.</span></span></label></fieldset>`;
    }
    cuerpo = `<section class="ar-q ui-card" aria-labelledby="ar-h1">
      <p class="ar-step">${editing ? 'Cambiando una respuesta' : `Pregunta ${idx} de ${pr.total}`}<span class="sr-only">. La cantidad total puede cambiar según tus respuestas.</span></p>
      <div class="ar-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${pr.total}" aria-valuenow="${pr.done}" aria-label="Avance"><i style="width:${Math.round(pr.done / Math.max(1, pr.total) * 100)}%"></i></div>
      <h2 id="ar-h1" tabindex="-1">${esc(next.text)}</h2>
      <p class="ar-why"><b>Por qué te pregunto:</b> ${esc(next.why)}</p>
      ${learn}
      <form id="ar-form" data-q="${esc(next.id)}" novalidate>${campo}<p class="ar-err" id="ar-err" role="alert" hidden></p>
        <p class="ar-actions"><button type="submit" class="btn-primary">${next.type === 'text' ? 'Continuar' : 'Continuar'}</button>${next.type === 'single' ? '<button type="button" class="btn-secondary" data-omitir>Omitir por ahora</button>' : ''}${!editing && pr.done ? '<button type="button" class="ar-link" data-atras>← Pregunta anterior</button>' : ''}</p>
      </form>
      ${B.canRecommend(state) && !editing ? `<p class="ar-early">¿Con esto alcanza? <a href="#/proyecto/decisiones${q}">Ver la recomendación ahora</a>. Lo que falte se marca como supuesto o pregunta abierta.</p>` : ''}
    </section>`;
  }
  return `
<header class="ar-head ui-sh ui-sh--page">
  <p class="ui-eyebrow">Project Builder</p>
  <h1 class="ui-sh__title">Armar un proyecto</h1>
  <p class="ui-sh__lead">Contame qué querés construir. Hago preguntas cortas, de a una, que se adaptan a lo que respondés, y te devuelvo decisiones explicadas, no solo una lista de tecnologías.</p>
</header>
<div class="ar-builder">${cuerpo}${lado}</div>
<p class="ar-foot"><a class="link-arrow" href="#/">← Volver al Explorer</a> <button type="button" class="ar-link" data-reiniciar>Empezar de nuevo</button></p>`;
}

// ═══ Decisiones ═══
const pickCard = (d, p) => `<li class="ar-pick"><div class="ar-pick-h"><b>${p.entity ? `<a href="${href(p.id)}" data-aprender="${esc(p.id)}" class="ar-concept">${esc(p.name)}</a>` : esc(p.name)}</b> ${fitBadge(p.fit)} ${necessityBadge(p.necessity)}${p.entity ? `<button type="button" class="ar-learn ar-learn--sm" data-aprender="${esc(p.id)}">Aprender</button>` : ''}</div>
  <p class="ar-pick-s">${esc(p.summary)}</p>
  <h4>Por qué</h4><ul class="ar-list">${p.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
  ${p.against?.length ? `<h4>En contra</h4><ul class="ar-list is-bad">${p.against.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
  ${p.tradeoffs.length ? `<h4>Trade-offs</h4><ul class="ar-list">${p.tradeoffs.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
  ${p.revisit.length ? `<h4>Cuándo reconsiderar</h4><ul class="ar-list">${p.revisit.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}</li>`;

/** Complejidad práctica del proyecto: visible, sin bloquear nada. */
export function complexityView(c) {
  if (!c) return '';
  const meter = [1, 2, 3, 4].map(n => `<li class="ar-cx-step${n <= c.level ? ' is-on' : ''}${n > c.zone_max ? ' is-out' : ''}"${n === c.level ? ' aria-current="step"' : ''}><b>${n}</b><span>${esc(PRACTICAL_LEVELS[n].label.split(' · ')[1])}</span></li>`).join('');
  const zone = c.within_zone ? '<span class="ui-badge ui-badge--ok">Dentro de la zona práctica habitual</span>' : '<span class="ui-badge ui-badge--warn">Fuera de la zona práctica habitual</span>';
  return `<section class="ar-cx ui-card" aria-labelledby="h-cx"><h2 id="h-cx" class="ar-h2">Complejidad práctica</h2>
    <ol class="ar-cx-meter" aria-label="Nivel de complejidad práctica: ${c.level} de 4">${meter}</ol>
    <p class="ar-cx-lead"><b>${esc(c.label)}</b> ${zone}${c.uncertain ? ' <span class="ui-badge">Estimado: falta definir el tipo de producto</span>' : ''}</p>
    <p class="ar-sub">La zona habitual son los niveles 1 a ${c.zone_max}. ${esc(SUPERVISION_TXT[c.supervision])} Los niveles contextualizan la aplicación: no limitan lo que la base explica ni bloquean ningún proyecto.</p>
    <h3 class="ar-h3">Por qué este nivel</h3><ul class="ar-list">${c.drivers.map(d => `<li>${esc(d.reason)}</li>`).join('')}</ul>
    ${c.parts.length ? `<h3 class="ar-h3">Partes que piden más cuidado</h3><ul class="ar-list">${c.parts.map(p => `<li><a href="${href(p.id)}" data-aprender="${esc(p.id)}" class="ar-concept">${esc(p.name)}</a> ${practicalBadge(p.level, { help: true })} <em>${esc(p.title)}.</em> ${p.level >= 4 ? 'Conocimiento avanzado y supervisión cercana.' : 'Conviene revisarlo con más cuidado.'}${p.simpler_option ? ` <b>Más simple:</b> <a href="${href(p.simpler_option.id)}" data-aprender="${esc(p.simpler_option.id)}" class="ar-concept">${esc(p.simpler_option.name)}</a> (${esc(PRACTICAL_LEVELS[p.simpler_option.level].short.toLowerCase())}).` : p.simpler_text ? ` <b>Más simple:</b> ${esc(p.simpler_text)}` : ''}</li>`).join('')}</ul>` : ''}
    ${c.simpler.length ? `<h3 class="ar-h3">Qué lo haría más simple</h3><ul class="ar-list">${c.simpler.map(s => `<li>${esc(s.reason)} <b>→</b> ${esc(s.simpler)}</li>`).join('')}</ul>` : ''}
  </section>`;
}

export function decisionsView(res, K, M, ctx) {
  const dec = res.decisions.filter(d => d.picks.length || d.alternatives.length);
  const cards = dec.map(d => `<section class="ar-dec ui-card" aria-labelledby="dec-${esc(d.id)}">
    <header><h3 id="dec-${esc(d.id)}">${esc(d.title)}</h3>${confBadge(d.confidence)}</header>
    ${d.confidence.note ? `<p class="ar-note">${esc(d.confidence.note)}${d.confidence.missing.length ? ` Falta: ${d.confidence.missing.map(m => esc(M.signals[m]?.label || m)).join(', ')}.` : ''}${d.confidence.assumed.length ? ` Supuestos: ${d.confidence.assumed.map(m => esc(M.signals[m]?.label || m)).join(', ')}.` : ''}</p>` : ''}
    <p class="ar-lbl">${d.kind === 'choice' ? 'Propuesta' : 'Se proponen'}</p>
    <ul class="ar-picks">${d.picks.map(p => pickCard(d, p)).join('')}</ul>
    ${d.alternatives.length ? `<details class="ar-alts-box"><summary>Alternativas y por qué no (${d.alternatives.length})</summary><ul>${d.alternatives.map(a => `<li><b>${a.entity ? `<a href="${href(a.id)}" data-aprender="${esc(a.id)}" class="ar-concept">${esc(a.name)}</a>` : esc(a.name)}</b>${a.fit ? ' ' + fitBadge(a.fit) : ''}<p><em>Sería mejor si:</em> ${esc(a.better_when)}</p>${a.why_not.length ? `<p><em>Hoy no, porque:</em> ${esc(a.why_not.join(' '))}</p>` : ''}</li>`).join('')}</ul></details>` : ''}
  </section>`).join('');
  const calidad = res.quality.map(q => `<li><a href="${href(q.id)}" data-aprender="${esc(q.id)}">${esc(q.entity.name)}</a><span class="ar-w ar-w-${q.weight}" title="${esc(q.reasons.join(' '))}">${NIVEL[q.weight]}</span></li>`).join('');
  return `
<section class="ar-intro ui-card"><p><b>${esc(ctx.product)}.</b> ${esc(ctx.idea)}</p><p class="ar-sub">Estas son <b>propuestas con criterio de este proyecto</b>, no verdades universales: cada una dice por qué, qué se resigna, cuándo conviene otra cosa y cuánta confianza hay. Las piezas con enlace explican el concepto sin sacarte de acá.</p></section>
${complexityView(res.complexity)}
<section aria-labelledby="h-calidad"><h2 id="h-calidad" class="ar-h2">Qué pesa más en este proyecto</h2><p class="ar-sub">No todos los atributos de calidad pesan igual. Pasá el mouse o el foco por un nivel para ver por qué.</p><ul class="ar-quality">${calidad}</ul></section>
<section aria-labelledby="h-dec"><h2 id="h-dec" class="ar-h2">Decisiones</h2><div class="ar-decs">${cards}</div></section>
<section aria-labelledby="h-riesgos"><h2 id="h-riesgos" class="ar-h2">Riesgos a tener presentes</h2>${res.risks.length ? `<ul class="ar-list">${res.risks.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : '<p class="ar-sub">Con lo que respondiste no se detectaron riesgos específicos; igual revisá la lista de seguridad del Project Pack.</p>'}</section>
<section aria-labelledby="h-abiertas"><h2 id="h-abiertas" class="ar-h2">Preguntas abiertas</h2>${res.open.length ? `<ul class="ar-list">${res.open.map(o => `<li><b>${esc(M.signals[o.signal]?.label || o.signal)}</b>: ${esc(o.why)} <button type="button" class="ar-link" data-editar-signal="${esc(o.signal)}">Responder</button></li>`).join('')}</ul>` : '<p class="ar-sub">No quedan preguntas abiertas que cambien las decisiones.</p>'}</section>`;
}

/** Enlace a una fuente del catálogo (si no existe, solo el texto: nunca rompe la vista). */
const srcLink = (K, id, text) => { const s = K?.sources?.find(x => x.id === id); return s ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(text)}</a>` : esc(text); };

// ═══ Blueprint ═══
export function blueprintView(blueprints, K) {
  return `<p class="ar-sub">Cada diagrama responde una pregunta distinta, por eso no hay uno solo con todo (idea tomada de los niveles del ${srcLink(K, 'c4-model', 'modelo C4')}, sin seguir su notación al pie de la letra). Las piezas con enlace explican el concepto. Línea punteada: comunicación asíncrona.</p>` + blueprints.map(b => {
    const d = describeDiagram(b);
    return `<section class="ar-bp" aria-labelledby="bp-${esc(b.id)}"><h2 id="bp-${esc(b.id)}" class="ar-h2">${esc(b.title)}</h2>${DIAGRAM_PURPOSES[b.purpose] !== b.title ? `<p class="ar-sub"><span class="ui-badge">${esc(DIAGRAM_PURPOSES[b.purpose])}</span></p>` : ''}
      <div class="ar-diagram" tabindex="0" role="group" aria-label="${esc(b.title)} (se puede desplazar)">${renderDiagramSVG(b, { id: `bp-${b.id}` })}</div>
      ${b.notes.length ? `<ul class="ar-list">${b.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      <details class="ar-textual"><summary>Ver como texto y copiar Mermaid</summary><p><b>Componentes:</b> ${esc(d.components)}.</p><ul>${d.connections.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
        <p><button type="button" class="btn-secondary" data-copiar="mermaid:${esc(b.id)}">Copiar código Mermaid</button></p><pre class="ar-pre" tabindex="0">${esc(toMermaid(b))}</pre></details></section>`;
  }).join('');
}

// ═══ ADR ═══
export function adrView(adrs, date, K) {
  if (!adrs.length) return '<p class="ar-sub">Todavía no hay decisiones para registrar.</p>';
  return `<p class="ar-sub">Un ADR registra <b>una decisión</b>, el contexto en que se tomó, las alternativas y cuándo revisarla. Estos son <b>propuestas</b> generadas con el criterio de este proyecto: revisalos antes de aceptarlos. Formato: ${srcLink(K, 'nygard-adr', 'ADR de Michael Nygard')} ampliado con alternativas y condiciones de revisión (más sobre el formato en ${srcLink(K, 'adr-github', 'adr.github.io')}).</p>
  <p class="ar-actions"><button type="button" class="btn-secondary" data-copiar="adr-todos">Copiar todos (Markdown)</button><button type="button" class="btn-secondary" data-descargar="adr-todos">Descargar .md</button></p>` +
    adrs.map(a => `<details class="ar-adr ui-card"><summary><b>${esc(a.id)}</b> · ${esc(a.title)} <span class="ui-badge">${esc(a.status)}</span>${confBadge(a.confidence)}</summary>
      <div class="ar-adr-body">
        ${[['Contexto', a.context], ['Razones', a.rationale], ['Trade-offs', a.tradeoffs], ['Consecuencias', a.consequences], ['Condiciones para reconsiderar', a.revisit]].map(([t, l]) => l.length ? `<h4>${t}</h4><ul class="ar-list">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '').join('')}
        <h4>Decisión</h4><p>${esc(a.decision)}</p>
        ${a.rejected.length ? `<h4>Alternativas rechazadas</h4><ul class="ar-list">${a.rejected.map(r => `<li><b>${esc(r.name)}</b>${r.fit ? ' ' + fitBadge(r.fit) : ''}: ${esc(r.why.join(' '))} <em>Sería mejor si:</em> ${esc(r.better_when)}</li>`).join('')}</ul>` : ''}
        ${a.sources.length ? `<h4>Fuentes</h4><ul class="ar-list">${a.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a> — ${esc(s.organization)} (${esc(s.evidence)})</li>`).join('')}</ul>` : ''}
        <p class="ar-actions"><button type="button" class="btn-secondary" data-copiar="adr:${esc(a.id)}">Copiar Markdown</button></p>
      </div></details>`).join('');
}

// ═══ Prompts ═══
export function promptsView(prompts) {
  return `<p class="ar-sub">Prompts listos para pegar en Claude Code (o cualquier asistente), ya con el contexto de tu proyecto. Reemplazá lo que está entre corchetes y revisá siempre lo que genere.</p>
  <p class="ar-actions"><button type="button" class="btn-secondary" data-copiar="prompts-todos">Copiar los 16 prompts</button></p>` +
    prompts.map(p => `<details class="ar-prompt ui-card"><summary><b>${esc(p.title)}</b> <span class="ui-badge">${esc(p.stage)}</span></summary><p class="ar-sub"><b>Para qué:</b> ${esc(p.goal)} <b>Cuándo:</b> ${esc(p.use_when)}</p><pre class="ar-pre" tabindex="0">${esc(p.text)}</pre><p class="ar-actions"><button type="button" class="btn-primary" data-copiar="prompt:${esc(p.id)}">Copiar prompt</button></p></details>`).join('');
}

// ═══ Pack ═══
export function packView(pack) {
  const chars = pack.sections.reduce((n, s) => n + s.markdown.length, 0);
  return `<p class="ar-sub">Todo en un solo documento: resumen, requisitos, arquitectura, diagramas (Mermaid), ADR, modelo de datos, tecnologías, estructura, hoja de ruta, pruebas, seguridad, QA, estrategia con IA, prompts, definición de terminado, riesgos y preguntas abiertas. ${pack.sections.length} secciones, ${Math.round(chars / 1000)} mil caracteres.</p>
  <p class="ar-actions"><button type="button" class="btn-primary" data-descargar="pack-md">Descargar Markdown</button><button type="button" class="btn-secondary" data-descargar="pack-json">Descargar JSON</button><button type="button" class="btn-secondary" data-copiar="pack-md">Copiar Markdown</button></p>
  <ol class="ar-packlist">${pack.sections.map(s => `<li><details class="ar-pack ui-card"><summary>${esc(s.title)}</summary><pre class="ar-pre" tabindex="0">${esc(s.markdown)}</pre></details></li>`).join('')}</ol>`;
}

export const resultsHead = (title, lead, tabs) => `<header class="ar-head ui-sh ui-sh--page"><p class="ui-eyebrow">Tu proyecto</p><h1 class="ui-sh__title" id="ar-h1" tabindex="-1">${esc(title)}</h1><p class="ui-sh__lead">${esc(lead)}</p></header>${tabs}`;
