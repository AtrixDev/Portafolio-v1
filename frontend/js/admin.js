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
  $('pf-scrape').addEventListener('click', async () => {
    const url = $('pf-url').value.trim(); if (!url) { $('pf-url').focus(); return; }
    const st = $('pf-status'); st.textContent = 'Buscando datos…';
    try {
      const r = await api(`/api/portfolio?scrape=1&url=${encodeURIComponent(url)}`);
      const d = await r.json();
      if (d.title) $('pf-title').value = d.title;
      if (d.image) { $('pf-image').value = d.image; preview(d.title, d.image); }
      st.textContent = d.title ? 'Listo, revisá los datos.' : 'No se pudo leer todo: completalo a mano.';
    } catch (e) { st.textContent = 'No se pudo leer: completalo a mano.'; }
  });
  function preview(title, img) { $('pf-preview').hidden = false; $('pf-preview-img').src = img; $('pf-preview-title').textContent = title || ''; }
  $('pf-image').addEventListener('change', () => { const u = $('pf-image').value.trim(); if (/^https?:/.test(u)) preview($('pf-title').value, u); });

  const PF = ['pf-url', 'pf-title', 'pf-image', 'pf-brand', 'pf-employer', 'pf-category', 'pf-metrics', 'pf-notes'];
  $('pf-add').addEventListener('click', async () => {
    const st = $('pf-status');
    const body = Object.fromEntries(PF.map(id => [id.slice(3), $(id).value.trim()]));
    body.skipScrape = true;
    if (!body.url && !body.title) { st.textContent = 'Poné al menos el link o el título.'; return; }
    st.textContent = 'Guardando…';
    try {
      const r = await api('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(r.status);
      PF.forEach(id => { $(id).value = ''; }); $('pf-preview').hidden = true;
      st.textContent = ''; toast('Publicación agregada.'); loadPortfolio();
    } catch (e) { if (e.message !== '401') st.textContent = 'No se pudo guardar.'; }
  });

  async function loadPortfolio() {
    const list = $('pf-list');
    try {
      const { items } = await (await fetch('/api/portfolio')).json();
      if (!items?.length) { list.innerHTML = '<p class="cp-empty">Todavía no agregaste publicaciones. El inicio muestra las que vienen de fábrica.</p>'; return; }
      list.innerHTML = items.map(it => `
        <article class="cp-item">
          ${safeUrl(it.image) ? `<img src="${safeUrl(it.image)}" alt="">` : '<span class="cp-item-noimg">Sin imagen</span>'}
          <div>
            <strong>${esc(it.title || it.brand || 'Sin título')}</strong>
            <small>${esc([it.employer, it.category].filter(Boolean).join(' · '))}</small>
            ${it.metrics ? `<small class="cp-hl">${esc(it.metrics)}</small>` : ''}
            ${safeUrl(it.url) ? `<a href="${safeUrl(it.url)}" target="_blank" rel="noopener">Ver en Mercado Libre</a>` : ''}
          </div>
          <button type="button" class="cp-icon-btn cp-danger" data-del-pf="${esc(it._id)}" aria-label="Eliminar">${icon('trash')}</button>
        </article>`).join('');
    } catch (e) { list.innerHTML = '<p class="cp-empty">No se pudo cargar la lista.</p>'; }
  }
  $('pf-list').addEventListener('click', async e => {
    const b = e.target.closest('[data-del-pf]'); if (!b || !confirm('¿Eliminar esta publicación del historial?')) return;
    try { await api(`/api/portfolio?id=${encodeURIComponent(b.dataset.delPf)}`, { method: 'DELETE' }); loadPortfolio(); } catch (e2) {}
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
