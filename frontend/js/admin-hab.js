// js/admin-hab.js — Admin: editor de Habilidades (se guarda en /api/content → habilidades)
// Cada habilidad: nombre, en qué puestos la usé (texto + dato), herramientas, prueba y guía del Lab.
import { PUESTOS, esc } from './exp-data.js';
import { AREAS, APRENDIENDO, habilidades } from './hab-data.js';

const COLS = ['ministerio', 'taki', 'adamas', 'demasled', 'veni', 'propias'].map(id => PUESTOS.find(p => p.id === id));
const $ = id => document.getElementById(id);
const raiz = $('hab-editor');
let D = { areas: [], aprendiendo: [] };
const copia = x => JSON.parse(JSON.stringify(x));
const slug = t => (t || 'habilidad').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'h' + Date.now();

function skillHTML(s, ai, si, n) {
  return `<details class="he-skill" data-a="${ai}" data-s="${si}">
    <summary><b>${esc(s.n || 'Nueva habilidad')}</b><span>${COLS.filter(c => s.usos?.[c.id]).map(c => esc(c.corto)).join(' · ') || 'sin puestos'}</span>
      <span class="he-ord"><button type="button" data-act="up" ${si === 0 ? 'disabled' : ''} aria-label="Subir"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-arrow-up"/></svg></button><button type="button" data-act="down" ${si === n - 1 ? 'disabled' : ''} aria-label="Bajar" class="pf-abajo"><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-arrow-up"/></svg></button></span></summary>
    <div class="he-body">
      <label class="cp-field"><span>Nombre</span><input data-f="n" value="${esc(s.n)}"></label>
      <fieldset class="he-usos"><legend>Dónde la usé</legend>
        ${COLS.map(c => { const u = s.usos?.[c.id]; return `<div class="he-uso">
          <label class="he-chk"><input type="checkbox" data-uso="${c.id}" ${u ? 'checked' : ''}>${esc(c.corto)}</label>
          <input data-ut="${c.id}" placeholder="Qué hice con esta habilidad ahí" value="${esc(u?.[0] || '')}" ${u ? '' : 'disabled'}>
          <input data-ud="${c.id}" placeholder="Dato (opcional): +200, ACOS 30% → 12%…" value="${esc(u?.[1] || '')}" ${u ? '' : 'disabled'}>
        </div>`; }).join('')}
      </fieldset>
      <label class="cp-field"><span>Herramientas (separadas por coma)</span><input data-f="tools" value="${esc((s.tools || []).join(', '))}"></label>
      <div class="he-2"><label class="cp-field"><span>Prueba: texto</span><input data-f="p0" value="${esc(s.prueba?.[0] || '')}"></label><label class="cp-field"><span>Prueba: link</span><input data-f="p1" value="${esc(s.prueba?.[1] || '')}"></label></div>
      <div class="he-2"><label class="cp-field"><span>Guía del Lab: texto</span><input data-f="l0" value="${esc(s.lab?.[0] || '')}"></label><label class="cp-field"><span>Guía del Lab: link</span><input data-f="l1" value="${esc(s.lab?.[1] || '')}"></label></div>
      <button type="button" class="he-del" data-act="del">Eliminar esta habilidad</button>
    </div></details>`;
}
function pintar() {
  raiz.innerHTML = `${D.areas.map((a, ai) => `<section class="cp-card he-area" data-a="${ai}">
      <div class="he-area-top"><label class="cp-field"><span>Área</span><input data-area="${ai}" value="${esc(a.area)}"></label><button type="button" class="he-del" data-act="delarea">Eliminar área</button></div>
      ${(a.skills || []).map((s, si) => skillHTML(s, ai, si, a.skills.length)).join('')}
      <button type="button" class="btn-secondary he-add" data-act="add">+ Agregar habilidad</button>
    </section>`).join('')}
    <button type="button" class="btn-secondary" data-act="addarea">+ Agregar área</button>
    <label class="cp-field he-learn"><span>Aprendiendo ahora (una por línea)</span><textarea rows="5" id="he-learn">${esc(D.aprendiendo.join('\n'))}</textarea></label>`;
}
// Lee el formulario de vuelta a los datos
function leer() {
  raiz.querySelectorAll('[data-area]').forEach(i => { D.areas[+i.dataset.area].area = i.value.trim(); });
  raiz.querySelectorAll('.he-skill').forEach(el => {
    const s = D.areas[+el.dataset.a].skills[+el.dataset.s], f = k => el.querySelector(`[data-f="${k}"]`).value.trim();
    s.n = f('n'); s.id ||= slug(s.n);
    s.tools = f('tools').split(',').map(x => x.trim()).filter(Boolean);
    s.prueba = f('p0') && f('p1') ? [f('p0'), f('p1')] : null;
    s.lab = f('l0') && f('l1') ? [f('l0'), f('l1')] : null;
    s.usos = {};
    COLS.forEach(c => { if (el.querySelector(`[data-uso="${c.id}"]`).checked) { const t = el.querySelector(`[data-ut="${c.id}"]`).value.trim(), d = el.querySelector(`[data-ud="${c.id}"]`).value.trim(); s.usos[c.id] = d ? [t, d] : [t]; } });
  });
  const l = $('he-learn'); if (l) D.aprendiendo = l.value.split('\n').map(x => x.trim()).filter(Boolean);
}
raiz.addEventListener('change', e => {
  const c = e.target.closest('[data-uso]'); if (!c) return;
  const box = c.closest('.he-uso'); box.querySelectorAll('input:not([type=checkbox])').forEach(i => { i.disabled = !c.checked; });
});
raiz.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  e.preventDefault(); leer();
  const sk = b.closest('.he-skill'), ar = b.closest('.he-area');
  const ai = sk ? +sk.dataset.a : ar ? +ar.dataset.a : -1, si = sk ? +sk.dataset.s : -1, lista = ai >= 0 ? D.areas[ai].skills : null;
  if (b.dataset.act === 'up' && si > 0) [lista[si - 1], lista[si]] = [lista[si], lista[si - 1]];
  if (b.dataset.act === 'down' && si < lista.length - 1) [lista[si + 1], lista[si]] = [lista[si], lista[si + 1]];
  if (b.dataset.act === 'del' && confirm('¿Eliminar esta habilidad?')) lista.splice(si, 1);
  if (b.dataset.act === 'add') lista.push({ id: 'h' + Date.now(), n: '', usos: {}, tools: [] });
  if (b.dataset.act === 'addarea') D.areas.push({ area: 'Nueva área', skills: [] });
  if (b.dataset.act === 'delarea' && confirm('¿Eliminar el área y todas sus habilidades?')) D.areas.splice(ai, 1);
  pintar();
  if (b.dataset.act === 'add') raiz.querySelectorAll(`.he-skill[data-a="${ai}"]`).forEach((d, i, all) => { if (i === all.length - 1) { d.open = true; d.querySelector('[data-f="n"]').focus(); } });
});

async function guardar(datos, msg) {
  let token = ''; try { token = sessionStorage.getItem('dc_token') || ''; } catch (e) { /* sin almacenamiento */ }
  const r = await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ habilidades: datos }) });
  const t = $('hab-msg'); t.hidden = false;
  t.textContent = r.ok ? msg : r.status === 401 ? 'La sesión venció: volvé a entrar.' : 'No se pudo guardar. Probá de nuevo.';
  t.dataset.tono = r.ok ? 'ok' : 'bad';
}
$('hab-save').addEventListener('click', () => { leer(); guardar(D, 'Guardado. Ya se ve en la web.'); });
$('hab-reset').addEventListener('click', () => { if (!confirm('¿Volver a los valores originales? Se pierden tus cambios.')) return; D = copia({ areas: AREAS, aprendiendo: APRENDIENDO }); pintar(); guardar(null, 'Listo: la web vuelve a mostrar los valores originales.'); });

fetch('/api/content').then(r => r.ok ? r.json() : {}).catch(() => ({})).then(c => { D = copia(habilidades(c.habilidades)); pintar(); });
