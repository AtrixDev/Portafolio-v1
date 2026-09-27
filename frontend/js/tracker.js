/* ============================================================
   TRACKER.JS — Auditoría de publicaciones (tracker.html)
   Usa /api/audit (función serverless que lee la API oficial de ML).
   Si la auditoría en vivo no está disponible, ofrece la auditoría de
   ejemplo que calcula DCScore (score.js) en el navegador.
   ============================================================ */

const AUDIT_API  = '/api/audit';
const STATUS_API = '/api/ml?action=status';
let liveState = 'checking';   // 'checking' | 'ok' | 'off'

// ── Estado de la conexión con Mercado Libre (chip del hero) ──
(async function () {
  const el = document.getElementById('tk-status');
  if (!el) return;
  const text = el.querySelector('.tk-status-text');
  try {
    const res = await fetch(STATUS_API, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    liveState = data.linked ? 'ok' : 'off';
    text.textContent = data.linked ? 'Auditoría en vivo: conectada a Mercado Libre' : 'Auditoría en vivo en mantenimiento. Podés ver una auditoría de ejemplo.';
  } catch (e) {
    liveState = 'off';
    text.textContent = 'Auditoría en vivo no disponible ahora. Podés ver una auditoría de ejemplo.';
  }
  el.dataset.state = liveState;
})();

// ── Auditoría ──
(function () {
  const form       = document.getElementById('audit-form');
  const urlInput   = document.getElementById('audit-url');
  const btn        = document.getElementById('audit-btn');
  const btnLabel   = btn?.querySelector('span');
  const statusEl   = document.getElementById('audit-status');
  const resultArea = document.getElementById('audit-result-area');
  if (!form || !urlInput || !btn) return;

  const STEPS = [
    'Consultando la publicación en Mercado Libre',
    'Calculando el score de salud',
    'Armando el plan de acción',
  ];
  const impactTone = i => i === 'alto' ? 'bad' : i === 'medio' ? 'warn' : 'ok';

  function showError(html, withDemo) {
    statusEl.innerHTML = `<div class="audit-error" role="alert">${icon('alert')}<div><p>${html}</p>${withDemo
      ? `<button type="button" class="btn-secondary audit-demo-btn" data-demo>${icon('eye')}Ver auditoría de ejemplo</button>` : ''}</div></div>`;
    statusEl.querySelector('[data-demo]')?.addEventListener('click', showDemo);
  }

  function showDemo() {
    statusEl.innerHTML = '';
    renderResult(DCScore.auditar(DCScore.EJEMPLO), true);
  }

  function renderResult(d, demo = false) {
    const item = d.item   || {};
    const ai   = d.ai     || {};
    const chk  = d.checks || {};
    const sc   = Number(d.score ?? 0);
    const pot  = Number(ai.score_potencial ?? sc);
    const band = DCScore.band(sc);

    // ok: true = cumple, false = no cumple, null = no se pudo verificar
    const checks = [
      { ok: chk.fotos7,      txt: '7 fotos (secuencia completa)' },
      { ok: chk.fotoHero,    txt: 'Al menos 1 foto' },
      { ok: chk.titulo,      txt: 'Título de 40+ caracteres' },
      { ok: chk.descripcion, txt: 'Descripción presente' },
      { ok: chk.stock,       txt: 'Stock disponible' },
      { ok: chk.activa,      txt: 'Publicación activa' },
      { ok: chk.atributos,   txt: '5+ atributos cargados' },
      { ok: chk.garantia,    txt: 'Garantía especificada' },
    ];
    const acciones = (ai.acciones || []).slice(0, 5);
    const img  = safeUrl(item.pictures?.[0]);
    const link = safeUrl(item.permalink);
    const nFotos = Number(item.pictures_count ?? item.pictures?.length ?? 0);
    const ex = d.extras;
    const n = v => Number(v).toLocaleString('es-AR');
    const meta = [esc(d.mla_id)];
    if (!ex) meta.push(`${nFotos} fotos`);
    if (item.attributes_count != null) meta.push(`${Number(item.attributes_count)} atributos`);
    if (item.price) meta.push(`$${n(item.price)}`);
    if (ex?.visitas != null) meta.push(`${n(ex.visitas)} visitas`);
    if (ex?.preguntas != null) meta.push(`${n(ex.preguntas)} ${ex.preguntas === 1 ? 'pregunta' : 'preguntas'}`);
    if (ex?.opiniones != null) meta.push(ex.opiniones ? `${n(ex.opiniones)} opiniones (${Number(ex.rating).toFixed(1)}★)` : 'sin opiniones');

    resultArea.innerHTML = `
      <article class="ar" data-tone="${band.tone}" tabindex="-1" aria-label="Resultado de la auditoría">
        ${demo ? `<p class="ar-demo">${icon('eye')}<span><strong>Auditoría de ejemplo.</strong> Datos de la publicación del caso Borner cargados a mano, calculados con el mismo algoritmo que la auditoría en vivo.</span></p>` : ''}
        <div class="ar-head">
          <div class="ar-gauge" style="--s:${sc}">
            <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ar-track" cx="60" cy="60" r="52"/><circle class="ar-arc" cx="60" cy="60" r="52" pathLength="100"/></svg>
            <div class="ar-score"><span class="ar-num num">${sc}</span><span class="ar-band">${d.parcial ? 'Parcial' : band.label}</span></div>
          </div>
          <div class="ar-product">
            ${img ? `<img class="ar-img" src="${img}" alt="" width="84" height="84">` : ''}
            <div>
              <h2 class="ar-title">${esc(item.title) || 'Sin título'}</h2>
              <p class="ar-meta mono">${meta.join(' · ')}</p>
              ${link ? `<a class="link-arrow ar-link" href="${link}" target="_blank" rel="noopener">Ver en Mercado Libre ${icon('external')}</a>` : ''}
            </div>
          </div>
          ${pot > sc ? `<div class="ar-pot"><span class="ar-pot-k">Potencial</span><span class="ar-pot-v num">${sc} → <b>${pot}</b></span><span class="ar-pot-t">${esc(ai.tiempo_total || '')}</span></div>` : ''}
        </div>
        ${ai.resumen ? `<p class="ar-summary">${esc(ai.resumen)}</p>` : ''}

        <div class="ar-cols">
          <div class="ar-panel">
            <h3 class="ar-panel-title">Diagnóstico</h3>
            <ul class="ar-checks">
            ${checks.map(c => c.ok == null
              ? `<li class="na">${icon('minus')}<span>${c.txt} <em>(no se pudo verificar)</em></span></li>`
              : `<li class="${c.ok ? 'ok' : 'bad'}">${icon(c.ok ? 'check' : 'x')}<span>${c.txt}<span class="sr-only">${c.ok ? ': cumple' : ': no cumple'}</span></span></li>`
            ).join('')}
            </ul>
          </div>
          <div class="ar-panel">
            <h3 class="ar-panel-title">Plan de acción</h3>
            ${acciones.length ? `<ol class="ar-actions">${acciones.map(a => `
              <li class="ar-action" data-tone="${impactTone(a.impacto)}">
                <div class="ar-action-head">
                  <span class="ar-action-title">${esc(a.titulo)}</span>
                  <span class="ar-action-pts mono">+${esc(a.impacto_pts)} pts</span>
                </div>
                <p class="ar-action-desc">${esc(a.como)}</p>
                <p class="ar-action-time mono">${icon('clock')}${esc(a.tiempo_estimado)}</p>
              </li>`).join('')}</ol>`
            : `<p class="ar-action-desc">${d.parcial ? 'En lo que se pudo verificar no hay acciones pendientes. Fotos, stock y atributos se revisan desde la cuenta del vendedor.' : 'La publicación está en muy buen estado. No hay acciones urgentes.'}</p>`}
          </div>
        </div>

        ${ai.titulo_optimizado ? `
        <div class="ar-titles">
          <div><p class="ar-titles-k">Título actual <span class="mono">${item.title?.length ?? 0} car.</span></p><p class="ar-titles-v">${esc(item.title)}</p></div>
          <div class="is-new"><p class="ar-titles-k">Sugerido por IA <span class="mono">${ai.titulo_optimizado.length} car.</span></p><p class="ar-titles-v">${esc(ai.titulo_optimizado)}</p></div>
        </div>` : ''}

        ${d.aviso ? `<p class="ar-warning">${esc(d.aviso)}</p>` : ''}
      </article>`;

    const ar = resultArea.querySelector('.ar');
    requestAnimationFrame(() => requestAnimationFrame(() => ar.classList.add('in')));
    ar.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    ar.focus({ preventScroll: true });
  }

  async function runAudit(e) {
    e?.preventDefault();
    const url = urlInput.value.trim();
    statusEl.innerHTML = '';
    if (!url) { urlInput.focus(); return; }
    if (!/mercadoli[bv]re\.com|MLA-?\d+|^(publicaci[oó]n\s*)?#?\s*\d{8,13}$/i.test(url)) {
      showError('Ese link no parece de Mercado Libre. Copiá el link de una publicación o el número que aparece abajo de todo («Publicación #…») y probá de nuevo.');
      urlInput.focus();
      return;
    }

    btn.disabled = true;
    btnLabel.textContent = 'Analizando';
    resultArea.innerHTML = '';

    let si = 0;
    statusEl.innerHTML = `<div class="audit-loading" role="status">
      <ol class="audit-steps">${STEPS.map((s, i) => `<li class="${i === 0 ? 'is-on' : ''}">${s}</li>`).join('')}</ol>
      <div class="audit-skeleton" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>`;
    const stepTimer = setInterval(() => {
      si = Math.min(si + 1, STEPS.length - 1);
      statusEl.querySelectorAll('.audit-steps li').forEach((li, i) => { li.classList.toggle('is-done', i < si); li.classList.toggle('is-on', i === si); });
    }, 1400);

    try {
      let res;
      try {
        res = await fetch(AUDIT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: AbortSignal.timeout(25000),
        });
      } catch (netErr) {
        throw Object.assign(new Error('offline'), { offline: true });
      }
      const data = await res.json().catch(() => null);
      // Sin backend (404/HTML) o cuenta de ML sin vincular → "no disponible"
      if (!data || res.status === 404 && !data.error || data.code === 'ml_not_linked' || data.code === 'no_db') {
        throw Object.assign(new Error('offline'), { offline: true });
      }
      if (!res.ok) throw new Error(data.error || 'No se pudo analizar la publicación.');
      statusEl.innerHTML = '';
      renderResult(data);
    } catch (err) {
      if (err.offline) liveState = 'off';
      showError(err.offline
        ? 'La auditoría en vivo no está disponible en este momento: Mercado Libre exige una cuenta vinculada y la conexión está en mantenimiento. Mientras tanto, mirá cómo se ve un resultado real.'
        : esc(err.message), err.offline);
      resultArea.innerHTML = '';
    } finally {
      clearInterval(stepTimer);
      btn.disabled = false;
      btnLabel.textContent = 'Analizar';
    }
  }

  form.addEventListener('submit', runAudit);
  document.querySelectorAll('.audit-example').forEach(b => b.addEventListener('click', () => {
    urlInput.value = b.dataset.url;
    if (liveState === 'off') showDemo();
    else form.requestSubmit();
  }));
})();
