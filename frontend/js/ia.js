/* ============================================================
   IA.JS — Página pública "IA aplicada a Mercado Libre" (ia.html)
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
    principios(); skills(); sistemas(); cats(); prompts(); stack();
    $('ia-n-skills').textContent = D.skills.length;
    $('ia-n-prompts').textContent = D.prompts.length;
    const n = Object.values(PUB).filter(s => s.estado === 'aplicada' || s.estado === 'dominada').length;
    if (n) { $('ia-n-aplicadas').textContent = n; $('ia-n-aplicadas-box').hidden = false; }
    $('ia-credit').innerHTML = `${esc(D.credito.txt)} <a href="${esc(D.credito.url)}" target="_blank" rel="noopener">Fuente</a>.`;
  }).catch(() => { $('ia-skills').innerHTML = '<p class="ia-loading">No se pudo cargar el contenido. Recargá la página.</p>'; });

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
