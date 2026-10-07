// js/architect/app.js — Router por hash y eventos. Única parte (con ui/views) que toca el DOM.
//   #/                          Explorer (filtros en la URL: ?q=&g=Área,Área&n=nivel&e=respaldo)
//   #/c/<id>                    ficha de concepto
//   #/proyecto                  Project Builder (preguntas adaptativas). El proyecto viaja en ?p=… y se guarda en este navegador.
//   #/proyecto/<pestaña>        decisiones · blueprint · adr · prompts · pack
import { loadKnowledge, buildKnowledge } from './content.js';
import { explorerView, resultsView, conceptView, notFoundView } from './views.js';
import { builderView, decisionsView, blueprintView, adrView, promptsView, packView, tabsView, resultsHead, TABS } from './views-project.js';
import * as B from './builder.js';
import { decide } from './decide.js';
import { buildPack, packToMarkdown } from './pack.js';
import { adrToMarkdown } from './adr.js';
import { toMermaid } from './blueprint.js';
import { buildContext } from './context.js';
import { parseHash, esc } from './ui.js';

const root = document.getElementById('ar-app'), dlg = document.getElementById('ar-dialog'), dlgBody = document.getElementById('ar-dialog-body'), live = document.getElementById('ar-live');
const STORE = 'dc-architect-project';
let K = null, biblioteca = null, filtros = { q: '', groups: [], level: '', evidence: '' };
let PD = null, state = B.emptyState(), editing = null, avisos = [], proyectoCargado = false;

const fetchJson = p => fetch(p).then(r => { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); });
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const anuncio = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };
const hoy = () => new Date().toISOString().slice(0, 10);

async function nombresBiblioteca() {
  if (biblioteca) return biblioteca;
  try { const i = await fetchJson('data/weblab/index.json'); biblioteca = new Map(i.entries.map(r => [r[1], r[2]])); } catch { biblioteca = new Map(); }
  return biblioteca;
}
async function datosProyecto() {
  if (PD) return PD;
  const [q, rules, pack, prompts] = await Promise.all(['questions', 'rules', 'pack', 'prompts'].map(n => fetchJson(`data/architect/${n}.json`)));
  PD = { M: B.buildModel(q), rules, pack, prompts };
  return PD;
}

// ── Explorer: filtros en la URL ──
const filtrosDesdeUrl = q => ({ q: q.get('q') || '', groups: (q.get('g') || '').split(',').filter(Boolean), level: q.get('n') || '', evidence: q.get('e') || '' });
function filtrosAUrl(f) {
  const q = new URLSearchParams();
  if (f.q) q.set('q', f.q); if (f.groups.length) q.set('g', f.groups.join(',')); if (f.level) q.set('n', f.level); if (f.evidence) q.set('e', f.evidence);
  const s = q.toString(); return '#/' + (s ? '?' + s : '');
}

// ── Proyecto: estado ⇄ URL ⇄ localStorage ──
const pParam = () => (state.answers && Object.keys(state.answers).length ? `?p=${B.encodeState(state)}` : '');
function persist() {
  try { localStorage.setItem(STORE, B.encodeState(state)); } catch { /* sin almacenamiento: el enlace igual lleva el proyecto */ }
  const base = location.hash.split('?')[0] || '#/proyecto';
  history.replaceState(null, '', base + pParam());
}
/** Trae el proyecto: del enlace (?p=) si lo hay y difiere, o del almacenamiento de este navegador la primera vez. */
function sincronizarProyecto(q) {
  const url = q.get('p');
  if (url && url !== B.encodeState(state)) { const r = B.decodeState(PD.M, url); state = r.state; avisos = r.problems; proyectoCargado = true; return; }
  if (proyectoCargado) return;
  proyectoCargado = true; avisos = [];
  let guardado = null; try { guardado = localStorage.getItem(STORE); } catch { /* nada */ }
  if (guardado) { const r = B.decodeState(PD.M, guardado); state = r.state; if (Object.keys(state.answers).length) avisos = ['Retomé tu proyecto guardado en este navegador.']; }
}

