/* ============================================================
   MAIN.JS — Comportamiento compartido en todas las páginas
   ============================================================ */

document.documentElement.classList.add('js');

// ── UTILIDADES COMPARTIDAS ──
// Escapa texto que viene de APIs antes de meterlo en innerHTML
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function safeUrl(u) {
  return /^https?:\/\//i.test(String(u || '')) ? esc(u) : '';
}
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="assets/icons.svg#i-${name}"/></svg>`;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── TEMA CLARO / OSCURO ──
// Sin elección guardada, sigue al sistema (lo resuelve el CSS). El botón guarda la elección.
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const systemLight = window.matchMedia('(prefers-color-scheme: light)');
  const current = () => root.dataset.theme || (systemLight.matches ? 'light' : 'dark');
  const label = () => btn?.setAttribute('aria-label', current() === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');

  label();
  systemLight.addEventListener?.('change', label);
  btn?.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('dc-theme', next); } catch (e) {}
    label();
  });
})();

// ── HAMBURGER MENU ──
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function setMobileMenu(open) {
  if (!hamburger || !mobileMenu) return;
  hamburger.classList.toggle('open', open);
  mobileMenu.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) mobileMenu.querySelector('a, button')?.focus();
}

function closeMobileMenu() { setMobileMenu(false); }

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => setMobileMenu(!mobileMenu.classList.contains('open')));

  // Cerrar al tocar fuera de los links o al elegir un link
  mobileMenu.addEventListener('click', e => {
    if (e.target === mobileMenu || e.target.closest('a')) closeMobileMenu();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
      hamburger.focus();
    }
  });
}

// ── NAV CON FONDO AL SCROLLEAR (sentinela en vez de escuchar el scroll) ──
const siteNav = document.getElementById('site-nav');
if (siteNav && 'IntersectionObserver' in window) {
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:12px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => siteNav.classList.toggle('scrolled', !e.isIntersecting)).observe(sentinel);
} else siteNav?.classList.add('scrolled');

// ── SCROLL REVEAL ──
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}
