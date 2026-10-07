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

// ── NAV: GRUPOS CON SUBMENÚ ──
// Escritorio: el padre es un enlace real; el submenú se abre con hover, con foco por teclado, con el botón ▾
// y se cierra con Escape o al salir. Sin JS el CSS lo abre con hover/foco (ver shared.css).
(function () {
  const grupos = [...document.querySelectorAll('.nav-group')];
  const hover = window.matchMedia('(hover: hover)');
  const abrir = (g, v) => {
    g.classList.toggle('open', v);
    g.querySelector('.nav-toggle')?.setAttribute('aria-expanded', String(v));
  };
  const cerrarOtros = g => grupos.forEach(o => { if (o !== g) abrir(o, false); });
  grupos.forEach(g => {
    const toggle = g.querySelector('.nav-toggle');
    toggle.addEventListener('click', () => { const v = !g.classList.contains('open'); cerrarOtros(g); abrir(g, v); });
    g.addEventListener('mouseenter', () => { if (hover.matches) { cerrarOtros(g); abrir(g, true); } });
    g.addEventListener('mouseleave', () => { if (hover.matches) abrir(g, false); });
    // por teclado: al entrar con Tab (foco visible) se abre; al salir del grupo se cierra
    g.addEventListener('focusin', e => { if (!g.dataset.sinAbrir && e.target.matches(':focus-visible')) { cerrarOtros(g); abrir(g, true); } });
    g.addEventListener('focusout', e => { if (!g.contains(e.relatedTarget)) abrir(g, false); });
    g.addEventListener('keydown', e => {
      if (e.key === 'Escape' && g.classList.contains('open')) {
        abrir(g, false);
        g.dataset.sinAbrir = '1';   // devolver el foco al padre no debe reabrir el submenú
        g.querySelector('.nav-parent')?.focus();
        delete g.dataset.sinAbrir;
      }
    });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.nav-group')) grupos.forEach(g => abrir(g, false)); });

  // Menú móvil: los grupos arrancan cerrados (salvo el de la página actual) y el botón ▾ los abre/cierra.
  document.querySelectorAll('.mm-group').forEach(g => {
    const toggle = g.querySelector('.mm-toggle'), sub = g.querySelector('.mm-sub');
    const set = v => { sub.hidden = !v; toggle.setAttribute('aria-expanded', String(v)); };
    set(!!g.querySelector('a.active, a[aria-current="page"]'));
    toggle.addEventListener('click', () => set(sub.hidden));
  });
})();

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

/* Anclas estables: si el contenido de arriba crece después de cargar (datos que llegan tarde),
   el navegador queda desalineado. Se re-alinea mientras la página se acomoda y se frena apenas la persona toca el scroll. */
(function () {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  let activo = true, ultimo = 0;
  const parar = () => { activo = false; };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, parar, { passive: true, once: true }));
  const alinear = () => {
    const el = document.getElementById(id);
    if (!activo || !el) return;
    const top = el.getBoundingClientRect().top - (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
    if (Math.abs(top) > 4) { ultimo = performance.now(); scrollTo({ top: scrollY + top, behavior: 'instant' }); }
  };
  const ro = new ResizeObserver(alinear);
  ro.observe(document.body);
  addEventListener('load', alinear);
  setTimeout(() => { ro.disconnect(); activo = false; }, 5000);
})();
