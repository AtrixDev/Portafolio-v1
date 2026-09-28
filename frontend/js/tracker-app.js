/* ============================================================
   TRACKER-APP.JS — ML Tracker dentro del panel (admin.html)
   Cuentas vinculadas, tendencias, clasificación, stock y precio.
   Datos: /api/tracker (requiere la sesión del panel).
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const ORDEN_CLASES = ['sin_stock', 'perdiendo', 'visitas_sin_ventas', 'en_alza', 'estrella', 'estable', 'dormida', 'pausada'];
  const PRECIO = {
    subir:       { txt: 'Subir precio', tono: 'ok' },
    probar_suba: { txt: 'Probar suba',  tono: 'ok' },
    bajar:       { txt: 'Bajar precio', tono: 'bad' },
    revisar:     { txt: 'Revisar oferta', tono: 'warn' },
    mantener:    { txt: 'Mantener',     tono: 'muted' },
  };
  const S = { cuentas: [], clases: {}, cuenta: null, datos: null, filtro: 'todas', orden: 'prioridad', q: '', item: null, modo: 'visitas', modoCuenta: 'visitas', pedido: 0, vista: 'resumen' };

  // ── Utilidades ──
  const token = () => sessionStorage.getItem('dc_token') || '';
  async function api(q, method = 'GET') {
    const r = await fetch('/api/tracker?' + q, { method, headers: { Authorization: 'Bearer ' + token() } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.error || 'Error'), { status: r.status, code: d.code });
    return d;
  }
  const ic = n => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-${n}"/></svg>`;
  const num = x => x == null ? '—' : Math.round(x).toLocaleString('es-AR');
  const plata = x => x == null ? '—' : (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)).toLocaleString('es-AR');
  const REP = { '5_green': 'verde', '4_light_green': 'verde claro', '3_yellow': 'amarilla', '2_orange': 'naranja', '1_red': 'roja' };
  const MEDALLA = { platinum: 'MercadoLíder Platinum', gold: 'MercadoLíder Gold', silver: 'MercadoLíder' };
  const repTxt = (nivel, medalla) => [nivel ? `Reputación ${REP[nivel] || nivel}` : '', medalla ? MEDALLA[medalla] || medalla : ''].filter(Boolean).join(' · ');
  const plataCorta = x => x == null ? '—' : x >= 1e6 ? '$' + (x / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' M' : x >= 1e4 ? '$' + Math.round(x / 1e3).toLocaleString('es-AR') + ' mil' : plata(x);
  const pct = (x, d = 1) => x == null ? '—' : (x * 100).toLocaleString('es-AR', { maximumFractionDigits: d, minimumFractionDigits: d }) + '%';
  const fecha = d => { const [y, m, dd] = d.split('-'); return `${+dd}/${+m}`; };
  const hace = t => {
    if (!t) return 'nunca';
    const m = Math.round((Date.now() - new Date(t)) / 6e4);
    return m < 2 ? 'recién' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} días`;
  };
  function delta(x, sig, invertir = false) {
    if (x == null) return '<span class="tk-delta is-flat" title="Sin datos del período anterior">—</span>';
    const r = Math.round(x * 100);
    const dir = r > 0 ? 'up' : r < 0 ? 'down' : 'flat';
    const bueno = invertir ? dir === 'down' : dir === 'up';
    const cls = !sig || dir === 'flat' ? 'is-flat' : bueno ? 'is-good' : 'is-bad';
    return `<span class="tk-delta ${cls}" title="${sig ? 'Cambio significativo' : 'Dentro de la variación normal'}">${r > 0 ? '▲' : r < 0 ? '▼' : '•'} ${Math.abs(r)}%</span>`;
  }
  const chip = (clase) => { const c = S.clases[clase] || { txt: clase, tono: 'neutral' }; return `<span class="tk-chip" data-tono="${c.tono}">${esc(c.txt)}</span>`; };
  const chipPrecio = p => { const c = PRECIO[p.accion] || PRECIO.mantener; return `<span class="tk-chip tk-chip-precio" data-tono="${c.tono}">${esc(c.txt)}${p.sugerido ? ` <b>${plata(p.sugerido)}</b>` : ''}</span>`; };
  const diasStockTxt = it => it.stock == null ? '—' : it.stock === 0 ? 'Sin stock' : it.diasStock == null ? `${num(it.stock)} u.` : `${num(it.stock)} u. · ${it.diasStock > 365 ? '+1 año' : Math.floor(it.diasStock) + ' días'}`;

  // ── Gráfico (SVG a mano: barras + línea de precio + marcas de cambios de precio) ──
  function grafico(serie, { modo, precio = false, eventos = [] }) {
    const W = 1000, H = 250, L = 46, R = precio ? 64 : 16, T = 14, B = 26;
    const pw = W - L - R, ph = H - T - B, n = serie.length;
    const x = i => L + (i + 0.5) * pw / n;
    let vals, fmt, linea = false;
    if (modo === 'conversion') {
      linea = true;
      vals = serie.map((_, i) => { const t = serie.slice(Math.max(0, i - 6), i + 1); const v = t.reduce((s, p) => s + p.v, 0), u = t.reduce((s, p) => s + p.u, 0); return v >= 5 ? u / v : null; });
      fmt = v => pct(v);
    } else if (modo === 'facturacion') { vals = serie.map(p => p.r); fmt = plataCorta; }
    else if (modo === 'ventas') { vals = serie.map(p => p.u); fmt = num; }
    else { vals = serie.map(p => p.v); fmt = num; }
    const max = Math.max(...vals.filter(v => v != null), modo === 'conversion' ? 0.01 : 1);
    const techo = linea ? max * 1.15 : niceMax(max);
    const y = v => T + ph - (v / techo) * ph;

    let svg = `<svg viewBox="0 0 ${W} ${H}" class="tk-svg" role="img" aria-label="Gráfico de ${modo} de los últimos ${n} días">`;
    for (let k = 0; k <= 4; k++) {
      const v = techo * k / 4, yy = y(v);
      svg += `<line class="tk-grid" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text class="tk-axis" x="${L - 8}" y="${yy + 4}" text-anchor="end">${fmt(v)}</text>`;
    }
    serie.forEach((p, i) => { if (p.d.endsWith('-01')) svg += `<text class="tk-axis" x="${x(i)}" y="${H - 6}" text-anchor="middle">${['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][+p.d.slice(5, 7)]}</text>`; });
    if (linea) {
      let dpath = '', abierto = false;
      vals.forEach((v, i) => { if (v == null) { abierto = false; return; } dpath += `${abierto ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; abierto = true; });
      svg += `<path class="tk-line" d="${dpath}"/>`;
    } else {
      const bw = Math.max(1, pw / n * 0.72);
      vals.forEach((v, i) => { if (v > 0) svg += `<rect class="tk-bar" x="${(x(i) - bw / 2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(T + ph - y(v)).toFixed(1)}" rx="1"/>`; });
    }
    if (precio) {
      const ps = serie.map(p => p.precio).filter(Boolean);
      if (ps.length) {
        const pmin = Math.min(...ps) * 0.9, pmax = Math.max(...ps) * 1.05;
        const yp = v => T + ph - ((v - pmin) / (pmax - pmin || 1)) * ph;
        let d = '';
        serie.forEach((p, i) => { if (!p.precio) return; const xx = L + i * pw / n, xx2 = L + (i + 1) * pw / n; d += `${d ? 'L' : 'M'}${xx.toFixed(1)},${yp(p.precio).toFixed(1)}L${xx2.toFixed(1)},${yp(p.precio).toFixed(1)}`; });
        svg += `<path class="tk-price" d="${d}"/>`;
        svg += `<text class="tk-axis tk-axis-price" x="${W - R + 8}" y="${yp(Math.max(...ps)) + 4}">${plataCorta(Math.max(...ps))}</text>`;
        if (Math.min(...ps) !== Math.max(...ps)) svg += `<text class="tk-axis tk-axis-price" x="${W - R + 8}" y="${yp(Math.min(...ps)) + 4}">${plataCorta(Math.min(...ps))}</text>`;
      }
    }
    for (const e of eventos) {
      const i = serie.findIndex(p => p.d === e.dia); if (i < 0) continue;
      const xx = L + i * pw / n;
      svg += `<line class="tk-event" x1="${xx}" x2="${xx}" y1="${T}" y2="${T + ph}"/><text class="tk-event-t" x="${xx + 4}" y="${T + 11}">${e.cambio > 0 ? '+' : ''}${Math.round(e.cambio * 100)}%</text>`;
    }
    svg += `<line class="tk-cursor" x1="0" x2="0" y1="${T}" y2="${T + ph}" visibility="hidden"/>`;
    svg += `<rect class="tk-hit" x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg>`;
    return { html: `<div class="tk-chart" data-n="${n}" data-l="${L / W}" data-pw="${pw / W}">${svg}<div class="tk-tip" hidden></div></div>`, vals, fmt };
  }
  function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }

  function activarTooltip(cont, serie, conPrecio) {
    const box = cont.querySelector('.tk-chart'); if (!box) return;
    const svg = box.querySelector('svg'), tip = box.querySelector('.tk-tip'), cur = svg.querySelector('.tk-cursor');
    const n = +box.dataset.n, l = +box.dataset.l, pwr = +box.dataset.pw;
    const mover = ev => {
      const r = svg.getBoundingClientRect();
      const fx = ((ev.touches?.[0]?.clientX ?? ev.clientX) - r.left) / r.width;
      const i = Math.max(0, Math.min(n - 1, Math.floor((fx - l) / pwr * n)));
      const p = serie[i];
      const xx = (l + (i + 0.5) * pwr / n) * 1000;
      cur.setAttribute('x1', xx); cur.setAttribute('x2', xx); cur.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.innerHTML = `<strong>${fecha(p.d)}</strong><span>${num(p.v)} visitas</span><span>${num(p.u)} ventas${p.v ? ` · ${pct(p.u / p.v)}` : ''}</span>${p.r ? `<span>${plata(p.r)}</span>` : ''}${conPrecio && p.precio ? `<span>Precio ${plata(p.precio)}</span>` : ''}`;
      const left = (l + (i + 0.5) * pwr / n) * r.width;
      tip.style.left = Math.min(r.width - 150, Math.max(0, left + 12)) + 'px';
    };
    svg.addEventListener('mousemove', mover); svg.addEventListener('touchstart', mover, { passive: true }); svg.addEventListener('touchmove', mover, { passive: true });
    svg.addEventListener('mouseleave', () => { tip.hidden = true; cur.setAttribute('visibility', 'hidden'); });
  }

  // ── Carga ──
  async function abrir() {
    const root = $('tk-app');
    if (!S.cuentas.length) {
      root.innerHTML = esqueleto();
      try {
        const d = await api('action=cuentas');
        S.cuentas = d.cuentas; S.clases = d.clases;
      } catch (e) { root.innerHTML = error(e.message); return; }
      const guardada = localStorageGet('tk-cuenta');
      const real = S.cuentas.find(c => !c.demo && c.status === 'ok');
      S.cuenta = S.cuentas.find(c => c.id === guardada)?.id || real?.id || 'demo';
    }
    if (S.item) return abrirItem(S.item);
    return cargarCuenta();
  }

  async function cargarCuenta() {
    const root = $('tk-app');
    const c = S.cuentas.find(x => x.id === S.cuenta);
    if (c && !c.demo && !c.ultimaSync) { root.innerHTML = cabecera(c) + primeraVez(c); enlazarCabecera(); return; }
    root.innerHTML = cabecera(c) + esqueleto();
    enlazarCabecera();
    // Si mientras tanto se eligió otra cuenta, esta respuesta ya no sirve
    const pedido = ++S.pedido;
    let datos;
    try { datos = await api('action=cuenta&id=' + encodeURIComponent(S.cuenta)); }
    catch (e) { if (pedido === S.pedido) { root.innerHTML = cabecera(c) + error(e.message); enlazarCabecera(); } return; }
    if (pedido !== S.pedido) return;
    S.datos = datos; S.clases = datos.clases;
    renderCuenta();
  }

  function localStorageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }

  // ── Vistas ──
  const esqueleto = () => `<div class="tk-skel" aria-hidden="true"><span></span><span></span><span></span><span></span><i></i></div>`;
  const error = m => `<div class="cp-empty tk-error">${ic('alert')} ${esc(m)}</div>`;

  function cabecera(c) {
    const opciones = S.cuentas.map(x => `<option value="${esc(x.id)}" ${x.id === S.cuenta ? 'selected' : ''}>${esc(x.nickname)}${x.demo ? ' (datos simulados)' : x.principal ? ' (tu cuenta)' : ''}</option>`).join('');
    return `
      <header class="tk-head">
        <div>
          <p class="tk-eyebrow mono">ML Tracker</p>
          <h2>${esc(c?.nickname || '')}</h2>
          <p class="tk-sub">${c?.demo ? 'Cuenta de ejemplo con datos simulados para ver cómo responde el análisis.' : `Últimos 28 días contra los 28 anteriores · datos actualizados ${hace(c?.ultimaSync)}`}</p>
        </div>
        <div class="tk-head-actions">
          <label class="tk-select"><span class="sr-only">Cuenta</span><select id="tk-cuenta">${opciones}</select></label>
          ${c && !c.demo ? `<button type="button" class="btn-secondary cp-sm" id="tk-sync">${ic('refresh')}Actualizar datos</button>` : ''}
        </div>
      </header>
      <div id="tk-progreso" class="tk-progress" hidden></div>
      ${c?.demo ? `<p class="tk-demo">${ic('eye')}<span><strong>Cuenta demo.</strong> Cada publicación representa un caso típico: estrella, en alza, pérdida de catálogo, suba de precio que bajó la conversión, stock por agotarse, visitas sin ventas.</span></p>` : ''}
      ${c && c.status !== 'ok' && !c.demo ? `<p class="tk-demo is-bad">${ic('alert')}<span>Esta cuenta perdió el acceso a Mercado Libre. Volvé a vincularla desde <a href="#" data-ir="ml">Cuentas</a>.</span></p>` : ''}`;
  }

  function enlazarCabecera() {
    $('tk-cuenta')?.addEventListener('change', e => { S.cuenta = e.target.value; S.filtro = 'todas'; S.item = null; S.vista = 'resumen'; localStorageSet('tk-cuenta', S.cuenta); cargarCuenta(); });
    $('tk-sync')?.addEventListener('click', () => sincronizar(S.cuenta));
    document.querySelectorAll('#tk-app [data-ir]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); document.querySelector(`.cp-nav a[data-s="${a.dataset.ir}"]`)?.click(); }));
  }

  function primeraVez(c) {
    setTimeout(() => $('tk-sync-first')?.addEventListener('click', () => sincronizar(c.id)));
    return `<div class="tk-empty">
      <span class="tk-empty-ic">${ic('database')}</span>
      <h3>Todavía no trajimos los datos de esta cuenta</h3>
      <p>La primera vez se traen las publicaciones, 150 días de visitas y las ventas del mismo período. Tarda entre unos segundos y un par de minutos según el tamaño de la cuenta. Después se actualiza sola todos los días.</p>
      <button type="button" class="btn-primary" id="tk-sync-first">${ic('download')}Traer los datos</button>
    </div>`;
  }

  async function sincronizar(id, nueva = true) {
    const box = $('tk-progreso'), btn = $('tk-sync') || $('tk-sync-first');
    if (btn) btn.disabled = true;
    if (box) { box.hidden = false; box.innerHTML = barra({ paso: 0, pasos: 6, texto: 'Conectando con Mercado Libre' }); }
    try {
      let p, vueltas = 0;
      do {
        p = await api(`action=sync&id=${encodeURIComponent(id)}${nueva && vueltas === 0 ? '&nueva=1' : ''}`, 'POST');
        if (box) box.innerHTML = barra(p);
        vueltas++;
      } while (!p.listo && vueltas < 200);
      const d = await api('action=cuentas'); S.cuentas = d.cuentas;
      toastTk('Datos actualizados');
      await cargarCuenta();
      window.DCTracker.cuentas?.();
    } catch (e) {
      if (box) box.innerHTML = `<p class="tk-progress-err">${ic('alert')} ${esc(e.message)}</p>`;
      if (btn) btn.disabled = false;
    }
  }
  const barra = p => `<div class="tk-progress-row"><span>${esc(p.texto)}${p.detalle ? ` · ${esc(p.detalle)}` : ''}</span><span class="mono">${p.paso}/${p.pasos}</span></div><div class="tk-progress-bar"><i style="width:${Math.round(p.paso / p.pasos * 100)}%"></i></div>`;
  function toastTk(m) { const t = $('toast'); if (!t) return; t.textContent = m; t.classList.remove('is-bad'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400); }

  function renderCuenta() {
    if (S.vista !== 'resumen') return renderVista();
    const root = $('tk-app'), d = S.datos, c = S.cuentas.find(x => x.id === S.cuenta);
    const a = d.resumen.actual, b = d.resumen.anterior;
    const dv = b.visitas ? a.visitas / b.visitas - 1 : null, du = b.unidades ? a.unidades / b.unidades - 1 : null;
    const dr = b.facturacion ? a.facturacion / b.facturacion - 1 : null, dc = b.conversion ? a.conversion / b.conversion - 1 : null;
    const kpi = (k, v, dd, extra = '') => `<div class="tk-kpi"><p class="tk-kpi-k">${k}</p><p class="tk-kpi-v num">${v}</p><p class="tk-kpi-d">${delta(dd, dd != null && Math.abs(dd) >= 0.1)} <span>vs. 28 días anteriores</span></p>${extra}</div>`;
    const rep = c?.reputacion;
    const conteo = d.resumen.conteo;
    const chips = ['todas', ...ORDEN_CLASES.filter(k => conteo[k])].map(k => `<button type="button" data-f="${k}" aria-pressed="${S.filtro === k}">${k === 'todas' ? 'Todas' : esc(S.clases[k].txt)} <span class="mono">${k === 'todas' ? d.items.length : conteo[k]}</span></button>`).join('');

    root.innerHTML = cabecera(c) + tabs() + `
      <p class="tk-section-help">${ayuda(AYUDA.kpis)} Últimos 28 días</p>
      <div class="tk-kpis">
        ${kpi('Visitas', num(a.visitas), dv)}
        ${kpi('Ventas', num(a.unidades) + ' <small>u.</small>', du)}
        ${kpi('Facturación', plataCorta(a.facturacion), dr)}
        ${kpi('Conversión', pct(a.conversion, 2), dc)}
      </div>
      ${rep || c?.preguntasSinResponder != null ? `<div class="tk-meta">
        ${rep?.nivel ? `<span>${ic('award')}<b>${esc(repTxt(rep.nivel, rep.medalla))}</b></span>` : ''}
        ${rep?.reclamos != null ? `<span>Reclamos <b>${pct(rep.reclamos, 2)}</b></span>` : ''}
        ${rep?.demoras != null ? `<span>Despachos demorados <b>${pct(rep.demoras, 2)}</b></span>` : ''}
        ${c?.preguntasSinResponder != null ? `<span class="${c.preguntasSinResponder ? 'is-warn' : ''}">${ic('message')}<b>${c.preguntasSinResponder}</b> preguntas sin responder</span>` : ''}
      </div>` : ''}

      <section class="tk-card tk-alerts">
          <div class="tk-card-head"><h3>Qué mirar hoy ${ayuda(AYUDA.alertas)}</h3><span class="mono tk-count">${d.alertas.length}</span></div>
          ${d.alertas.length ? `<ul>${d.alertas.slice(0, 8).map(al => `<li data-nivel="${al.nivel}"><button type="button" ${al.vista ? `data-ir-vista="${al.vista}"` : `data-item="${esc(al.id)}"`}><i aria-hidden="true"></i><span>${esc(al.txt)}</span>${ic('arrow-right')}</button></li>`).join('')}</ul>${d.alertas.length > 8 ? `<p class="tk-more">y ${d.alertas.length - 8} más en la tabla</p>` : ''}`
            : `<p class="tk-ok">${ic('check')} Nada urgente: no hay caídas, quiebres de stock ni catálogos perdidos.</p>`}
      </section>
      <section class="tk-card">
          <div class="tk-card-head"><h3>Evolución de la cuenta ${ayuda(AYUDA.evolucion)}</h3>
            <div class="tk-seg" role="group" aria-label="Métrica">${['visitas', 'ventas', 'facturacion', 'conversion'].map(m => `<button type="button" data-mc="${m}" aria-pressed="${S.modoCuenta === m}">${{ visitas: 'Visitas', ventas: 'Ventas', facturacion: 'Facturación', conversion: 'Conversión' }[m]}</button>`).join('')}</div>
          </div>
          <div id="tk-chart-cuenta">${grafico(d.serie, { modo: S.modoCuenta }).html}</div>
      </section>

      <section class="tk-card tk-table-card">
        <div class="tk-toolbar">
          <div class="tk-table-title"><h3>Publicaciones ${ayuda(AYUDA.tabla)}</h3></div>
          <div class="cp-filters tk-filters" id="tk-filtros">${chips}</div>
          <div class="tk-tools">
            <label class="tk-search">${ic('search')}<input id="tk-q" type="search" placeholder="Buscar por título o MLA" value="${esc(S.q)}" autocomplete="off"></label>
            <label class="tk-select"><span class="sr-only">Ordenar</span><select id="tk-orden">
              ${[['prioridad', 'Prioridad'], ['visitas', 'Más visitas'], ['ventas', 'Más ventas'], ['facturacion', 'Más facturación'], ['caida', 'Mayor caída'], ['suba', 'Mayor crecimiento'], ['conversion', 'Mejor conversión'], ['stock', 'Menos stock']].map(([v, t]) => `<option value="${v}" ${S.orden === v ? 'selected' : ''}>${t}</option>`).join('')}
            </select></label>
            <button type="button" class="btn-secondary cp-sm" id="tk-csv">${ic('download')}Exportar a Excel</button>
          </div>
        </div>
        <div class="tk-table-wrap"><table class="tk-table">
          <thead><tr><th>Publicación</th><th>Estado</th><th class="r">Visitas</th><th class="r">Ventas</th><th class="r">Conversión</th><th class="r">Precio</th><th>Stock</th><th>Precio sugerido</th></tr></thead>
          <tbody id="tk-filas"></tbody>
        </table></div>
      </section>`;

    enlazarCabecera(); enlazarTabs();
    $('tk-csv').addEventListener('click', exportarCSV);
    root.querySelectorAll('[data-ir-vista]').forEach(b => b.addEventListener('click', () => { S.vista = b.dataset.irVista; renderCuenta(); }));
    activarTooltip($('tk-chart-cuenta'), d.serie, false);
    root.querySelectorAll('[data-mc]').forEach(b => b.addEventListener('click', () => {
      S.modoCuenta = b.dataset.mc;
      root.querySelectorAll('[data-mc]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $('tk-chart-cuenta').innerHTML = grafico(d.serie, { modo: S.modoCuenta }).html;
      activarTooltip($('tk-chart-cuenta'), d.serie, false);
    }));
    $('tk-filtros').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; S.filtro = b.dataset.f; $('tk-filtros').querySelectorAll('[data-f]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); filas(); });
    $('tk-q').addEventListener('input', e => { S.q = e.target.value; filas(); });
    $('tk-orden').addEventListener('change', e => { S.orden = e.target.value; filas(); });
    root.querySelectorAll('.tk-alerts [data-item]').forEach(b => b.addEventListener('click', () => abrirItem(b.dataset.item)));
    filas();
  }

  function filas() {
    const d = S.datos, q = S.q.trim().toLowerCase();
    let items = d.items.filter(i => (S.filtro === 'todas' || i.clase === S.filtro) && (!q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)));
    const prio = i => ORDEN_CLASES.indexOf(i.clase) * 1e9 - (i.actual.facturacion || 0);
    const ord = {
      prioridad: (a, b) => prio(a) - prio(b), visitas: (a, b) => b.actual.visitas - a.actual.visitas, ventas: (a, b) => b.actual.unidades - a.actual.unidades,
      facturacion: (a, b) => b.actual.facturacion - a.actual.facturacion, caida: (a, b) => (a.cambio.unidades ?? 0) - (b.cambio.unidades ?? 0),
      suba: (a, b) => (b.cambio.unidades ?? 0) - (a.cambio.unidades ?? 0), conversion: (a, b) => (b.actual.conversion ?? -1) - (a.actual.conversion ?? -1),
      stock: (a, b) => (a.diasStock ?? 1e9) - (b.diasStock ?? 1e9),
    }[S.orden];
    items = items.sort(ord);
    $('tk-filas').innerHTML = items.length ? items.map(i => `
      <tr data-item="${esc(i.id)}" tabindex="0">
        <td><div class="tk-pub">${i.thumbnail ? `<img src="${esc(safeUrl(i.thumbnail))}" alt="" width="40" height="40" loading="lazy">` : `<span class="tk-noimg" aria-hidden="true">${esc(i.title.slice(0, 1))}</span>`}<div><strong>${esc(i.title)}</strong><small class="mono">${esc(i.id)}${i.abc ? ` · <span class="tk-abc" data-abc="${i.abc}" title="Curva ABC">${i.abc}</span>` : ''}</small></div></div></td>
        <td>${chip(i.clase)}${i.nueva ? ' <span class="tk-chip" data-tono="neutral">Nueva</span>' : ''}</td>
        <td class="r"><span class="num">${num(i.actual.visitas)}</span>${delta(i.cambio.visitas, i.significativo.visitas)}</td>
        <td class="r"><span class="num">${num(i.actual.unidades)}</span>${delta(i.cambio.unidades, i.significativo.unidades)}</td>
        <td class="r"><span class="num">${pct(i.actual.conversion)}</span>${delta(i.cambio.conversion, i.significativo.conversion)}</td>
        <td class="r num">${plata(i.price)}</td>
        <td class="${i.alertaStock?.tipo === 'quiebre' || i.stock === 0 ? 'is-bad' : i.alertaStock?.tipo === 'reponer' ? 'is-warn' : ''}"><span class="tk-stock">${diasStockTxt(i)}</span></td>
        <td>${chipPrecio(i.precio)}</td>
      </tr>`).join('') : `<tr><td colspan="8"><p class="tk-none">No hay publicaciones con ese filtro.</p></td></tr>`;
    $('tk-filas').querySelectorAll('tr[data-item]').forEach(tr => {
      tr.addEventListener('click', () => abrirItem(tr.dataset.item));
      tr.addEventListener('keydown', e => { if (e.key === 'Enter') abrirItem(tr.dataset.item); });
    });
  }

  // ── Ayuda contextual: "?" que explica cómo se lee cada bloque ──
  const ayuda = txt => `<details class="tk-help"><summary aria-label="Cómo se lee">?</summary><div>${txt}</div></details>`;
  const AYUDA = {
    kpis: 'Suma de todas las publicaciones en los últimos 28 días, comparada con los 28 anteriores. La flecha se pinta de verde o rojo solo si el cambio es de 10% o más.',
    alertas: 'Lo más urgente primero: rojo es para hoy (catálogo perdido, stock por agotarse, pérdida de plata), amarillo es para esta semana y verde son oportunidades. Tocá una alerta para ir a la publicación.',
    evolucion: 'Visitas, ventas, facturación o conversión de toda la cuenta día por día, 150 días para atrás. Pasá el mouse para ver cada día.',
    tabla: 'Cada publicación se clasifica sola comparando los últimos 28 días con los 28 anteriores. Las variaciones en gris están dentro de lo normal; en color, son cambios reales (no ruido). A, B y C es la curva ABC: A son las que hacen el 80% de la facturación.',
    rentabilidad: 'Margen por unidad = precio − comisión de Mercado Libre − envío gratis (si lo pagás vos) − impuestos − costo del producto. Comisión y envío se traen solos de Mercado Libre; el costo y los impuestos los cargás vos. El ACOS máximo es lo máximo que podés gastar en Product Ads por venta sin perder plata.',
    calidad: 'Es el puntaje de calidad oficial de Mercado Libre para cada publicación, con lo que te pide completar. Mejorarlo sube la exposición. Ordenado de peor a mejor.',
    preguntas: 'Preguntas sin responder, las más viejas primero. Responder rápido mejora la conversión: después de 24 horas se marcan en amarillo.',
    auditoria: 'Diagnóstico completo para un cliente nuevo o un prospecto: salud de la cuenta por área, qué problemas tiene, cuánta plata está en juego y las 10 acciones en orden. Usá el link de invitación para que el prospecto vincule su cuenta, sincronizá y guardá esto como PDF.',
    reporte: 'Resumen mensual listo para mandarle al cliente. Tocá «Imprimir o guardar PDF» y elegí «Guardar como PDF».',
    diagnostico: 'Si cayeron las visitas, el problema es de exposición (la encuentran menos). Si las visitas siguen igual y cayó la conversión, es de oferta (la ven pero no la compran). La causa probable sale de cruzar precio, stock y catálogo.',
    precio: 'Subir: convierte arriba del promedio, el stock no alcanza o las subas anteriores no le bajaron la conversión. Bajar: perdiste el catálogo, la conversión cayó después de una suba o hay stock parado. Siempre controla que el precio sugerido no te haga perder plata con tus costos.',
    cambios: 'Cada vez que el precio se movió 3% o más y se sostuvo una semana, se comparan hasta 21 días antes y después. Si la conversión no cambió, esa publicación aguanta subas.',
    stock: 'Ritmo = unidades vendidas por día en los últimos 28 días. «Alcanza para» es el stock dividido el ritmo. Menos de 7 días: reponé ya. Más de 90: stock inmovilizado.',
    competencia: 'Los vendedores del mismo producto de catálogo, en el orden en que los muestra Mercado Libre, con precio, envío y logística.',
  };

  // ── Pestañas de la cuenta ──
  const VISTAS = [['resumen', 'Resumen', 'chart'], ['rentabilidad', 'Rentabilidad', 'dollar'], ['calidad', 'Calidad', 'award'], ['preguntas', 'Preguntas', 'message'], ['reporte', 'Reporte', 'file'], ['auditoria', 'Auditoría', 'shield']];
  function tabs() {
    const d = S.datos;
    const badge = { preguntas: d?.preguntas?.length || 0, rentabilidad: d?.resumen?.rentabilidad?.perdiendo || 0 };
    return `<nav class="tk-tabs" aria-label="Vistas de la cuenta">${VISTAS.map(([v, t, i]) => `<button type="button" data-vista="${v}" aria-current="${S.vista === v ? 'page' : 'false'}">${ic(i)}${t}${badge[v] ? `<span class="tk-tab-badge">${badge[v]}</span>` : ''}</button>`).join('')}</nav>`;
  }
  function enlazarTabs() {
    document.querySelectorAll('#tk-app [data-vista]').forEach(b => b.addEventListener('click', () => { S.vista = b.dataset.vista; renderCuenta(); document.querySelector('.cp-main').scrollTop = 0; }));
  }

  function renderVista() {
    const root = $('tk-app'), c = S.cuentas.find(x => x.id === S.cuenta);
    if (S.vista === 'auditoria' && !DX) { cargarDX(); }
    const cuerpo = { rentabilidad: vistaRentabilidad, calidad: vistaCalidad, preguntas: vistaPreguntas, reporte: vistaReporte, auditoria: vistaAuditoria }[S.vista]();
    root.innerHTML = cabecera(c) + tabs() + cuerpo;
    enlazarCabecera(); enlazarTabs();
    if (S.vista === 'rentabilidad') enlazarRentabilidad();
    if (S.vista === 'reporte' || S.vista === 'auditoria') $('tk-print')?.addEventListener('click', () => window.print());
    root.querySelectorAll('[data-item]').forEach(b => b.addEventListener('click', e => { if (e.target.closest('input')) return; abrirItem(b.dataset.item); }));
  }

  // Rentabilidad
  function vistaRentabilidad() {
    const d = S.datos, r = d.resumen.rentabilidad;
    const activos = d.items.filter(i => i.status === 'active').sort((a, b) => (a.rentabilidad?.completo ? 1 : 0) - (b.rentabilidad?.completo ? 1 : 0) || (a.rentabilidad?.margenPct ?? 9) - (b.rentabilidad?.margenPct ?? 9));
    const conM = activos.filter(i => i.rentabilidad?.completo);
    const margenProm = conM.length ? conM.reduce((s, i) => s + i.rentabilidad.margenPct * (i.actual.facturacion || 1), 0) / conM.reduce((s, i) => s + (i.actual.facturacion || 1), 0) : null;
    return `
      <div class="tk-kpis">
        <div class="tk-kpi"><p class="tk-kpi-k">Ganancia estimada (28 días)</p><p class="tk-kpi-v num">${r.ganancia == null ? '—' : plataCorta(r.ganancia)}</p><p class="tk-kpi-d"><span>${r.conCosto} con costo cargado</span></p></div>
        <div class="tk-kpi"><p class="tk-kpi-k">Margen promedio</p><p class="tk-kpi-v num">${pct(margenProm)}</p><p class="tk-kpi-d"><span>ponderado por facturación</span></p></div>
        <div class="tk-kpi"><p class="tk-kpi-k">Pierden plata</p><p class="tk-kpi-v num ${r.perdiendo ? 'tk-bad' : ''}">${r.perdiendo}</p><p class="tk-kpi-d"><span>margen negativo por venta</span></p></div>
        <div class="tk-kpi"><p class="tk-kpi-k">Sin costo cargado</p><p class="tk-kpi-v num">${r.sinCosto}</p><p class="tk-kpi-d"><span>cargalos abajo para ver el margen</span></p></div>
      </div>
      <section class="tk-card">
        <div class="tk-card-head"><h3>Margen por publicación ${ayuda(AYUDA.rentabilidad)}</h3>
          <div class="tk-tools">
            <label class="tk-inline-field">Impuestos sobre el precio <input id="tk-imp" type="number" min="0" max="60" step="0.1" value="${esc(String(d.config?.impuestosPct ?? 0))}" inputmode="decimal"> %</label>
            <button type="button" class="btn-secondary cp-sm" id="tk-pegar">${ic('sheet')}Pegar costos desde Excel</button>
            <button type="button" class="btn-primary cp-sm" id="tk-guardar-costos" disabled>${ic('check')}Guardar cambios</button>
          </div>
        </div>
        <div id="tk-pegado" class="tk-paste" hidden>
          <p>Pegá dos columnas copiadas de Excel: código de publicación y costo unitario (una fila por producto). Ejemplo: <code>MLA1234567890 &nbsp; 4500</code></p>
          <textarea id="tk-pegado-txt" rows="5" placeholder="MLA1234567890	4500&#10;MLA9876543210	12300"></textarea>
          <div class="cp-actions"><button type="button" class="btn-secondary cp-sm" id="tk-pegado-ok">Aplicar</button><span class="cp-status" id="tk-pegado-st"></span></div>
        </div>
        <div class="tk-table-wrap"><table class="tk-table tk-rent">
          <thead><tr><th>Publicación</th><th class="r">Precio</th><th class="r">Comisión</th><th class="r">Envío</th><th class="r">Impuestos</th><th class="r">Costo unitario</th><th class="r">Margen</th><th class="r">ACOS máx.</th><th class="r">Ganancia 28 d</th></tr></thead>
          <tbody>${activos.map(i => { const R = i.rentabilidad || {}; return `<tr data-item="${esc(i.id)}">
            <td><div class="tk-pub"><div><strong>${esc(i.title)}</strong><small class="mono">${esc(i.id)} · ${i.abc || '—'}</small></div></div></td>
            <td class="r num">${plata(i.price)}</td>
            <td class="r"><span class="num">${plata(R.comision)}</span><small class="tk-sub2">${R.comisionPct != null ? pct(R.comisionPct / 100) + (R.tipo ? ' · ' + esc(R.tipo) : '') : 'sin dato'}</small></td>
            <td class="r"><span class="num">${R.envioGratis ? plata(R.envio) : '$0'}</span><small class="tk-sub2">${R.envioGratis ? 'envío gratis' : 'lo paga el comprador'}</small></td>
            <td class="r num">${plata(R.impuestos)}</td>
            <td class="r"><input class="tk-costo" type="number" min="0" step="1" inputmode="numeric" data-costo="${esc(i.id)}" value="${R.costo ?? ''}" placeholder="Cargar" aria-label="Costo unitario de ${esc(i.title)}"></td>
            <td class="r ${R.completo && R.margen < 0 ? 'is-bad' : ''}">${R.completo ? `<span class="num">${plata(R.margen)}</span><small class="tk-sub2">${pct(R.margenPct)}</small>` : '<span class="tk-muted">—</span>'}</td>
            <td class="r num">${R.completo ? pct(R.acosEquilibrio) : '—'}</td>
            <td class="r num">${R.completo ? plata(R.ganancia) : '—'}</td>
          </tr>`; }).join('')}</tbody>
        </table></div>
        <p class="tk-foot">El envío es el precio de lista de Mercado Libre; si tu reputación te da descuento, el costo real es menor. La ganancia estimada usa el precio actual.</p>
      </section>`;
  }

  function enlazarRentabilidad() {
    const cambios = {}, btn = $('tk-guardar-costos'), demo = S.cuenta === 'demo';
    const marcar = () => { btn.disabled = !Object.keys(cambios).length && !marcar.imp; };
    document.querySelectorAll('.tk-costo').forEach(inp => {
      inp.addEventListener('click', e => e.stopPropagation());
      inp.addEventListener('input', () => { cambios[inp.dataset.costo] = inp.value === '' ? null : Number(inp.value); marcar(); });
    });
    $('tk-imp').addEventListener('input', () => { marcar.imp = true; marcar(); });
    $('tk-pegar').addEventListener('click', () => { const b = $('tk-pegado'); b.hidden = !b.hidden; });
    $('tk-pegado-ok').addEventListener('click', () => {
      let n = 0, mal = 0;
      for (const linea of $('tk-pegado-txt').value.split(/\r?\n/)) {
        const m = linea.trim().match(/(MLA-?\d+)[\s;,|]+\$?\s*([\d.,]+)/i);
        if (!m) { if (linea.trim()) mal++; continue; }
        const id = m[1].toUpperCase().replace('-', '');
        const valor = Number(m[2].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
        const inp = document.querySelector(`.tk-costo[data-costo="${id}"]`);
        if (!inp || !Number.isFinite(valor)) { mal++; continue; }
        inp.value = valor; cambios[id] = valor; n++;
      }
      $('tk-pegado-st').textContent = `${n} costos aplicados${mal ? `, ${mal} filas sin reconocer` : ''}. Tocá «Guardar cambios».`;
      marcar();
    });
    btn.addEventListener('click', async () => {
      if (demo) { toastTk('En la cuenta demo los costos no se guardan'); return; }
      btn.disabled = true;
      try {
        if (Object.keys(cambios).length) await apiJson('costos', { cuenta: S.cuenta, costos: cambios });
        if (marcar.imp) await apiJson('config', { cuenta: S.cuenta, impuestosPct: Number($('tk-imp').value) || 0 });
        toastTk('Costos guardados');
        S.datos = await api('action=cuenta&id=' + encodeURIComponent(S.cuenta));
        renderCuenta();
      } catch (e) { toastTk(e.message); btn.disabled = false; }
    });
  }
  async function apiJson(action, body) {
    const r = await fetch('/api/tracker?action=' + action, { method: 'POST', headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'No se pudo guardar');
    return d;
  }

  // Calidad
  function vistaCalidad() {
    const d = S.datos;
    const con = d.items.filter(i => i.calidad).sort((a, b) => a.calidad.score - b.calidad.score);
    const tono = s => s >= 80 ? 'ok' : s >= 60 ? 'warn' : 'bad';
    return `
      <section class="tk-card">
        <div class="tk-card-head"><h3>Calidad de publicaciones ${ayuda(AYUDA.calidad)}</h3>${d.resumen.calidadPromedio != null ? `<span class="tk-chip" data-tono="${tono(d.resumen.calidadPromedio)}">Promedio ${d.resumen.calidadPromedio}/100</span>` : ''}</div>
        ${con.length ? `<ul class="tk-quality">${con.map(i => `<li>
          <button type="button" class="tk-q-head" data-item="${esc(i.id)}">
            <span class="tk-score" data-tono="${tono(i.calidad.score)}"><b class="num">${i.calidad.score}</b></span>
            <span class="tk-q-title"><strong>${esc(i.title)}</strong><small>${esc(i.calidad.nivel || '')} · ${i.abc ? 'Curva ' + i.abc : ''} · ${num(i.actual.visitas)} visitas en 28 días</small></span>
            ${ic('arrow-right')}
          </button>
          ${i.calidad.faltan?.length ? `<ul class="tk-q-todo">${i.calidad.faltan.map(f => `<li><span class="tk-q-group">${esc(f.grupo)}</span>${esc(f.titulo)}${f.detalle?.length ? `<small>${f.detalle.map(esc).join(' · ')}</small>` : ''}</li>`).join('')}</ul>` : `<p class="tk-q-done">${ic('check')} Nada pendiente.</p>`}
        </li>`).join('')}</ul>` : `<p class="tk-none">Todavía no hay datos de calidad: tocá «Actualizar datos».</p>`}
      </section>`;
  }

  // Preguntas
  function vistaPreguntas() {
    const qs = S.datos.preguntas || [];
    return `
      <section class="tk-card">
        <div class="tk-card-head"><h3>Preguntas sin responder ${ayuda(AYUDA.preguntas)}</h3><span class="mono tk-count">${qs.length}</span></div>
        ${qs.length ? `<ul class="tk-questions">${qs.map(q => `<li class="${q.horas >= 24 ? 'is-late' : ''}">
          <p class="tk-q-text">«${esc(q.texto)}»</p>
          <p class="tk-q-meta"><span class="mono">${q.horas == null ? '' : q.horas < 1 ? 'recién' : q.horas < 48 ? `hace ${q.horas} h` : `hace ${Math.round(q.horas / 24)} días`}</span> · <button type="button" class="tk-linkbtn" data-item="${esc(q.item)}">${esc(q.titulo)}</button></p>
        </li>`).join('')}</ul>
        <p class="tk-foot">Se responden desde Mercado Libre: Ventas → Preguntas. Se actualizan con cada sincronización.</p>`
        : `<p class="tk-ok">${ic('check')} No hay preguntas pendientes.</p>`}
      </section>`;
  }

  // Reporte para el cliente (se imprime o se guarda como PDF)
  function vistaReporte() {
    const d = S.datos, c = S.cuentas.find(x => x.id === S.cuenta), a = d.resumen.actual, b = d.resumen.anterior;
    const var_ = (x, y) => y ? `${x >= y ? '▲' : '▼'} ${Math.abs(Math.round((x / y - 1) * 100))}%` : '—';
    const top = [...d.items].sort((x, y) => y.actual.facturacion - x.actual.facturacion).slice(0, 8);
    const acciones = [];
    for (const i of d.items) {
      if (i.precio.accion === 'subir' || i.precio.accion === 'bajar') acciones.push(`${i.precio.accion === 'subir' ? 'Subir' : 'Bajar'} el precio de «${i.title}» a ${plata(i.precio.sugerido)}: ${i.precio.motivos[0]}`);
      if (i.alertaStock?.tipo === 'quiebre' || i.alertaStock?.tipo === 'reponer') acciones.push(`Reponer «${i.title}»: el stock alcanza para ${i.alertaStock.dias} días.`);
      if (i.calidad?.faltan?.length && i.abc === 'A') acciones.push(`Mejorar la calidad de «${i.title}» (${i.calidad.score}/100): ${i.calidad.faltan[0].titulo.toLowerCase()}.`);
      if (i.clase === 'perdiendo' && i.diagnostico[0]) acciones.push(`«${i.title}»: ${i.diagnostico[0].titulo.toLowerCase()}. ${i.diagnostico[0].texto}`);
    }
    const hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `
      <div class="tk-report-bar"><p>${ayuda(AYUDA.reporte)} Vista previa del reporte</p><button type="button" class="btn-primary cp-sm" id="tk-print">${ic('download')}Imprimir o guardar PDF</button></div>
      <article class="tk-report" id="tk-report">
        <header class="tk-rep-head">
          <div><p class="mono">Reporte de rendimiento · Mercado Libre</p><h2>${esc(c?.nickname || '')}</h2><p>Del ${fecha(d.serie.at(-28).d)} al ${fecha(d.hasta)} · comparado con los 28 días anteriores</p></div>
          <div class="tk-rep-by"><span class="nav-mark" aria-hidden="true">DC</span><span>Darío Colángelo<br><small>${hoy}</small></span></div>
        </header>
        <div class="tk-rep-kpis">
          <div><p>Facturación</p><b>${plata(a.facturacion)}</b><span>${var_(a.facturacion, b.facturacion)}</span></div>
          <div><p>Unidades vendidas</p><b>${num(a.unidades)}</b><span>${var_(a.unidades, b.unidades)}</span></div>
          <div><p>Visitas</p><b>${num(a.visitas)}</b><span>${var_(a.visitas, b.visitas)}</span></div>
          <div><p>Conversión</p><b>${pct(a.conversion, 2)}</b><span>${var_(a.conversion || 0, b.conversion || 0)}</span></div>
        </div>
        <h3>Evolución de las visitas</h3>
        ${grafico(d.serie.slice(-56), { modo: 'visitas' }).html}
        <h3>Publicaciones que más facturaron</h3>
        <table class="tk-table"><thead><tr><th>Publicación</th><th class="r">Facturación</th><th class="r">Unidades</th><th class="r">Conversión</th><th>Estado</th></tr></thead>
          <tbody>${top.map(i => `<tr><td>${esc(i.title)}</td><td class="r num">${plata(i.actual.facturacion)}</td><td class="r num">${num(i.actual.unidades)}</td><td class="r num">${pct(i.actual.conversion)}</td><td>${esc(S.clases[i.clase]?.txt || '')}</td></tr>`).join('')}</tbody></table>
        <h3>Próximos pasos recomendados</h3>
        ${acciones.length ? `<ol class="tk-rep-actions">${acciones.slice(0, 10).map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '<p>No hay acciones urgentes: la cuenta se mueve dentro de lo esperado.</p>'}
        <p class="tk-rep-foot">Datos de la API oficial de Mercado Libre. Clasificaciones y recomendaciones calculadas por ML Tracker.</p>
      </article>`;
  }

  // ── Auditoría de cuenta (servicio): salud por área, hallazgos con plata en juego y plan de 10 acciones ──
  // Los problemas, causas y soluciones salen del catálogo de diagnóstico público (data/ia-meli.json), el mismo de sistema.html.
  let DX = null;
  async function cargarDX() {
    try { DX = (await (await fetch('data/ia-meli.json')).json()).diagnostico || []; } catch (e) { DX = []; }
    if (S.vista === 'auditoria') renderVista();
  }
  // Qué publicaciones tienen cada problema del catálogo, con la misma lógica del análisis
  const DETECTA = {
    exposicion: i => i.clase === 'perdiendo' && i.diagnostico.some(x => x.tipo === 'exposicion'),
    catalogo: i => i.catalogo?.status === 'competing',
    oferta: i => i.clase === 'perdiendo' && i.diagnostico.some(x => x.tipo === 'oferta'),
    'visitas-sin-ventas': i => i.clase === 'visitas_sin_ventas',
    perdida: i => i.status === 'active' && i.rentabilidad?.completo && i.rentabilidad.margen < 0,
    quiebre: i => i.clase === 'sin_stock' || ['quiebre', 'reponer'].includes(i.alertaStock?.tipo),
    inmovilizado: i => i.alertaStock?.tipo === 'inmovilizado',
    calidad: i => i.abc === 'A' && i.calidad?.score != null && i.calidad.score < 60,
    dormida: i => i.clase === 'dormida',
    suba: i => ['subir', 'probar_suba'].includes(i.precio?.accion),
  };
  const PRIORIDAD = { perdida: 3, quiebre: 3, catalogo: 3, exposicion: 2, oferta: 2, 'visitas-sin-ventas': 2, calidad: 1, inmovilizado: 1, dormida: 1, suba: 1 };
  const PRIO_TXT = { 3: 'Urgente', 2: 'Importante', 1: 'Oportunidad' };
  const PRIO_TONO = { 3: 'bad', 2: 'warn', 1: 'ok' };
  // Plata en juego por problema: pérdida del período, facturación expuesta o valor del stock parado
  function enJuego(id, items) {
    if (id === 'perdida') return { monto: items.reduce((t, i) => t + -i.rentabilidad.margen * i.actual.unidades, 0), txt: 'perdidos en el período' };
    if (id === 'inmovilizado') return { monto: items.reduce((t, i) => t + (i.stock || 0) * (i.rentabilidad?.costo ?? i.price ?? 0), 0), txt: 'en stock parado' };
    if (id === 'suba') return { monto: items.reduce((t, i) => t + Math.max(0, (i.precio.sugerido || i.price) - i.price) * i.actual.unidades, 0), txt: 'de margen extra posible' };
    if (id === 'dormida') return null;
    return { monto: items.reduce((t, i) => t + i.actual.facturacion, 0), txt: 'de facturación expuesta' };
  }
  function saludCuenta(d) {
    const act = d.items.filter(i => i.status === 'active'), n = act.length || 1;
    const share = f => Math.round(100 * (1 - act.filter(f).length / n));
    const conCosto = act.filter(i => i.rentabilidad?.completo);
    const viejas = (d.preguntas || []).filter(q => q.horas >= 24).length;
    const areas = [
      ['Visibilidad', share(i => DETECTA.exposicion(i) || DETECTA.catalogo(i) || DETECTA.dormida(i)), 'Publicaciones que no pierden exposición ni catálogo'],
      ['Conversión', share(i => DETECTA.oferta(i) || DETECTA['visitas-sin-ventas'](i)), 'Publicaciones que convierten sus visitas'],
      ['Rentabilidad', conCosto.length ? Math.round(100 * conCosto.filter(i => i.rentabilidad.margen >= 0).length / conCosto.length) : null, conCosto.length ? `${conCosto.length} con costo cargado` : 'Sin costos cargados: no se puede evaluar'],
      ['Stock', share(i => DETECTA.quiebre(i) || DETECTA.inmovilizado(i)), 'Sin quiebres ni stock parado'],
      ['Calidad de fichas', d.resumen.calidadPromedio ?? null, d.resumen.calidadPromedio != null ? 'Promedio del puntaje oficial de Mercado Libre' : 'Sin datos de calidad'],
      ['Atención', Math.max(0, 100 - viejas * 15), viejas ? `${viejas} preguntas con más de 24 h` : 'Preguntas respondidas a tiempo'],
    ];
    const con = areas.filter(a => a[1] != null);
    return { areas, total: con.length ? Math.round(con.reduce((t, a) => t + a[1], 0) / con.length) : null };
  }
  const tonoSalud = v => v == null ? 'muted' : v >= 80 ? 'ok' : v >= 60 ? 'warn' : 'bad';
  function vistaAuditoria() {
    if (!DX) return '<p class="tk-empty">Cargando el catálogo de diagnóstico…</p>';
    const d = S.datos, c = S.cuentas.find(x => x.id === S.cuenta), a = d.resumen.actual;
    const sal = saludCuenta(d);
    const hallazgos = DX.map(x => {
      const items = d.items.filter(i => DETECTA[x.id]?.(i));
      return items.length ? { ...x, items, prio: PRIORIDAD[x.id] || 1, juego: enJuego(x.id, items) } : null;
    }).filter(Boolean).sort((x, y) => y.prio - x.prio || (y.juego?.monto || 0) - (x.juego?.monto || 0));
    // Plan: una acción por publicación y problema, las más graves y de más plata primero
    const vistos = new Set();
    const plan = hallazgos.flatMap(h => h.items.map(i => ({ id: i.id, prio: h.prio, monto: i.actual.facturacion, txt: `«${i.title}»: ${h.titulo.toLowerCase()}. ${h.solucion[0]}.`, kpi: h.kpi })))
      .sort((x, y) => y.prio - x.prio || y.monto - x.monto)
      .filter(x => !vistos.has(x.id) && vistos.add(x.id)).slice(0, 10);   // una acción por publicación: la más grave
    const sinEvaluar = [!d.items.some(i => i.rentabilidad?.completo) && 'Rentabilidad: faltan los costos de los productos', 'Product Ads: la inversión por campaña se revisa aparte en el panel de publicidad'].filter(Boolean);
    const hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `
      <div class="tk-report-bar"><p>${ayuda(AYUDA.auditoria)} Vista previa de la auditoría</p><button type="button" class="btn-primary cp-sm" id="tk-print">${ic('download')}Imprimir o guardar PDF</button></div>
      <article class="tk-report tk-audit" id="tk-report">
        <header class="tk-rep-head">
          <div><p class="mono">Auditoría de cuenta · Mercado Libre</p><h2>${esc(c?.nickname || '')}</h2><p>${d.items.length} publicaciones analizadas · ${fecha(d.serie.at(-28).d)} al ${fecha(d.hasta)} contra los 28 días anteriores</p></div>
          <div class="tk-rep-by"><span class="nav-mark" aria-hidden="true">DC</span><span>Darío Colángelo<br><small>${hoy}</small></span></div>
        </header>

        <section class="au-salud">
          <div class="au-total" data-tono="${tonoSalud(sal.total)}"><b>${sal.total ?? '—'}</b><span>/100</span><p>Salud de la cuenta</p></div>
          <ul class="au-areas">${sal.areas.map(([n, v, t]) => `<li><span class="au-a-n">${n}</span><span class="au-bar"><i style="width:${v ?? 0}%" data-tono="${tonoSalud(v)}"></i></span><b class="mono">${v ?? '—'}</b><small>${esc(t)}</small></li>`).join('')}</ul>
        </section>

        <h3>Resumen</h3>
        <p class="au-lead">${hallazgos.length
          ? `Encontré <b>${hallazgos.length} tipos de problema</b> en <b>${new Set(hallazgos.flatMap(h => h.items.map(i => i.id))).size} publicaciones</b>. ${hallazgos.filter(h => h.prio === 3).length ? `Hay ${hallazgos.filter(h => h.prio === 3).length} urgentes, que conviene resolver esta semana.` : 'Ninguno es urgente.'} La cuenta facturó ${plata(a.facturacion)} en los últimos 28 días con una conversión de ${pct(a.conversion, 2)}.`
          : 'No encontré problemas relevantes: la cuenta se mueve dentro de lo esperado.'}</p>

        <h3>Hallazgos</h3>
        <div class="au-hall">${hallazgos.map(h => `
          <section class="au-h">
            <div class="au-h-top"><span class="tk-chip" data-tono="${PRIO_TONO[h.prio]}">${PRIO_TXT[h.prio]}</span><h4>${esc(h.titulo)}</h4><span class="mono au-n">${h.items.length} ${h.items.length === 1 ? 'publicación' : 'publicaciones'}</span></div>
            ${h.juego && h.juego.monto > 0 ? `<p class="au-juego"><b>${plata(h.juego.monto)}</b> ${h.juego.txt}</p>` : ''}
            <p class="au-regla"><b>Cómo lo detecté:</b> ${esc(h.regla)}</p>
            <p class="au-pubs">${h.items.slice(0, 4).map(i => esc(i.title)).join(' · ')}${h.items.length > 4 ? ` y ${h.items.length - 4} más` : ''}</p>
            <p><b>Causas probables:</b> ${esc(h.causas.slice(0, 3).join(', ').toLowerCase())}.</p>
            <p><b>Qué hacer:</b> ${esc(h.solucion.slice(0, 2).join('. '))}.</p>
          </section>`).join('') || '<p>Sin hallazgos.</p>'}</div>

        <h3>Plan de acción: los 10 primeros pasos</h3>
        ${plan.length ? `<ol class="tk-rep-actions au-plan">${plan.map(x => `<li><span class="tk-chip" data-tono="${PRIO_TONO[x.prio]}">${PRIO_TXT[x.prio]}</span> ${esc(x.txt)} <small>Se resolvió cuando: ${esc(x.kpi.toLowerCase())}.</small></li>`).join('')}</ol>` : '<p>No hay acciones urgentes.</p>'}

        ${sinEvaluar.length ? `<h3>Qué no se pudo evaluar</h3><ul class="au-no">${sinEvaluar.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}

        <footer class="au-foot">
          <p><b>¿Seguimos?</b> Puedo implementar este plan y medir los resultados cada semana.</p>
          <p class="mono">Darío Colángelo · daricolangelo@gmail.com · Analista de Mercado Libre</p>
          <p class="tk-rep-foot">Datos de la API oficial de Mercado Libre. Detección con las reglas públicas del catálogo de diagnóstico; las caídas se validan con pruebas estadísticas.</p>
        </footer>
      </article>`;
  }

  // Exportar la tabla a Excel (CSV con punto y coma, como lo abre Excel en español)
  function exportarCSV() {
    const d = S.datos;
    const cols = [['Publicación', i => i.id], ['Título', i => i.title], ['Estado', i => S.clases[i.clase]?.txt], ['Curva ABC', i => i.abc], ['Precio', i => i.price],
      ['Visitas 28d', i => i.actual.visitas], ['Var. visitas %', i => i.cambio.visitas == null ? '' : Math.round(i.cambio.visitas * 100)],
      ['Ventas 28d', i => i.actual.unidades], ['Var. ventas %', i => i.cambio.unidades == null ? '' : Math.round(i.cambio.unidades * 100)],
      ['Facturación 28d', i => Math.round(i.actual.facturacion)], ['Conversión %', i => i.actual.conversion == null ? '' : (i.actual.conversion * 100).toFixed(2)],
      ['Stock', i => i.stock ?? ''], ['Días de stock', i => i.diasStock == null ? '' : Math.floor(i.diasStock)],
      ['Margen unitario', i => i.rentabilidad?.completo ? Math.round(i.rentabilidad.margen) : ''], ['Calidad ML', i => i.calidad?.score ?? ''],
      ['Precio: acción', i => PRECIO[i.precio.accion]?.txt], ['Precio sugerido', i => i.precio.sugerido ?? ''], ['Motivo', i => i.precio.motivos[0]]];
    const celda = v => { const s = String(v ?? '').replace(/\./g, ',').replace(/"/g, '""'); return /[;"\n]/.test(s) ? `"${s}"` : s; };
    const txt = (v, k) => (k === 1 || k === 17 || k === 2 || k === 15 ? String(v ?? '').replace(/"/g, '""') : null);
    const filas = [cols.map(c => c[0]).join(';'), ...d.items.map(i => cols.map((c, k) => { const v = c[1](i); const t = txt(v, k); return t != null ? `"${t}"` : celda(v); }).join(';'))];
    const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ml-tracker-${(S.cuentas.find(x => x.id === S.cuenta)?.nickname || 'cuenta').toLowerCase()}-${d.hasta}.csv`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ── Detalle de una publicación ──
  async function abrirItem(id) {
    S.item = id;
    const root = $('tk-app');
    root.innerHTML = `<button type="button" class="tk-back" id="tk-back">${ic('arrow-right')}Volver a la cuenta</button>` + esqueleto();
    $('tk-back').addEventListener('click', volver);
    document.querySelector('.cp-main').scrollTop = 0; window.scrollTo(0, 0);
    let d;
    const pedido = ++S.pedido;
    try { d = await api(`action=item&cuenta=${encodeURIComponent(S.cuenta)}&id=${encodeURIComponent(id)}`); }
    catch (e) { if (pedido === S.pedido) root.innerHTML += error(e.message); return; }
    if (pedido !== S.pedido || S.item !== id) return;
    const it = d.item, serie = d.serie;
    const cur = it.actual, prev = it.anterior;
    const dx = (k, t, v, dd, sig, inv) => `<div class="tk-kpi"><p class="tk-kpi-k">${k}</p><p class="tk-kpi-v num">${v}</p><p class="tk-kpi-d">${delta(dd, sig, inv)} <span>${t}</span></p></div>`;
    const p = it.precio, pc = PRECIO[p.accion] || PRECIO.mantener;

    root.innerHTML = `
      <button type="button" class="tk-back" id="tk-back">${ic('arrow-right')}Volver a la cuenta</button>
      <header class="tk-item-head">
        ${it.thumbnail ? `<img src="${esc(safeUrl(it.thumbnail))}" alt="" width="72" height="72">` : `<span class="tk-noimg is-lg" aria-hidden="true">${esc(it.title.slice(0, 1))}</span>`}
        <div>
          <p class="tk-eyebrow mono">${esc(it.id)}${it.catalog_listing ? ' · Catálogo' : ''}</p>
          <h2>${esc(it.title)}</h2>
          <p class="tk-item-tags">${chip(it.clase)} ${it.nueva ? '<span class="tk-chip" data-tono="neutral">Nueva</span>' : ''} ${it.abc ? `<span class="tk-chip" data-tono="neutral" title="Curva ABC">Curva ${it.abc}${it.participacion ? ` · ${pct(it.participacion)} de la facturación` : ''}</span>` : ''} <span class="tk-price-now num">${plata(it.price)}</span>
          ${it.permalink ? `<a class="link-arrow" href="${esc(safeUrl(it.permalink))}" target="_blank" rel="noopener">Ver en Mercado Libre ${ic('external')}</a>` : ''}</p>
        </div>
      </header>

      <div class="tk-kpis">
        ${dx('Visitas (28 días)', 'vs. anteriores', num(cur.visitas), it.cambio.visitas, it.significativo.visitas)}
        ${dx('Ventas', `${num(prev.unidades)} antes`, num(cur.unidades) + ' <small>u.</small>', it.cambio.unidades, it.significativo.unidades)}
        ${dx('Conversión', `${pct(prev.conversion)} antes · cuenta ${pct(d.conversionMediana)}`, pct(cur.conversion, 2), it.cambio.conversion, it.significativo.conversion)}
        ${dx('Facturación', 'vs. anteriores', plataCorta(cur.facturacion), it.cambio.facturacion, Math.abs(it.cambio.facturacion ?? 0) >= 0.15)}
      </div>

      <section class="tk-card">
        <div class="tk-card-head"><h3>Historia de ${serie.length} días ${ayuda(AYUDA.evolucion)}</h3>
          <div class="tk-seg" role="group" aria-label="Métrica">${['visitas', 'ventas', 'conversion'].map(m => `<button type="button" data-m="${m}" aria-pressed="${S.modo === m}">${{ visitas: 'Visitas', ventas: 'Ventas', conversion: 'Conversión (7 días)' }[m]}</button>`).join('')}</div>
        </div>
        <div id="tk-chart-item">${grafico(serie, { modo: S.modo, precio: true, eventos: it.eventosPrecio }).html}</div>
        <p class="tk-legend"><span class="is-bar"></span>${{ visitas: 'Visitas por día', ventas: 'Ventas por día', conversion: 'Conversión (promedio de 7 días)' }[S.modo]}<span class="is-price"></span>Precio<span class="is-event"></span>Cambio de precio</p>
      </section>

      <div class="tk-grid2 is-even">
        <section class="tk-card">
          <div class="tk-card-head"><h3>Diagnóstico ${ayuda(AYUDA.diagnostico)}</h3></div>
          ${it.diagnostico.length ? it.diagnostico.map(g => `<div class="tk-diag" data-tipo="${g.tipo}"><strong>${esc(g.titulo)}</strong><p>${esc(g.texto)}</p></div>`).join('')
            : `<p class="tk-ok">${ic('check')} Sin cambios relevantes contra el mes anterior: se mueve dentro de lo normal.</p>`}
          ${it.catalogo ? `<div class="tk-diag" data-tipo="catalogo"><strong>Catálogo: ${it.catalogo.status === 'winning' ? 'estás ganando' : it.catalogo.status === 'competing' ? 'no estás ganando' : it.catalogo.status === 'sharing_first_place' ? 'compartís el primer lugar' : esc(it.catalogo.status || '—')}</strong>
            <p>${it.catalogo.price_to_win ? `Precio para ganar: <b>${plata(it.catalogo.price_to_win)}</b>. ` : ''}${it.catalogo.visit_share ? `Participación en visitas: ${esc(String(it.catalogo.visit_share))}.` : ''}</p></div>` : ''}
        </section>
        <section class="tk-card tk-price-card" data-tono="${pc.tono}">
          <div class="tk-card-head"><h3>Precio ${ayuda(AYUDA.precio)}</h3>${chipPrecio(p)}</div>
          ${p.sugerido ? `<p class="tk-price-sug"><span class="num">${plata(it.price)}</span>${ic('arrow-right')}<b class="num">${plata(p.sugerido)}</b><em>${p.cambio > 0 ? '+' : ''}${Math.round(p.cambio * 100)}%</em></p>` : ''}
          <ul class="tk-motivos">${p.motivos.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
        </section>
      </div>

      <div class="tk-grid2 is-stock">
        <section class="tk-card">
          <div class="tk-card-head"><h3>Stock ${ayuda(AYUDA.stock)}</h3></div>
          <dl class="tk-dl">
            <div><dt>Disponible</dt><dd class="num">${it.stock == null ? '—' : num(it.stock) + ' u.'}</dd></div>
            <div><dt>Ritmo de venta</dt><dd class="num">${it.ritmoDiario ? it.ritmoDiario.toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' u./día' : 'sin ventas'}</dd></div>
            <div><dt>Alcanza para</dt><dd class="num">${it.diasStock == null ? '—' : it.diasStock > 365 ? 'más de un año' : Math.floor(it.diasStock) + ' días'}</dd></div>
          </dl>
          ${it.alertaStock ? `<p class="tk-stock-alert" data-tipo="${it.alertaStock.tipo}">${ic('alert')}${{ quiebre: `Se queda sin stock en ${it.alertaStock.dias} días: reponé ya o subí el precio para estirarlo.`, reponer: `Stock para ${it.alertaStock.dias} días: planificá la reposición.`, inmovilizado: `Stock para ${it.alertaStock.dias} días: capital inmovilizado. Evaluá una promo o una baja de precio.`, sin_rotacion: 'Tiene stock y visitas pero no vendió en 28 días.' }[it.alertaStock.tipo]}</p>` : ''}
        </section>
        <section class="tk-card">
          <div class="tk-card-head"><h3>Cambios de precio ${ayuda(AYUDA.cambios)}</h3><span class="mono tk-count">${it.eventosPrecio.length}</span></div>
          ${it.eventosPrecio.length ? `<div class="tk-table-wrap"><table class="tk-table tk-events">
            <thead><tr><th>Fecha</th><th class="r">Precio</th><th class="r">Conversión</th><th class="r">Ventas/día</th><th>Efecto</th></tr></thead>
            <tbody>${it.eventosPrecio.slice().reverse().map(e => `<tr>
              <td class="mono">${fecha(e.dia)}</td>
              <td class="r num">${plata(e.precioAntes)} → ${plata(e.precioDespues)} <small>${e.cambio > 0 ? '+' : ''}${Math.round(e.cambio * 100)}%</small></td>
              <td class="r num">${pct(e.conversionAntes)} → ${pct(e.conversionDespues)}</td>
              <td class="r num">${e.unidadesDiaAntes.toFixed(1)} → ${e.unidadesDiaDespues.toFixed(1)}</td>
              <td>${{ sin_efecto: '<span class="tk-chip" data-tono="ok">No movió la conversión</span>', bajo_conversion: '<span class="tk-chip" data-tono="bad">Bajó la conversión</span>', subio_conversion: '<span class="tk-chip" data-tono="ok">Subió la conversión</span>', sin_datos: '<span class="tk-chip" data-tono="muted">Pocos datos</span>' }[e.efecto]}</td>
            </tr>`).join('')}</tbody></table></div>
            <p class="tk-foot">Compara hasta 21 días antes y después de cada cambio. Así sabés cuánto aguanta esta publicación una suba.</p>`
            : `<p class="tk-none">Sin cambios de precio en los últimos ${serie.length} días${d.demo ? '' : ' (el historial de precio se completa día a día desde que vinculaste la cuenta, y con el precio de cada venta)'}.</p>`}
        </section>
      </div>

      <div class="tk-grid2 is-even">
        <section class="tk-card">
          <div class="tk-card-head"><h3>Rentabilidad ${ayuda(AYUDA.rentabilidad)}</h3></div>
          ${rentItem(it)}
        </section>
        <section class="tk-card">
          <div class="tk-card-head"><h3>Calidad según Mercado Libre ${ayuda(AYUDA.calidad)}</h3>${it.calidad ? `<span class="tk-score is-sm" data-tono="${it.calidad.score >= 80 ? 'ok' : it.calidad.score >= 60 ? 'warn' : 'bad'}"><b class="num">${it.calidad.score}</b></span>` : ''}</div>
          ${!it.calidad ? '<p class="tk-none">Sin datos de calidad todavía.</p>'
            : it.calidad.faltan?.length ? `<p class="tk-sub">Nivel <b>${esc(it.calidad.nivel)}</b>. Para subir el puntaje:</p><ul class="tk-q-todo">${it.calidad.faltan.map(f => `<li><span class="tk-q-group">${esc(f.grupo)}</span>${esc(f.titulo)}${f.detalle?.length ? `<small>${f.detalle.map(esc).join(' · ')}</small>` : ''}</li>`).join('')}</ul>`
            : `<p class="tk-ok">${ic('check')} Nivel ${esc(it.calidad.nivel)}: no le falta nada.</p>`}
        </section>
      </div>
      ${it.catalog_listing ? `<section class="tk-card" id="tk-comp">
        <div class="tk-card-head"><h3>Competencia en el catálogo ${ayuda(AYUDA.competencia)}</h3><button type="button" class="btn-secondary cp-sm" id="tk-comp-btn">${ic('users')}Ver competidores</button></div>
        <div id="tk-comp-body"><p class="tk-sub">Consulta en vivo a Mercado Libre quién más vende este producto, a qué precio y con qué envío.</p></div>
      </section>` : ''}`;

    $('tk-back').addEventListener('click', volver);
    $('tk-comp-btn')?.addEventListener('click', () => competencia(it));
    const ci = document.querySelector('.tk-costo-item');
    ci?.addEventListener('keydown', e => { if (e.key === 'Enter') ci.nextElementSibling?.click(); });
    ci?.nextElementSibling?.addEventListener('click', async () => {
      if (S.cuenta === 'demo') { toastTk('En la cuenta demo los costos no se guardan'); return; }
      try { await apiJson('costos', { cuenta: S.cuenta, costos: { [it.id]: ci.value === '' ? null : Number(ci.value) } }); toastTk('Costo guardado'); S.datos = null; abrirItem(it.id); }
      catch (e) { toastTk(e.message); }
    });
    activarTooltip($('tk-chart-item'), serie, true);
    root.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => {
      S.modo = b.dataset.m;
      root.querySelectorAll('[data-m]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $('tk-chart-item').innerHTML = grafico(serie, { modo: S.modo, precio: true, eventos: it.eventosPrecio }).html;
      root.querySelector('.tk-legend').firstChild.nextSibling.textContent = { visitas: 'Visitas por día', ventas: 'Ventas por día', conversion: 'Conversión (promedio de 7 días)' }[S.modo];
      activarTooltip($('tk-chart-item'), serie, true);
    }));
  }

  function rentItem(it) {
    const R = it.rentabilidad;
    if (!R) return '<p class="tk-none">Sin precio.</p>';
    const fila = (k, v, cls = '') => `<div class="${cls}"><dt>${k}</dt><dd class="num">${v}</dd></div>`;
    return `<dl class="tk-waterfall">
      ${fila('Precio', plata(it.price))}
      ${fila(`Comisión ${R.comisionPct != null ? '(' + pct(R.comisionPct / 100) + (R.tipo ? ', ' + esc(R.tipo) : '') + ')' : ''}`, R.comision == null ? 'sin dato' : '− ' + plata(R.comision))}
      ${fila(R.envioGratis ? 'Envío gratis (lista)' : 'Envío (lo paga el comprador)', R.envio == null ? 'sin dato' : '− ' + plata(R.envio))}
      ${fila(`Impuestos (${String(R.impuestosPct).replace('.', ',')}%)`, '− ' + plata(R.impuestos))}
      <div><dt>Costo del producto</dt><dd><span class="tk-inline-cost"><input class="tk-costo tk-costo-item" type="number" min="0" step="1" inputmode="numeric" value="${R.costo ?? ''}" placeholder="Cargar" aria-label="Costo unitario"><button type="button" class="btn-secondary cp-sm">Guardar</button></span></dd></div>
      ${R.completo ? fila('Margen por unidad', `${plata(R.margen)} <small>${pct(R.margenPct)}</small>`, 'is-total' + (R.margen < 0 ? ' is-bad' : '')) : ''}
    </dl>
    ${R.completo ? `<p class="tk-sub">ACOS máximo para Product Ads: <b>${pct(R.acosEquilibrio)}</b>. Precio mínimo sin perder: <b>${plata(R.precioEquilibrio)}</b>. Ganancia en 28 días: <b>${plata(R.ganancia)}</b>.</p>`
      : '<p class="tk-sub">Cargá el costo del producto para ver el margen, el ACOS máximo y el precio mínimo.</p>'}`;
  }

  async function competencia(it) {
    const body = $('tk-comp-body'), btn = $('tk-comp-btn');
    btn.disabled = true; body.innerHTML = '<p class="tk-sub">Consultando…</p>';
    try {
      const d = await api(`action=competencia&cuenta=${encodeURIComponent(S.cuenta)}&id=${encodeURIComponent(it.id)}`);
      if (!d.vendedores.length) { body.innerHTML = '<p class="tk-none">No hay otros vendedores en este catálogo.</p>'; return; }
      const min = Math.min(...d.vendedores.map(v => v.precio));
      body.innerHTML = `<div class="tk-table-wrap"><table class="tk-table">
        <thead><tr><th>#</th><th>Vendedor</th><th class="r">Precio</th><th>Envío</th><th>Reputación</th></tr></thead>
        <tbody>${d.vendedores.map(v => `<tr class="${v.propio ? 'is-own' : ''}"><td class="mono">${v.posicion}</td><td><strong>${esc(v.vendedor)}</strong>${v.propio ? ' <span class="tk-chip" data-tono="accent">Vos</span>' : ''}${v.tiendaOficial ? ' <span class="tk-chip" data-tono="neutral">Tienda oficial</span>' : ''}</td>
          <td class="r"><span class="num">${plata(v.precio)}</span><small class="tk-sub2">${v.precio === min ? 'el más barato' : '+' + pct(v.precio / min - 1, 0) + ' vs. el más barato'}</small></td>
          <td>${v.full ? '<span class="tk-chip" data-tono="ok">Full</span> ' : ''}${v.envioGratis ? 'Gratis' : 'A cargo del comprador'}</td>
          <td>${esc(repTxt(v.reputacion, v.medalla).replace('Reputación ', '')) || '—'}</td></tr>`).join('')}</tbody></table></div>
        <p class="tk-foot">${d.total} vendedores en el catálogo${d.demo ? ' (datos simulados)' : ''}.</p>`;
    } catch (e) { body.innerHTML = error(e.message); btn.disabled = false; }
  }

  function volver() { S.item = null; S.pedido++; if (S.datos) { renderCuenta(); } else cargarCuenta(); }

  // ── Cuentas (sección "Cuentas" del panel) ──
  async function cuentas() {
    const box = $('tk-cuentas'); if (!box) return;
    try {
      const d = await api('action=cuentas');
      S.cuentas = d.cuentas; S.clases = d.clases;
      const reales = d.cuentas.filter(c => !c.demo);
      box.innerHTML = reales.length ? reales.map(c => `
        <div class="cp-item tk-acc">
          <span class="tk-noimg" aria-hidden="true">${esc((c.nickname || '?').slice(0, 1))}</span>
          <div>
            <strong>${esc(c.nickname)} ${c.principal ? '<span class="cp-tag is-hl">Tu cuenta</span>' : '<span class="cp-tag">Cliente</span>'}</strong>
            <small>${c.status === 'ok' ? `Actualizada ${hace(c.ultimaSync)}` : '<span class="tk-bad">Perdió el acceso: hay que volver a vincularla</span>'}${c.preguntasSinResponder ? ` · ${c.preguntasSinResponder} preguntas sin responder` : ''}</small>
          </div>
          <div class="cp-msg-actions">
            <button type="button" class="btn-secondary cp-sm" data-ver="${esc(c.id)}">${ic('chart')}Ver</button>
            ${c.principal ? '' : `<button type="button" class="btn-secondary cp-sm cp-danger" data-quitar="${esc(c.id)}" data-nick="${esc(c.nickname)}">${ic('trash')}Desvincular</button>`}
          </div>
        </div>`).join('') : '<p class="cp-empty">Todavía no hay cuentas vinculadas.</p>';
      box.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => { S.cuenta = b.dataset.ver; S.item = null; localStorageSet('tk-cuenta', S.cuenta); document.querySelector('.cp-nav a[data-s="tracker"]')?.click(); }));
      box.querySelectorAll('[data-quitar]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm(`¿Desvincular ${b.dataset.nick}? Se borran también sus datos guardados.`)) return;
        try { await api('action=desvincular&id=' + encodeURIComponent(b.dataset.quitar), 'POST'); S.cuentas = []; cuentas(); } catch (e) { toastTk(e.message); }
      }));
    } catch (e) { box.innerHTML = error(e.message); }
  }

  async function invitar() {
    const out = $('tk-invite');
    try {
      const d = await api('action=invitar');
      out.hidden = false;
      out.innerHTML = `<div class="cp-inline"><input id="tk-invite-url" readonly value="${esc(d.url)}" aria-label="Link para el cliente"><button type="button" class="btn-secondary" id="tk-invite-copy">${ic('copy')}Copiar</button></div>
        <p class="cp-status">Vence en ${esc(d.vence)}. Tu cliente abre el link, entra con su usuario de Mercado Libre, acepta, y la cuenta aparece acá.</p>`;
      $('tk-invite-copy').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(d.url); toastTk('Link copiado'); } catch (e) { $('tk-invite-url').select(); }
      });
    } catch (e) { out.hidden = false; out.innerHTML = error(e.message); }
  }

  $('tk-invite-btn')?.addEventListener('click', invitar);

  window.DCTracker = { abrir, cuentas };
})();
