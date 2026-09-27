/* ============================================================
   PROGRAMACION.JS — Lab de Programación
   Rutas por hash:  #/categoria   ·   #/categoria/id-de-ficha
   ============================================================ */

const DATA_URL   = 'data/weblab/';
const RECIPE_KEY = 'dc-weblab-receta';
const PAGE_SIZE  = 48;
const SINGLE     = ['soluciones', 'arquitecturas', 'rubros', 'estilos', 'landing', 'tipografias', 'paletas']; // una ficha por casillero
const RECIPE_ORDER = ['soluciones', 'rubros', 'arquitecturas', 'stacks', 'servicios', 'estilos', 'landing', 'tipografias', 'paletas', 'ux', 'skills', 'negocios'];

const $ = id => document.getElementById(id);
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const state = { cats: [], catById: {}, entries: [], cache: {}, cat: null, query: '', tags: new Set(), limit: PAGE_SIZE };

// ── Datos ──
async function loadCat(cat) {
  if (!state.cache[cat]) {
    const res = await fetch(`${DATA_URL}${cat}.json`);
    state.cache[cat] = await res.json();
  }
  return state.cache[cat];
}
async function findEntry(cat, id) {
  return (await loadCat(cat)).find(e => e.id === id);
}

// ── Receta (se guarda en este navegador) ──
const recipe = {
  load() { try { return JSON.parse(localStorage.getItem(RECIPE_KEY)) || {}; } catch (e) { return {}; } },
  save(r) { try { localStorage.setItem(RECIPE_KEY, JSON.stringify(r)); } catch (e) {} },
  has(cat, id) { return (this.load()[cat] || []).includes(id); },
  toggle(cat, id) {
    const r = this.load();
    const list = r[cat] || [];
    if (list.includes(id)) r[cat] = list.filter(x => x !== id);
    else r[cat] = SINGLE.includes(cat) ? [id] : [...list, id];
    if (!r[cat].length) delete r[cat];
    this.save(r);
    updateRecipeCount(true);
  },
  count() { return Object.values(this.load()).reduce((n, l) => n + l.length, 0); },
};

function updateRecipeCount(bump) {
  const b = $('wl-recipe-count');
  b.textContent = recipe.count();
  if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
}

// ── Barra lateral ──
function renderSidebar() {
  const groups = {};
  state.cats.forEach(c => (groups[c.group] ||= []).push(c));
  $('wl-cats').innerHTML = Object.entries(groups).map(([g, cats]) => `
    <div class="wl-group"><p class="wl-group-title">${esc(g)}</p>
      ${cats.map(c => `<a class="wl-cat" href="#/${c.id}" data-cat="${c.id}">${icon(c.icon)}<span>${esc(c.name)}</span><span class="wl-cat-n">${c.count}</span></a>`).join('')}
    </div>`).join('');
}
function markSidebar() {
  document.querySelectorAll('.wl-cat').forEach(a => a.setAttribute('aria-current', String(!state.query && a.dataset.cat === state.cat)));
}

// ── Tarjetas ──
function card(e, showCat) {
  const c = state.catById[e.cat];
  const sw = e.swatches?.length ? e.swatches : (e.palette || []).map(p => p[1]);
  return `<button type="button" class="wl-card" data-open="${e.cat}/${esc(e.id)}">
    ${recipe.has(e.cat, e.id) ? `<span class="wl-card-in" title="En tu receta">${icon('bookmark')}</span>` : ''}
    ${showCat ? `<span class="wl-card-cat">${esc(c?.name)}</span>` : ''}
    <h3>${esc(e.name)}</h3>
    ${sw.length ? `<div class="wl-swatches" aria-hidden="true">${sw.slice(0, 8).map(h => `<span style="background:${esc(h)}"></span>`).join('')}</div>` : ''}
    ${e.summary ? `<p>${esc(e.summary)}</p>` : ''}
    ${e.tags?.length ? `<div class="wl-card-tags">${e.tags.slice(0, 3).map(t => `<span class="wl-tag">${esc(t)}</span>`).join('')}</div>` : ''}
  </button>`;
}

