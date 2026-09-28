/* ============================================================
   GUIA.JS — Guías del Lab ML
   · Marca en el índice lateral la sección que se está leyendo.
   · Botón "Copiar" de los prompts.
   ============================================================ */

(function () {
  const links = [...document.querySelectorAll('.gd-toc a[href^="#"]')];
  const sections = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const setCurrent = id => links.forEach(a => {
    if (a.hash === '#' + id) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });

  // La sección "actual" es la última cuyo título ya pasó la franja superior de lectura
  const visible = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    const first = sections.find(s => visible.has(s));
    if (first) setCurrent(first.id);
  }, { rootMargin: '-20% 0px -55% 0px' });
  sections.forEach(s => io.observe(s));
  setCurrent(sections[0].id);
})();

document.querySelectorAll('.gd-copy').forEach(btn => {
  const label = btn.querySelector('span');
  const original = label?.textContent;
  btn.addEventListener('click', async () => {
    const text = document.getElementById(btn.dataset.copy)?.innerText.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (label) label.textContent = 'Copiado';
    } catch (e) {
      if (label) label.textContent = 'Seleccionalo y copiá';
    }
    btn.setAttribute('data-done', '');
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.removeAttribute('data-done'); if (label) label.textContent = original; }, 2200);
  });
});
