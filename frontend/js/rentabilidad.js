// js/rentabilidad.js — la calculadora de rentabilidad (rentabilidad.html). Orquesta: formulario → motor → pantalla → servidor.
//
// ARQUITECTURA (ver backend/lib/motor/LEEME.md):
//   formulario → rentabilidad-form.js (puro) → entrada → MOTOR (js/motor/, la misma fuente que usa el servidor) → rentabilidad-render.js (puro) → pantalla
//   «Guardar» → POST /api/herramientas?action=calcular { entrada } → el SERVIDOR recalcula, guarda y devuelve el link (?r=).
// Acá no hay NINGUNA fórmula económica: cada número sale de una llamada al motor o de la respuesta del servidor.
// Los resultados compartidos se muestran con lo que se guardó, sin recalcular.
import { evaluar } from './motor/economia.js';
import { resolverObjetivos } from './motor/inversas.js';
import { compararEscenarios, escenariosTipicos } from './motor/escenarios.js';
import * as V from './motor/vista.js';
import { MOTOR_VERSION } from './motor/version.js';
import { parsearNumero } from './num-ar.js';
import { valoresVacios, EJEMPLO, construirEntrada, aValores, campoAControl } from './rentabilidad-form.js';
import { htmlVacio, htmlIncompleto, htmlRevisar, htmlResultado, htmlEscenarios, htmlCompartido, esc, textoMotor } from './rentabilidad-render.js';
import { mostrarSalida } from './salida.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const form = $('#rt-form'), panel = $('#rt-res'), MAX_EXTRAS = 20, MAX_TRAMOS = 10;
const AYUDA_REGIMEN = {
  monotributo: 'No discriminás IVA: el IVA de lo que comprás y de los cargos del canal es un costo para vos.',
  ri: 'El IVA que cobrás en la venta no es tuyo y el IVA de tus compras y de los cargos lo recuperás.',
  sin_iva: 'No se aplica ningún tratamiento de IVA: se calcula con los montos tal cual.',
};

// ── estado ──
let ultimo = null;             // último cálculo VÁLIDO hecho en vivo: { entrada, r, o, mapa }
let guardado = null;           // lo que se guardó en el servidor: { id, huella }
let compartido = null;         // resultado compartido que se está mirando (modo lectura)
let precioPrueba = null;       // precio que la persona quiso probar en los escenarios
let mapaActual = { extras: [], fijo: [], envio: [] };
const modoMonto = { fijo: 'valor', envio: 'valor' };
let timer = null, timerAnuncio = null, htmlPanel = '';

// ═══ formulario ↔ valores ═══
/** Escribe el HTML del panel solo si cambió (evita redibujar en cada blur). */
function pintar(html) { if (html === htmlPanel) return; htmlPanel = html; panel.innerHTML = html; }
const filasTramos = m => $$(`[data-tramos="${m}"] .rt-tramo`);
function leer() {
  const v = valoresVacios(), val = n => form.elements[n]?.value ?? '', radio = n => form.querySelector(`input[name="${n}"]:checked`)?.value ?? '';
  for (const k of ['precio', 'costo', 'unidades', 'ivaProducto', 'ventaPct', 'financiacionPct', 'acos', 'ventasPorAds', 'impuestos', 'devoluciones', 'objMargen', 'objGanancia', 'objMes', 'fijosMes']) v[k] = val(k);
  Object.assign(v, { costoIva: radio('costoIva'), regimen: radio('regimen'), canalIva: radio('canalIva'), adsBase: radio('adsBase'), adsIva: radio('adsIva') });
  for (const m of ['fijo', 'envio']) {
    v[m] = { modo: modoMonto[m], valor: val(m), tramos: filasTramos(m).map(f => ({ hasta: f.querySelector('[data-h]')?.value ?? '', monto: f.querySelector('[data-m]').value })) };
  }
  v.extras = $$('#rt-extras .rt-extra').map(f => ({ nombre: f.querySelector('[data-n]').value, monto: f.querySelector('[data-m]').value, iva: f.querySelector('input[type=radio]:checked')?.value ?? '' }));
  return v;
}

