/* ============================================================
   SISTEMA.JS — Página pública "Sistema: IA aplicada a Mercado Libre" (sistema.html)
   Demo en vivo del ML Tracker: /api/tracker?action=demo (cuenta simulada, sin datos reales).
   Contenido: data/ia-meli.json (el mismo que usa la Academia del panel).
   Estado de cada skill: /api/academia?action=publico (solo lo que marqué como visible).
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = n => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-${n}"/></svg>`;
  const ICONOS = ['shield', 'database', 'chart', 'lock', 'target', 'trending'];
  let D, PUB = {}, tier = 'S', cat = 'Todas', q = '';

  Promise.all([
    fetch('data/ia-meli.json').then(r => r.json()),
    fetch('/api/academia?action=publico').then(r => r.ok ? r.json() : { skills: {} }).catch(() => ({ skills: {} })),
  ]).then(([data, pub]) => {
    D = data; PUB = pub.skills || {};
    principios(); diagnostico(); skills(); sistemas(); cats(); prompts(); stack();
    $('ia-n-diag').textContent = D.diagnostico.length;
    $('ia-n-skills').textContent = D.skills.length;
    $('ia-n-prompts').textContent = D.prompts.length;
    const n = Object.values(PUB).filter(s => s.estado === 'aplicada' || s.estado === 'dominada').length;
    if (n) { $('ia-n-aplicadas').textContent = n; $('ia-n-aplicadas-box').hidden = false; }
    $('ia-credit').innerHTML = `${esc(D.credito.txt)} <a href="${esc(D.credito.url)}" target="_blank" rel="noopener">Fuente</a>.`;
  }).catch(() => { $('ia-skills').innerHTML = '<p class="ia-loading">No se pudo cargar el contenido. Recargá la página.</p>'; });

  // ═══ Demo en vivo ═══
  let DM = null, dmSel = null;
  const num = x => x == null ? '—' : Math.round(x).toLocaleString('es-AR');
  const plata = x => x == null ? '—' : (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)).toLocaleString('es-AR');
  const pct = (x, d = 1) => x == null ? '—' : (x * 100).toLocaleString('es-AR', { maximumFractionDigits: d }) + '%';
  const delta = (a, b) => { if (!b) return ''; const r = Math.round((a / b - 1) * 100); return `<span class="dm-d ${r > 0 ? 'up' : r < 0 ? 'down' : ''}">${r > 0 ? '▲' : r < 0 ? '▼' : '•'} ${Math.abs(r)}%</span>`; };
  const ACC = { subir: 'Subir precio', probar_suba: 'Probar suba', bajar: 'Bajar precio', revisar: 'Revisar oferta', mantener: 'Mantener' };
  const chipCl = c => { const x = DM.clases[c] || { txt: c, tono: 'neutral' }; return `<span class="dm-chip" data-tono="${x.tono}">${esc(x.txt)}</span>`; };

  fetch('/api/tracker?action=demo').then(r => r.ok ? r.json() : Promise.reject()).then(d => { DM = d; demo(); })
    .catch(() => { $('dm').innerHTML = '<p class="ia-loading">La demo no está disponible en este momento.</p>'; });

  function grafico(serie) {
    const s = serie.slice(-90), W = 600, H = 120, max = Math.max(...s.map(p => p.v), 1), maxU = Math.max(...s.map(p => p.u), 1);
    const x = i => i * W / (s.length - 1);
    const linea = s.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${(H - p.v / max * (H - 8)).toFixed(1)}`).join('');
    const barras = s.map((p, i) => `<rect x="${(x(i) - 2).toFixed(1)}" y="${(H - p.u / maxU * (H * .45)).toFixed(1)}" width="4" height="${(p.u / maxU * (H * .45)).toFixed(1)}" rx="1"/>`).join('');
    return `<svg class="dm-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Visitas (línea) y ventas (barras) diarias de los últimos 90 días"><g class="dm-bars">${barras}</g><path class="dm-line" d="${linea}"/></svg>
      <p class="dm-leg mono"><span class="l">Visitas</span><span class="b">Ventas</span><span>Últimos 90 días</span></p>`;
  }

  function demo() {
    const R = DM.resumen, a = R.actual, b = R.anterior;
    const items = [...DM.items].sort((x, y) => y.actual.facturacion - x.actual.facturacion);
    $('dm').innerHTML = `
      <div class="dm-top">
        <div class="dm-kpis">
          <div><dt>Visitas</dt><dd>${num(a.visitas)}</dd>${delta(a.visitas, b.visitas)}</div>
          <div><dt>Ventas</dt><dd>${num(a.unidades)}</dd>${delta(a.unidades, b.unidades)}</div>
          <div><dt>Facturación</dt><dd>${plata(a.facturacion)}</dd>${delta(a.facturacion, b.facturacion)}</div>
          <div><dt>Conversión</dt><dd>${pct(a.conversion, 2)}</dd>${delta(a.conversion, b.conversion)}</div>
        </div>
        <div class="dm-chart">${grafico(DM.serie)}</div>
      </div>
      <p class="dm-period mono">Últimos ${DM.ventana} días vs. los ${DM.ventana} anteriores · cuenta de ejemplo</p>
      <div class="dm-grid">
        <section class="dm-card">
          <h3>Alertas <span class="dm-n">${DM.alertas.length}</span></h3>
          <ul class="dm-alerts">${DM.alertas.slice(0, 7).map(x => `<li data-nivel="${x.nivel}">${x.id ? `<button type="button" data-dm="${x.id}">${esc(x.txt)}</button>` : `<span>${esc(x.txt)}</span>`}</li>`).join('')}</ul>
        </section>
        <section class="dm-card">
          <h3>Publicaciones <span class="dm-n">${items.length}</span></h3>
          <ul class="dm-list">${items.map(i => `<li><button type="button" data-dm="${i.id}"${i.id === dmSel ? ' aria-current="true"' : ''}>
            <span class="dm-t">${esc(i.title)}</span>
            <span class="dm-m mono">${num(i.actual.visitas)} vis · ${num(i.actual.unidades)} u · ${pct(i.actual.conversion)}</span>
            ${chipCl(i.clase)}</button></li>`).join('')}</ul>
        </section>
      </div>
      <div id="dm-det"></div>`;
    if (dmSel) detalle();
  }

  function detalle() {
    const i = DM.items.find(x => x.id === dmSel); if (!i) return;
    const r = i.rentabilidad, c = i.catalogo, p = i.precio;
    const probs = (D?.diagnostico || []).filter(x => x.demo === i.id);
    $('dm-det').innerHTML = `
      <section class="dm-card dm-det">
        <div class="dm-det-h"><div><p class="mono dm-id">${esc(i.id)} · curva ${esc(i.abc || '—')}</p><h3>${esc(i.title)}</h3></div>${chipCl(i.clase)}</div>
        ${i.diagnostico.length ? `<div class="dm-diag">${i.diagnostico.map(x => `<p><b>${esc(x.titulo)}.</b> ${esc(x.texto)}</p>`).join('')}</div>` : ''}
        <div class="dm-cols">
          <div><h4>Precio</h4><p class="dm-big">${plata(i.price)}</p><p><b>${ACC[p.accion] || p.accion}${p.sugerido ? ' a ' + plata(p.sugerido) : ''}</b></p><p class="dm-muted">${esc((p.motivos || []).join(' '))}</p></div>
          <div><h4>Rentabilidad por unidad</h4>${r?.completo ? `<dl class="dm-dl"><dt>Comisión</dt><dd>${plata(r.comision)}</dd><dt>Envío</dt><dd>${plata(r.envio)}</dd><dt>Impuestos</dt><dd>${plata(r.impuestos)}</dd><dt>Costo</dt><dd>${plata(r.costo)}</dd><dt>Margen</dt><dd class="${r.margen < 0 ? 'neg' : 'pos'}">${plata(r.margen)} (${pct(r.margenPct)})</dd><dt>Precio de equilibrio</dt><dd>${plata(r.precioEquilibrio)}</dd><dt>ACOS máximo</dt><dd>${pct(r.acosEquilibrio)}</dd></dl>` : '<p class="dm-muted">Sin costo cargado.</p>'}</div>
          <div><h4>Stock y calidad</h4><dl class="dm-dl"><dt>Stock</dt><dd>${i.stock == null ? '—' : num(i.stock) + ' u.'}</dd><dt>Cobertura</dt><dd>${i.diasStock == null ? (i.stock ? 'sin rotación' : '—') : Math.round(i.diasStock) + ' días'}</dd><dt>Calidad ML</dt><dd>${i.calidad?.score ?? '—'}/100</dd>${c ? `<dt>Catálogo</dt><dd>${c.status === 'winning' ? 'Ganando' : c.status === 'competing' ? 'Perdiendo' : esc(c.status)}${c.price_to_win ? ' · ganás a ' + plata(c.price_to_win) : ''}</dd>` : ''}</dl></div>
        </div>
        ${probs.length ? `<p class="dm-links">${probs.map(x => `<a href="#dx-${x.id}">Cómo se resuelve: ${esc(x.titulo.toLowerCase())} →</a>`).join('')}</p>` : ''}
      </section>`;
  }
  function abrirDemo(id) {
    dmSel = id; if (!DM) return;
    demo(); $('dm-det').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('dm').addEventListener('click', e => { const b = e.target.closest('[data-dm]'); if (b) abrirDemo(b.dataset.dm); });

  // ═══ Catálogo de diagnóstico ═══
  function diagnostico() {
    $('dx').innerHTML = D.diagnostico.map(x => `
      <article class="dx-card" id="dx-${x.id}">
        <p class="dx-g mono">${esc(x.grupo)}</p>
        <h3>${esc(x.titulo)}</h3>
        <p class="dx-rule"><b>Cómo lo detecta:</b> ${esc(x.regla)}</p>
        <details><summary>Causas y solución</summary>
          <h4>Causas probables</h4><ul>${x.causas.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
          <h4>Qué hacer</h4><ol>${x.solucion.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
        </details>
        <p class="dx-kpi"><b>Se resolvió cuando:</b> ${esc(x.kpi)}</p>
        <button type="button" class="dx-demo" data-dx-demo="${x.demo}">Verlo en la demo →</button>
      </article>`).join('');
  }
  $('dx').addEventListener('click', e => { const b = e.target.closest('[data-dx-demo]'); if (b) abrirDemo(b.dataset.dxDemo); });

  function principios() {
    $('ia-principios').innerHTML = D.principios.map((p, i) => `
      <div class="card"><span class="card-icon">${ic(ICONOS[i % ICONOS.length])}</span><div class="card-title">${esc(p.t)}</div><div class="card-desc">${esc(p.d)}</div></div>`).join('');
  }

  // Viñeta con el logro real (solo si la skill se marcó como pública)
  function logro(sk, campos) {
    if (!sk.campos.length || !sk.campos.every(c => campos?.[c])) return '';
    return sk.cv.replace(/\{(\w+)\}/g, (_, k) => campos[k]);
  }

  function skills() {
    const lista = D.skills.filter(s => tier === 'todas' || s.tier === tier);
    $('ia-skills').innerHTML = lista.map(sk => {
      const pub = PUB[sk.id], est = pub && D.estados[pub.estado];
      const l = pub ? logro(sk, pub.campos) : '';
      return `<details class="ia-skill">
        <summary>
          <span class="ia-skill-top"><span class="ia-tier mono" data-tier="${sk.tier}">${sk.tier}</span><span class="ia-dots" aria-label="Valor ${sk.valor} de 5">${'●'.repeat(sk.valor)}<i>${'●'.repeat(5 - sk.valor)}</i></span>${est ? `<span class="ia-estado" data-tono="${est.tono}">${est.txt}</span>` : ''}</span>
          <span class="ia-skill-title">${esc(sk.nombre)}</span>
          <span class="ia-skill-desc">${esc(sk.resumen)}</span>
          <span class="ia-more mono">Ver conceptos ${ic('arrow-right')}</span>
        </summary>
        <div class="ia-skill-body">
          <p class="ia-why">${esc(sk.porque)}</p>
          <ul>${sk.conceptos.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
          <p class="ia-kpis">${sk.kpis.map(k => `<span class="skill-tag">${esc(k)}</span>`).join('')}</p>
          ${l ? `<p class="ia-logro">${ic('award')}<span>${esc(l)}</span></p>` : ''}
          ${sk.lab ? `<a class="link-arrow" href="${sk.lab}">Guía relacionada en el Lab ${ic('arrow-right')}</a>` : ''}
        </div>
      </details>`;
    }).join('');
  }
  $('ia-tiers').addEventListener('click', e => {
    const b = e.target.closest('[data-tier]'); if (!b) return;
    tier = b.dataset.tier;
    $('ia-tiers').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    skills();
  });

  function sistemas() {
    $('ia-sistemas').innerHTML = D.sistemas.map(s => `
      <li class="ia-sis">
        <span class="ia-sis-n mono">${String(s.n).padStart(2, '0')}</span>
        <div><h3>${esc(s.nombre)}</h3><p>${esc(s.que)}</p><p class="ia-sis-meta"><span><b>KPI</b> ${esc(s.kpi)}</span><span><b>Cuidado</b> ${esc(s.cuidado)}</span></p></div>
      </li>`).join('');
  }

  function cats() {
    const cs = ['Todas', ...new Set(D.prompts.map(p => p.cat))];
    $('ia-cats').innerHTML = cs.map(c => `<button type="button" data-cat="${esc(c)}" aria-pressed="${c === cat}">${esc(c)}</button>`).join('');
  }
  $('ia-cats').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat; cats(); prompts();
  });
  $('ia-q').addEventListener('input', e => { q = e.target.value.toLowerCase(); prompts(); });

  // En la web el bloque de datos se muestra como un marcador para completar
  const textoPublico = t => t.replace('{{DATOS}}', '[DATOS]');
  function prompts() {
    const lista = D.prompts.filter(p => (cat === 'Todas' || p.cat === cat) && (!q || (p.titulo + ' ' + p.desc + ' ' + p.texto).toLowerCase().includes(q)));
    $('ia-prompts').innerHTML = lista.length ? lista.map(p => `
      <details class="ia-prompt">
        <summary><span class="ia-pcat mono">${esc(p.cat)}</span><span class="ia-ptitle">${esc(p.titulo)}</span><span class="ia-pdesc">${esc(p.desc)}</span></summary>
        <div class="ia-pbody">
          <pre>${esc(textoPublico(p.texto))}</pre>
          <button type="button" class="btn-secondary ia-copy" data-copy="${p.id}">${ic('copy')}Copiar prompt</button>
        </div>
      </details>`).join('') : '<p class="ia-loading">No hay prompts con ese filtro.</p>';
  }
  $('ia-prompts').addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    const p = D.prompts.find(x => x.id === b.dataset.copy);
    try { await navigator.clipboard.writeText(textoPublico(p.texto)); b.lastChild.textContent = '¡Copiado!'; }
    catch (err) { b.lastChild.textContent = 'Seleccioná y copiá'; }
    setTimeout(() => { b.lastChild.textContent = 'Copiar prompt'; }, 1800);
  });

  function stack() {
    $('ia-stack').innerHTML = D.stack.map(s => `
      <a class="ia-tool" href="${esc(s.url)}" target="_blank" rel="noopener">
        <span class="ia-tool-top"><span class="ia-pcat mono">${esc(s.tipo)}</span>${ic('external')}</span>
        <span class="ia-tool-name">${esc(s.nombre)}</span>
        <span class="ia-tool-desc">${esc(s.uso)}</span>
        ${s.cmd ? `<code>${esc(s.cmd)}</code>` : ''}
      </a>`).join('');
  }
})();