function emptyState(title, text) {
  return `<div class="wl-empty"><strong>${title}</strong>${text}</div>`;
}

// ── Listado ──
async function renderList() {
  const main = $('wl-main');
  main.setAttribute('aria-busy', 'true');
  markSidebar();
  const q = norm(state.query.trim());
  let items, showCat = false;

  if (q) {
    // Búsqueda global sobre el índice (todas las categorías)
    const terms = q.split(/\s+/);
    items = state.entries
      .map(([cat, id, name, summary, tags]) => {
        const hay = norm(`${name} ${summary} ${tags.join(' ')}`);
        if (!terms.every(t => hay.includes(t))) return null;
        const score = (norm(name).includes(q) ? 10 : 0) + (norm(name).startsWith(terms[0]) ? 5 : 0);
        return { cat, id, name, summary, tags, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    showCat = true;
    $('wl-cat-head').innerHTML = `<h2>Resultados para “${esc(state.query.trim())}”</h2><p>Buscando en las ${state.cats.length} categorías.</p>`;
    $('wl-filters').innerHTML = '';
  } else {
    const c = state.catById[state.cat];
    const all = await loadCat(state.cat);
    // Filtros: las etiquetas más frecuentes de la categoría
    const freq = {};
    all.forEach(e => (e.tags || []).forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    const top = Object.entries(freq).filter(([, n]) => n > 1 && n < all.length).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t]) => t);
    $('wl-filters').innerHTML = top.map(t => `<button type="button" class="wl-chip" data-tag="${esc(t)}" aria-pressed="${state.tags.has(t)}">${esc(t)}</button>`).join('');
    items = state.tags.size ? all.filter(e => [...state.tags].every(t => e.tags?.includes(t))) : all;
    $('wl-cat-head').innerHTML = `<h2>${icon(c.icon)} ${esc(c.name)} ${c.origin !== 'curado' ? `<span class="wl-origin" title="Datos importados de la base de la skill ui-ux-pro-max, traducidos al castellano">Fuente: ${esc(c.origin)}</span>` : ''}</h2><p>${esc(c.desc)}</p>`;
  }

  $('wl-count').textContent = `${items.length} ${items.length === 1 ? 'ficha' : 'fichas'}`;
  if (!items.length) {
    $('wl-grid').innerHTML = q
      ? emptyState('No encontré nada con esa búsqueda.', 'Probá con otra palabra (sin tildes también funciona).')
      : emptyState('Ninguna ficha tiene todas esas etiquetas.', 'Sacá algún filtro para ver más resultados.');
  } else {
    $('wl-grid').innerHTML = items.slice(0, state.limit).map(e => card(e, showCat)).join('') +
      (items.length > state.limit ? `<button type="button" class="btn-secondary wl-more" id="wl-more">Ver ${Math.min(PAGE_SIZE, items.length - state.limit)} más</button>` : '');
  }
  main.setAttribute('aria-busy', 'false');
}

// ── Ficha ──
const drawer = { el: null, last: null };

function openDrawer(el) {
  if (!el.hidden) return;
  drawer.last = document.activeElement;
  el.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => { el.classList.add('open'); el.querySelector('.wl-tool')?.focus(); });
}
function closeDrawer(el) {
  if (el.hidden) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { el.hidden = true; }, prefersReducedMotion ? 0 : 250);
  drawer.last?.focus?.();
}

function fieldValue(v) {
  const s = String(v);
  if (/^https?:\/\/\S+$/.test(s)) return `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s.replace(/^https?:\/\//, ''))}</a>`;
  return esc(s.replace(/\s*☐\s*/g, '\n☐ ').trim());
}