const errTramo = (n, i) => `<p class="rt-err" data-err="${n}-${i}" hidden></p>`;
function dibujarTramos(m, tramos) {
  const ult = tramos.length - 1;
  $(`[data-tramos="${m}"]`).innerHTML = `<p class="rt-ayuda">Cada tramo vale hasta ese precio de venta. El último vale de ahí en adelante.</p>`
    + tramos.map((t, i) => `<div class="rt-tramo">
      ${i === ult ? '<span class="rt-tramo-t">Desde ahí en adelante</span>' : `<label><span>Hasta</span><span class="rt-in rt-in-sm"><i aria-hidden="true">$</i><input data-h name="${m}Hasta-${i}" inputmode="decimal" value="${esc(t.hasta)}"></span></label>`}
      <label><span>Cuesta</span><span class="rt-in rt-in-sm"><i aria-hidden="true">$</i><input data-m name="${m}Monto-${i}" inputmode="decimal" value="${esc(t.monto)}"></span></label>
      ${tramos.length > 2 ? `<button type="button" class="rt-link" data-accion="tramo-quitar" data-para="${m}" data-i="${i}">Quitar</button>` : ''}
      ${i === ult ? '' : errTramo(m + 'Hasta', i)}${errTramo(m + 'Monto', i)}</div>`).join('')
    + (tramos.length < MAX_TRAMOS ? `<button type="button" class="rt-link" data-accion="tramo-mas" data-para="${m}">Agregar un tramo</button>` : '');
}
function ponerModoMonto(m, modo) {
  modoMonto[m] = modo;
  const caja = $(`[data-monto="${m}"]`);
  caja.querySelector('[data-tramos]').hidden = modo !== 'tramos';
  caja.querySelector('label.rt-campo').hidden = modo === 'tramos';
  const b = caja.querySelector('[data-accion="modo-monto"]'); b.setAttribute('aria-expanded', String(modo === 'tramos'));
  b.textContent = modo === 'tramos' ? `Es un monto fijo` : 'Cambia según el precio de venta';
}

function dibujarExtras(extras) {
  $('#rt-extras').innerHTML = extras.map((x, i) => `<div class="rt-extra">
    <label><span>Qué es</span><input data-n name="extraNombre-${i}" maxlength="60" value="${esc(x.nombre)}"></label>
    <label><span>Cuánto</span><span class="rt-in rt-in-sm"><i aria-hidden="true">$</i><input data-m name="extraMonto-${i}" inputmode="decimal" value="${esc(x.monto)}"></span></label>
    <div class="rt-seg" role="radiogroup" aria-label="IVA del costo adicional ${i + 1}" data-grupo="extraIva-${i}"><label><input type="radio" name="extraIva-${i}" value="si"${x.iva === 'si' ? ' checked' : ''}><span>Con IVA</span></label><label><input type="radio" name="extraIva-${i}" value="no"${x.iva === 'no' ? ' checked' : ''}><span>Sin IVA</span></label></div>
    <button type="button" class="rt-link" data-accion="extra-quitar" data-i="${i}">Quitar</button>
    <p class="rt-err" data-err="extraMonto-${i}" hidden></p><p class="rt-err" data-err="extraIva-${i}" hidden></p></div>`).join('');
  $('[data-accion="extra-mas"]').hidden = extras.length >= MAX_EXTRAS;
}

function escribir(v) {
  for (const k of ['precio', 'costo', 'unidades', 'ivaProducto', 'ventaPct', 'financiacionPct', 'acos', 'ventasPorAds', 'impuestos', 'devoluciones', 'objMargen', 'objGanancia', 'objMes', 'fijosMes']) form.elements[k].value = v[k];
  for (const [n, valor] of [['costoIva', v.costoIva], ['regimen', v.regimen], ['canalIva', v.canalIva], ['adsBase', v.adsBase], ['adsIva', v.adsIva]])
    $$(`input[name="${n}"]`).forEach(r => { r.checked = r.value === valor; });
  for (const m of ['fijo', 'envio']) { form.elements[m].value = v[m].valor; dibujarTramos(m, v[m].tramos); ponerModoMonto(m, v[m].modo); }
  dibujarExtras(v.extras);
  textoRegimen();
  marcarGrupos(true);
  bloquear(Boolean(compartido));
}
function textoRegimen() { $('#rt-ayuda-regimen').textContent = AYUDA_REGIMEN[form.querySelector('input[name="regimen"]:checked')?.value] ?? ''; }

