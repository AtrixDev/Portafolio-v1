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
  let D, PUB = {}, tier = 'S', cat = 'Todas', q = '';

  Promise.all([
    fetch('data/ia-meli.json').then(r => r.json()),
    fetch('/api/academia?action=publico').then(r => r.ok ? r.json() : { skills: {} }).catch(() => ({ skills: {} })),
  ]).then(([data, pub]) => {
    D = data; PUB = pub.skills || {};
    principios(); diagnostico(); skills(); sistemas(); cats(); prompts(); stack();
    $('ia-n-diag').textContent = D.diagnostico.length;
    $('ia-credit').innerHTML = `${esc(D.credito.txt)} <a href="${esc(D.credito.url)}" target="_blank" rel="noopener">Fuente</a>.`;
  }).catch(() => { $('ia-skills').innerHTML = '<p class="ia-loading">No se pudo cargar el contenido. Recargá la página.</p>'; });

  // ═══ Demo en vivo ═══
  let DM = null, dmSel = null;
  const num = x => x == null ? '—' : Math.round(x).toLocaleString('es-AR');
  const plata = x => x == null ? '—' : (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)).toLocaleString('es-AR');
  const pct = (x, d = 1) => x == null ? '—' : (x * 100).toLocaleString('es-AR', { maximumFractionDigits: d }) + '%';
  const delta = (a, b) => { if (!b) return ''; const r = Math.round((a / b - 1) * 100); return `<dd class="dm-d ${r > 0 ? 'up' : r < 0 ? 'down' : ''}">${r > 0 ? '▲' : r < 0 ? '▼' : '•'} ${Math.abs(r)}%</dd>`; };
  const ACC = { subir: 'Subir precio', probar_suba: 'Probar suba', bajar: 'Bajar precio', revisar: 'Revisar oferta', mantener: 'Mantener' };
  const chipCl = c => { const x = DM.clases[c] || { txt: c, tono: 'neutral' }; return `<span class="dm-chip" data-tono="${x.tono}">${esc(x.txt)}</span>`; };

  fetch('/api/tracker?action=demo').then(r => r.ok ? r.json() : Promise.reject()).then(d => { DM = d; demo(); peek(); })
    .catch(() => { $('dm').innerHTML = '<p class="ia-loading">La demo no está disponible en este momento.</p>'; });

  // Vista previa en el primer viewport: salud, alertas y un acceso a cada una
  function peek() {
    const el = $('ia-peek'); if (!el || !DM) return;
    const a = DM.resumen.actual;
    el.innerHTML = `
      <p class="pk-t"><span class="status-dot" aria-hidden="true"></span>En vivo · cuenta de ejemplo</p>
      <dl class="pk-kpis">
        <div><dt>Ventas 28 días</dt><dd>${num(a.unidades)}</dd></div>
        <div><dt>Conversión</dt><dd>${pct(a.conversion, 2)}</dd></div>
        <div><dt>Alertas</dt><dd>${DM.alertas.length}</dd></div>
      </dl>
      <ul class="dm-alerts pk-alerts">${DM.alertas.slice(0, 3).map(x => `<li data-nivel="${x.nivel}">${x.id ? `<button type="button" data-dm="${x.id}">${esc(x.txt)}</button>` : `<span>${esc(x.txt)}</span>`}</li>`).join('')}</ul>
      <a class="pk-mas" href="#demo">Abrir la demo completa ${ic('arrow-right')}</a>`;
    el.hidden = false;
    el.addEventListener('click', e => { const b = e.target.closest('[data-dm]'); if (b) abrirDemo(b.dataset.dm); });
  }
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
        <dl class="dm-kpis">
          <div><dt>Visitas</dt><dd>${num(a.visitas)}</dd>${delta(a.visitas, b.visitas)}</div>
          <div><dt>Ventas</dt><dd>${num(a.unidades)}</dd>${delta(a.unidades, b.unidades)}</div>
          <div><dt>Facturación</dt><dd>${plata(a.facturacion)}</dd>${delta(a.facturacion, b.facturacion)}</div>
          <div><dt>Conversión</dt><dd>${pct(a.conversion, 2)}</dd>${delta(a.conversion, b.conversion)}</div>
        </dl>
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

  // ═══ Buscador de tendencias ═══
  // /api/tracker?action=tendencias: los 3 primeros completos; del resto el servidor manda solo posición y tipo.
  // El término oculto nunca llega al navegador: en su lugar va un texto de relleno difuminado.
  const TIPOS = { crece: 'Crece rápido', buscada: 'Muy buscada', popular: 'Popular' };
  const RELLENO = ['acá va un término', 'pedime la lista', 'esto no es el dato', 'buen intento', 'término escondido', 'la lista completa', 'escribime y te la paso', 'no está en el código'];
  const MAX_OCULTAS = 5;
  let tdPedido = 0, tdCats = false;
  const tdSel = $('td-cat'), tdOut = $('td-out');
  const tipo = t => `<span class="td-tipo" data-tipo="${t}">${TIPOS[t] || ''}</span>`;
  const fechaTd = f => new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(f));

  function tendenciasRender(d) {
    if (!tdCats && d.categorias?.length) {
      tdSel.innerHTML = `<option value="todas">Todo Mercado Libre</option>` + d.categorias.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join('');
      tdSel.value = d.categoria?.id || 'todas'; tdCats = true;
    }
    $('td-fuente').textContent = d.demo ? 'Ejemplo ilustrativo: no son datos de Mercado Libre.'
      : d.actualizado ? `Datos de Mercado Libre · actualizado el ${fechaTd(d.actualizado)}` : 'Datos de Mercado Libre';
    const aviso = d.demo ? `<p class="td-aviso">${ic('alert')}<span><b>Estás viendo un ejemplo.</b> La conexión con Mercado Libre no está disponible en este momento, así que estos términos son inventados para mostrarte cómo funciona. No los uses para decidir.</span></p>` : '';
    if (!d.total) { tdOut.innerHTML = aviso + '<p class="td-vacio">Mercado Libre no tiene tendencias para esta categoría hoy. Probá con otra.</p>'; return; }
    const cat = d.categoria?.id === 'todas' ? 'todo Mercado Libre' : d.categoria?.nombre || 'esta categoría';
    const fila = x => `<li class="td-fila td-top"><span class="td-pos">${x.pos}</span>
      <span class="td-term">${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.termino)}${ic('external')}<span class="sr-only"> (ver la búsqueda en Mercado Libre, se abre en otra pestaña)</span></a>` : esc(x.termino)}</span>
      <span class="td-der">${tipo(x.tipo)}</span></li>`;
    const ocultas = d.ocultos.slice(0, MAX_OCULTAS);
    const n = d.ocultos.length;
    tdOut.innerHTML = `${aviso}
      <ol class="td-lista">${d.visibles.map(fila).join('')}
        ${n ? `<li class="sr-only">Y ${n} términos más que te paso por mensaje.</li>` : ''}
      </ol>
      ${n ? `<ol class="td-lista td-ocultas" aria-hidden="true">${ocultas.map(x => `<li class="td-fila td-oculta"><span class="td-pos">${x.pos}</span><span class="td-term">${RELLENO[(x.pos * 5) % RELLENO.length]}</span><span class="td-der">${tipo(x.tipo)}</span></li>`).join('')}</ol>
      <div class="td-mas">
        <h3>Hay ${n} términos más en ${esc(cat)}</h3>
        <p>Te paso la lista completa y te marco en cuáles vale la pena entrar según tu producto, tu margen y la competencia que hay arriba.</p>
        <a class="btn-primary" href="contacto.html?motivo=consulta&asunto=tendencias&cat=${encodeURIComponent(d.categoria?.nombre || '')}#formulario">Quiero la lista completa ${ic('arrow-right').replace('class="icon"', 'class="icon icon-end"')}</a>
      </div>` : ''}`;
  }

  async function tendencias(cat = 'todas') {
    const yo = ++tdPedido;
    tdSel.disabled = true;
    tdOut.innerHTML = '<div class="td-cargando" aria-busy="true" aria-label="Cargando tendencias"><span></span><span></span><span></span><span></span></div>';
    try {
      const r = await fetch('/api/tracker?action=tendencias&cat=' + encodeURIComponent(cat));
      const d = await r.json().catch(() => ({}));
      if (yo !== tdPedido) return;
      if (r.ok) tendenciasRender(d);
      else tdOut.innerHTML = `<div class="au-msg${r.status === 429 ? ' is-limite' : ''}"><p>${esc(d.error || 'Algo no salió bien. Probá de nuevo en un rato.')}</p>${r.status === 429 ? '<a class="btn-secondary" href="contacto.html?motivo=consulta&asunto=tendencias#formulario">Escribime</a>' : ''}</div>`;
    } catch (e) {
      if (yo === tdPedido) tdOut.innerHTML = '<div class="au-msg"><p>Se cortó la conexión. Revisá tu internet y probá de nuevo.</p></div>';
    }
    if (yo === tdPedido) tdSel.disabled = false;
  }
  tdSel.addEventListener('change', () => tendencias(tdSel.value));
  // Se pide recién cuando la sección está por verse: cuida la cuota de la API
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); tendencias(); } }, { rootMargin: '400px 0px' });
    io.observe($('tendencias'));
  } else tendencias();

  // ═══ Auditoría: conectar la cuenta (completa) o mirar una publicación (chequeo rápido) ═══
  // Mercado Libre no deja leer publicaciones ajenas: el puntaje real sale solo con la cuenta conectada.
  const out = $('au-out');
  const contactoAuditoria = link => `contacto.html?motivo=consulta&asunto=auditoria${link ? '&pub=' + encodeURIComponent(link) : ''}#formulario`;
  const tonoSalud = v => v == null ? 'muted' : v >= 80 ? 'ok' : v >= 60 ? 'warn' : 'bad';
  const plataAR = x => '$' + Math.round(x).toLocaleString('es-AR');
  const irAlFormulario = () => { $('au-cform').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('au-cform').elements.nombre.focus({ preventScroll: true }), 400); };

  // Chequeo rápido: solo datos que Mercado Libre muestra de una publicación ajena, sin puntaje
  function chequeoRapido(r) {
    const d = r.datos, filas = [];
    if (r.catalogo) filas.push(['info', 'Es una publicación de catálogo', 'El título y las fotos los define Mercado Libre. Ahí se compite por precio, envío, cuotas y reputación.']);
    if (d.fotos != null) filas.push([d.fotos >= 7 ? 'check' : 'alert', `${d.fotos} ${d.fotos === 1 ? 'foto' : 'fotos'}`, d.fotos >= 7 ? 'Buena secuencia.' : 'Lo ideal son 7 o más: el comprador no puede tocar el producto, las fotos hacen ese trabajo.']);
    if (d.atributos != null) filas.push([d.atributos >= 10 ? 'check' : 'alert', `${d.atributos} atributos cargados`, d.atributos >= 10 ? 'Bien completo para aparecer en los filtros.' : 'Cada atributo que falta te saca de un filtro de búsqueda.']);
    if (d.descripcion != null) filas.push([d.descripcion > 300 ? 'check' : 'alert', d.descripcion ? `Descripción de ${d.descripcion.toLocaleString('es-AR')} caracteres` : 'Sin descripción', d.descripcion > 300 ? 'Tiene de dónde agarrarse el comprador.' : 'Es el último empujón antes de comprar: hoy no está ayudando.']);
    if (d.opiniones != null) filas.push(['info', `${d.opiniones.toLocaleString('es-AR')} opiniones`, 'Con la cuenta conectada te digo qué critican y qué elogian, y cómo usarlo.']);
    return `
      <article class="au-res">
        <header class="au-res-head">
          ${r.item.foto ? `<img src="${esc(r.item.foto)}" alt="" width="64" height="64">` : ''}
          <div><h3>${esc(r.item.title || 'Publicación')}</h3>${r.item.permalink ? `<a href="${esc(r.item.permalink)}" target="_blank" rel="noopener">Verla en Mercado Libre</a>` : ''}</div>
        </header>
        <ul class="au-datos">${filas.map(([i, t, x]) => `<li data-t="${i}">${ic(i === 'info' ? 'bulb' : i)}<div><b>${esc(t)}</b><span>${esc(x)}</span></div></li>`).join('')}</ul>
        <div class="au-mas-cta">
          <p><b>Esto es lo que se ve desde afuera.</b> Visitas, conversión, margen por venta, si estás ganando el catálogo y a qué precio lo recuperás: eso aparece cuando conectás tu cuenta.</p>
          <button type="button" class="btn-primary" data-ir-conectar>Quiero la auditoría completa</button>
        </div>
      </article>`;
  }
  $('au-form').addEventListener('submit', async e => {
    e.preventDefault();
    const url = $('au-url').value.trim(), btn = $('au-go');
    if (!url) { $('au-url').focus(); return; }
    btn.disabled = true; btn.textContent = 'Mirando…';
    out.innerHTML = '<div class="au-cargando" aria-busy="true"><span></span><span></span><span></span></div>';
    try {
      const r = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const d = await r.json().catch(() => ({}));
      out.innerHTML = r.ok && d.rapido ? chequeoRapido(d)
        : `<div class="au-msg${r.status === 429 ? ' is-limite' : ''}"><p>${esc(d.error || 'Algo no salió bien. Probá de nuevo en un rato.')}</p>${r.status === 429 || d.code === 'ml_not_linked' ? `<a class="btn-secondary" href="${contactoAuditoria(url)}">Escribime</a>` : ''}</div>`;
    } catch (err) {
      out.innerHTML = '<div class="au-msg"><p>Se cortó la conexión. Revisá tu internet y probá de nuevo.</p></div>';
    }
    btn.disabled = false; btn.textContent = 'Mirar';
  });
  out.addEventListener('click', e => { if (e.target.closest('[data-ir-conectar]')) irAlFormulario(); });

  // Conectar la cuenta: valida acá, crea el pedido y lleva a Mercado Libre a autorizar
  $('au-cform').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget, btn = f.querySelector('.au-cbtn'), err = $('au-cerr');
    const datos = { nombre: f.nombre.value.trim(), email: f.email.value.trim(), whatsapp: f.whatsapp.value.trim(), website: f.website.value };
    f.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
    const mal = datos.nombre.length < 2 ? f.nombre : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.email) ? f.email : null;
    if (mal) { mal.setAttribute('aria-invalid', 'true'); err.textContent = mal === f.nombre ? 'Decime cómo te llamás.' : 'Revisá el email: ahí te mando el informe.'; err.hidden = false; mal.focus(); return; }
    err.hidden = true; btn.disabled = true; btn.firstChild.textContent = 'Te llevo a Mercado Libre… ';
    try {
      const r = await fetch('/api/audit?action=conectar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) { location.href = d.url; return; }
      err.textContent = d.error || 'No se pudo iniciar la conexión. Probá de nuevo en un rato.'; err.hidden = false;
    } catch (e2) { err.textContent = 'Se cortó la conexión. Revisá tu internet y probá de nuevo.'; err.hidden = false; }
    btn.disabled = false; btn.firstChild.textContent = 'Conectar mi cuenta de Mercado Libre ';
  });

  // Vuelta desde Mercado Libre: ?auditoria=<pedido> sincroniza por tandas y muestra el resultado
  function panelProgreso(p, nick) {
    const pct = p?.pasos ? Math.round((p.paso - 1) / p.pasos * 100) : 5;
    return `<article class="au-res au-prog" aria-busy="true">
      <h3>Analizando la cuenta ${nick ? esc(nick) : ''}</h3>
      <p>${esc(p?.texto || 'Conectando con Mercado Libre')}${p?.detalle ? ` · ${esc(p.detalle)}` : ''}</p>
      <div class="au-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Avance del análisis"><i style="transform: scaleX(${Math.max(0.04, pct / 100)})"></i></div>
      <p class="au-nota">Tarda entre uno y cinco minutos según cuántas publicaciones tengas. Podés dejar esta pestaña abierta.</p>
    </article>`;
  }
  function resultadoCuenta(d) {
    const r = d.resumen;
    return `<article class="au-res au-final">
      <div class="au-salud" data-tono="${tonoSalud(r.salud)}">
        <p class="au-num"><b>${r.salud ?? '—'}</b><span>/100</span></p>
        <div><h3>${esc(d.nombre?.split(' ')[0] || 'Listo')}, esta es la salud de ${esc(d.nickname || 'tu cuenta')}</h3>
        <p>${r.activas} publicaciones activas analizadas. ${r.totalHallazgos ? `Encontré ${r.totalHallazgos} tipos de problema; estos son los que más pesan.` : 'No encontré problemas relevantes: la cuenta se mueve dentro de lo esperado.'}</p></div>
      </div>
      <ul class="au-areas">${r.areas.map(a => `<li><span>${esc(a.area)}</span><span class="au-bar"><i data-tono="${tonoSalud(a.valor)}" style="transform: scaleX(${(a.valor ?? 0) / 100})"></i></span><b>${a.valor ?? '—'}</b></li>`).join('')}</ul>
      ${r.hallazgos.length ? `<ol class="au-top">${r.hallazgos.map(h => `<li><b>${esc(h.titulo)}</b><span>${h.publicaciones} ${h.publicaciones === 1 ? 'publicación' : 'publicaciones'}${h.monto ? ` · ${plataAR(h.monto)} ${esc(h.montoTxt)}` : ''}</span></li>`).join('')}</ol>` : ''}
      ${r.sinCostos ? '<p class="au-nota">La rentabilidad no se puede medir sin los costos de tus productos: la vemos juntos en el informe.</p>' : ''}
      <div class="au-mas-cta">
        <p><b>En 24 horas te llega el informe completo</b> con el plan de diez acciones en orden y el paso a paso de cada una.</p>
        <a class="btn-primary" href="https://wa.me/541144474507?text=${encodeURIComponent('Hola Darío, conecté mi cuenta ' + (d.nickname || '') + ' para la auditoría y quiero charlar el resultado.')}" target="_blank" rel="noopener">Charlemos el resultado por WhatsApp</a>
      </div>
    </article>`;
  }
  async function seguirPedido(id) {
    $('au-caminos').hidden = true;
    out.innerHTML = panelProgreso(null);
    $('auditar').scrollIntoView({ block: 'start' });
    for (let intentos = 0; intentos < 120; intentos++) {
      let d;
      try { d = await (await fetch('/api/audit?action=estado&id=' + id)).json(); } catch (e) { d = { estado: 'sincronizando' }; }
      if (d.estado === 'listo') { out.innerHTML = resultadoCuenta(d); return; }
      if (d.error) { out.innerHTML = `<div class="au-msg"><p>${esc(d.error)}</p><a class="btn-secondary" href="${contactoAuditoria()}">Escribime</a></div>`; return; }
      out.innerHTML = panelProgreso(d.progreso, d.nickname);
      await new Promise(ok => setTimeout(ok, 1200));
    }
    out.innerHTML = `<div class="au-msg"><p>Tu cuenta es grande y el análisis sigue en curso. Te mando el resultado por email en cuanto termine.</p></div>`;
  }
  const pedido = new URLSearchParams(location.search).get('auditoria');
  if (/^[a-f0-9]{32}$/.test(pedido || '')) seguirPedido(pedido);
  else if (pedido === 'cancelada') out.innerHTML = '<div class="au-msg"><p>Cancelaste la conexión. Cuando quieras lo intentamos de nuevo: no se guardó nada de tu cuenta.</p></div>';
  else if (pedido === 'error') out.innerHTML = `<div class="au-msg"><p>Mercado Libre no terminó la conexión. Probá de nuevo o escribime y la hacemos juntos.</p><a class="btn-secondary" href="${contactoAuditoria()}">Escribime</a></div>`;

  // ═══ Catálogo de diagnóstico ═══
  function diagnostico() {
    const grupos = [...new Set(D.diagnostico.map(x => x.grupo))];
    $('dx').innerHTML = grupos.map(g => `
      <section class="dx-grupo" aria-label="${esc(g)}">
        <h3 class="dx-g">${esc(g)}</h3>
        ${D.diagnostico.filter(x => x.grupo === g).map(x => `
          <article class="dx-row" id="dx-${x.id}">
            <div class="dx-head">
              <h4>${esc(x.titulo)}</h4>
              <button type="button" class="dx-demo" data-dx-demo="${x.demo}">Verlo en la demo ${ic('arrow-right')}</button>
            </div>
            <p class="dx-rule"><b>Cómo lo detecta:</b> ${esc(x.regla)}</p>
            <details>
              <summary>Causas y qué hacer</summary>
              <div class="dx-cols">
                <div><h5>Causas probables</h5><ul>${x.causas.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
                <div><h5>Qué hacer</h5><ol>${x.solucion.map(c => `<li>${esc(c)}</li>`).join('')}</ol></div>
              </div>
              <p class="dx-kpi"><b>Se resolvió cuando:</b> ${esc(x.kpi)}</p>
            </details>
          </article>`).join('')}
      </section>`).join('');
  }
  $('dx').addEventListener('click', e => { const b = e.target.closest('[data-dx-demo]'); if (b) abrirDemo(b.dataset.dxDemo); });

  function principios() {
    $('ia-principios').innerHTML = D.principios.map(p => `<li><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></li>`).join('');
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
    $('ia-stack').innerHTML = D.stack.map(t => `
      <div class="ia-tool">
        <dt><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.nombre)} ${ic('external')}<span class="sr-only">(se abre en otra pestaña)</span></a><span class="ia-tipo">${esc(t.tipo)}</span></dt>
        <dd>${esc(t.uso)}${t.cmd ? `<code>${esc(t.cmd)}</code>` : ''}</dd>
      </div>`).join('');
  }

})();
