// js/informe.js — Informe de muestra: la auditoría que recibe un vendedor, armada con la cuenta de ejemplo.
// Misma lógica que la pestaña Auditoría del ML Tracker (js/tracker-app.js) y que backend/lib/auditoria-cuenta.js:
// salud por área, problemas del catálogo de diagnóstico (data/ia-meli.json) con plata en juego y plan de 10 acciones.
import { esc } from './exp-data.js';

const $ = id => document.getElementById(id);
const plata = x => '$' + Math.round(x).toLocaleString('es-AR');
const pct = (x, d = 1) => x == null ? '—' : (x * 100).toLocaleString('es-AR', { maximumFractionDigits: d }) + '%';
const fecha = d => new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
const ic = n => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-${n}"/></svg>`;
const ejemplo = '<span class="if-tag">Cuenta de ejemplo</span>';

// Qué publicaciones tienen cada problema del catálogo (igual que en el Tracker)
const DETECTA = {
  exposicion: i => i.clase === 'perdiendo' && i.diagnostico.some(x => x.tipo === 'exposicion'),
  catalogo: i => i.catalogo?.status === 'competing',
  oferta: i => i.clase === 'perdiendo' && i.diagnostico.some(x => x.tipo === 'oferta'),
  'visitas-sin-ventas': i => i.clase === 'visitas_sin_ventas',
  perdida: i => i.status === 'active' && i.rentabilidad?.completo && i.rentabilidad.margen < 0,
  quiebre: i => i.clase === 'sin_stock' || ['quiebre', 'reponer'].includes(i.alertaStock?.tipo),
  inmovilizado: i => i.alertaStock?.tipo === 'inmovilizado',
  calidad: i => i.abc === 'A' && i.calidad?.score != null && i.calidad.score < 60,
  dormida: i => i.clase === 'dormida',
  suba: i => ['subir', 'probar_suba'].includes(i.precio?.accion),
};
const PRIORIDAD = { perdida: 3, quiebre: 3, catalogo: 3, exposicion: 2, oferta: 2, 'visitas-sin-ventas': 2, calidad: 1, inmovilizado: 1, dormida: 1, suba: 1 };
const PRIO_TXT = { 3: 'Urgente', 2: 'Importante', 1: 'Oportunidad' };
const PRIO_TONO = { 3: 'bad', 2: 'warn', 1: 'ok' };
const PRIO_CUANDO = { 3: 'Esta semana', 2: 'Después, en este orden', 1: 'Cuando lo urgente esté resuelto' };

function enJuego(id, items) {
  if (id === 'perdida') return { monto: items.reduce((t, i) => t + -i.rentabilidad.margen * i.actual.unidades, 0), txt: 'perdidos en los últimos 28 días' };
  if (id === 'inmovilizado') return { monto: items.reduce((t, i) => t + (i.stock || 0) * (i.rentabilidad?.costo ?? i.price ?? 0), 0), txt: 'en stock parado' };
  if (id === 'suba') return { monto: items.reduce((t, i) => t + Math.max(0, (i.precio.sugerido || i.price) - i.price) * i.actual.unidades, 0), txt: 'de margen extra posible en 28 días' };
  if (id === 'dormida') return null;
  return { monto: items.reduce((t, i) => t + i.actual.facturacion, 0), txt: 'de facturación expuesta' };
}

function saludCuenta(d) {
  const act = d.items.filter(i => i.status === 'active'), n = act.length || 1;
  const share = f => Math.round(100 * (1 - act.filter(f).length / n));
  const conCosto = act.filter(i => i.rentabilidad?.completo);
  const viejas = (d.preguntas || []).filter(q => q.horas >= 24).length;
  const areas = [
    ['Visibilidad', share(i => DETECTA.exposicion(i) || DETECTA.catalogo(i) || DETECTA.dormida(i)), 'Publicaciones que no pierden exposición ni catálogo'],
    ['Conversión', share(i => DETECTA.oferta(i) || DETECTA['visitas-sin-ventas'](i)), 'Publicaciones que convierten sus visitas'],
    ['Rentabilidad', conCosto.length ? Math.round(100 * conCosto.filter(i => i.rentabilidad.margen >= 0).length / conCosto.length) : null, conCosto.length ? `Publicaciones que dejan ganancia (${conCosto.length} con costo cargado)` : 'Sin costos cargados: no se puede evaluar'],
    ['Stock', share(i => DETECTA.quiebre(i) || DETECTA.inmovilizado(i)), 'Sin quiebres ni stock parado'],
    ['Calidad de fichas', d.resumen.calidadPromedio ?? null, d.resumen.calidadPromedio != null ? 'Promedio del puntaje oficial de Mercado Libre' : 'Sin datos de calidad'],
    ['Atención', Math.max(0, 100 - viejas * 15), viejas ? `${viejas} ${viejas === 1 ? 'pregunta' : 'preguntas'} con más de 24 h sin respuesta` : 'Preguntas respondidas a tiempo'],
  ];
  const con = areas.filter(a => a[1] != null);
  return { areas, total: con.length ? Math.round(con.reduce((t, a) => t + a[1], 0) / con.length) : null };
}
const tono = v => v == null ? 'muted' : v >= 80 ? 'ok' : v >= 60 ? 'warn' : 'bad';
const lectura = v => v == null ? 'Sin datos' : v >= 80 ? 'Bien' : v >= 60 ? 'A mejorar' : 'Flojo';