/** Marca (y, si se pide, abre) los grupos desplegables que tienen datos. */
function marcarGrupos(abrir = false) {
  const v = leer();
  const lleno = { 'g-publicidad': [v.acos, v.ventasPorAds, v.adsBase, v.adsIva], 'g-impuestos': [v.impuestos, v.devoluciones], 'g-extras': v.extras.map(x => x.monto || x.nombre), 'g-objetivos': [v.objMargen, v.objGanancia, v.objMes, v.fijosMes] };
  for (const [id, campos] of Object.entries(lleno)) {
    const d = $('#' + id), con = campos.some(x => String(x ?? '').trim() !== '');
    d.querySelector('.rt-lleno').hidden = !con;
    if (abrir && con) d.open = true;
  }
}
function bloquear(si) {
  form.classList.toggle('is-lectura', si);
  $$('#rt-form input, #rt-form .rt-link, #rt-form .btn-secondary').forEach(el => { el.disabled = si; });
}

// ═══ errores junto a cada campo ═══
function limpiarErrores() {
  $$('[data-err]').forEach(p => { p.hidden = true; p.textContent = ''; });
  $$('#rt-form [aria-invalid]').forEach(c => c.removeAttribute('aria-invalid'));
}
function marcarError(control, texto) {
  if (!control) return;
  const p = $(`[data-err="${CSS.escape(control)}"]`);
  if (p) { p.textContent = texto; p.hidden = false; }
  $$(`[name="${CSS.escape(control)}"]`).forEach(c => c.setAttribute('aria-invalid', 'true'));
  $(`[data-grupo="${CSS.escape(control)}"]`)?.setAttribute('aria-invalid', 'true');
  $(`[name="${CSS.escape(control)}"]`)?.closest('details')?.setAttribute('open', '');
}
function irA(control) {
  const el = $(`[name="${CSS.escape(control)}"]`) ?? $(`[data-grupo="${CSS.escape(control)}"] input`);
  el?.closest('details')?.setAttribute('open', '');
  el?.focus({ preventScroll: false });
}

// ═══ cálculo en vivo (con el motor) ═══
function anunciar(texto) { clearTimeout(timerAnuncio); timerAnuncio = setTimeout(() => { $('#rt-anuncio').textContent = ''; $('#rt-anuncio').textContent = texto; }, 900); }
function chip(texto, tono) { const c = $('#rt-chip'); c.hidden = !texto; c.textContent = texto ?? ''; if (tono) c.dataset.tono = tono; else delete c.dataset.tono; }

function recalcular() {
  clearTimeout(timer);
  if (compartido) return;
  const { entrada, invalidos, faltan, mapa } = construirEntrada(leer());
  mapaActual = mapa; limpiarErrores(); ultimo = null;
  $('#rt-guardar').hidden = true; $('#escenarios').hidden = true; actualizarDock(null);
  const v = leer(), todoVacio = !String(v.precio).trim() && !String(v.costo).trim() && Object.keys(entrada).length <= 1;

  if (invalidos.length) {
    for (const i of invalidos) marcarError(campoAControl(i.campo, mapa), i.texto === '' ? 'Completá este dato.' : `«${i.texto}» no es un número.`);
    pintar(htmlRevisar({ invalidos }, campoAControl, mapa)); chip(null); return;
  }
  if (faltan.length) { pintar(todoVacio ? htmlVacio() : htmlIncompleto(faltan)); chip(null); return; }

  let r;
  try { r = evaluar(entrada); } catch (e) { pintar(`<div class="rt-revisar" role="alert"><h2 class="rt-vacio-t">Algo falló en el cálculo</h2><p>${esc(e.message)}</p></div>`); return; }
  if (!r.ok) {
    for (const e of r.errores) marcarError(campoAControl(e.campo, mapa), textoMotor(e.texto));
    pintar(htmlRevisar({ errores: r.errores }, campoAControl, mapa)); chip(null); return;
  }
  const o = resolverObjetivos(r.entrada);
  ultimo = { entrada, r, o, mapa };
  dibujar(r, o);
  actualizarGuardado();
}