const loadedFonts = new Set();
function loadFont(url) {
  if (!url || loadedFonts.has(url) || !/^https:\/\/fonts\.googleapis\.com\//.test(url)) return;
  loadedFonts.add(url);
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = url;
  document.head.appendChild(l);
}

async function renderEntry(cat, id) {
  const e = await findEntry(cat, id);
  const panel = $('wl-drawer');
  if (!e) { closeDrawer(panel); return; }
  const c = state.catById[cat];
  $('wl-d-cat').textContent = c.name;

  let visual = '';
  if (e.swatches?.length) {
    visual = `<div class="wl-d-block"><h3>Colores (clic para copiar)</h3><div class="wl-pal">${e.swatches.map(h => `<button type="button" data-copy="${esc(h)}"><span style="background:${esc(h)}"></span><span>${esc(h)}</span></button>`).join('')}</div></div>`;
  }
  if (e.palette?.length) {
    visual = `<div class="wl-d-block"><h3>Paleta (clic para copiar)</h3><div class="wl-pal">${e.palette.map(([n, h]) => `<button type="button" data-copy="${esc(h)}"><span style="background:${esc(h)}"></span><span>${esc(n)}<br>${esc(h)}</span></button>`).join('')}</div></div>`;
  }
  if (e.fonts) {
    loadFont(e.fonts.url);
    visual = `<div class="wl-d-block"><h3>Vista previa</h3><div class="wl-font-preview">
      <p class="fp-h" style="font-family:'${esc(e.fonts.heading)}', serif">Vendé más en Mercado Libre</p>
      <p class="fp-b" style="font-family:'${esc(e.fonts.body)}', sans-serif">Títulos con las keywords correctas, 7 fotos que cuentan una historia y una descripción que responde las preguntas antes de que las hagan.</p>
      <p class="fp-meta">${esc(e.fonts.heading)} + ${esc(e.fonts.body)}</p></div></div>`;
  }
  if (e.code && (e.code.good || e.code.bad)) {
    visual += `<div class="wl-d-block"><h3>Ejemplo</h3><div class="wl-code">
      ${e.code.good ? `<div><small>Bien</small><pre class="good">${esc(e.code.good)}</pre></div>` : ''}
      ${e.code.bad ? `<div><small>Mal</small><pre class="bad">${esc(e.code.bad)}</pre></div>` : ''}</div></div>`;
  }

  // Ejemplos visuales (programacion-ejemplos.js): paletas y estilos muestran primero el ejemplo
  const ejemplo = window.WLExamples ? await WLExamples.render(e, cat) : '';
  const despues = cat === 'skills' ? ejemplo : '';   // en skills, primero qué hace y después prompt e instalación
  if (!despues) visual = (cat === 'paletas' || cat === 'estilos') ? ejemplo + visual : visual + ejemplo;

  const related = [];
  for (const ref of e.related || []) {
    const [rc, rid] = ref.split('/');
    if (!rid) { related.push(`<a href="#/${esc(rc)}">${esc(state.catById[rc]?.name)} <small>categoría</small></a>`); continue; }
    const hit = state.entries.find(x => x[0] === rc && x[1] === rid);
    if (hit) related.push(`<a href="#/${esc(rc)}/${esc(rid)}">${esc(hit[2])} <small>${esc(state.catById[rc]?.name)}</small></a>`);
  }

  const inRecipe = recipe.has(cat, id);
  const monoLabels = /Variables CSS|CSS técnico|Import CSS|Config Tailwind|Prompt para IA/;
  $('wl-d-body').innerHTML = `
    <h2 class="wl-d-title" id="wl-d-title">${esc(e.name)}</h2>
    ${e.summary ? `<p class="wl-d-summary">${esc(e.summary)}</p>` : ''}
    <div class="wl-d-actions">
      <button type="button" class="btn-primary wl-d-add" data-toggle="${cat}/${esc(id)}" aria-pressed="${inRecipe}">${icon('bookmark')}<span>${inRecipe ? 'En tu receta' : 'Agregar a mi receta'}</span></button>
    </div>
    ${visual}
    ${e.fields?.length ? `<dl class="wl-dl">${e.fields.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="${monoLabels.test(k) ? 'mono' : ''}">${fieldValue(v)}</dd></div>`).join('')}</dl>` : ''}
    ${despues}
    ${related.length ? `<div class="wl-d-block"><h3>Relacionado</h3><div class="wl-related">${related.join('')}</div></div>` : ''}
  `;
  $('wl-d-body').scrollTop = 0;
  document.title = `${e.name} — Lab de Programación | Darío Colángelo`;
  openDrawer(panel);
}

// ── Receta: panel ──
async function renderRecipe() {
  const r = recipe.load();
  const cats = await Promise.all(RECIPE_ORDER.filter(c => r[c]?.length).map(async c => [c, await loadCat(c)]));
  const byCat = Object.fromEntries(cats);
  $('wl-r-slots').innerHTML = RECIPE_ORDER.map(cid => {
    const c = state.catById[cid];
    const ids = r[cid] || [];
    const items = ids.map(id => byCat[cid]?.find(e => e.id === id)).filter(Boolean);
    return `<section class="wl-slot"><h3>${icon(c.icon)}${esc(c.name)}</h3>
      ${items.length ? `<div class="wl-slot-items">${items.map(e => `<span class="wl-slot-item"><a href="#/${cid}/${esc(e.id)}">${esc(e.name)}</a><button type="button" data-remove="${cid}/${esc(e.id)}" aria-label="Quitar ${esc(e.name)}">${icon('x')}</button></span>`).join('')}</div>`
        : `<p class="wl-slot-empty">Vacío · <a href="#/${cid}">elegir</a></p>`}
    </section>`;
  }).join('');
}

async function recipeMarkdown() {
  const r = recipe.load();
  let md = '# Receta web\n';
  for (const cid of RECIPE_ORDER) {
    if (!r[cid]?.length) continue;
    const list = await loadCat(cid);
    md += `\n## ${state.catById[cid].name}\n`;
    r[cid].forEach(id => {
      const e = list.find(x => x.id === id);
      if (!e) return;
      md += `- **${e.name}**${e.summary ? ` — ${e.summary}` : ''}\n`;
      if (e.fonts) md += `  - Fuentes: ${e.fonts.heading} + ${e.fonts.body} · ${e.fonts.url}\n`;
      if (e.palette?.length) md += `  - Paleta: ${e.palette.map(([n, h]) => `${n} ${h}`).join(', ')}\n`;
      if (e.swatches?.length) md += `  - Colores: ${e.swatches.join(', ')}\n`;
    });
  }
  return md;
}

