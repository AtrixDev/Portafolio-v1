/* ============================================================
   PERDIDA.JS — ¿Cuánta plata estás perdiendo? (perdida.html)
   Estática: todo se calcula en el navegador. Porcentajes sobre las ventas por Product Ads.

   Modelo:
     ACOS actual        = inversión ÷ ventas por publicidad
     ACOS máximo        = margen − comisión            (el que deja ganancia cero)
     ACOS para ganar X  = margen − comisión − X
     Gasto de más / mes = ventas × (ACOS actual − ACOS objetivo), si es positivo
     Ganancia hoy       = ventas × (margen − comisión − ACOS actual)
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const form = $('pd-form');
  if (!form) return;
  const F = form.elements;
  const EJEMPLO = { ventas: 3000000, acos: 30, inversion: 900000, margen: 45, comision: 14, objetivo: 15, ganar: 10 };
  const NUMS = Object.keys(EJEMPLO);
  let ultimo = null;

  // ── Números en formato es-AR (igual que la calculadora de importación) ──
  function parse(v) {
    let s = String(v ?? '').trim().replace(/\s|\$|%/g, '');
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }
  const fmt = (n, d = 0) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtIn = n => n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
  const ars = n => !Number.isFinite(n) ? '—' : (n < 0 ? '−$ ' : '$ ') + fmt(Math.abs(Math.round(n)));
  const pct = n => !Number.isFinite(n) ? '—' : (n < 0 ? '−' : '') + fmt(Math.abs(n), 1).replace(/,0$/, '') + '%';

  NUMS.forEach(k => { F[k].value = fmtIn(EJEMPLO[k]); });

  const modo = () => form.querySelector('[name="modo"]:checked')?.value || 'acos';
  function modoCampo() {
    const m = modo();
    form.querySelectorAll('[data-modo]').forEach(el => { el.hidden = el.dataset.modo !== m; el.querySelector('input').disabled = el.hidden; });
  }

  function leer() {
    const v = {};
    NUMS.forEach(k => {
      const el = F[k];
      if (el.disabled) return;
      const n = parse(el.value), vacio = !el.value.trim();
      const malo = !vacio && (Number.isNaN(n) || n < 0 || (k !== 'ventas' && k !== 'inversion' && n > 100));
      if (malo) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      v[k] = malo || vacio ? NaN : n;
    });
    v.modo = modo();
    return v;
  }

  function modelo(v) {
    const r = { v };
    r.acos = v.modo === 'acos' ? v.acos / 100 : v.ventas > 0 ? v.inversion / v.ventas : NaN;
    r.inversion = v.ventas * r.acos;
    r.max = (v.margen - v.comision) / 100;
    r.paraGanar = r.max - v.ganar / 100;
    r.obj = v.objetivo / 100;
    r.deMas = Math.max(0, v.ventas * (r.acos - r.obj));
    r.anio = r.deMas * 12;
    r.ganHoy = v.ventas * (r.max - r.acos);
    r.ganObj = v.ventas * (r.max - r.obj);
    return r;
  }

  // ── Render ──
  let tAnuncio;
  function calcular() {
    const v = leer(), r = modelo(v);
    ultimo = r;
    const listo = v.ventas > 0 && Number.isFinite(r.acos) && Number.isFinite(r.obj);
    const conMargen = Number.isFinite(r.max);
    const big = $('pd-big');

    $('r-mes').textContent = listo ? ars(r.deMas) : '—';
    $('r-anio').textContent = listo ? `por mes · ${ars(r.anio)} por año` : 'por mes';
    big.dataset.cero = listo && r.deMas === 0 ? '1' : '';
    $('r-big-k').textContent = listo && r.deMas === 0 ? 'Ya estás en tu objetivo o por debajo' : 'Estás gastando de más';

    $('r-max').textContent = conMargen ? pct(r.max * 100) : '—';
    $('r-max').dataset.tono = conMargen ? (r.max > 0 ? '' : 'bad') : '';
    $('r-x').textContent = Number.isFinite(v.ganar) ? pct(v.ganar) : '—';
    $('r-obj').textContent = conMargen && Number.isFinite(r.paraGanar) ? (r.paraGanar > 0 ? pct(r.paraGanar * 100) : 'No alcanza') : '—';
    const hoy = $('r-hoy');
    hoy.textContent = listo && conMargen ? (r.ganHoy >= 0 ? `ganás ${ars(r.ganHoy)} por mes` : `perdés ${ars(-r.ganHoy)} por mes`) : '—';
    hoy.dataset.tono = listo && conMargen ? (r.ganHoy >= 0 ? 'ok' : 'bad') : '';

    let sum;
    if (!listo) sum = 'Completá las ventas por publicidad, tu ACOS (o tu inversión) y el objetivo para ver el resultado.';
    else if (!conMargen) sum = `Con un ACOS de ${pct(r.acos * 100)} invertís ${ars(r.inversion)} por mes. Cargá el margen y la comisión para saber si esa publicidad te deja plata.`;
    else if (r.max <= 0) sum = `Con ese margen y esa comisión, cada venta ya pierde plata antes de la publicidad. El problema es el precio o el costo, no el ACOS.`;
    else if (r.ganHoy < 0) sum = `Tu ACOS de ${pct(r.acos * 100)} está arriba del máximo rentable (${pct(r.max * 100)}): cada venta por publicidad te hace perder plata. ${r.deMas > 0 ? `Bajándolo a ${pct(v.objetivo)} dejás de gastar ${ars(r.deMas)} por mes.` : ''}`;
    else if (r.deMas > 0) sum = `Ganás plata con la publicidad, pero menos de la que podrías. Con un ACOS de ${pct(v.objetivo)} te ahorrás ${ars(r.deMas)} por mes vendiendo lo mismo.`;
    else sum = `Tu ACOS ya está en el objetivo o por debajo. Con estos números, la publicidad te deja ${ars(r.ganHoy)} por mes.`;
    if (listo && conMargen && r.max > 0 && r.obj > r.max) sum += ` Ojo: con un objetivo de ${pct(v.objetivo)} seguirías perdiendo; apuntá a ${pct(r.max * 100)} o menos.`;
    const s = $('pd-sum');
    s.setAttribute('aria-live', 'off');
    s.textContent = sum;
    clearTimeout(tAnuncio);
    tAnuncio = setTimeout(() => { s.setAttribute('aria-live', 'polite'); s.textContent = ''; s.textContent = sum; }, 900);

    regla(v, r, listo, conMargen);
    pasos(v, r, listo, conMargen);
    dock(r, listo);
  }

  // Regla de ACOS: rojo = perdés, ámbar = ganás menos de lo que querés, verde = ganás lo que querés
  function regla(v, r, listo, conMargen) {
    const el = $('pd-rule');
    const top = Math.max(0.2, Math.ceil(Math.max(r.acos || 0, r.obj || 0, r.max || 0) * 1.25 * 20) / 20);
    const x = n => Math.min(100, Math.max(0, n / top * 100));
    el.style.setProperty('--z-gana', conMargen ? x(Math.max(0, r.paraGanar)) + '%' : '0%');
    el.style.setProperty('--z-cero', conMargen ? x(Math.max(0, r.max)) + '%' : '0%');
    el.classList.toggle('is-off', !conMargen);
    el.querySelector('[data-k="hoy"]').style.left = listo ? x(r.acos) + '%' : '0%';
    el.querySelector('[data-k="hoy"] em').textContent = listo ? `Hoy ${pct(r.acos * 100)}` : 'Hoy';
    el.querySelector('[data-k="obj"]').style.left = listo ? x(r.obj) + '%' : '0%';
    el.querySelector('[data-k="obj"] em').textContent = listo ? `Objetivo ${pct(v.objetivo)}` : 'Objetivo';
    // Las etiquetas de los extremos no se salen de la regla
    el.querySelectorAll('.pd-mk').forEach(mk => { const p = parseFloat(mk.style.left); mk.querySelector('em').style.transform = `translateX(${p < 15 ? -8 : p > 85 ? -92 : -50}%)`; });
    el.hidden = !listo;
    el.nextElementSibling.hidden = !listo || !conMargen;
    $('r-scale-max').textContent = pct(top * 100);
  }

  function pasos(v, r, listo, conMargen) {
    const P = [];
    if (listo) {
      P.push(['Tu ACOS de hoy', pct(r.acos * 100), v.modo === 'acos'
        ? `Con ${ars(v.ventas)} vendidos por publicidad, un ACOS de ${pct(r.acos * 100)} es invertir ${ars(r.inversion)} por mes.`
        : `${ars(v.inversion)} invertidos ÷ ${ars(v.ventas)} vendidos. De cada $100 que vendés con publicidad, ${ars(r.acos * 100)} se van en publicidad.`]);
      P.push(['Gasto de más', `${ars(r.deMas)} por mes`, r.deMas > 0
        ? `${ars(v.ventas)} × (${pct(r.acos * 100)} − ${pct(v.objetivo)}). Es lo que dejarías de gastar con un ACOS de ${pct(v.objetivo)}, vendiendo lo mismo. En un año: ${ars(r.anio)}.`
        : `Tu ACOS ya está en ${pct(v.objetivo)} o menos: con este objetivo no hay gasto de más.`]);
    }
    if (conMargen) {
      P.push(['ACOS máximo rentable', pct(r.max * 100), r.max > 0
        ? `${pct(v.margen)} de margen − ${pct(v.comision)} de comisión. Es lo que te queda de cada venta antes de la publicidad: si el ACOS llega a ${pct(r.max * 100)}, la publicidad se come toda la ganancia y quedás en cero.`
        : `${pct(v.margen)} de margen − ${pct(v.comision)} de comisión da ${pct(r.max * 100)}: la venta ya pierde antes de la publicidad. Primero hay que revisar precio o costo.`]);
      if (Number.isFinite(r.paraGanar)) P.push([`ACOS para ganar ${pct(v.ganar)}`, r.paraGanar > 0 ? pct(r.paraGanar * 100) : 'No alcanza', r.paraGanar > 0
        ? `${pct(r.max * 100)} − ${pct(v.ganar)}. Con un ACOS de ${pct(r.paraGanar * 100)} o menos te queda limpio un ${pct(v.ganar)} de cada venta por publicidad${v.ventas > 0 ? `: ${ars(v.ventas * v.ganar / 100)} por mes` : ''}.`
        : `Querés ganar ${pct(v.ganar)}, pero antes de la publicidad te queda ${pct(r.max * 100)}. Ni con ACOS cero llegás: bajá la meta o revisá precio y costo.`]);
      if (listo) P.push(['Lo que te deja hoy la publicidad', `${r.ganHoy >= 0 ? '' : '−'}${ars(Math.abs(r.ganHoy))} por mes`,
        `${ars(v.ventas)} × (${pct(r.max * 100)} − ${pct(r.acos * 100)}). ${r.ganHoy >= 0 ? 'Es la ganancia de esas ventas después de pagar el producto, la comisión y la publicidad.' : 'Estás pagando para vender: cada venta por publicidad te cuesta más de lo que te deja.'}${Number.isFinite(r.obj) && r.ganObj > r.ganHoy ? ` Con el objetivo, serían ${ars(r.ganObj)}.` : ''}`]);
    }
    $('pd-steps').innerHTML = P.length
      ? P.map(([t, n, d]) => `<li><p class="pd-st-h"><span>${t}</span><b>${n}</b></p><p class="pd-st-d">${d}</p></li>`).join('')
      : '<li><p class="pd-st-d">Completá la calculadora para ver cada cuenta con tus números.</p></li>';
  }

  // ── Resumen fijo en celular (igual que en la calculadora de importación) ──
  const dockEl = $('pd-dock');
  function dock(r, listo) {
    dockEl.querySelector('b').textContent = listo ? ars(r.deMas) : '—';
  }
  if ('IntersectionObserver' in window) {
    let formVisible = false, resVisible = false;
    const upd = () => dockEl.classList.toggle('is-on', formVisible && !resVisible);
    new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; upd(); }, { rootMargin: '-30% 0px -30% 0px' }).observe(form);
    new IntersectionObserver(([e]) => { resVisible = e.isIntersecting; upd(); }).observe($('resultado'));
  }

  // ── Eventos ──
  form.addEventListener('input', calcular);
  form.addEventListener('change', e => {
    if (e.target.name === 'modo') {
      // Al cambiar de dato, el otro se completa con el mismo ACOS para no perder lo cargado
      const r = ultimo;
      if (e.target.value === 'inversion' && Number.isFinite(r?.inversion)) F.inversion.value = fmtIn(Math.round(r.inversion));
      if (e.target.value === 'acos' && Number.isFinite(r?.acos)) F.acos.value = fmtIn(Math.round(r.acos * 1000) / 10);
      modoCampo();
    }
    calcular();
  });
  document.addEventListener('focusout', e => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement) || !NUMS.includes(el.name)) return;
    const n = parse(el.value);
    if (el.value.trim() && Number.isFinite(n) && n >= 0) el.value = fmtIn(n);
  });
  form.addEventListener('submit', e => e.preventDefault());

  // El ACOS de hoy viaja al formulario de contacto
  $('pd-cta').addEventListener('click', e => {
    const a = ultimo?.acos;
    if (Number.isFinite(a) && a > 0 && a < 1) e.currentTarget.href = `contacto.html?asunto=acos&acos=${Math.round(a * 1000) / 10}`;
  });

  modoCampo();
  calcular();
  window.__perdida = { parse, modelo, leer, ultimo: () => ultimo };
})();
