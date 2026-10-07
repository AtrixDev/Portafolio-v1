// js/rentabilidad-render.js — DIBUJA los resultados de la calculadora de rentabilidad. Funciones puras: reciben datos y devuelven HTML.
//
// REGLAS (las vigila un test):
//  · NO calcula: no hay fórmulas, ni aritmética sobre campos del motor, ni se decide nada comparando montos.
//    Cada número que aparece es un campo que ya trae el resultado del motor, formateado con `V` (js/motor/vista.js, inyectado).
//  · No importa el motor: `V` llega por parámetro. Así se puede probar en Node con los resultados reales del motor.
//  · Los textos de las filas, los avisos y los supuestos vienen de vista.js y del propio motor; acá solo se ordenan y se dibujan.
//  · El ancho de cada tramo de la barra lo resuelve el CSS (flex-grow = el monto): no hay una sola cuenta en JavaScript.
import { ETIQUETAS } from './rentabilidad-form.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Texto de un error del motor sin las pistas técnicas para programadores («(true)», «("incluido")»): el resto, tal cual. */
export const textoMotor = t => String(t ?? '').replace(/\s*\((?:true|false|"[^"]*")\)/g, '');

/** Nombre legible de un campo del motor o del formulario. */
const etiquetaDe = campo => ETIQUETAS[campo] ?? ETIQUETAS[String(campo).replace(/\.\d+(\.\w+)?$/, '')] ?? campo;

// ── estados sin resultado ──
export const htmlVacio = () => `<div class="rt-vacio">
  <h2 class="rt-vacio-t">¿Ganás plata con este producto?</h2>
  <p>Cargá el precio de venta y lo que te cuesta. Te muestro cuánto te queda por unidad y a qué precio mínimo dejás de perder.</p>
  <button type="button" class="btn-secondary" data-accion="ejemplo">Probar con un ejemplo</button>
  <p class="rt-chico">El ejemplo usa números inventados.</p>
</div>`;

export const htmlIncompleto = faltan => `<div class="rt-vacio" data-estado="incompleto">
  <h2 class="rt-vacio-t">Falta poco</h2>
  <p>Para calcular necesito: <b>${faltan.map(c => esc(etiquetaDe(c))).join(' y ')}</b>.</p>
</div>`;

/** Lo que hay que revisar: textos que no son números y errores que devolvió el motor (cada uno con el texto del motor). */
export const htmlRevisar = ({ invalidos = [], errores = [], titulo = 'Revisá estos datos' }, campoAControl, mapa) => {
  const item = (campo, texto) => {
    const control = campoAControl(campo, mapa);
    const nombre = esc(etiquetaDe(campo));
    return `<li>${control ? `<a href="#" data-ir="${esc(control)}">${nombre}</a>` : `<b>${nombre}</b>`}: ${esc(texto)}</li>`;
  };
  const filas = [
    ...invalidos.map(x => item(x.campo, x.texto === '' ? 'Completá este dato.' : `«${x.texto}» no es un número.`)),
    ...errores.map(e => item(e.campo, textoMotor(e.texto))),
  ];
  return `<div class="rt-revisar" role="alert"><h2 class="rt-vacio-t">${esc(titulo)}</h2><ul>${filas.join('')}</ul></div>`;
};

// ── resultado ──
const fila = (f, i, lista) => {
  const nota = f.nota && f.nota !== lista[i - 1]?.nota ? f.nota : '';               // la misma nota dos veces seguidas se muestra una sola vez
  return `<div class="rt-fila" data-id="${esc(f.id)}"${f.ok === false ? ' data-tono="bad"' : ''}>
    <dt>${esc(f.etiqueta)}</dt><dd>${esc(f.valor)}</dd>${nota ? `<dd class="rt-nota">${esc(nota)}</dd>` : ''}
  </div>`;
};

/**
 * @param {{ r: object, o: object }} datos  Resultado de `evaluar` (con su `entrada`) y de `resolverObjetivos`. Del motor o guardados.
 * @param {object} V                         js/motor/vista.js
 */
export function htmlResultado({ r, o }, V) {
  const filas = V.filasVista(r, o, { completo: true });
  const por = ids => filas.filter(f => ids.includes(f.id));
  const principal = filas[0], gana = principal.ok !== false;                       // lo decidió el motor (GANANCIA_NEGATIVA)
  const total = filas.find(f => f.id === 'gananciaTotal');

  const veredicto = `<div class="rt-veredicto" data-tono="${gana ? 'ok' : 'bad'}">
    <h2 class="rt-titular">${gana ? 'Ganás' : 'Perdés plata:'} <b class="rt-cifra">${esc(principal.valor)}</b> por unidad</h2>
    <p class="rt-detalle">${esc(principal.nota)}</p>
    ${total ? `<p class="rt-detalle">En ${esc(total.nota)}: <b>${esc(total.valor)}</b></p>` : ''}
  </div>`;

  const precios = por(['piso', 'margenObjetivo', 'gananciaObjetivo']);
  const bloquePrecios = precios.length ? `<section class="rt-bloque" aria-labelledby="rt-h-precios">
    <h3 id="rt-h-precios">A qué precio tenés que vender</h3><dl class="rt-precios">${precios.map(fila).join('')}</dl></section>` : '';

  // Dónde se va el precio: cada tramo mide lo que vale su monto (flex-grow lo resuelve el CSS) y la tabla trae los mismos números.
  const costos = r.costos.filter(c => c.monto !== 0);
  const segmentos = costos.map(c => `<span class="rt-pieza" data-cat="${esc(c.categoria)}" style="--v:${esc(String(c.monto))}" title="${esc(c.nombre)}: ${esc(V.moneda(c.monto))}"></span>`).join('')
    + (gana ? `<span class="rt-pieza" data-cat="ganancia" style="--v:${esc(String(r.ganancia))}" title="Ganancia: ${esc(V.moneda(r.ganancia))}"></span>` : '');
  const filasCosto = costos.map(c => `<tr><th scope="row"><i class="rt-punto" data-cat="${esc(c.categoria)}" aria-hidden="true"></i>${esc(c.nombre)}${c.factorIva !== 1 ? `<small>Cotizado ${esc(V.moneda(c.cotizado))}, ajustado por el IVA</small>` : ''}</th><td>${esc(V.moneda(c.monto))}</td></tr>`).join('');
  const bloqueCostos = `<section class="rt-bloque" aria-labelledby="rt-h-costos">
    <h3 id="rt-h-costos">Dónde se va el precio</h3>
    <p class="rt-chico">${gana ? `De un ingreso neto de ${esc(V.moneda(r.ingresoNeto))}, lo que no es costo es tu ganancia.` : `El ingreso neto de ${esc(V.moneda(r.ingresoNeto))} no alcanza para cubrir los costos.`}</p>
    <div class="rt-barra" role="img" aria-label="Costos por ${esc(V.moneda(r.costoTotal))} sobre un ingreso neto de ${esc(V.moneda(r.ingresoNeto))}">${segmentos}</div>
    <table class="rt-tabla"><caption class="sr-only">Costos por unidad</caption><tbody>${filasCosto}</tbody>
      <tfoot><tr><th scope="row">Costo total</th><td>${esc(V.moneda(r.costoTotal))}</td></tr><tr><th scope="row">Ingreso neto</th><td>${esc(V.moneda(r.ingresoNeto))}</td></tr>
      <tr class="rt-total" data-tono="${gana ? 'ok' : 'bad'}"><th scope="row">Ganancia por unidad</th><td>${esc(V.moneda(r.ganancia))}</td></tr></tfoot></table>
  </section>`;

  const lista = V.avisosVista(r, o);
  const bloqueAvisos = lista.length ? `<section class="rt-bloque" aria-labelledby="rt-h-avisos">
    <h3 id="rt-h-avisos">Antes de confiar en este número</h3><ul class="rt-avisos">${lista.map(a => `<li data-sev="${esc(a.severidad)}"><b>${esc(a.titulo)}.</b> ${esc(a.texto)}</li>`).join('')}</ul></section>` : '';

  const sup = r.supuestos ?? [];
  const bloqueSupuestos = sup.length ? `<section class="rt-bloque" aria-labelledby="rt-h-sup">
    <h3 id="rt-h-sup">Lo que supuse</h3>
    <p class="rt-chico">No lo cargaste, así que el cálculo usó esto. Si no es tu caso, cargalo en el formulario.</p>
    <ul class="rt-supuestos">${sup.map(s => `<li><span class="rt-tag">Supuesto</span> ${esc(s.texto)}</li>`).join('')}</ul></section>` : '';

  const decidir = por(['acos', 'costoMaximo', 'unidadesEquilibrio', 'unidadesObjetivo']);
  const bloqueDecidir = decidir.length ? `<section class="rt-bloque" aria-labelledby="rt-h-decidir">
    <h3 id="rt-h-decidir">Para hablar con tu proveedor y con tu publicidad</h3><dl class="rt-precios">${decidir.map(fila).join('')}</dl></section>` : '';

  return `<div class="rt-res-in">${veredicto}${bloquePrecios}${bloqueCostos}${bloqueAvisos}${bloqueSupuestos}${bloqueDecidir}</div>`;
}

// ── escenarios ──
const EFECTO = { mejora: 'Mejora', empeora: 'Empeora', igual: 'Igual' };
/** @param {object} cmp  Salida de `compararEscenarios` (módulo escenarios.js). */
export function htmlEscenarios(cmp, V) {
  if (!cmp?.ok) return `<p class="rt-chico">No se pudieron armar los escenarios.</p>`;
  const b = cmp.base.metricas;
  const filaBase = `<tr class="rt-base"><th scope="row">Hoy</th><td>${esc(V.moneda(b.ganancia))}</td><td>—</td><td>${esc(V.porcentaje(b.margenNeto))}</td><td>${esc(V.moneda(b.precioEquilibrio))}</td></tr>`;
  const filas = cmp.escenarios.map(e => {
    if (!e.ok) {
      const falta = e.errores?.[0]?.campo;
      return `<tr class="rt-error"><th scope="row">${esc(e.nombre)}</th><td colspan="4">${falta ? `Para calcularlo falta un dato: <b>${esc(etiquetaDe(falta))}</b>.` : 'No se pudo calcular este escenario.'}</td></tr>`;
    }
    const d = e.deltas.ganancia, signo = e.efectoGanancia === 'mejora' ? '+' : '';
    const cambio = e.efectoGanancia === 'igual' ? 'Sin cambio'
      : `${signo}${esc(V.moneda(d.abs))}${d.pct === null ? '' : ` (${signo}${esc(V.porcentaje(d.pct))})`}`;
    return `<tr data-efecto="${esc(e.efectoGanancia)}"><th scope="row">${esc(e.nombre)}</th><td>${esc(V.moneda(e.metricas.ganancia))}</td>
      <td><span class="rt-efecto" data-efecto="${esc(e.efectoGanancia)}">${esc(EFECTO[e.efectoGanancia] ?? '')}</span> ${cambio}</td>
      <td>${esc(V.porcentaje(e.metricas.margenNeto))}</td><td>${esc(V.moneda(e.metricas.precioEquilibrio))}</td></tr>`;
  }).join('');
  return `<div class="rt-scroll"><table class="rt-tabla rt-tabla-esc"><caption class="sr-only">Escenarios comparados con el cálculo de hoy</caption>
    <thead><tr><th scope="col">Escenario</th><th scope="col">Ganancia por unidad</th><th scope="col">Cambio</th><th scope="col">Margen</th><th scope="col">Precio mínimo</th></tr></thead>
    <tbody>${filaBase}${filas}</tbody></table></div>`;
}

/** Banner de un resultado compartido. `meta`: { version, versionActual, fecha } (todo texto ya resuelto por quien llama). */
export const htmlCompartido = ({ version, mismaVersion, fecha }) => `<div class="rt-compartido">
  <p><b>Resultado compartido.</b> ${fecha ? `Calculado el ${esc(fecha)}. ` : ''}Los números son los que se guardaron: no se recalcularon acá.</p>
  ${mismaVersion ? '' : `<p class="rt-chico" data-sev="media">Se calculó con la versión ${esc(version)} del motor y esta página usa otra, así que no muestro escenarios nuevos para no mezclar versiones.</p>`}
  <div class="rt-acciones"><button type="button" class="btn-primary" data-accion="usar-datos">Usar estos datos en la calculadora</button></div>
</div>`;