async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); } catch (e) { return false; }
  if (btn) { btn.classList.add('done'); setTimeout(() => btn.classList.remove('done'), 1600); }
  return true;
}

// ── Ruteo ──
async function route() {
  const [, cat, id] = (location.hash.match(/^#\/([^/]+)(?:\/(.+))?$/) || []);
  const validCat = state.catById[cat] ? cat : state.cat || 'soluciones';
  if (validCat !== state.cat) { state.cat = validCat; state.tags.clear(); state.limit = PAGE_SIZE; }
  if (id || !state.query) await renderList();
  if (id) await renderEntry(validCat, decodeURIComponent(id));
  else {
    closeDrawer($('wl-drawer'));
    document.title = 'Lab de Programación — Base de conocimiento para construir webs | Darío Colángelo';
  }
}

// ── Eventos ──
function bindEvents() {
  let t;
  $('wl-q').addEventListener('input', e => {
    clearTimeout(t);
    t = setTimeout(() => { state.query = e.target.value; state.limit = PAGE_SIZE; renderList(); }, 140);
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); $('wl-q').focus(); }
    if (e.key === 'Escape') {
      if (!$('wl-recipe').hidden) closeDrawer($('wl-recipe'));
      else if (!$('wl-drawer').hidden) location.hash = `#/${state.cat}`;
    }
  });
  // Al elegir una categoría con búsqueda activa, limpiar la búsqueda
  $('wl-cats').addEventListener('click', e => {
    const a = e.target.closest('.wl-cat');
    if (a && state.query) { state.query = ''; $('wl-q').value = ''; if (a.dataset.cat === state.cat) renderList(); }
  });

  $('wl-grid').addEventListener('click', e => {
    const c = e.target.closest('[data-open]');
    if (c) { location.hash = `#/${c.dataset.open}`; return; }
    if (e.target.closest('#wl-more')) { state.limit += PAGE_SIZE; renderList(); }
  });
  $('wl-filters').addEventListener('click', e => {
    const b = e.target.closest('.wl-chip');
    if (!b) return;
    state.tags.has(b.dataset.tag) ? state.tags.delete(b.dataset.tag) : state.tags.add(b.dataset.tag);
    state.limit = PAGE_SIZE;
    renderList();
  });

  // Ficha
  $('wl-d-close').addEventListener('click', () => { location.hash = `#/${state.cat}`; });
  $('wl-drawer').addEventListener('click', e => {
    if (e.target.id === 'wl-drawer') { location.hash = `#/${state.cat}`; return; }
    const add = e.target.closest('[data-toggle]');
    if (add) {
      const [c, id] = add.dataset.toggle.split('/');
      recipe.toggle(c, id);
      const on = recipe.has(c, id);
      add.setAttribute('aria-pressed', on);
      add.querySelector('span').textContent = on ? 'En tu receta' : 'Agregar a mi receta';
      renderList();
      return;
    }
    const sw = e.target.closest('[data-copy]');
    if (sw) copyText(sw.dataset.copy).then(ok => { if (ok) { const l = sw.lastElementChild; const prev = l.innerHTML; l.textContent = 'Copiado'; setTimeout(() => { l.innerHTML = prev; }, 1200); } });
  });
  $('wl-d-link').addEventListener('click', e => copyText(location.href, e.currentTarget));

  // Receta
  $('wl-recipe-open').addEventListener('click', async () => { await renderRecipe(); openDrawer($('wl-recipe')); });
  $('wl-r-close').addEventListener('click', () => closeDrawer($('wl-recipe')));
  $('wl-recipe').addEventListener('click', e => {
    if (e.target.id === 'wl-recipe') { closeDrawer($('wl-recipe')); return; }
    const rm = e.target.closest('[data-remove]');
    if (rm) { const [c, id] = rm.dataset.remove.split('/'); recipe.toggle(c, id); renderRecipe(); renderList(); return; }
    if (e.target.closest('a[href^="#/"]')) closeDrawer($('wl-recipe'));
  });
  $('wl-r-copy').addEventListener('click', async e => {
    const btn = e.currentTarget, label = btn.querySelector('span');
    const ok = await copyText(await recipeMarkdown());
    label.textContent = ok ? '¡Copiado!' : 'No se pudo copiar';
    setTimeout(() => { label.textContent = 'Copiar como Markdown'; }, 1800);
  });
  $('wl-r-clear').addEventListener('click', () => {
    if (!recipe.count() || !confirm('¿Vaciar toda la receta?')) return;
    recipe.save({}); updateRecipeCount(); renderRecipe(); renderList();
  });

  // Mantener el foco dentro del panel abierto
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const open = [$('wl-recipe'), $('wl-drawer')].find(d => !d.hidden);
    if (!open) return;
    const f = open.querySelectorAll('a[href], button:not([disabled])');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  window.addEventListener('hashchange', route);
}

// ── Inicio ──
(async function init() {
  try {
    const idx = await (await fetch(`${DATA_URL}index.json`)).json();
    state.cats = idx.categories;
    state.catById = Object.fromEntries(idx.categories.map(c => [c.id, c]));
    state.entries = idx.entries;
    const total = idx.categories.reduce((n, c) => n + c.count, 0);
    $('wl-stats').textContent = `${total} fichas · ${idx.categories.length} categorías · tocá una ficha para ver el detalle`;
    renderSidebar();
    updateRecipeCount();
    bindEvents();
    await route();
  } catch (err) {
    $('wl-stats').textContent = 'No se pudo cargar la base de conocimiento. Recargá la página.';
    $('wl-grid').innerHTML = emptyState('No se pudo cargar la base.', 'Si abriste el archivo directo desde la compu, levantá un servidor local (por ejemplo: python3 -m http.server).');
  }
})();
