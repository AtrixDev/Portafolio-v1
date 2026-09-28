// js/hab.js — Habilidades: mapa de dónde usé cada una, con el tiempo de práctica calculado de la trayectoria real
import { esc, meses, PUESTOS } from './exp-data.js';
import { habilidades } from './hab-data.js';

// Solo los puestos de trabajo, en orden cronológico
const COLS = ['ministerio', 'taki', 'adamas', 'demasled', 'veni', 'propias'].map(id => PUESTOS.find(p => p.id === id));
let AREAS = [], APRENDIENDO = [], todas = [], MAX = 1;

const $ = id => document.getElementById(id);
const practica = s => Object.keys(s.usos || {}).reduce((t, id) => { const p = COLS.find(c => c.id === id); return p ? t + meses(p.desde, p.hasta) : t; }, 0);
const tiempo = m => m >= 12 ? `${(Math.round(m / 12 * 10) / 10).toLocaleString('es-AR')} años` : `${m} meses`;
const fmtA = p => `${new Date(p.desde).getUTCFullYear()}${new Date(p.hasta).getUTCFullYear() !== new Date(p.desde).getUTCFullYear() ? '–' + String(new Date(p.hasta).getUTCFullYear()).slice(2) : ''}`;

function tabla() {
  const head = `<thead><tr><th scope="col" class="hb-sk">Habilidad</th>${COLS.map(c => `<th scope="col"><span>${esc(c.corto)}</span><small>${fmtA(c)}</small></th>`).join('')}<th scope="col" class="hb-pr">Práctica</th></tr></thead>`;
  const body = AREAS.map(a => `<tbody><tr class="hb-area"><th colspan="${COLS.length + 2}" scope="colgroup">${esc(a.area)}</th></tr>${a.skills.map(s => {
    const m = practica(s);
    return `<tr data-id="${s.id}">
      <th scope="row" class="hb-sk"><button type="button" class="hb-name" data-id="${s.id}" aria-pressed="false">${esc(s.n)}</button>
        <span class="hb-chips">${COLS.filter(c => s.usos?.[c.id]).map(c => `<span>${esc(c.corto)}</span>`).join('')}</span></th>
      ${COLS.map(c => { const u = s.usos?.[c.id]; return `<td>${u ? `<button type="button" class="hb-cell" data-id="${s.id}" title="${esc(u[0])}"><span class="hb-dot" aria-hidden="true"></span>${u[1] ? `<b>${esc(u[1])}</b>` : `<span class="sr-only">${esc(u[0])}</span>`}</button>` : '<span class="hb-no" role="img" aria-label="No"></span>'}</td>`; }).join('')}
      <td class="hb-pr"><span class="hb-meter"><i style="--v:${m / MAX}"></i></span><b>${tiempo(m)}</b></td>
    </tr>`; }).join('')}</tbody>`).join('');
  $('hb-map').innerHTML = `<table class="hb-table"><colgroup><col class="c-sk">${COLS.map(() => '<col>').join('')}<col class="c-pr"></colgroup>${head}${body}</table>`;
  $('hb-learn').innerHTML = APRENDIENDO.map(x => `<span>${esc(x)}</span>`).join('');
}

function detalle(id) {
  const s = todas.find(x => x.id === id), m = practica(s);
  document.querySelectorAll('.hb-table tr[data-id]').forEach(tr => tr.classList.toggle('is-on', tr.dataset.id === id));
  document.querySelectorAll('.hb-name').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
  const usos = COLS.filter(c => s.usos?.[c.id]).reverse();
  $('hb-det').innerHTML = `<div class="hb-det-in">
    <header><h3>${esc(s.n)}</h3><p><b>${tiempo(m)}</b> de práctica en ${usos.length} ${usos.length === 1 ? 'puesto' : 'puestos'}</p></header>
    <ol class="hb-uses">${usos.map(c => `<li><span class="hb-when">${esc(c.corto)} · ${fmtA(c)}</span><p>${esc(s.usos[c.id][0])}${s.usos[c.id][1] ? ` <b>${esc(s.usos[c.id][1])}</b>` : ''}</p></li>`).join('')}</ol>
    ${s.tools?.length ? `<p class="hb-tools">${s.tools.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
    <p class="hb-links">${s.lab?.[1] ? `<a class="btn-primary hb-lab" href="${esc(s.lab[1])}">Entender la habilidad: ${esc(s.lab[0])}</a>` : ''}${s.prueba?.[1] ? `<a class="link-arrow hb-proof" href="${esc(s.prueba[1])}">${esc(s.prueba[0])} →</a>` : ''}</p>
  </div>`;
}

function arrancar(guardado) {
  ({ areas: AREAS, aprendiendo: APRENDIENDO } = habilidades(guardado));
  todas = AREAS.flatMap(a => a.skills || []);
  MAX = Math.max(1, ...todas.map(practica));
  tabla(); if (todas.length) detalle(todas[0].id);
}
arrancar(null);
fetch('/api/content').then(r => r.ok ? r.json() : null).then(d => { if (d?.habilidades) arrancar(d.habilidades); }).catch(() => {});
$('hb-map').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b && b.tagName === 'BUTTON') { detalle(b.dataset.id); if (matchMedia('(max-width: 1100px)').matches) $('hb-det').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); } });