function setTitle(t) { document.title = `${t} | Web Project Architect | Darío Colángelo`; }
function foco() { const h = document.getElementById('ar-h1'); if (h) h.focus({ preventScroll: true }); }
const resultado = () => decide(PD.rules, K, B.resolve(PD.M, state));
function armarPack() {
  const res = resultado();
  return { res, pack: buildPack({ M: PD.M, state, res, K, packData: PD.pack, promptsData: PD.prompts, date: hoy() }) };
}
const avisosHtml = () => avisos.length ? `<div class="ar-aviso ui-card" role="status">${avisos.map(a => `<p>${esc(a)}</p>`).join('')}</div>` : '';

async function render() {
  const { path, q } = parseHash(location.hash);
  root.setAttribute('aria-busy', 'true');
  if (!K) {
    try { K = buildKnowledge(await loadKnowledge(fetchJson)); }
    catch (err) { root.innerHTML = `<div class="ar-empty ui-card" role="alert"><h1>No se pudo cargar la base de conocimiento.</h1><p>Recargá la página. Si sigue pasando, escribime.</p></div>`; root.removeAttribute('aria-busy'); console.error(err); return; }
  }
  let scroll = true;
  if (path[0] === 'c' && path[1]) {
    const e = K.get(path[1]);
    root.innerHTML = conceptView(K, path[1], e?.library_refs?.length ? await nombresBiblioteca() : new Map());
    setTitle(e ? e.name : 'Concepto no encontrado');
  } else if (path[0] === 'proyecto') {
    try { await datosProyecto(); } catch (err) { root.innerHTML = `<div class="ar-empty ui-card" role="alert"><h1>No se pudo cargar el Project Builder.</h1><p>Recargá la página.</p></div>`; root.removeAttribute('aria-busy'); console.error(err); return; }
    sincronizarProyecto(q);
    const tab = path[1];
    const qs = pParam();
    if (!tab) {
      root.innerHTML = avisosHtml() + builderView(PD.M, state, K, { editing, q: qs });
      setTitle('Armar un proyecto'); scroll = !!editing || !location.hash.includes('?');
    } else if (TABS.some(t => t[0] === tab)) {
      if (!B.canRecommend(state)) { root.innerHTML = resultsHead('Primero contame qué querés construir', 'Las decisiones salen de tus respuestas. Con el tipo de producto ya alcanza para empezar.', '') + '<p><a class="btn-primary" href="#/proyecto">Armar un proyecto</a></p>'; setTitle('Tu proyecto'); }
      else {
        const { res, pack } = armarPack();
        const lead = { decisiones: 'Propuestas explicadas: por qué, qué se resigna, alternativas, cuándo reconsiderar y cuánta confianza hay.', blueprint: 'Los diagramas del sistema, separados por propósito.', adr: 'Una decisión de arquitectura por registro, listos para el repositorio.', prompts: 'Prompts con el contexto de tu proyecto para cada etapa del trabajo.', pack: 'Todo el material para arrancar, en un solo documento.' }[tab];
        const cuerpo = tab === 'decisiones' ? decisionsView(res, K, PD.M, { product: pack.meta.product, idea: pack.meta.idea || 'Proyecto sin descripción' }) : tab === 'blueprint' ? blueprintView(pack.blueprints, K) : tab === 'adr' ? adrView(pack.adrs, hoy()) : tab === 'prompts' ? promptsView(pack.prompts) : packView(pack);
        root.innerHTML = resultsHead(TABS.find(t => t[0] === tab)[1], lead, tabsView(tab, qs)) + avisosHtml() + `<div class="ar-results-body">${cuerpo}</div><p class="ar-foot"><a class="link-arrow" href="#/proyecto${qs}">← Cambiar mis respuestas</a> <button type="button" class="ar-link" data-copiar-enlace>Copiar enlace del proyecto</button></p>`;
        setTitle(TABS.find(t => t[0] === tab)[1]);
      }
    } else { root.innerHTML = notFoundView(path.join('/')); setTitle('No encontrado'); }
  } else if (!path.length) {
    filtros = filtrosDesdeUrl(q);
    root.innerHTML = explorerView(K, filtros);
    setTitle('Explorer'); scroll = !location.hash.includes('?');
  } else { root.innerHTML = notFoundView(path.join('/')); setTitle('No encontrado'); }
  root.removeAttribute('aria-busy');
  if (scroll) scrollTo({ top: 0, behavior: 'auto' });
  foco();
}

