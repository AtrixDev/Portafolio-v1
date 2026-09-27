/* ============================================================
   INDEX.JS — Comportamiento exclusivo del CV (index.html)
   ============================================================ */

// ── Aplicar contenido desde API o localStorage como fallback ──
function applyState(s) {
  if (!s) return;
  const setText = (id, v) => { const el = document.getElementById(id); if (el && v) el.textContent = v; };
  const setValue = (id, v) => { const el = document.querySelector(`#${id} .contact-link-value`); if (el && v) el.textContent = v; };

  if (s.hero) {
    const h = s.hero;
    setText('el-tag', h.tag);
    setText('el-n1', h.name1);
    setText('el-n2', h.name2);
    setText('el-sub', h.sub);
    setText('el-btn1', h.btn1);
    setText('el-badge', h.badge);
  }
  if (s.stats && s.stats.length) {
    document.getElementById('el-stats').innerHTML = s.stats.map(st =>
      `<div class="stat" role="listitem"><div class="stat-number">${st.number}</div><div class="stat-label">${st.label}</div></div>`
    ).join('');
  }
  if (s.sobre) {
    const sb = s.sobre;
    document.getElementById('el-sobre').innerHTML =
      [sb.p1, sb.p2, sb.p3].filter(Boolean).map(p => `<p>${p}</p>`).join('');
  }
  if (s.contacto) {
    const c = s.contacto;
    setText('el-csub', c.sub);
    const setHref = (id, v) => { const el = document.getElementById(id); if (el && v) el.href = v; };
    if (c.email) { setHref('el-cemail', 'mailto:' + c.email); setValue('el-cemail', c.email); }
    if (c.linkedin) setHref('el-clinkedin', c.linkedin);
    if (c.tel) { setHref('el-ctel', 'tel:' + c.tel.replace(/[^\d+]/g, '')); setValue('el-ctel', c.tel); }
  }
}

async function loadContent() {
  try {
    const res = await fetch('/api/content');
    if (res.ok) {
      const data = await res.json();
      applyState(data);
      try { localStorage.setItem('dc_cache', JSON.stringify(data)); } catch (e) {}
      return;
    }
  } catch (e) {}
  // Fallback: localStorage cache (funciona abriendo el HTML directo)
  try {
    const cached = JSON.parse(localStorage.getItem('dc_cache') || localStorage.getItem('dc_crm'));
    if (cached) applyState(cached);
  } catch (e) {}
}

loadContent();


// ── SCROLL-SPY: marca en el nav la sección visible ──
(function () {
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"], .mobile-menu a[href^="#"]'));
  const sections = [...new Set(links.map(a => a.getAttribute('href')))]
    .map(h => document.querySelector(h)).filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const setActive = id => links.forEach(a => {
    const on = a.getAttribute('href') === '#' + id;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => io.observe(s));
})();


// ── GALERÍA ANTES / DESPUÉS ──
document.querySelectorAll('.ce-thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    const mainImg = document.getElementById(thumb.dataset.target);
    if (!mainImg) return;
    const newSrc = thumb.dataset.full;
    const newAlt = thumb.querySelector('img')?.alt;
    mainImg.style.opacity = '0';
    const preload = new Image();
    const swap = () => {
      mainImg.src = newSrc;
      if (newAlt) mainImg.alt = newAlt;
      requestAnimationFrame(() => requestAnimationFrame(() => { mainImg.style.opacity = '1'; }));
    };
    preload.onload = swap;
    preload.onerror = swap;
    preload.src = newSrc;
    thumb.closest('.ce-thumbs').querySelectorAll('.ce-thumb').forEach(t => t.setAttribute('aria-pressed', 'false'));
    thumb.setAttribute('aria-pressed', 'true');
  });
});