function render(d, DX) {
  const a = d.resumen.actual, sal = saludCuenta(d);
  const hallazgos = DX.map(x => {
    const items = d.items.filter(i => DETECTA[x.id]?.(i));
    return items.length ? { ...x, items, prio: PRIORIDAD[x.id] || 1, juego: enJuego(x.id, items) } : null;
  }).filter(Boolean);
  // Primero lo urgente y, dentro de cada nivel, lo que más plata mueve (igual que en el Tracker)
  const porPlata = [...hallazgos].sort((x, y) => y.prio - x.prio || (y.juego?.monto || 0) - (x.juego?.monto || 0));
  const max = Math.max(1, ...porPlata.map(h => h.juego?.monto || 0));
  // Plan: una acción por publicación y problema, lo más grave y de más plata primero (igual que en el Tracker)
  const vistos = new Set();
  const plan = [...hallazgos].sort((x, y) => y.prio - x.prio || (y.juego?.monto || 0) - (x.juego?.monto || 0))
    .flatMap(h => h.items.map(i => ({ id: i.id, prio: h.prio, monto: i.actual.facturacion, pub: i.title, prob: h.titulo, accion: h.solucion[0], kpi: h.kpi })))
    .sort((x, y) => y.prio - x.prio || y.monto - x.monto)
    .filter(x => !vistos.has(x.id) && vistos.add(x.id)).slice(0, 10);
  const pubs = new Set(hallazgos.flatMap(h => h.items.map(i => i.id))).size;
  const urgentes = hallazgos.filter(h => h.prio === 3).length;
  const peor = sal.areas.filter(x => x[1] != null).sort((x, y) => x[1] - y[1])[0];
  const caro = porPlata.find(h => h.juego?.monto > 0);  // el urgente que más plata mueve
  const sinEvaluar = [!d.items.some(i => i.rentabilidad?.completo) && 'Rentabilidad: faltan los costos de los productos.', 'Product Ads: la inversión por campaña se revisa aparte, en el panel de publicidad.'].filter(Boolean);

  $('if-meta').textContent = `${d.items.length} publicaciones analizadas · del ${fecha(d.serie.at(-28).d)} al ${fecha(d.hasta)}, contra los 28 días anteriores`;

  let n = 0;
  $('if-body').innerHTML = `
    <section class="if-sec if-resumen" aria-labelledby="if-s0">
      <h3 id="if-s0" class="sr-only">Resumen</h3>
      <p class="if-lead">${hallazgos.length
        ? `Encontré <b>${hallazgos.length} tipos de problema</b> en <b>${pubs} de ${d.items.length} publicaciones</b>. ${urgentes ? `${urgentes === 1 ? 'Uno es urgente' : `${urgentes} son urgentes`} y conviene resolver${urgentes === 1 ? 'lo' : 'los'} esta semana.` : 'Ninguno es urgente.'} La cuenta facturó <b>${plata(a.facturacion)}</b> en los últimos 28 días, con una conversión de ${pct(a.conversion, 2)}.`
        : 'No encontré problemas relevantes: la cuenta se mueve dentro de lo esperado.'}</p>
      ${caro ? `<p class="if-lead-2">Lo primero para resolver: <b>${esc(caro.titulo.toLowerCase())}</b>, con <b>${plata(caro.juego.monto)}</b> ${esc(caro.juego.txt)}.${peor ? ` El área más floja es <b>${esc(peor[0].toLowerCase())}</b> (${peor[1]}/100).` : ''}</p>` : ''}
    </section>

    <section class="if-sec" aria-labelledby="if-s1">
      <div class="if-sec-h"><h3 id="if-s1"><span class="if-n">${++n}</span>Salud por área</h3>${ejemplo}</div>
      <div class="if-salud">
        <div class="if-total" data-tono="${tono(sal.total)}">
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" class="tr"/><circle cx="60" cy="60" r="50" class="ar" pathLength="100" style="--v:${sal.total ?? 0}"/></svg>
          <p><b>${sal.total ?? '—'}</b><span>/100</span></p>
          <small>Salud de la cuenta: el promedio de las 6 áreas</small>
        </div>
        <ul class="if-areas">${sal.areas.map(([t, v, s]) => `
          <li data-tono="${tono(v)}">
            <span class="if-a-t">${esc(t)}</span>
            <span class="if-bar" aria-hidden="true"><i style="--v:${(v ?? 0) / 100}"></i></span>
            <b class="if-a-v">${v ?? '—'}<span class="sr-only"> de 100</span></b>
            <span class="if-a-l">${lectura(v)}</span>
            <small>${esc(s)}</small>
          </li>`).join('')}</ul>
      </div>
    </section>

    <section class="if-sec" aria-labelledby="if-s2">
      <div class="if-sec-h"><h3 id="if-s2"><span class="if-n">${++n}</span>Los problemas que más plata cuestan</h3>${ejemplo}</div>
      <p class="if-sub">Primero lo urgente y, dentro de cada nivel, lo que más plata mueve. Los montos no se suman entre sí: una misma publicación puede tener más de un problema.</p>
      <ol class="if-hall">${porPlata.map(h => `
        <li class="if-h">
          <div class="if-h-top">
            <span class="if-chip" data-tono="${PRIO_TONO[h.prio]}">${PRIO_TXT[h.prio]}</span>
            <h4>${esc(h.titulo)}</h4>
            <span class="if-h-n">${h.items.length} ${h.items.length === 1 ? 'publicación' : 'publicaciones'}</span>
          </div>
          ${h.juego?.monto > 0
            ? `<p class="if-plata"><b>${plata(h.juego.monto)}</b><span>${esc(h.juego.txt)}</span></p><span class="if-mbar" aria-hidden="true"><i style="--v:${h.juego.monto / max}"></i></span>`
            : '<p class="if-plata is-sin"><span>Sin monto directo: casi no tienen visitas, así que no facturan.</span></p>'}
          <p class="if-pubs">${h.items.slice(0, 3).map(i => esc(i.title)).join(' · ')}${h.items.length > 3 ? ` y ${h.items.length - 3} más` : ''}</p>
          <dl class="if-dl">
            <div><dt>Cómo lo detecté</dt><dd>${esc(h.regla)}</dd></div>
            <div><dt>Qué hacer</dt><dd>${esc(h.solucion.slice(0, 2).join('. '))}.</dd></div>
          </dl>
        </li>`).join('') || '<li class="if-h">Sin hallazgos.</li>'}</ol>
    </section>

    <section class="if-sec" aria-labelledby="if-s3">
      <div class="if-sec-h"><h3 id="if-s3"><span class="if-n">${++n}</span>Plan de acción, en orden</h3>${ejemplo}</div>
      <p class="if-sub">Una acción por publicación: la más grave y la que más factura, primero. Cada paso dice cómo te das cuenta de que quedó resuelto.</p>
      ${plan.length ? [3, 2, 1].filter(p => plan.some(x => x.prio === p)).map(p => `
        <div class="if-fase" data-tono="${PRIO_TONO[p]}">
          <p class="if-fase-t"><span class="if-chip" data-tono="${PRIO_TONO[p]}">${PRIO_TXT[p]}</span>${PRIO_CUANDO[p]}</p>
          <ol class="if-plan" start="${plan.findIndex(x => x.prio === p) + 1}" style="counter-reset:paso ${plan.findIndex(x => x.prio === p)}">${plan.filter(x => x.prio === p).map(x => `
            <li><p class="if-p-pub">${esc(x.pub)}</p><p class="if-p-acc"><b>${esc(x.prob)}.</b> ${esc(x.accion)}.</p><p class="if-p-kpi">${ic('check')}Resuelto cuando: ${esc(x.kpi.charAt(0).toLowerCase() + x.kpi.slice(1))}.</p></li>`).join('')}</ol>
        </div>`).join('') : '<p class="if-sub">No hay acciones urgentes.</p>'}
    </section>

    ${sinEvaluar.length ? `<section class="if-sec if-no" aria-labelledby="if-s4">
      <div class="if-sec-h"><h3 id="if-s4">Qué no entra en este informe</h3></div>
      <ul>${sinEvaluar.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    </section>` : ''}

    <footer class="if-doc-foot">
      <p>Datos de la cuenta de ejemplo del ML Tracker: 13 publicaciones simuladas que muestran casos típicos. En tu informe, los datos salen de la API oficial de Mercado Libre. La detección usa las reglas públicas del <a href="sistema.html#diagnostico">catálogo de diagnóstico</a> y las caídas se validan con pruebas estadísticas.</p>
    </footer>`;
  $('informe').setAttribute('aria-busy', 'false');
}

function fallo() {
  $('if-meta').textContent = 'No pude cargar la cuenta de ejemplo.';
  $('if-body').innerHTML = `<div class="if-err" role="status">${ic('alert')}<p>Se cortó la conexión y no pude armar el informe. <button type="button" class="if-link" id="if-retry">Probar de nuevo</button> o mirá la <a href="sistema.html#demo">demo del ML Tracker</a>.</p></div>`;
  $('informe').setAttribute('aria-busy', 'false');
  $('if-retry').addEventListener('click', cargar);
}

async function cargar() {
  $('if-body').innerHTML = '<div class="if-load" aria-hidden="true"><span></span><span></span><span></span></div>';
  $('informe').setAttribute('aria-busy', 'true');
  try {
    const [d, dx] = await Promise.all([
      fetch('/api/tracker?action=demo').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch('data/ia-meli.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
    ]);
    render(d, dx.diagnostico || []);
  } catch (e) { fallo(); }
}

document.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));
cargar();
