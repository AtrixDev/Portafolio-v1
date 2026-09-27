/* ============================================================
   SIMULADOR.JS — Conecta cada [data-sim] con el algoritmo de DCScore
   ============================================================ */

(function () {
  if (!window.DCScore) return;

  document.querySelectorAll('[data-sim]').forEach(sim => {
    const inputs = {};
    sim.querySelectorAll('[data-sim-in]').forEach(el => { inputs[el.dataset.simIn] = el; });
    const outs = {};
    sim.querySelectorAll('[data-sim-out]').forEach(el => { outs[el.dataset.simOut] = el; });
    const numEl  = sim.querySelector('[data-sim-score]');
    const bandEl = sim.querySelector('[data-sim-band]');
    const tipEl  = sim.querySelector('[data-sim-tip]');
    const arc    = sim.querySelector('.sim-arc');
    const initial = Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.type === 'checkbox' ? el.checked : el.value]));
    let shown = 0, anim = null;

    const item = () => ({
      pictures: new Array(+inputs.fotos.value).fill(''),
      title: 'x'.repeat(+inputs.titulo.value),
      descripcion: inputs.descripcion.checked ? 'x'.repeat(80) : '',
      available_quantity: inputs.stock.checked ? 12 : 0,
      status: inputs.activa.checked ? 'active' : 'paused',
      attributes: new Array(inputs.atributos.checked ? 8 : 1).fill({}),
      warranty: inputs.garantia.checked ? '6 meses' : null,
    });

    function countTo(target) {
      cancelAnimationFrame(anim);
      if (prefersReducedMotion) { numEl.textContent = target; shown = target; return; }
      const from = shown, t0 = performance.now(), dur = 420;
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        shown = Math.round(from + (target - from) * e);
        numEl.textContent = shown;
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }

    function update() {
      for (const k of ['fotos', 'titulo']) {
        const el = inputs[k];
        if (outs[k]) outs[k].textContent = el.value + (k === 'titulo' ? ' car.' : '');
        el.style.setProperty('--p', `${(el.value - el.min) / (el.max - el.min) * 100}%`);
      }
      const it = item();
      const r = DCScore.score(it);
      const plan = DCScore.plan(it, r.score, r.problemas, r.mejoras);
      const band = DCScore.band(r.score);
      sim.dataset.tone = band.tone;
      bandEl.textContent = band.label;
      arc.style.strokeDashoffset = String(100 - r.score);
      countTo(r.score);
      const a = plan.acciones[0];
      tipEl.innerHTML = a
        ? `<strong>Próxima acción:</strong> ${esc(a.titulo)} <span class="pts">+${a.impacto_pts} pts</span>`
        : '<strong>Publicación óptima.</strong> No hay acciones pendientes: a cuidar el stock y el precio.';
    }

    Object.values(inputs).forEach(el => el.addEventListener('input', update));
    sim.querySelector('[data-sim-reset]')?.addEventListener('click', () => {
      Object.entries(initial).forEach(([k, v]) => { const el = inputs[k]; el.type === 'checkbox' ? (el.checked = v) : (el.value = v); });
      update();
    });

    // Arranca cuando entra en pantalla, para que se vea el gauge llenarse
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { update(); io.disconnect(); } }, { threshold: .35 });
      io.observe(sim);
    } else update();
  });
})();
