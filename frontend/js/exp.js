// js/exp.js — Trayectoria: línea de tiempo a escala + expediente de cada puesto
// Cada puesto trae solo el material que tiene; nada inventado.
import { PUBS } from './exp-pubs.js';
import { HOY, esc, vend, pos, meses, dur, PUESTOS } from './exp-data.js';

const $ = id => document.getElementById(id);
const scale = $('xp-scale'), file = $('xp-file');

function bar(p) {
  const x = p.slot ? p.slot[0] : pos(p.desde), w = p.slot ? p.slot[1] - p.slot[0] : Math.max(pos(p.hasta) - x, 6);
  const m = meses(p.desde, p.hasta);
  const cls = ['xp-bar', p.ahora && 'is-now', p.proximo && 'is-next'].filter(Boolean).join(' ');
  return `<button class="${cls}" role="tab" id="xp-t-${p.id}" aria-controls="xp-file" aria-selected="false" tabindex="-1" style="--x:${x}%;--w:${Math.min(w, 100 - x)}%" data-id="${p.id}">
    <b>${esc(p.corto)}</b><small>${p.proximo ? 'en curso' : dur(m)}</small></button>`;
}
function escala() {
  const ticks = ['2023', '2024', '2025', '2026'].map(a => `<span style="left:${pos(a + '-01-01')}%">${a}</span>`).join('') + `<span style="left:7%">2018–22</span>`;
  const lanes = [['Trabajo', 0], ['Formación', 1]].map(([k, c]) =>
    `<div class="xp-lane"><span class="xp-lane-k">${k}</span><div class="xp-track">${PUESTOS.filter(p => p.carril === c).map(bar).join('')}${c === 0 ? `<span class="xp-gap" style="left:15%">//</span>` : ''}</div></div>`).join('');
  scale.innerHTML = `<div class="xp-scale-in" style="--xp-lead-w:6.5rem;--xp-rows:2">
    <div class="xp-axis" style="margin-left:6.5rem">${ticks}</div>
    <div class="xp-lanes" role="tablist" aria-label="Puestos">${lanes}
      <div class="xp-today" style="left:calc(6.5rem + (100% - 6.5rem) * ${pos(HOY) / 100})"><span>hoy</span></div>
    </div></div>`;
}

function expediente(p) {
  const m = meses(p.desde, p.hasta);
  const fmt = f => new Date(f).toLocaleDateString('es-AR', { month: 'short', year: 'numeric', timeZone: 'UTC' }).replace('.', '');
  const izq = [], der = [];
  if (p.alcance?.length) izq.push(`<div><p class="xp-k">Alcance</p><div class="xp-scope">${p.alcance.map(([n, t]) => `<div><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('')}</div></div>`);
  if (p.marcas) izq.push(`<div><p class="xp-k">Marcas que manejé</p><p class="xp-brands">${p.marcas.map(x => `<span>${esc(x)}</span>`).join('')}${p.otras.map(x => `<span class="is-minor">${esc(x)}</span>`).join('')}</p></div>`);
  izq.push(`<div><p class="xp-k">Qué hice</p><ul class="xp-did">${p.hizo.map(h => `<li>${h}</li>`).join('')}</ul></div>`);
  if (p.tools) izq.push(`<div><p class="xp-k">Con qué</p><p class="xp-tools">${p.tools.map(t => `<span>${esc(t)}</span>`).join('')}</p></div>`);
  if (p.cta) izq.push(`<p class="xp-cta">${p.cta.map(([t, u], i) => `<a class="${i ? 'btn-secondary' : 'btn-primary'}" href="${u}">${esc(t)}</a>`).join('')}</p>`);

  if (p.resultado) der.push(`<div><p class="xp-k">Resultado, medido en el panel</p><div class="xp-res">${p.resultado.map(r => r.antes != null
      ? `<div class="xp-row"><span>${r.k} antes</span><span class="xp-meter"><i class="was" style="--v:${r.antes / r.max}"></i></span><b>${r.antes}%</b></div><div class="xp-row"><span>${r.k} después</span><span class="xp-meter"><i style="--v:${r.ahora / r.max}"></i></span><b>${r.ahora}%</b></div>`
      : `<div class="xp-row"><span>${r.k}</span><span class="xp-meter"><i style="--v:${r.crece / 50}"></i></span><b>${r.txt}</b></div>`).join('')}</div>
      <p class="xp-src">Junio a noviembre de 2025 contra el período anterior.</p></div>`);
  if (p.pubs) {
    const lista = [...PUBS].sort((a, b) => b.v - a.v);
    der.push(`<div><p class="xp-k">Publicaciones que creé o rehíce, entre las más vendidas de la tienda</p>
      <div class="xp-wall">${lista.map((x, i) => `<a class="xp-pub${i < 2 ? ' is-top' : ''}" href="${esc(x.u)}" target="_blank" rel="noopener" title="${esc(x.t)}"><img src="${esc(x.img)}" alt="${esc(x.t)}" loading="lazy" width="200" height="200"><span>${vend(x.v)}</span></a>`).join('')}</div>
      <p class="xp-wall-note">Vendidos históricos que muestra Mercado Libre en cada publicación. Tocá una para verla.</p></div>`);
  }
  if (p.pruebas) der.push(`<div><p class="xp-k">Capturas del panel</p><div class="xp-proofs">${p.pruebas.map(([src, alt]) => `<button type="button" class="xp-proof" data-src="${src}" aria-label="Ampliar: ${esc(alt)}"><img src="${src}" alt="${esc(alt)}" loading="lazy"></button>`).join('')}</div><p class="xp-src">Montos en pesos difuminados: la facturación de la empresa es confidencial.</p></div>`);
  if (p.flujo) der.push(`<div><p class="xp-k">Lo que armé: monitor de precios de la competencia</p><ol class="xp-flow">${p.flujo.map(([t, d]) => `<li><b>${esc(t)}</b>${esc(d)}</li>`).join('')}</ol></div>`);
  if (p.sistemas) der.push(`<div><p class="xp-k">Problemas que ya resuelvo · probá cualquiera gratis</p><ul class="xp-sys">${p.sistemas.map(([q, n, d, u]) => `<li><a href="${u}"><span class="xp-q">${esc(q)}</span><b><span class="xp-on" aria-hidden="true"></span>${esc(n)}</b><span>${esc(d)}</span><em>Probalo gratis →</em></a></li>`).join('')}</ul></div>`);
  if (p.conecta) der.push(`<div class="xp-hoy"><p class="xp-k">Cómo lo uso hoy</p><p>${esc(p.conecta[0])}</p><a class="link-arrow" href="${p.conecta[2]}">${esc(p.conecta[1])} →</a></div>`);
  if (p.fuente) der.push(`<p class="xp-src">Fuente: <a href="${p.fuente[1]}" target="_blank" rel="noopener">${esc(p.fuente[0])}</a></p>`);
  if (p.aporte) der.push(`<div><p class="xp-k">Qué me dejó</p><p style="font-size:1.05rem">${esc(p.aporte)}</p></div>`);
  if (!p.resultado && !p.pubs && !p.flujo && !p.sistemas && !p.conecta) der.push(`<p class="xp-empty">De este puesto no tengo capturas públicas: los datos son de las cuentas de los clientes.</p>`);

  return `<div class="xp-file-in">
    <header class="xp-top">
      <div><h3 class="xp-co">${esc(p.co)}</h3><p class="xp-role">${esc(p.rol)}</p><span class="xp-type">${esc(p.tipo)}</span></div>
      <p class="xp-when"><b>${p.proximo ? 'En curso' : p.ahora ? 'Actual' : dur(m)}</b>${fmt(p.desde)} – ${p.ahora ? 'hoy' : p.proximo ? '2029' : fmt(p.hasta)}</p>
    </header>
    ${p.desafio ? `<div class="xp-ps"><div><p class="xp-k">El desafío</p><p>${esc(p.desafio)}</p></div><span class="xp-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span><div><p class="xp-k">Cómo lo resolví</p><p>${esc(p.solucion)}</p></div></div>` : ''}
    <div class="xp-body"><div class="xp-col">${izq.join('')}</div><div class="xp-col">${der.join('')}</div></div>
  </div>`;
}

let actual = null;
function abrir(id, animar) {
  const p = PUESTOS.find(x => x.id === id); if (!p || id === actual) return;
  actual = id;
  scale.querySelectorAll('.xp-bar').forEach(b => { const on = b.dataset.id === id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
  file.setAttribute('aria-labelledby', 'xp-t-' + id);
  const pintar = () => { file.innerHTML = expediente(p); requestAnimationFrame(() => file.classList.remove('is-swapping')); };
  if (animar && !matchMedia('(prefers-reduced-motion: reduce)').matches) { file.classList.add('is-swapping'); setTimeout(pintar, 160); } else { file.classList.add('is-swapping'); pintar(); }
}

escala();
abrir(PUESTOS.find(p => p.id === location.hash.slice(1)) ? location.hash.slice(1) : 'propias', false);
scale.addEventListener('click', e => { const b = e.target.closest('.xp-bar'); if (b) abrir(b.dataset.id, true); });
scale.addEventListener('keydown', e => {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
  e.preventDefault();
  const i = PUESTOS.findIndex(p => p.id === actual), p = PUESTOS[(i + d + PUESTOS.length) % PUESTOS.length];
  abrir(p.id, true); $('xp-t-' + p.id).focus();
});
const dlg = $('xp-dialog');
file.addEventListener('click', e => { const b = e.target.closest('.xp-proof'); if (!b) return; dlg.querySelector('img').src = b.dataset.src; dlg.querySelector('img').alt = b.querySelector('img').alt; dlg.showModal(); });
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
