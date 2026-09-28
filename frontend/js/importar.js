/* ============================================================
   IMPORTAR.JS — Calculadora de importación a Mercado Libre (importar.html)
   Estática: lee data/importacion.json (alícuotas orientativas y caso de ejemplo) y calcula todo en el navegador.

   Modelo (por embarque, en USD y después en pesos):
     CIF = FOB + flete + seguro                      (valor en aduana)
     DI  = CIF × DI%        TE = CIF × TE%
     Base IVA = CIF + DI + TE
     IVA, IVA adicional, Ganancias, IIBB = Base IVA × alícuota
   Responsable inscripto: IVA e IVA adicional son crédito fiscal; Ganancias e IIBB, pagos a cuenta → no son costo.
   Monotributo / no inscripto: todo es costo, incluido el 21% de IVA de los gastos locales.
   Venta: si es RI, el precio y los cargos de Mercado Libre se toman sin IVA (débito y crédito se compensan).
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const form = $('im-form');
  if (!form) return;
  const F = form.elements;
  const IVA_ML = 0.21;          // los cargos de Mercado Libre se facturan con IVA 21%
  const IVA_LOCAL = 0.21;       // despachante, terminal y fletes locales
  let D = null, cat = null, ultimo = null;

  // ── Números en formato es-AR ──
  // Acepta "1.450", "4,20", "4.20", "1.450,5". Punto seguido de exactamente 3 dígitos = miles.
  function parse(v) {
    let s = String(v ?? '').trim().replace(/\s|\$|%|usd/gi, '');
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }
  const fmt = (n, d = 0) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const USD_IN = ['fob', 'flete_total', 'flete_kg', 'flete_cbm'];   // montos en dólares: siempre con centavos si los tienen
  const fmtIn = (n, name) => n.toLocaleString('es-AR', { minimumFractionDigits: USD_IN.includes(name) && !Number.isInteger(n) ? 2 : 0, maximumFractionDigits: 4 });
  const ars = (n, d = 0) => !Number.isFinite(n) ? '—' : (n < 0 ? '−$ ' : '$ ') + fmt(Math.abs(n), d);
  const usd = n => !Number.isFinite(n) ? '—' : 'USD ' + fmt(n, 2);
  const pct = (n, d = 1) => !Number.isFinite(n) ? '—' : fmt(n * 100, d).replace(/,0$/, '') + '%';
  const tasa = n => fmt(n, 2).replace(/,?0+$/, '') + '%';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const NUMS = ['fob', 'unidades', 'tc', 'flete_total', 'flete_kg', 'kg', 'flete_cbm', 'cbm', 'seguro', 'di', 'te', 'iva', 'iva_ad',
    'ganancias', 'iibb', 'despachante', 'locales', 'precio', 'comision', 'cuotas', 'envio', 'cargo_fijo', 'iibb_venta', 'margen_objetivo'];
  const TASAS = ['di', 'te', 'iva', 'iva_ad', 'ganancias', 'iibb'];

  function set(name, v) { const el = F[name]; if (el) el.value = typeof v === 'number' ? fmtIn(v, name) : v; }

  fetch('data/importacion.json').then(r => r.ok ? r.json() : Promise.reject()).then(data => {
    D = data;
    $('im-cat').innerHTML = D.categorias.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join('');
    const [a, m] = String(D.revisado || '').split('-');
    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    if (a && m) $('im-revisado').textContent = `(revisados en ${MESES[+m - 1]} de ${a})`;
    cargarEjemplo();
    calcular();
  }).catch(() => {
    $('im-sum').textContent = 'No se pudieron cargar las alícuotas. Recargá la página.';
  });

  function cargarEjemplo() {
    const e = D.ejemplo;
    set('producto', e.producto);
    ['fob', 'unidades', 'flete_total', 'flete_kg', 'kg', 'flete_cbm', 'cbm', 'seguro', 'despachante', 'locales', 'precio', 'cuotas', 'envio', 'cargo_fijo', 'margen_objetivo']
      .forEach(k => set(k, e[k]));
    set('tc', D.tipo_cambio_ejemplo);
    form.querySelector(`[name="flete_modo"][value="${e.flete_modo}"]`).checked = true;
    form.querySelector(`[name="tipo"][value="${e.tipo}"]`).checked = true;
    set('comision', D.mercadolibre[e.tipo === 'clasica' ? 'comision_clasica' : 'comision_premium']);
    set('iibb_venta', D.mercadolibre.iibb_venta);
    F.ri.checked = false;
    F.categoria.value = e.categoria;
    aplicarRubro();
    modoFlete();
  }

  function aplicarRubro() {
    cat = D.categorias.find(c => c.id === F.categoria.value) || D.categorias[0];
    TASAS.forEach(k => { set(k, cat[k]); F[k].removeAttribute('aria-invalid'); });
    marcarEditadas();
  }
  // Una alícuota distinta a la del rubro queda marcada (y el botón de restablecer tiene sentido)
  function marcarEditadas() {
    let alguna = false;
    TASAS.forEach(k => {
      const cambiada = cat && parse(F[k].value) !== cat[k];
      F[k].closest('.im-field').classList.toggle('is-edit', cambiada);
      alguna ||= cambiada;
    });
    $('im-reset').hidden = !alguna;
  }

  function modoFlete() {
    const modo = form.querySelector('[name="flete_modo"]:checked')?.value || 'total';
    form.querySelectorAll('[data-modo]').forEach(el => {
      const on = el.dataset.modo === modo;
      el.hidden = !on;
      el.querySelector('input').disabled = !on;
    });
  }

  function leer() {
    const v = {};
    NUMS.forEach(k => {
      const el = F[k]; if (!el) return;
      const n = parse(el.value);
      const malo = Number.isNaN(n) || n < 0;
      if (malo) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      v[k] = malo ? 0 : n;
    });
    v.modo = form.querySelector('[name="flete_modo"]:checked')?.value || 'total';
    v.ri = F.ri.checked;
    v.unidades = Math.floor(v.unidades);
    return v;
  }

  function modelo(v) {
    const r = { v };
    const p = x => x / 100;
    r.fob = v.fob * v.unidades;
    r.flete = v.modo === 'kg' ? v.flete_kg * v.kg : v.modo === 'cbm' ? v.flete_cbm * v.cbm : v.flete_total;
    r.seguro = (r.fob + r.flete) * p(v.seguro);
    r.cif = r.fob + r.flete + r.seguro;
    r.di = r.cif * p(v.di);
    r.te = r.cif * p(v.te);
    r.base = r.cif + r.di + r.te;
    r.iva = r.base * p(v.iva);
    r.ivaAd = r.base * p(v.iva_ad);
    r.gan = r.base * p(v.ganancias);
    r.iibb = r.base * p(v.iibb);
    const tc = v.tc;
    r.local = v.despachante + v.locales;
    r.ivaLocal = r.local * IVA_LOCAL;
    r.aCuentaArs = (r.iva + r.ivaAd + r.gan + r.iibb) * tc + r.ivaLocal;   // tributos recuperables para un RI
    r.costoTotal = r.base * tc + r.local + (v.ri ? 0 : r.aCuentaArs);
    r.costoU = v.unidades > 0 ? r.costoTotal / v.unidades : NaN;

    // Venta
    const kP = v.ri ? 1 / (1 + p(v.iva)) : 1;    // el precio lleva el IVA del producto
    const kML = v.ri ? 1 / (1 + IVA_ML) : 1;
    const c = p(v.comision) + p(v.cuotas), iv = p(v.iibb_venta);
    r.kP = kP; r.kML = kML;
    r.neto = v.precio * kP;
    r.ivaVenta = v.precio - r.neto;
    r.comision = v.precio * p(v.comision) * kML;
    r.cuotas = v.precio * p(v.cuotas) * kML;
    r.envio = v.envio * kML;
    r.fijo = v.cargo_fijo * kML;
    r.iibbVenta = r.neto * iv;
    r.ganU = r.neto - r.comision - r.cuotas - r.envio - r.fijo - r.iibbVenta - r.costoU;
    r.margen = r.neto > 0 ? r.ganU / r.neto : NaN;
    r.markup = r.costoU > 0 ? r.ganU / r.costoU : NaN;
    r.ganTotal = r.ganU * v.unidades;
    // Ganancia(P) = P·A − fijos  →  precio mínimo y precio para un margen objetivo sobre el ingreso neto
    const A = kP * (1 - iv) - c * kML;
    const fijos = (v.envio + v.cargo_fijo) * kML + r.costoU;
    r.pMin = A > 0 ? fijos / A : NaN;
    const B = A - p(v.margen_objetivo) * kP;
    r.pObj = B > 0 ? fijos / B : NaN;
    return r;
  }

  // ── Render ──
  let tAnuncio;
  function calcular() {
    if (!D) return;
    const v = leer(), r = modelo(v);
    ultimo = r;
    const listo = v.unidades > 0 && v.fob > 0 && v.tc > 0;
    const vende = listo && v.precio > 0;

    $('r-costo').textContent = listo ? ars(r.costoU) : '—';
    const g = $('r-gan');
    g.textContent = vende ? ars(r.ganU) : '—';
    g.dataset.tono = !vende ? '' : r.ganU >= 0 ? 'ok' : 'bad';
    $('r-margen').textContent = vende ? pct(r.margen) : '—';
    $('r-markup').textContent = vende ? pct(r.markup) : '—';
    $('r-u').textContent = listo ? `(${fmt(v.unidades)} u.)` : '';
    $('r-total').textContent = vende ? ars(r.ganTotal) : '—';
    $('r-total').dataset.tono = !vende ? '' : r.ganTotal >= 0 ? 'ok' : 'bad';
    $('r-min').textContent = listo ? (Number.isFinite(r.pMin) ? ars(Math.ceil(r.pMin)) : 'Con estas comisiones no hay precio que alcance') : '—';
    $('r-sug').textContent = listo ? (Number.isFinite(r.pObj) ? ars(Math.ceil(r.pObj)) : 'No alcanzable con estas comisiones') : '—';

    const adel = $('r-adel');
    adel.hidden = !(listo && v.ri);
    if (v.ri && listo) adel.innerHTML = `Además adelantás <b>${ars(r.aCuentaArs)}</b> en IVA y percepciones (${ars(r.aCuentaArs / v.unidades)} por unidad). No es costo, pero es plata que necesitás tener hasta recuperarla.`;

    let sum;
    if (!listo) sum = 'Completá el costo FOB, las unidades y el dólar para ver el resultado.';
    else if (!vende) sum = `Cada unidad te cuesta ${ars(r.costoU)} puesta en tu depósito. Cargá el precio de venta para ver cuánto te queda.`;
    else if (r.ganU >= 0) sum = `Cada unidad te cuesta ${ars(r.costoU)} puesta en tu depósito. Vendiéndola a ${ars(v.precio)} te quedan ${ars(r.ganU)}: un margen de ${pct(r.margen)}.`;
    else sum = `Cada unidad te cuesta ${ars(r.costoU)} puesta en tu depósito. A ${ars(v.precio)} perdés ${ars(-r.ganU)} por unidad${Number.isFinite(r.pMin) ? `: para no perder necesitás venderla a ${ars(Math.ceil(r.pMin))} o más` : ''}.`;
    const s = $('im-sum');
    s.dataset.tono = vende ? (r.ganU >= 0 ? 'ok' : 'bad') : '';
    // El texto se actualiza al instante; el anuncio al lector de pantalla, cuando dejás de escribir
    s.setAttribute('aria-live', 'off');
    s.textContent = sum;
    clearTimeout(tAnuncio);
    tAnuncio = setTimeout(() => { s.setAttribute('aria-live', 'polite'); s.textContent = ''; s.textContent = sum; }, 900);

    tablaCosto(v, r, listo);
    tablaVenta(v, r, vende);
    dock(v, r, vende);
  }

  function fila(concepto, detalle, total, unidad, cls = '', tag = '') {
    return `<tr class="${cls}"><th scope="row">${concepto}${tag}${detalle ? `<small>${detalle}</small>` : ''}</th><td>${total}</td>${unidad === null ? '' : `<td>${unidad}</td>`}</tr>`;
  }

  function tablaCosto(v, r, listo) {
    const tc = v.tc, u = v.unidades || NaN;
    const A = (usdN) => [ars(usdN * tc), listo ? ars(usdN * tc / u) : '—'];
    const tag = v.ri ? '<span class="im-tag" data-t="cuenta">a cuenta</span>' : '<span class="im-tag">costo</span>';
    const modo = v.modo === 'kg' ? `${fmt(v.kg, 1)} kg × ${usd(v.flete_kg)}` : v.modo === 'cbm' ? `${fmt(v.cbm, 2)} m³ × ${usd(v.flete_cbm)}` : 'Total cotizado';
    const rows = [
      fila('Mercadería (FOB)', `${fmt(v.unidades)} u. × ${usd(v.fob)} = ${usd(r.fob)}`, ...A(r.fob)),
      fila('Flete internacional', `${modo} = ${usd(r.flete)}`, ...A(r.flete)),
      fila('Seguro', `${tasa(v.seguro)} sobre FOB + flete = ${usd(r.seguro)}`, ...A(r.seguro)),
      fila('Valor en aduana (CIF)', usd(r.cif), ...A(r.cif), 'is-sub'),
      fila('Derecho de importación', `${tasa(v.di)} sobre CIF`, ...A(r.di)),
      fila('Tasa de estadística', `${tasa(v.te)} sobre CIF`, ...A(r.te)),
      fila('IVA', `${tasa(v.iva)} sobre CIF + DI + tasa`, ...A(r.iva), v.ri ? 'is-cuenta' : '', tag),
      fila('IVA adicional', `${tasa(v.iva_ad)} sobre la misma base`, ...A(r.ivaAd), v.ri ? 'is-cuenta' : '', tag),
      fila('Percepción de Ganancias', `${tasa(v.ganancias)} sobre la misma base`, ...A(r.gan), v.ri ? 'is-cuenta' : '', tag),
      fila('Percepción de Ingresos Brutos', `${tasa(v.iibb)} sobre la misma base`, ...A(r.iibb), v.ri ? 'is-cuenta' : '', tag),
      fila('Despachante', 'Sin IVA', ars(v.despachante), listo ? ars(v.despachante / u) : '—'),
      fila('Terminal, depósito y flete local', 'Sin IVA', ars(v.locales), listo ? ars(v.locales / u) : '—'),
      fila('IVA de los gastos locales', '21%', ars(r.ivaLocal), listo ? ars(r.ivaLocal / u) : '—', v.ri ? 'is-cuenta' : '', tag),
    ];
    $('tb-costo').innerHTML = `
      <caption class="sr-only">Desglose del costo de importación, total del embarque y por unidad</caption>
      <thead><tr><th scope="col">Concepto</th><th scope="col">Embarque</th><th scope="col">Por unidad</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
      <tfoot>${fila('Costo puesto en tu depósito', v.ri ? 'Sin los tributos a cuenta' : 'Incluye todos los tributos', ars(r.costoTotal), listo ? ars(r.costoU) : '—', 'is-total')}
      ${v.ri ? fila('Plata que adelantás y recuperás', 'IVA, IVA adicional y percepciones', ars(r.aCuentaArs), listo ? ars(r.aCuentaArs / u) : '—', 'is-cuenta') : ''}</tfoot>`;
  }

  function tablaVenta(v, r, vende) {
    const d = x => vende ? ars(x) : '—';
    const neg = x => vende ? ars(-x) : '—';
    $('t-venta-sub').innerHTML = v.ri
      ? 'Como sos RI, todo va sin IVA: el IVA que cobrás en la venta se compensa con el de la importación y el de las comisiones.'
      : 'Sin IVA discriminado: lo que pagás de IVA en cada paso es costo. Es la ganancia antes del impuesto a las ganancias.';
    const rows = [
      fila('Precio de venta', v.ri ? 'Con IVA, lo que paga el comprador' : 'Lo que paga el comprador', d(v.precio), null, 'is-sub'),
      v.ri ? fila('IVA de la venta', `${tasa(v.iva)} incluido en el precio`, neg(r.ivaVenta), null) : '',
      fila(`Comisión ${form.querySelector('[name="tipo"]:checked')?.value === 'clasica' ? 'clásica' : 'premium'}`, `${tasa(v.comision)} del precio${v.ri ? ', sin IVA' : ''}`, neg(r.comision), null),
      v.cuotas ? fila('Cuotas sin interés', `${tasa(v.cuotas)} del precio${v.ri ? ', sin IVA' : ''}`, neg(r.cuotas), null) : '',
      fila('Envío', v.ri ? 'Sin IVA' : '', neg(r.envio), null),
      v.cargo_fijo ? fila('Cargo fijo', v.ri ? 'Sin IVA' : '', neg(r.fijo), null) : '',
      fila('Ingresos Brutos', `${tasa(v.iibb_venta)} de la venta${v.ri ? ' sin IVA' : ''}`, neg(r.iibbVenta), null),
      fila('Costo puesto en tu depósito', '', neg(r.costoU), null),
    ];
    $('tb-venta').innerHTML = `
      <caption class="sr-only">Qué queda de cada venta en Mercado Libre</caption>
      <thead><tr><th scope="col">Concepto</th><th scope="col">Por unidad</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
      <tfoot><tr class="is-total" data-tono="${vende ? (r.ganU >= 0 ? 'ok' : 'bad') : ''}"><th scope="row">Ganancia por unidad<small>Margen ${vende ? pct(r.margen) : '—'} · markup ${vende ? pct(r.markup) : '—'}</small></th><td>${d(r.ganU)}</td></tr></tfoot>`;
  }

  // ── Resumen fijo en celular: visible mientras completás el formulario ──
  const dockEl = $('im-dock');
  function dock(v, r, vende) {
    if (!dockEl) return;
    dockEl.querySelector('b').textContent = vende ? ars(r.ganU) : '—';
    dockEl.querySelector('b').dataset.tono = !vende ? '' : r.ganU >= 0 ? 'ok' : 'bad';
    dockEl.querySelector('small').textContent = vende ? `ganancia por unidad · ${pct(r.margen)}` : 'ganancia por unidad';
  }
  if (dockEl && 'IntersectionObserver' in window) {
    let formVisible = false, resVisible = false;
    const upd = () => dockEl.classList.toggle('is-on', formVisible && !resVisible);
    new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; upd(); }, { rootMargin: '-30% 0px -30% 0px' }).observe(form);
    const vistos = new Set();
    const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target)); resVisible = vistos.size > 0; upd(); });
    io.observe($('resultado')); io.observe($('desglose'));
  }

  // ── Eventos ──
  form.addEventListener('input', e => {
    if (TASAS.includes(e.target.name)) marcarEditadas();
    calcular();
  });
  $('im-obj').addEventListener('input', calcular);
  form.addEventListener('change', e => {
    const n = e.target.name;
    if (n === 'categoria') aplicarRubro();
    if (n === 'flete_modo') modoFlete();
    if (n === 'tipo' && D) set('comision', D.mercadolibre[e.target.value === 'clasica' ? 'comision_clasica' : 'comision_premium']);
    calcular();
  });
  // Al salir de un campo, el número queda escrito en formato argentino
  document.addEventListener('focusout', e => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement) || !NUMS.includes(el.name)) return;
    const n = parse(el.value);
    if (el.value.trim() && Number.isFinite(n) && n >= 0) el.value = fmtIn(n, el.name);
  });
  $('im-reset').addEventListener('click', () => { aplicarRubro(); calcular(); });
  form.addEventListener('submit', e => e.preventDefault());

  // Para el CTA: el producto viaja al formulario de contacto
  $('im-cta')?.addEventListener('click', e => {
    const prod = F.producto.value.trim();
    if (prod) e.currentTarget.href = `contacto.html?asunto=importacion&producto=${encodeURIComponent(prod.slice(0, 80))}`;
  });

  // Exponer para pruebas (consola / Playwright)
  window.__importar = { parse, modelo, leer, ultimo: () => ultimo };
})();
