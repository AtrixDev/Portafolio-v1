/* ============================================================
   WEB.JS — Revisá tu web: diagnóstico de la web de un negocio
   POST /api/audit?action=web  { url }  → chequeos por área (lib/diagnostico-web.js)
   POST /api/audit?action=web-velocidad → velocidad real en celular (PageSpeed), si está configurada
   ============================================================ */
(function () {
  const $ = id => document.getElementById(id);
  const form = $('wb-form'), input = $('wb-url'), btn = $('wb-go'), out = $('wb-out');
  const WA = '541144474507';
  const tono = v => v == null ? 'muted' : v >= 85 ? 'ok' : v >= 65 ? 'warn' : 'bad';
  const icono = ok => ok === true
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
    : ok === false
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 12h12"/></svg>';
  const estadoTxt = ok => ok === true ? 'Bien' : ok === false ? 'Falta' : 'A mejorar';
  const seg = ms => (ms / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' s';
  const flecha = '<svg class="icon icon-end" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  const veredicto = s => s >= 85 ? 'Está bien armada: lo que queda son detalles que suman.'
    : s >= 65 ? 'Funciona, pero está perdiendo consultas por cosas que se arreglan rápido.'
    : 'Le está costando clientes: faltan cosas básicas para que te encuentren y te escriban.';

  const PASOS = ['Abriendo tu web…', 'Mirando cómo se ve en el celular…', 'Revisando lo que lee Google…', 'Buscando WhatsApp, teléfono y mapa…', 'Midiendo cuánto tarda…'];
  function cargando() {
    let i = 0;
    out.innerHTML = `<div class="wb-load" aria-busy="true"><div class="wb-load-bar"><i></i></div><p id="wb-paso">${PASOS[0]}</p></div>`;
    const t = setInterval(() => { const p = $('wb-paso'); if (!p) return clearInterval(t); p.textContent = PASOS[++i % PASOS.length]; }, 1100);
    return () => clearInterval(t);
  }

  function resultado(d) {
    const porArea = id => d.chequeos.filter(c => c.area === id);
    const prio = d.prioridad.map(id => d.chequeos.find(c => c.id === id)).filter(Boolean);
    const msg = `Hola Darío, revisé mi web ${d.dominio} en tu diagnóstico y dio ${d.salud}/100. ¿Me decís qué le cambiarías?`;
    const fallas = d.chequeos.filter(c => c.ok === false).length;
    return `<article class="wb-res">
      <header class="wb-head" data-tono="${tono(d.salud)}">
        <p class="wb-num"><b>${d.salud}</b><span>/100</span></p>
        <div class="wb-head-t">
          <h2>${esc(d.dominio)}</h2>
          ${d.titulo ? `<p class="wb-titulo">${esc(d.titulo)}</p>` : ''}
          <p class="wb-verd">${veredicto(d.salud)} ${fallas ? `Encontré ${fallas} ${fallas === 1 ? 'cosa' : 'cosas'} para arreglar.` : ''}</p>
        </div>
        ${d.imagen ? `<img class="wb-og" src="${esc(d.imagen)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
      </header>
      <ul class="wb-areas">${d.areas.map(a => `<li data-tono="${tono(a.valor)}"><span>${esc(a.nombre)}</span><span class="wb-bar"><i style="transform: scaleX(${a.valor == null ? 0 : Math.max(.04, a.valor / 100)})"></i></span><b>${a.valor ?? '—'}</b></li>`).join('')}</ul>
      ${d.avisoSpa ? `<p class="wb-aviso">Tu web se arma con JavaScript en el navegador: parte de lo que se ve no llega en el HTML, así que algunos puntos pueden figurar como faltantes aunque estén. Google también la lee así, y eso le juega en contra.</p>` : ''}
      ${prio.length ? `<section class="wb-prio"><h3>Arreglá esto primero</h3><ol>${prio.map(c => `<li>
        <b>${esc(c.titulo)}</b><p class="wb-det">${esc(c.detalle)}</p>
        <p><span>Por qué importa:</span> ${esc(c.porque)}</p><p><span>Cómo se arregla:</span> ${esc(c.arreglo)}</p></li>`).join('')}</ol></section>`
        : '<p class="wb-ok">No encontré nada importante para arreglar. Lo próximo es medir cuántas visitas se convierten en consultas.</p>'}
      <details class="wb-todo"><summary>Ver los ${d.chequeos.length} chequeos</summary>
        ${d.areas.map(a => `<div class="wb-grupo"><h4>${esc(a.nombre)}</h4><ul>${porArea(a.id).map(c => `<li data-ok="${c.ok}"><span class="wb-ic" title="${estadoTxt(c.ok)}">${icono(c.ok)}<span class="sr-only">${estadoTxt(c.ok)}:</span></span><div><b>${esc(c.titulo)}</b><span>${esc(c.detalle)}</span></div></li>`).join('')}</ul></div>`).join('')}
      </details>
      <p class="wb-med"><span>Respuesta <b>${seg(d.medido.ttfb)}</b></span><span>HTML <b>${d.medido.kb.toLocaleString('es-AR')} KB</b></span><span>Imágenes <b>${d.medido.imagenes}</b></span><span>Scripts <b>${d.medido.scripts}</b></span>${d.medido.redirecciones ? `<span>Redirecciones <b>${d.medido.redirecciones}</b></span>` : ''}</p>
      <div class="wb-vel" id="wb-vel" hidden></div>
      <div class="wb-cta">
        <div><h3>¿Te la arreglo?</h3><p>Te mando qué cambiaría, en qué orden y cuánto lleva. Sin compromiso.</p></div>
        <div class="wb-cta-b"><a class="btn-primary" href="https://wa.me/${WA}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Escribime por WhatsApp</a><a class="btn-secondary" href="contacto.html?motivo=consulta&asunto=web&web=${encodeURIComponent(d.dominio)}#formulario">Por mail</a></div>
      </div>
      <p class="wb-pie">Revisado el ${new Date(d.fecha).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}${d.memoria ? ' (resultado guardado de las últimas 24 h)' : ''}. <button type="button" class="wb-link" data-copiar>Copiar el link de este resultado</button></p>
    </article>`;
  }

  async function velocidad(url) {
    try {
      const r = await fetch('/api/audit?action=web-velocidad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const v = await r.json().catch(() => ({}));
      const box = $('wb-vel'); if (!box || !r.ok || v.sinClave || v.puntaje == null) return;
      box.hidden = false;
      box.innerHTML = `<h3>Velocidad real en el celular <small>Google PageSpeed</small></h3>
        <div class="wb-vel-in">${v.captura ? `<img src="${v.captura}" alt="Cómo se ve tu web en un celular, según Google" width="120">` : ''}
        <dl><div data-tono="${tono(v.puntaje)}"><dt>Puntaje</dt><dd>${v.puntaje}</dd></div><div><dt>Se ve lo principal</dt><dd>${seg(v.lcp)}</dd></div><div><dt>Saltos al cargar</dt><dd>${(v.cls ?? 0).toFixed(2).replace('.', ',')}</dd></div><div><dt>Tiempo bloqueada</dt><dd>${Math.round(v.tbt)} ms</dd></div></dl></div>`;
    } catch (e) { /* la velocidad es un extra: si falla, no se muestra */ }
  }

  async function revisar(url) {
    url = url.trim().replace(/^https?:\/\//i, '');
    if (!url) { input.focus(); return; }
    input.value = url;
    btn.disabled = true; btn.textContent = 'Revisando…';
    const parar = cargando();
    out.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    try {
      const r = await fetch('/api/audit?action=web', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const d = await r.json().catch(() => ({}));
      parar();
      if (r.ok && d.salud != null) {
        out.innerHTML = resultado(d);
        history.replaceState(null, '', `?url=${encodeURIComponent(d.dominio)}`);
        velocidad(d.url);
      } else {
        const sinWeb = d.code === 'no_web';
        out.innerHTML = `<div class="wb-msg${r.status === 429 ? ' is-limite' : ''}"><p>${esc(d.error || 'Algo no salió bien. Probá de nuevo en un rato.')}</p>
          ${sinWeb ? '<a class="btn-primary" href="armar.html">Ver cómo quedaría tu web</a>' : r.status === 429 ? `<a class="btn-secondary" href="https://wa.me/${WA}?text=${encodeURIComponent('Hola Darío, quería que revises mi web: ' + url)}" target="_blank" rel="noopener">Escribime por WhatsApp</a>` : ''}</div>`;
      }
    } catch (e) {
      parar();
      out.innerHTML = '<div class="wb-msg"><p>Se cortó la conexión. Revisá tu internet y probá de nuevo.</p></div>';
    }
    btn.disabled = false; btn.textContent = 'Revisar mi web';
  }

  form.addEventListener('submit', e => { e.preventDefault(); revisar(input.value); });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-try]');
    if (t) { revisar(t.dataset.try); return; }
    const c = e.target.closest('[data-copiar]');
    if (c) navigator.clipboard?.writeText(location.href).then(() => { c.textContent = 'Link copiado'; setTimeout(() => { c.textContent = 'Copiar el link de este resultado'; }, 1600); });
  });
  const inicial = new URLSearchParams(location.search).get('url');
  if (inicial) revisar(inicial);
})();
