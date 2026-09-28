/* ============================================================
   ADMIN.JS — Panel de administración (admin.html)
   Contenido del inicio (/api/content), historial (/api/portfolio),
   mensajes (/api/contact) y cuenta de Mercado Libre (/api/ml).
   Todo requiere sesión: el token se guarda en sessionStorage.
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const TOKEN_KEY = 'dc_token';
  let TOKEN = sessionStorage.getItem(TOKEN_KEY) || '';
  let ST = {};
  const authH = (extra = {}) => ({ Authorization: 'Bearer ' + TOKEN, ...extra });

  // Resultados que muestra hoy la web (se usan si todavía no se guardaron otros)
  const STATS_DEFAULT = [
    { number: '+3', label: 'Años en Mercado Libre' },
    { number: '+20', label: 'Cuentas gestionadas' },
    { number: '39,2%', label: 'Más facturación' },
    { number: '13%', label: 'ACOS final (desde 30%)' },
    { number: '+1.800', label: 'Publicaciones trabajadas' },
  ];

  function toast(msg, bad = false) {
    const t = $('toast');
    t.textContent = msg; t.classList.toggle('is-bad', bad); t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ── Login ──
  $('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('li-err'); err.hidden = true;
    const btn = e.currentTarget.querySelector('button[type="submit"]'); btn.disabled = true;
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: $('li-user').value.trim(), pass: $('li-pass').value }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) { TOKEN = data.token; sessionStorage.setItem(TOKEN_KEY, TOKEN); $('li-pass').value = ''; openPanel(); return; }
      err.textContent = data.error || 'Usuario o contraseña incorrectos.';
    } catch (e2) {
      err.textContent = 'No hay conexión con el servidor.';
    } finally { btn.disabled = false; }
    err.hidden = false;
  });

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY); TOKEN = '';
    $('panel').hidden = true; $('login-screen').hidden = false; $('li-user').focus();
  }
  $('logout-btn').addEventListener('click', logout);

  // Si una llamada responde 401, la sesión venció
  async function api(url, opts = {}) {
    const res = await fetch(url, { ...opts, headers: authH(opts.headers) });
    if (res.status === 401) { toast('La sesión venció: volvé a entrar.', true); logout(); throw new Error('401'); }
    return res;
  }

  function openPanel() {
    $('login-screen').hidden = true; $('panel').hidden = false;
    // Abre en la última sección usada (la primera vez, ML Tracker)
    let ultima = 'tracker';
    try { ultima = localStorage.getItem('cp-sec') || 'tracker'; } catch (e) { /* sin almacenamiento */ }
    try { show(document.getElementById('ps-' + ultima) ? ultima : 'tracker'); } catch (e) { panelError(e); }
    // Siempre queda una sección visible, aunque algo de abajo falle
    if (!document.querySelector('.cp-sec.active')) show('hero');
    loadContent().catch(e => panelError(e));
    refreshUnread(); refreshMLDot();
  }

  // Si algo se rompe con el panel abierto, se ve el aviso en vez de una pantalla vacía
  function panelError(e) {
    console.error(e);
    if (!$('panel').hidden) toast('Algo falló al cargar el panel. Recargá con Ctrl+Shift+R.', true);
  }
  window.addEventListener('error', e => panelError(e.error || e.message));
  window.addEventListener('unhandledrejection', e => { if (e.reason?.message !== '401') panelError(e.reason); });

  // ── Navegación ──
  function show(name) {
    document.querySelectorAll('.cp-sec').forEach(s => s.classList.toggle('active', s.id === 'ps-' + name));
    document.querySelectorAll('.cp-nav a').forEach(a => a.classList.toggle('active', a.dataset.s === name));
    if (name === 'portfolio') loadPortfolio();
    if (name === 'mensajes') loadMessages();
    if (name === 'ml') { loadML(); window.DCTracker?.cuentas(); }
    if (name === 'tracker') window.DCTracker?.abrir();
    if (name === 'academia') window.DCAcademia?.abrir();
    $('panel').querySelector('.cp-main').classList.toggle('is-wide', name === 'tracker' || name === 'academia');
    try { localStorage.setItem('cp-sec', name); } catch (e) { /* sin almacenamiento */ }
    $('panel').querySelector('.cp-main').scrollTop = 0;
  }
  $('sidebar-nav').addEventListener('click', e => {
    const a = e.target.closest('a[data-s]'); if (!a) return;
    e.preventDefault(); show(a.dataset.s);
  });

  // ── Contenido ──
  async function loadContent() {
    try { const r = await fetch('/api/content'); ST = r.ok ? await r.json() : {}; } catch (e) { ST = {}; }
    const h = ST.hero || {}, s = ST.sobre || {}, c = ST.contacto || {};
    $('h-tag').value = h.tag || ''; $('h-n1').value = h.name1 || ''; $('h-n2').value = h.name2 || '';
    $('h-sub').value = h.sub || ''; $('h-btn1').value = h.btn1 || ''; $('h-badge').value = h.badge || '';
    $('s-p1').value = s.p1 || ''; $('s-p2').value = s.p2 || ''; $('s-p3').value = s.p3 || '';
    $('c-sub').value = c.sub || ''; $('c-email').value = c.email || ''; $('c-linkedin').value = c.linkedin || ''; $('c-tel').value = c.tel || '';
    const stats = ST.stats?.length ? ST.stats : STATS_DEFAULT;
    $('stats-editor').innerHTML = stats.map((st, i) => `
      <div class="cp-card cp-stat">
        <label class="cp-field"><span>Número ${i + 1}</span><input id="st-num-${i}" value="${esc(st.number)}"></label>
        <label class="cp-field"><span>Texto</span><input id="st-lbl-${i}" value="${esc(st.label)}"></label>
      </div>`).join('');
  }

  async function save(section) {
    const v = id => $(id).value.trim();
    if (section === 'hero') ST.hero = { tag: v('h-tag'), name1: v('h-n1'), name2: v('h-n2'), sub: v('h-sub'), btn1: v('h-btn1'), badge: v('h-badge') };
    if (section === 'sobre') ST.sobre = { p1: v('s-p1'), p2: v('s-p2'), p3: v('s-p3') };
    if (section === 'contacto') ST.contacto = { sub: v('c-sub'), email: v('c-email'), linkedin: v('c-linkedin'), tel: v('c-tel') };
    if (section === 'stats') ST.stats = STATS_DEFAULT.map((_, i) => ({ number: v(`st-num-${i}`), label: v(`st-lbl-${i}`) }));
    try {
      const r = await api('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ST) });
      if (!r.ok) throw new Error(r.status);
      toast('Guardado. Ya se ve en la web.');
    } catch (e) { if (e.message !== '401') toast('No se pudo guardar.', true); }
  }
  document.querySelectorAll('[data-save]').forEach(b => b.addEventListener('click', () => save(b.dataset.save)));

  // ── Historial de publicaciones ──
  // "Extraer datos" lee el link (catálogo por API + extracción guardada) y estima qué hiciste
  // vos según el mes de subida de cada foto. Lo que no se pudo leer se completa a mano.
  const CLASE_TXT = { creado: 'Catálogo creado', rehecho: 'Publicación rehecha', retocado: 'Retocada', ninguna: 'Sin evidencia' };
  let PF_EXTRA = {};   // datos de la extracción que no tienen campo en el formulario
  let PF_ITEMS = [];

  $('pf-scrape').addEventListener('click', async () => {
    const url = $('pf-url').value.trim(); if (!url) { $('pf-url').focus(); return; }
    const st = $('pf-status'); st.textContent = 'Leyendo la publicación…';
    const btn = $('pf-scrape'); btn.disabled = true;
    try {
      const qs = new URLSearchParams({ scrape: 1, url, desde: $('pf-desde').value, hasta: $('pf-hasta').value });
      const r = await api(`/api/portfolio?${qs}`);
      const d = await r.json();
      if (!r.ok) { st.textContent = d.error || 'No se pudo leer el link.'; return; }
      const set = (id, v) => { if (v != null && v !== '') $(id).value = v; };
      set('pf-url', d.url); set('pf-title', d.titulo); set('pf-image', d.imagen); set('pf-brand', d.marca);
      set('pf-category', CLASE_TXT[d.clase]); set('pf-metrics', d.logro);
      set('pf-vendidos', d.vendidos); set('pf-opiniones', d.opiniones); set('pf-rating', d.rating);
      PF_EXTRA = { clase: d.clase, fotosPeriodo: d.fotosPeriodo, catalogoCreado: d.catalogoCreado, meses: d.meses, galeria: d.galeria };
      if (d.imagen) preview(d.titulo, d.imagen);
      renderEvid(d);
      st.textContent = d.yaCargada ? 'Ojo: esta publicación ya está en tu lista.' : (d.titulo ? 'Listo, revisá los datos.' : 'No se pudo leer todo: completalo a mano.');
    } catch (e) { if (e.message !== '401') st.textContent = 'No se pudo leer: completalo a mano.'; }
    finally { btn.disabled = false; }
  });

  function renderEvid(d) {
    const desde = $('pf-desde').value, hasta = $('pf-hasta').value;
    const en = m => m && m >= desde && m <= hasta;
    const meses = d.meses || [];
    const box = $('pf-evid');
    box.innerHTML = `
      <strong>${esc(CLASE_TXT[d.clase] || 'Sin evidencia')}</strong>
      <ul>
        <li>${meses.length ? `${d.fotosPeriodo} de ${meses.length} fotos subidas en tu período` : 'No se pudieron leer las fotos'}${meses.length ? ' (la portada no cuenta: ML la reprocesa sola)' : ''}</li>
        ${d.catalogoCreado ? `<li>Catálogo creado el ${esc(new Date(d.catalogoCreado + 'T12:00').toLocaleDateString('es-AR'))}${en(d.catalogoCreado.slice(0, 7)) ? ' — <b>en tu período</b>' : ''}</li>` : ''}
        ${d.fuentes?.length ? `<li>Datos de: ${esc(d.fuentes.join(', '))}</li>` : ''}
        ${(d.faltan || []).map(f => `<li class="pf-warn">Falta: ${esc(f)}</li>`).join('')}
      </ul>
      ${meses.length ? `<div class="pf-meses" aria-label="Mes de subida de cada foto">${meses.map(m => `<span class="${en(m) ? 'is-in' : ''}">${esc(m ? m.slice(5) + '/' + m.slice(2, 4) : '?')}</span>`).join('')}</div>` : ''}`;
    box.hidden = false;
  }

  function preview(title, img) { $('pf-preview').hidden = false; $('pf-preview-img').src = img; $('pf-preview-title').textContent = title || ''; }
  $('pf-image').addEventListener('change', () => { const u = $('pf-image').value.trim(); if (/^https?:/.test(u)) preview($('pf-title').value, u); });

  const PF = ['pf-url', 'pf-title', 'pf-image', 'pf-brand', 'pf-employer', 'pf-category', 'pf-metrics', 'pf-notes', 'pf-vendidos', 'pf-opiniones', 'pf-rating'];
  function resetForm() {
    PF.filter(id => id !== 'pf-employer').forEach(id => { $(id).value = ''; });
    $('pf-preview').hidden = true; $('pf-evid').hidden = true; $('pf-destacada').checked = true; PF_EXTRA = {};
  }
  $('pf-add').addEventListener('click', async () => {
    const st = $('pf-status');
    const body = { ...PF_EXTRA, ...Object.fromEntries(PF.map(id => [id.slice(3), $(id).value.trim()])) };
    body.destacada = $('pf-destacada').checked;
    body.skipScrape = true;
    if (!body.url && !body.title) { st.textContent = 'Poné al menos el link o el título.'; return; }
    st.textContent = 'Guardando…';
    try {
      const r = await api('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { st.textContent = d.error || 'No se pudo guardar.'; return; }
      resetForm(); st.textContent = ''; toast(body.destacada ? 'Agregada: ya se ve en la web.' : 'Agregada (sin destacar).'); loadPortfolio();
    } catch (e) { if (e.message !== '401') st.textContent = 'No se pudo guardar.'; }
  });

  async function loadPortfolio() {
    try {
      const r = await api('/api/portfolio?all=1'); if (!r.ok) throw new Error(r.status);
      PF_ITEMS = (await r.json()).items || [];
      const marcas = [...new Set(PF_ITEMS.map(i => i.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
      const sel = $('pf-f-marca'), actual = sel.value;
      sel.innerHTML = '<option value="">Todas</option>' + marcas.map(m => `<option${m === actual ? ' selected' : ''}>${esc(m)}</option>`).join('')
        + (PF_ITEMS.some(i => !i.brand) ? `<option value="__sin"${actual === '__sin' ? ' selected' : ''}>(sin marca)</option>` : '');
      renderPortfolio();
    } catch (e) { if (e.message !== '401') $('pf-list').innerHTML = '<p class="cp-empty">No se pudo cargar la lista.</p>'; }
  }

  function filtradas() {
    const q = $('pf-q').value.trim().toLowerCase(), marca = $('pf-f-marca').value, clase = $('pf-f-clase').value, dest = $('pf-f-dest').value;
    return PF_ITEMS.filter(i =>
      (!q || `${i.title} ${i.brand}`.toLowerCase().includes(q)) &&
      (!marca || (marca === '__sin' ? !i.brand : i.brand === marca)) &&
      (!clase || (i.clase || 'ninguna') === clase) &&
      (!dest || (dest === '1') === (i.destacada !== false)));
  }

  function renderPortfolio() {
    const list = $('pf-list');
    const items = filtradas();
    const nDest = PF_ITEMS.filter(i => i.destacada !== false).length;
    $('pf-count').textContent = PF_ITEMS.length ? `${PF_ITEMS.length} en total · ${nDest} en la web` : '';
    const hayFiltro = ['pf-q', 'pf-f-marca', 'pf-f-clase', 'pf-f-dest'].some(id => $(id).value);
    $('pf-bulk').hidden = !(hayFiltro && items.length);
    $('pf-bulk-txt').textContent = `${items.length} publicaci${items.length === 1 ? 'ón' : 'ones'} con este filtro. Si son falsos positivos (ej. una marca que no trabajaste), podés borrarlas juntas.`;
    if (!PF_ITEMS.length) { list.innerHTML = '<p class="cp-empty">Todavía no agregaste publicaciones. El inicio muestra las que vienen de fábrica.</p>'; return; }
    if (!items.length) { list.innerHTML = '<p class="cp-empty">Nada coincide con el filtro.</p>'; return; }
    list.innerHTML = items.slice(0, 300).map(it => {
      const on = it.destacada !== false;
      const ev = [it.fotosPeriodo != null && it.meses?.length ? `${it.fotosPeriodo}/${it.meses.length} fotos en tu período` : '', it.catalogoCreado ? `catálogo ${it.catalogoCreado}` : ''].filter(Boolean).join(' · ');
      return `
        <article class="cp-item pf-item${on ? '' : ' is-off'}">
          ${safeUrl(it.image) ? `<img src="${safeUrl(it.image)}" alt="" loading="lazy">` : '<span class="cp-item-noimg">Sin imagen</span>'}
          <div>
            <strong>${esc(it.title || it.brand || 'Sin título')}</strong>
            <small>${esc([it.brand, CLASE_TXT[it.clase] || it.category, it.employer].filter(Boolean).join(' · '))}</small>
            ${it.metrics ? `<small class="cp-hl">${esc(it.metrics)}</small>` : ''}
            ${ev ? `<small class="pf-ev">${esc(ev)}</small>` : ''}
            ${safeUrl(it.url) ? `<a href="${safeUrl(it.url)}" target="_blank" rel="noopener">Ver en Mercado Libre</a>` : ''}
          </div>
          <div class="pf-item-acts">
            ${on && !hayFiltro ? `<span class="pf-orden"><button type="button" class="cp-icon-btn" data-mover-pf="${esc(it._id)}" data-dir="-1" aria-label="Subir en la web" title="Subir">↑</button><button type="button" class="cp-icon-btn" data-mover-pf="${esc(it._id)}" data-dir="1" aria-label="Bajar en la web" title="Bajar">↓</button></span>` : ''}
            <button type="button" class="cp-icon-btn pf-star" data-star="${esc(it._id)}" aria-pressed="${on}" aria-label="${on ? 'Quitar de la web' : 'Destacar en la web'}" title="${on ? 'Se ve en la web: tocá para ocultarla' : 'Oculta: tocá para mostrarla en la web'}">${icon('star')}</button>
            <button type="button" class="cp-icon-btn cp-danger" data-del-pf="${esc(it._id)}" aria-label="Eliminar">${icon('trash')}</button>
          </div>
        </article>`;
    }).join('') + (items.length > 300 ? `<p class="cp-empty">Se muestran 300 de ${items.length}: usá los filtros.</p>` : '');
  }
  ['pf-q', 'pf-f-marca', 'pf-f-clase', 'pf-f-dest'].forEach(id => $(id).addEventListener('input', renderPortfolio));

  $('pf-list').addEventListener('click', async e => {
    // Reordenar destacadas: se intercambia con la vecina y se guarda el orden completo (1, 2, 3…)
    const mv = e.target.closest('[data-mover-pf]');
    if (mv) {
      const dest = PF_ITEMS.filter(i => i.destacada !== false);
      const i = dest.findIndex(x => x._id === mv.dataset.moverPf), j = i + Number(mv.dataset.dir);
      if (i < 0 || j < 0 || j >= dest.length) return;
      [dest[i], dest[j]] = [dest[j], dest[i]];
      dest.forEach((x, k) => { x.order = k + 1; });
      PF_ITEMS = [...dest, ...PF_ITEMS.filter(x => x.destacada === false)];
      renderPortfolio();
      try {
        const r = await api('/api/portfolio?action=orden', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: dest.map(x => x._id) }) });
        if (!r.ok) throw new Error(r.status);
        toast('Orden guardado: así se ve en la web.');
      } catch (e2) { if (e2.message !== '401') { toast('No se pudo guardar el orden.', true); loadPortfolio(); } }
      return;
    }
    const star = e.target.closest('[data-star]');
    if (star) {
      const it = PF_ITEMS.find(i => i._id === star.dataset.star); if (!it) return;
      const nuevo = it.destacada === false;
      star.disabled = true;
      try {
        const r = await api(`/api/portfolio?id=${encodeURIComponent(it._id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destacada: nuevo }) });
        if (!r.ok) throw new Error(r.status);
        it.destacada = nuevo; renderPortfolio(); toast(nuevo ? 'Ahora se ve en la web.' : 'Oculta de la web.');
      } catch (e2) { if (e2.message !== '401') toast('No se pudo cambiar.', true); star.disabled = false; }
      return;
    }
    const b = e.target.closest('[data-del-pf]'); if (!b || !confirm('¿Eliminar esta publicación del historial?')) return;
    try {
      const r = await api(`/api/portfolio?id=${encodeURIComponent(b.dataset.delPf)}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(r.status);
      PF_ITEMS = PF_ITEMS.filter(i => i._id !== b.dataset.delPf); renderPortfolio();
    } catch (e2) { if (e2.message !== '401') toast('No se pudo eliminar.', true); }
  });

  $('pf-del-filtradas').addEventListener('click', async () => {
    const items = filtradas(); if (!items.length) return;
    if (!confirm(`¿Eliminar ${items.length} publicaci${items.length === 1 ? 'ón' : 'ones'} del historial? No se puede deshacer.`)) return;
    try {
      const ids = items.map(i => i._id);
      for (let k = 0; k < ids.length; k += 100) {
        const r = await api(`/api/portfolio?ids=${ids.slice(k, k + 100).join(',')}`, { method: 'DELETE' });
        if (!r.ok) throw new Error(r.status);
      }
      toast(`Eliminadas: ${ids.length}.`); loadPortfolio();
    } catch (e) { if (e.message !== '401') toast('No se pudieron eliminar todas.', true); loadPortfolio(); }
  });

  // ── Mensajes ──
  let MSGS = [], FILTER = 'todos';
  const REASONS = { oferta: 'Oferta laboral', freelance: 'Pedido de web / freelance', consulta: 'Consulta', otro: 'Otro' };
  async function loadMessages() {
    const list = $('msg-list'); list.innerHTML = '<p class="cp-empty">Cargando…</p>';
    try {
      const r = await api('/api/contact'); if (!r.ok) throw new Error(r.status);
      const d = await r.json(); MSGS = d.items || []; setUnread(d.unread || 0); renderMessages();
    } catch (e) { if (e.message !== '401') list.innerHTML = '<p class="cp-empty">No se pudieron cargar los mensajes.</p>'; }
  }
  function setUnread(n) { const b = $('msg-unread'); b.hidden = !n; b.textContent = n; }
  async function refreshUnread() { try { const r = await api('/api/contact'); if (r.ok) setUnread((await r.json()).unread || 0); } catch (e) {} }
  function renderMessages() {
    const items = MSGS.filter(m => FILTER === 'todos' || (FILTER === 'noleidos' ? !m.read : m.reason === FILTER));
    const list = $('msg-list');
    if (!items.length) { list.innerHTML = '<p class="cp-empty">No hay mensajes acá.</p>'; return; }
    list.innerHTML = items.map(m => {
      const fecha = new Date(m.createdAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
      const wa = /(?:\+?54)?\s?9?\s?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{4}/.exec(m.message || '');
      return `<article class="cp-msg${m.read ? '' : ' is-unread'}">
        <header><div><strong>${esc(m.name)}</strong>${m.company ? `<span> · ${esc(m.company)}</span>` : ''}</div><time>${fecha}</time></header>
        <p class="cp-msg-meta"><span class="cp-tag${m.reason === 'freelance' ? ' is-hl' : ''}">${esc(REASONS[m.reason] || m.reason)}</span><a href="mailto:${esc(m.email)}">${esc(m.email)}</a></p>
        <div class="cp-msg-body">${esc(m.message)}</div>
        <div class="cp-msg-actions">
          <a class="btn-secondary cp-sm" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: tu mensaje en mi web')}">${icon('mail')}Responder</a>
          ${wa ? `<a class="btn-secondary cp-sm" href="https://wa.me/${wa[0].replace(/\D/g, '')}" target="_blank" rel="noopener">${icon('message')}WhatsApp</a>` : ''}
          <button type="button" class="btn-secondary cp-sm" data-read="${esc(m._id)}" data-v="${!m.read}">${m.read ? 'Marcar no leído' : 'Marcar leído'}</button>
          <button type="button" class="cp-icon-btn cp-danger" data-del-msg="${esc(m._id)}" aria-label="Eliminar">${icon('trash')}</button>
        </div>
      </article>`;
    }).join('');
  }
  $('msg-list').addEventListener('click', async e => {
    const r = e.target.closest('[data-read]'), d = e.target.closest('[data-del-msg]');
    try {
      if (r) { await api('/api/contact?id=' + encodeURIComponent(r.dataset.read), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: r.dataset.v === 'true' }) }); loadMessages(); }
      if (d && confirm('¿Eliminar este mensaje?')) { await api('/api/contact?id=' + encodeURIComponent(d.dataset.delMsg), { method: 'DELETE' }); loadMessages(); }
    } catch (e2) {}
  });
  document.querySelector('.cp-filters').addEventListener('click', e => {
    const b = e.target.closest('[data-filter]'); if (!b) return;
    FILTER = b.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderMessages();
  });
  $('msg-reload').addEventListener('click', loadMessages);

  // ── Mercado Libre ──
  async function loadML() {
    const box = $('ml-status');
    try {
      const st = await (await api('/api/ml?action=status')).json();
      $('ml-dot').hidden = !!st.linked;
      box.innerHTML = st.linked
        ? `<p class="cp-ml-state is-ok"><span class="status-dot" aria-hidden="true"></span>Vinculada como <strong>${esc(st.nickname || 'tu cuenta')}</strong></p>
           <p>Desde ${st.linkedAt ? new Date(st.linkedAt).toLocaleString('es-AR') : '-'}. El acceso se renueva solo; si alguna vez vence, te aviso acá.</p>`
        : `<p class="cp-ml-state is-bad"><span class="cp-dot" aria-hidden="true"></span>${st.status === 'expired' ? 'El acceso venció' : 'Sin vincular'}</p>
           <p>Vinculala para que ML Tracker pueda leer tus publicaciones.</p>`;
    } catch (e) { if (e.message !== '401') box.textContent = 'No se pudo consultar el estado.'; }
  }
  async function refreshMLDot() { try { const st = await (await api('/api/ml?action=status')).json(); $('ml-dot').hidden = !!st.linked; } catch (e) {} }
  $('ml-link').addEventListener('click', () => { location.href = '/api/ml?action=login&t=' + encodeURIComponent(TOKEN); });
  $('ml-unlink').addEventListener('click', async () => {
    if (!confirm('¿Desvincular tu cuenta? Se borran también sus datos guardados en ML Tracker.')) return;
    try { await api('/api/ml?action=unlink', { method: 'POST' }); loadML(); } catch (e) {}
  });

  // ── Inicio ──
  if (TOKEN) {
    openPanel();
    const p = new URLSearchParams(location.search);
    if (p.get('ml')) {
      show('ml');
      const msg = { ok: 'Cuenta de Mercado Libre vinculada.', error: 'No se pudo vincular con Mercado Libre.', cancelado: 'Vinculación cancelada.' }[p.get('ml')];
      if (msg) toast(msg, p.get('ml') !== 'ok');
      history.replaceState(null, '', location.pathname);
    }
  } else {
    $('login-screen').hidden = false;
    $('li-user').focus();
  }
})();