// ── MODAL DE PORTFOLIO ──
(function () {
  const modal = document.getElementById('portfolio-modal');
  const closeBtn = document.getElementById('btn-close-portfolio');
  if (!modal) return;
  let lastFocus = null;
  let loaded = false;

  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { modal.classList.add('open'); closeBtn.focus(); });
    if (!loaded) { loaded = true; loadPortfolioAPI(); }
  }
  function close() {
    if (modal.hidden) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { modal.hidden = true; }, prefersReducedMotion ? 0 : 250);
    lastFocus?.focus();
  }

  document.getElementById('btn-open-portfolio')?.addEventListener('click', open);
  document.getElementById('nav-portfolio-btn')?.addEventListener('click', open);
  document.getElementById('nav-portfolio-mob')?.addEventListener('click', () => { closeMobileMenu(); open(); });
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {   // mantener el foco dentro del modal
      const f = modal.querySelectorAll('a[href], button:not([disabled])');
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Items dinámicos desde la API, antes de los estáticos
  async function loadPortfolioAPI() {
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) return;
      const { items } = await res.json();
      if (items && items.length) renderDynamicPortfolio(items);
    } catch (e) { /* offline o sin backend — quedan los items estáticos */ }
  }

  function renderDynamicPortfolio(items) {
    const container = document.getElementById('pm-dynamic-items');
    if (!container) return;
    const byEmployer = {};
    items.forEach(item => {
      const key = item.employer || 'Sin empresa';
      (byEmployer[key] ||= []).push(item);
    });
    container.innerHTML = Object.entries(byEmployer).map(([employer, empItems]) => `
      <div class="pm-employer">
        <div class="pm-employer-label"><span>${esc(employer)}</span></div>
        <div class="pm-brands">${empItems.map(item => {
          const img = safeUrl(item.image), url = safeUrl(item.url);
          return `
          <div class="pm-brand">
            ${img ? `<div class="pm-gal-item" style="margin-bottom:.8rem;"><img src="${img}" alt="${esc(item.title)}" loading="lazy"></div>` : ''}
            <div class="pm-brand-name">${esc(item.brand || (item.title || '').slice(0, 40))}</div>
            <div class="pm-brand-cat">${esc(item.category)}</div>
            ${item.metrics ? `<span class="pm-brand-pill">${esc(item.metrics)}</span>` : ''}
            ${url ? `<br><a href="${url}" target="_blank" rel="noopener" class="cert-link" style="margin-top:.6rem;">Ver en ML ${icon('external')}</a>` : ''}
          </div>`;
        }).join('')}
        </div>
      </div>`).join('') + '<hr class="pm-sep">';
  }
})();


// ── DRAGÓN GLITCH — caracteres que mutan (≈15 fps, sólo visible y sin "reducir movimiento") ──
(function () {
  const svg = document.querySelector('.dragon-ascii-svg');
  if (!svg || prefersReducedMotion) return;

  const texts = Array.from(svg.querySelectorAll('text'));
  if (!texts.length) return;

  const CHARS = '#@%!?+=~^&|/\\:;0123456789ABCDabcdef><{}[]';
  const originals = texts.map(t => t.textContent);
  const glitchState = new Array(texts.length).fill(0);   // frames restantes de glitch por línea
  const FRAME_MS = 66;

  let rafId = null, last = 0, inView = false, chance = 0.035;

  // Al pasar el mouse (o tocar) el dragón, el glitch se intensifica
  const zone = document.getElementById('hero-visual') || svg;
  zone.addEventListener('pointerenter', () => { chance = 0.2; });
  zone.addEventListener('pointerleave', () => { chance = 0.035; });

  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (now - last < FRAME_MS) return;
    last = now;
    texts.forEach((el, i) => {
      if (glitchState[i] > 0) {
        el.textContent = Array.from(originals[i], c => c === ' ' ? ' ' : CHARS[(Math.random() * CHARS.length) | 0]).join('');
        if (--glitchState[i] === 0) el.textContent = originals[i];
      } else if (Math.random() < chance) {
        glitchState[i] = ((Math.random() * 4) | 0) + 2;   // 2–5 frames
      }
    });
  }

  function start() { if (!rafId && inView && !document.hidden) rafId = requestAnimationFrame(tick); }
  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    texts.forEach((el, i) => { el.textContent = originals[i]; glitchState[i] = 0; });
  }

  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    inView ? start() : stop();
  }, { threshold: 0.05 }).observe(svg);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
})();


// ── CONTADORES: los números grandes suben desde 0 al entrar en pantalla ──
(function () {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length || prefersReducedMotion || !('IntersectionObserver' in window)) return;
  const fmt = (v, dec) => Number(v.toFixed(dec)).toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec });   // 39,2% y 1.800, como en el CV
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, target = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split('.')[1] || '').length;
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1400;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + fmt(target * ease, dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  els.forEach(el => io.observe(el));
})();


// ── PRUEBAS: capturas ampliadas en un <dialog> nativo ──
(function () {
  const dlg = document.getElementById('proof-dialog');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const img = dlg.querySelector('img');
  document.querySelectorAll('[data-proof]').forEach(btn => btn.addEventListener('click', () => {
    img.src = btn.dataset.proof;
    img.alt = btn.querySelector('img')?.alt || '';
    dlg.showModal();
  }));
  dlg.querySelector('.proof-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
})();