function dibujar(r, o) {
  pintar(htmlResultado({ r, o }, V));
  const f = V.filasVista(r, o)[0];
  actualizarDock(f);
  anunciar(`${f.ok === false ? 'Perdés plata' : 'Ganás'} ${f.valor} por unidad. ${f.nota}`);
  dibujarEscenarios(compartido ? compartido.entradaDeclarada : ultimo.entrada);
}

function dibujarEscenarios(entradaDeclarada) {
  const lista = escenariosTipicos();
  if (precioPrueba !== null) lista.push({ id: 'precio_prueba', nombre: `Si vendés a ${V.moneda(precioPrueba)}`, cambios: { precio: precioPrueba } });
  const cmp = compararEscenarios(entradaDeclarada, lista);
  $('#rt-esc-tabla').innerHTML = htmlEscenarios(cmp, V);
  $('#escenarios').hidden = false;
  $('#rt-prueba-borrar').hidden = precioPrueba === null;
}

// ═══ resumen fijo en el celular ═══
const dock = $('#rt-dock');
let formVisible = false, resVisible = false;
const actDock = () => dock.classList.toggle('is-on', formVisible && !resVisible && !dock.hidden);   // se reevalúa también cuando aparece o se oculta el resumen
function actualizarDock(f) {
  if (!f) { dock.hidden = true; actDock(); return; }
  dock.hidden = false;
  dock.querySelector('b').textContent = f.valor; dock.querySelector('b').dataset.tono = f.ok === false ? 'bad' : 'ok';
  actDock();
}
if ('IntersectionObserver' in window) {
  const act = actDock;
  new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; act(); }, { rootMargin: '-30% 0px -30% 0px' }).observe(form);
  new IntersectionObserver(([e]) => { resVisible = e.isIntersecting; act(); }).observe($('#resultado'));
}

// ═══ guardar en el servidor ═══
/** Igualdad estructural (el orden de las claves no importa). Es una comparación de datos, no una cuenta. */
const iguales = (a, b) => (a === b) || (a && b && typeof a === 'object' && typeof b === 'object' && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => iguales(a[k], b[k])));
const huella = () => JSON.stringify(ultimo?.entrada ?? null);
function mensaje(texto, tono) { const m = $('#rt-msg'); m.textContent = texto ?? ''; if (tono) m.dataset.tono = tono; else delete m.dataset.tono; }
function actualizarGuardado() {
  if (!ultimo) return;
  $('#rt-guardar').hidden = false;
  const btn = $('#rt-btn-guardar');
  if (!guardado) { chip('Calculado en tu navegador'); btn.textContent = 'Guardar y obtener un link'; btn.disabled = false; mensaje(''); return; }
  const igual = guardado.huella === huella();
  chip(igual ? 'Guardado en el servidor' : 'Cambiaste datos desde que guardaste', igual ? 'ok' : 'warn');
  btn.textContent = igual ? 'Guardado' : 'Guardar de nuevo';
  btn.disabled = igual;
  if (!igual) mensaje('El link que ya compartiste muestra el cálculo anterior.', 'warn');
}

