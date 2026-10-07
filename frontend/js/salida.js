// js/salida.js — bloque de salida común de las herramientas (F0: funcional, sin pulir).
// El resultado ya se mostró antes: acá solo se ofrece guardarlo/compartirlo y, después, recibirlo por mail.
import { esc } from './exp-data.js';

const API = '/api/herramientas';
const WA = '541144474507';

export const linkResultado = id => `${location.origin}/herramientas.html?r=${encodeURIComponent(id)}`;

// ÚNICO renderizador de un resultado: el que se ve en vivo y el que abre el link compartido (?r=) pasan por acá.
export function renderResumen(r) {
  const rs = r.resumen || {};
  const fila = p => `<li class="${p.ok === true ? 'ok' : p.ok === false ? 'bad' : ''}"><b>${esc(p.t)}</b><span>${esc(p.s || '')}</span></li>`;
  return `${rs.etiqueta ? `<p class="hd-tag">${esc(rs.etiqueta)}${rs.cobertura ? ` · ${rs.cobertura.verificados} de ${rs.cobertura.total} criterios verificados` : ''}</p>` : ''}
    <p class="hd-strong">${esc(rs.titulo || 'Resultado')}</p>${rs.veredicto ? `<p class="hd-soft">${esc(rs.veredicto)}</p>` : ''}
    ${(rs.puntos || []).length ? `<ul class="hd-rows">${rs.puntos.map(fila).join('')}</ul>` : ''}
    ${(rs.noVerificado || []).length ? `<p class="hd-strong">Lo que no pude ver</p><ul class="hd-rows">${rs.noVerificado.map(p => `<li><b>${esc(p.t)}</b><span>${esc(p.s || '')}</span></li>`).join('')}</ul>` : ''}`;
}
export const vistaResultado = r => `<div class="hd-resumen">${renderResumen(r)}</div>`;

export function mostrarSalida(el, { resultadoId, herramienta, titulo }) {
  const box = document.createElement('div');
  box.className = 'hd-salida';
  const link = linkResultado(resultadoId);
  const wa = `https://wa.me/${WA}?text=${encodeURIComponent(`Hola Darío, usé tu herramienta (${herramienta}) y quiero charlar el resultado: ${link}`)}`;
  box.innerHTML = `<p class="hd-strong">Guardá o compartí este resultado</p>
    <p class="hd-soft">Este link abre exactamente lo que ves ahora y dura 90 días.</p>
    <p><button type="button" class="btn-secondary" data-copiar>Copiar link</button> <a class="btn-secondary" href="${wa}" target="_blank" rel="noopener">Charlarlo por WhatsApp</a></p>
    <form class="hd-form" data-lead novalidate>
      <label for="hs-mail">¿Querés que te lo mande por mail?</label>
      <div><input id="hs-mail" name="email" type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com" required>
      <button type="submit" class="btn-primary">Mandámelo</button></div>
      <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
    </form><p class="hd-soft" data-estado aria-live="polite"></p>`;
  el.appendChild(box);

  const estado = box.querySelector('[data-estado]');
  box.querySelector('[data-copiar]').addEventListener('click', async e => {
    try { await navigator.clipboard.writeText(link); e.target.textContent = 'Link copiado'; } catch { prompt('Copiá este link:', link); }
    fetch(`${API}?action=evento`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ herramienta, evento: 'compartir' }) }).catch(() => {});
  });
  box.querySelector('[data-lead]').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, b = f.querySelector('button');
    if (!f.email.value.trim()) { estado.textContent = 'Poné tu email para mandártelo.'; f.email.focus(); return; }
    b.disabled = true; estado.textContent = 'Enviando…';
    try {
      const r = await fetch(`${API}?action=lead`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultadoId, email: f.email.value, website: f.website.value }), signal: AbortSignal.timeout(15000) });
      const d = await r.json().catch(() => ({}));
      estado.textContent = !r.ok ? (d.error || 'No pude enviarlo. Probá de nuevo.')
        : d.enviado ? 'Listo: te lo mandé. Si no lo ves, mirá en spam.' : 'Listo: quedó guardado y te escribo yo con el resultado.';
      if (r.ok) f.reset();
    } catch { estado.textContent = 'Se cortó la conexión. Probá de nuevo.'; }
    b.disabled = false;
  });
}