// ── Explorer: repinta solo los resultados (el buscador no pierde el foco) ──
function actualizarExplorer() {
  const r = resultsView(K, filtros);
  document.getElementById('ar-results').innerHTML = r.body;
  document.getElementById('ar-count').innerHTML = r.count;
  document.querySelectorAll('.ar-chip').forEach(b => b.setAttribute('aria-pressed', String(filtros.groups.includes(b.dataset.grupo))));
  history.replaceState(null, '', filtrosAUrl(filtros));
}

// ── Diálogo «Aprender»: el concepto sin salir del proyecto ──
let opener = null;
async function abrirConcepto(id, desde) {
  const e = K.get(id); if (!e) return;
  opener = desde || document.activeElement;
  const nombres = e.library_refs?.length ? await nombresBiblioteca() : new Map();
  dlgBody.innerHTML = `<div class="ar-dialog-bar"><a class="link-arrow" href="${'#/c/' + encodeURIComponent(id)}" data-pagina>Abrir en página completa</a><button type="button" class="btn-secondary" data-cerrar>Cerrar</button></div>` + conceptView(K, id, nombres, { idp: 'dlg-', compact: true });
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0; document.getElementById('dlg-ar-h1')?.focus({ preventScroll: true });
}
dlg?.addEventListener('close', () => { opener?.focus?.(); opener = null; });
dlg?.addEventListener('click', e => {
  if (e.target === dlg) { dlg.close(); return; }                                   // clic en el fondo
  if (e.target.closest('[data-cerrar]')) { dlg.close(); return; }
  const a = e.target.closest('a[href^="#/c/"]');
  if (a && !a.hasAttribute('data-pagina')) { e.preventDefault(); abrirConcepto(decodeURIComponent(a.getAttribute('href').slice(4)), opener); return; }
  if (a && a.hasAttribute('data-pagina')) { dlg.close(); return; }
  const sc = e.target.closest('[data-scroll]'); if (sc) document.getElementById(sc.dataset.scroll)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
});

// ── Copiar y descargar ──
async function copiar(texto, ok = 'Copiado al portapapeles.') {
  try { await navigator.clipboard.writeText(texto); }
  catch { const t = document.createElement('textarea'); t.value = texto; t.style.cssText = 'position:fixed;opacity:0'; document.body.append(t); t.select(); try { document.execCommand('copy'); } finally { t.remove(); } }
  anuncio(ok);
}
function descargar(nombre, texto, tipo) {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo + ';charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  anuncio(`Descarga iniciada: ${nombre}`);
}
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'proyecto';
function textoParaClave(clave) {
  const { pack } = armarPack();
  if (clave === 'pack-md') return packToMarkdown(pack);
  if (clave === 'adr-todos') return pack.adrs.map(a => adrToMarkdown(a, { date: hoy() })).join('\n---\n\n');
  if (clave === 'prompts-todos') return pack.prompts.map(p => `# ${p.title}\n\n${p.text}`).join('\n\n---\n\n');
  if (clave.startsWith('adr:')) return adrToMarkdown(pack.adrs.find(a => a.id === clave.slice(4)), { date: hoy() });
  if (clave.startsWith('prompt:')) return pack.prompts.find(p => p.id === clave.slice(7)).text;
  if (clave.startsWith('mermaid:')) return toMermaid(pack.blueprints.find(b => b.id === clave.slice(8)));
  return '';
}