const MENSAJE_ERROR = {
  entrada_grande: 'Cargaste demasiados datos para guardarlos. Sacá algún tramo o costo adicional y probá de nuevo.',
  resultado_grande: 'El resultado es demasiado grande para guardarse. Probá con menos costos adicionales o tramos.',
  entrada_invalida: 'El servidor no aceptó algunos datos. Revisalos y probá de nuevo.',
  entrada_ilegible: 'No pude leer los datos que mandé. Recargá la página y probá de nuevo.',
};
async function guardar() {
  if (!ultimo || compartido) return;
  const btn = $('#rt-btn-guardar'); btn.disabled = true; btn.textContent = 'Guardando…'; mensaje(''); panel.setAttribute('aria-busy', 'true');
  let res, body = null;
  try {
    res = await fetch('/api/herramientas?action=calcular', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entrada: ultimo.entrada }), signal: AbortSignal.timeout(20000) });
    body = await res.json().catch(() => null);
  } catch { res = null; }
  panel.setAttribute('aria-busy', 'false'); btn.disabled = false; btn.textContent = guardado ? 'Guardar de nuevo' : 'Guardar y obtener un link';
  if (res?.status === 201 && body?.ok) {
    const r = { ...body.resultado, entrada: body.entrada };
    // El servidor es la autoridad: se muestra lo que él calculó. Si no coincide con lo del navegador, se avisa (no debería pasar).
    const distinto = !iguales(r, ultimo.r) || !iguales(body.objetivos, ultimo.o);
    ultimo = { ...ultimo, r, o: body.objetivos };
    guardado = { id: body.resultadoId, huella: huella() };
    dibujar(r, body.objetivos);
    $('#rt-salida').innerHTML = ''; mostrarSalida($('#rt-salida'), { resultadoId: body.resultadoId, herramienta: 'rentabilidad' });
    actualizarGuardado();
    mensaje(distinto ? `El servidor calculó distinto del navegador (motor ${body.motor.version} contra ${MOTOR_VERSION}): te muestro lo del servidor.` : '', distinto ? 'warn' : undefined);
    return;
  }
  const status = res?.status ?? 0;
  if (status === 400 && body?.errores) {
    limpiarErrores();
    for (const e of body.errores) marcarError(campoAControl(e.campo, mapaActual), textoMotor(e.texto));
    panel.insertAdjacentHTML('afterbegin', htmlRevisar({ errores: body.errores, titulo: 'El servidor no aceptó estos datos' }, campoAControl, mapaActual));
  }
  mensaje(status === 429 ? (body?.error ?? 'Guardaste muchas veces seguidas. Probá de nuevo en un rato.')
    : MENSAJE_ERROR[body?.code] ?? (status === 0 ? 'No pude conectarme para guardar. Tu cálculo sigue acá: probá de nuevo en un momento.'
    : status >= 500 ? 'El servidor no pudo guardar ahora. Tu cálculo sigue acá: probá de nuevo en un rato.' : (body?.error ?? 'No pude guardar. Probá de nuevo.')), 'bad');
}

// ═══ resultado compartido (?r=) ═══
const fechaCorta = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
function errorCompartido(titulo, texto) {
  htmlPanel = '';
  panel.innerHTML = `<div class="rt-vacio" role="alert"><h2 class="rt-vacio-t">${esc(titulo)}</h2><p>${esc(texto)}</p><a class="btn-primary" href="rentabilidad.html">Hacer un cálculo nuevo</a></div>`;
  chip(null); $('#rt-guardar').hidden = true;
}
async function cargarCompartido(id) {
  htmlPanel = ''; panel.setAttribute('aria-busy', 'true'); panel.innerHTML = '<div class="rt-cargando" aria-hidden="true"><span></span><span></span><span></span></div>'; chip('Abriendo el resultado compartido…');
  let res, d = null;
  try { res = await fetch('/api/herramientas?action=resultado&id=' + encodeURIComponent(id)); d = await res.json().catch(() => null); } catch { res = null; }
  panel.setAttribute('aria-busy', 'false');
  if (!res) return errorCompartido('No pude abrir el resultado', 'Falló la conexión. Probá de nuevo en un momento.');
  if (res.status === 404) return errorCompartido('Ese resultado no existe', 'Puede que el link esté mal copiado o que ya haya vencido (los resultados duran 90 días).');
  if (res.status === 429) return errorCompartido('Demasiadas consultas', 'Probá de nuevo en un rato.');
  if (!res.ok || !d) return errorCompartido('No pude abrir el resultado', 'El servidor no respondió como esperaba. Probá de nuevo en un rato.');
  if (d.herramienta !== 'rentabilidad') { location.replace('herramientas.html?r=' + encodeURIComponent(id)); return; }
  const datos = d.datos;
  if (!datos?.entrada || !datos?.resultado || !datos?.objetivos) return errorCompartido('Este resultado está incompleto', 'Se guardó sin sus datos completos, así que no puedo mostrarlo.');

  const mismaVersion = datos.motor?.version === MOTOR_VERSION;
  compartido = { id, entradaDeclarada: datos.entradaDeclarada ?? datos.entrada, mismaVersion };
  escribir(aValores(compartido.entradaDeclarada));
  const r = { ...datos.resultado, entrada: datos.entrada };       // lo guardado, tal cual: sin recalcular
  $('#rt-compartido').innerHTML = htmlCompartido({ version: datos.motor?.version ?? '?', mismaVersion, fecha: fechaCorta(d.creadoEn) });
  htmlPanel = ''; panel.innerHTML = htmlResultado({ r, o: datos.objetivos }, V);
  actualizarDock(V.filasVista(r, datos.objetivos)[0]);
  if (mismaVersion) dibujarEscenarios(compartido.entradaDeclarada); else $('#escenarios').hidden = true;
  chip('Resultado compartido', 'ok');
  $('#rt-guardar').hidden = false; $('#rt-btn-guardar').hidden = true; mensaje('');
  $('#rt-salida').innerHTML = ''; mostrarSalida($('#rt-salida'), { resultadoId: id, herramienta: 'rentabilidad' });
  anunciar('Resultado compartido abierto.');
}
function usarDatos() {
  compartido = null; guardado = null;
  $('#rt-compartido').innerHTML = ''; $('#rt-salida').innerHTML = ''; $('#rt-btn-guardar').hidden = false;
  bloquear(false); history.replaceState(null, '', location.pathname);
  recalcular();
}

// ═══ eventos ═══
function acciones(e) {
  const b = e.target.closest('[data-accion]'); if (!b) return;
  const a = b.dataset.accion, m = b.dataset.para, i = Number(b.dataset.i);
  if (a === 'ejemplo') { if (compartido) usarDatos(); escribir(EJEMPLO); guardado = null; $('#rt-salida').innerHTML = ''; recalcular(); }
  else if (a === 'limpiar') { if (compartido) usarDatos(); escribir(valoresVacios()); guardado = null; precioPrueba = null; $('#rt-salida').innerHTML = ''; mensaje(''); recalcular(); }
  else if (a === 'guardar') guardar();
  else if (a === 'usar-datos') usarDatos();
  else if (a === 'modo-monto') { ponerModoMonto(m, modoMonto[m] === 'tramos' ? 'valor' : 'tramos'); programar(); }
  else if (a === 'tramo-mas') { const v = leer()[m].tramos; v.splice(v.length - 1, 0, { hasta: '', monto: '' }); dibujarTramos(m, v); programar(); }
  else if (a === 'tramo-quitar') { const v = leer()[m].tramos; v.splice(i, 1); dibujarTramos(m, v); programar(); }
  else if (a === 'extra-mas') { const v = leer().extras; v.push({ nombre: '', monto: '', iva: '' }); dibujarExtras(v); marcarGrupos(); form.querySelector(`[name="extraNombre-${v.length - 1}"]`)?.focus(); programar(); }
  else if (a === 'extra-quitar') { const v = leer().extras; v.splice(i, 1); dibujarExtras(v); marcarGrupos(); programar(); }
}
function programar() { clearTimeout(timer); timer = setTimeout(() => { marcarGrupos(); recalcular(); }, 120); }

document.addEventListener('click', e => {
  const ir = e.target.closest('[data-ir]'); if (ir) { e.preventDefault(); irA(ir.dataset.ir); return; }
  acciones(e);
});
form.addEventListener('input', programar);
form.addEventListener('change', e => { if (e.target.name === 'regimen') textoRegimen(); programar(); });
form.addEventListener('submit', e => e.preventDefault());

$('#rt-prueba').addEventListener('submit', e => {
  e.preventDefault();
  const err = $('#rt-prueba-err'), n = parsearNumero($('#rt-prueba-precio').value);
  if (n === null || Number.isNaN(n)) { err.textContent = 'Poné un precio de venta con números.'; err.hidden = false; return; }
  err.hidden = true; precioPrueba = n;
  const base = compartido ? compartido.entradaDeclarada : ultimo?.entrada;
  if (base && (!compartido || compartido.mismaVersion)) dibujarEscenarios(base);
});
$('#rt-prueba-borrar').addEventListener('click', () => { precioPrueba = null; $('#rt-prueba-precio').value = ''; const base = compartido ? compartido.entradaDeclarada : ultimo?.entrada; if (base) dibujarEscenarios(base); });

$('#rt-cta').addEventListener('click', () => { /* el mensaje se arma en contacto.js según el asunto */ });

// ═══ arranque ═══
const idCompartido = new URLSearchParams(location.search).get('r');
escribir(valoresVacios());
if (idCompartido) cargarCompartido(idCompartido);
else { pintar(htmlVacio()); chip(null); }