// ── Eventos ──
let t;
root.addEventListener('input', e => {
  if (e.target.id === 'ar-q') { clearTimeout(t); t = setTimeout(() => { filtros.q = e.target.value.trim(); actualizarExplorer(); }, 120); }
  if (e.target.id === 'ar-ans') document.getElementById('ar-cnt').textContent = e.target.value.length;
});
root.addEventListener('change', e => {
  if (e.target.id === 'ar-nivel') { filtros.level = e.target.value; actualizarExplorer(); }
  if (e.target.id === 'ar-evid') { filtros.evidence = e.target.value; actualizarExplorer(); }
});
root.addEventListener('submit', e => {
  const f = e.target.closest('#ar-form'); if (!f) return;
  e.preventDefault();
  const q = f.dataset.q, type = PD.M.byId.get(q).type, err = document.getElementById('ar-err');
  const value = type === 'text' ? f.querySelector('#ar-ans').value : f.querySelector('input[name="ar-opt"]:checked')?.value;
  if (type === 'single' && !value) { err.textContent = 'Elegí una opción, o «No lo sé todavía», o tocá «Omitir por ahora».'; err.hidden = false; f.querySelector('input')?.focus(); return; }
  const r = B.setAnswer(PD.M, state, q, value);
  if (r.error) { err.textContent = r.error; err.hidden = false; return; }
  state = r.state; editing = null; persist(); render();
});
root.addEventListener('click', e => {
  const T = sel => e.target.closest(sel);
  const chip = T('[data-grupo]');
  if (chip) { const g = chip.dataset.grupo; filtros.groups = filtros.groups.includes(g) ? filtros.groups.filter(x => x !== g) : [...filtros.groups, g]; actualizarExplorer(); return; }
  if (T('[data-limpiar]')) { filtros = { q: '', groups: [], level: '', evidence: '' }; history.replaceState(null, '', '#/'); render(); return; }
  const sc = T('[data-scroll]');
  if (sc) { const el = document.getElementById(sc.dataset.scroll); if (el) { el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); const h = el.querySelector('h2'); h?.setAttribute('tabindex', '-1'); h?.focus({ preventScroll: true }); } return; }
  const ap = T('[data-aprender]'); if (ap) { e.preventDefault(); abrirConcepto(ap.dataset.aprender, ap); return; }
  if (T('[data-afinar]')) { state = B.enableFine(state); editing = null; persist(); render(); return; }
  if (T('[data-omitir]')) { state = B.skip(PD.M, state, document.getElementById('ar-form').dataset.q); editing = null; persist(); render(); return; }
  if (T('[data-atras]')) {
    const { applicable } = B.resolve(PD.M, state), next = B.nextQuestion(PD.M, state);
    const hechas = applicable.filter(x => B.isAnswered(x, state)), idx = next ? applicable.findIndex(x => x.id === next.id) : applicable.length;
    const prev = [...applicable.slice(0, idx)].reverse().find(x => B.isAnswered(x, state)) || hechas.at(-1);
    if (prev) { editing = prev.id; render(); } return;
  }
  const ed = T('[data-editar]'); if (ed) { editing = ed.dataset.editar; if (location.hash.split('?')[0] !== '#/proyecto') location.hash = '#/proyecto' + pParam(); else render(); return; }
  const es = T('[data-editar-signal]'); if (es) { const q = PD.M.questions.find(x => x.signal === es.dataset.editarSignal); if (q) { editing = q.id; location.hash = '#/proyecto' + pParam(); } return; }
  const rs = T('[data-reiniciar]');
  if (rs) { if (rs.dataset.confirmar) { state = B.emptyState(); editing = null; try { localStorage.removeItem(STORE); } catch { /* nada */ } history.replaceState(null, '', '#/proyecto'); avisos = []; render(); } else { rs.dataset.confirmar = '1'; rs.textContent = '¿Seguro? Se borran todas las respuestas. Tocá de nuevo para confirmar'; } return; }
  const cp = T('[data-copiar]'); if (cp) { copiar(textoParaClave(cp.dataset.copiar)); return; }
  const ds = T('[data-descargar]');
  if (ds) { const k = ds.dataset.descargar, { pack } = armarPack(), base = slug(pack.meta.idea || pack.meta.product);
    if (k === 'pack-md') descargar(`project-pack-${base}.md`, packToMarkdown(pack), 'text/markdown'); else if (k === 'pack-json') descargar(`project-pack-${base}.json`, JSON.stringify(pack, null, 2), 'application/json'); else if (k === 'adr-todos') descargar(`adr-${base}.md`, textoParaClave('adr-todos'), 'text/markdown'); return; }
  if (T('[data-copiar-enlace]')) { copiar(location.href, 'Enlace del proyecto copiado.'); }
});
addEventListener('hashchange', () => { render(); });
render();
