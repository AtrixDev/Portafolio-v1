// motor/vista.js — PRESENTACIÓN: convierte lo que el motor ya calculó en texto y en un resumen guardable.
//
// REGLA ÚNICA: acá no se calcula nada. Cada número que aparece es un campo que ya trae el resultado del motor;
// esta capa solo lo FORMATEA y lo ordena. No hay fórmulas, no se recalcula ganancia, margen, markup ni precios, no se comparan
// montos para decidir qué es «bueno» o «malo»: esas decisiones llegan resueltas por el motor (advertencias con código,
// `motivo`, `estable`). Si hace falta una conclusión nueva, se calcula en el motor y se muestra desde acá.
// Un test alimenta esta capa con resultados INVENTADOS e incoherentes y exige que muestre exactamente lo que recibió.
import { redondear } from './economia.js';

// ── formato es-AR sin Intl (dos entornos con distinto ICU darían textos distintos): miles con «.», decimales con «,» ──
function numero(n, decimales) {
  const r = redondear(n, decimales);
  if (r === null) return null;
  let [entero, dec = ''] = Math.abs(r).toFixed(decimales).split('.');
  entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  dec = dec.replace(/0+$/, '');                                   // sin ceros de relleno: 3.635 y 4.405,35
  return (r < 0 ? '−' : '') + entero + (dec ? ',' + dec : '');
}
export const moneda = n => { const t = numero(n, 2); return t === null ? '—' : t.startsWith('−') ? `−$ ${t.slice(1)}` : `$ ${t}`; };
export const porcentaje = f => { const t = numero(typeof f === 'number' ? f * 100 : f, 1); return t === null ? '—' : `${t}%`; };   // fracción → «24,2%» (conversión de unidad, no cálculo económico)
export const entero = n => numero(n, 0) ?? '—';

// ── rótulos de texto (copy de presentación) ──
export const REGIMEN_TEXTO = { monotributo: 'Monotributo', ri: 'Responsable inscripto', sin_iva: 'Sin IVA' };
export const AVISO_TITULO = {
  GANANCIA_NEGATIVA: 'Perdés plata en cada unidad',
  CANAL_NO_DECLARADO: 'Faltan la comisión y el envío del canal',
  IMPUESTOS_NO_DECLARADOS: 'Faltan los impuestos sobre las ventas',
  COSTO_CERO: 'El costo del producto es cero',
  PISO_NO_ESTABLE: 'El precio mínimo no es estable',
  CARGO_PUEDE_CAMBIAR_CON_EL_PRECIO: 'Un cargo puede cambiar con el precio',
};
export const MOTIVO_TEXTO = {
  CARGOS_SUPERAN_INGRESO: 'Los cargos y los impuestos se comen todo el ingreso: ningún precio alcanza.',
  MARGEN_INALCANZABLE: 'Ese margen no se puede alcanzar con estos cargos.',
  OBJETIVO_INALCANZABLE: 'Ese objetivo no se puede alcanzar con estos datos.',
  PRECIO_FUERA_DE_RANGO: 'El precio necesario supera el máximo permitido.',
  NO_CONVERGE: 'No se pudo fijar un precio estable: revisá los cargos escalonados.',
  SIN_MARGEN_PARA_PUBLICIDAD: 'No queda margen para publicidad.',
  SIN_VENTAS_POR_PUBLICIDAD: 'Ninguna venta viene de publicidad: no hay ACOS que calcular.',
  OBJETIVO_INALCANZABLE_AUN_SIN_COSTO: 'Aunque el proveedor lo regalara, no se llega al objetivo.',
  SIN_GANANCIA_POR_UNIDAD: 'Con ganancia cero o negativa por unidad no se cubren los costos fijos.',
  VOLUMEN_INVIABLE: 'Haría falta un volumen inviable.',
};
const motivo = m => MOTIVO_TEXTO[m] ?? String(m);
const SEVERIDAD = { alta: 0, media: 1, baja: 2 };

/** Avisos del resultado y de las inversas, sin repetir códigos, los más graves primero (el orden relativo se conserva). */
export function avisos(resultado, objetivos) {
  const vistos = new Set();
  return [...(resultado?.advertencias ?? []), ...(objetivos?.advertencias ?? [])]
    .filter(a => !vistos.has(a.codigo) && vistos.add(a.codigo))
    .map((a, i) => ({ a, i })).sort((x, y) => (SEVERIDAD[x.a.severidad] ?? 3) - (SEVERIDAD[y.a.severidad] ?? 3) || x.i - y.i).map(x => x.a);
}

/** Línea corta que identifica la entrada (para el listado del admin). */
export function descripcionEntrada(entrada) {
  const u = entrada?.unidades;
  return `Precio ${moneda(entrada?.precio)} · ${REGIMEN_TEXTO[entrada?.fiscal?.regimen] ?? '—'}${u > 1 ? ` · ${entero(u)} u.` : ''}`.slice(0, 300);
}

/**
 * Las filas del resultado, ESTRUCTURADAS: { id, etiqueta, valor, nota, ok }. Es la única fuente de estos textos: la usan el resumen
 * guardable (que las junta como «etiqueta: valor») y la pantalla (que las dibuja con etiqueta, valor y nota por separado).
 * `completo` suma las filas que no entran en el resumen guardable (p. ej. las unidades para el objetivo del mes).
 * `ok`: true / false SOLO si el motor lo informó (advertencia con código); en cualquier otro caso null.
 */
export function filasVista(r, o, { completo = false } = {}) {
  const negativa = (r.advertencias ?? []).some(a => a.codigo === 'GANANCIA_NEGATIVA');          // lo decidió el motor
  const piso = o?.precioPiso?.equilibrio, filas = [];

  filas.push({ id: 'ganancia', etiqueta: 'Ganancia por unidad', valor: moneda(r.ganancia), nota: `Margen ${porcentaje(r.margenNeto)} sobre el ingreso neto · markup ${r.markup === null ? '—' : porcentaje(r.markup)} sobre el costo del producto`, ok: !negativa });
  const nUnidades = r.entrada?.unidades;
  if (nUnidades > 1) filas.push({ id: 'gananciaTotal', etiqueta: 'Ganancia total', valor: moneda(r.gananciaTotal), nota: `${entero(nUnidades)} unidades`, ok: !negativa });

  const precio = (id, p, etiqueta) => (p.precio !== null
    ? { id, etiqueta, valor: moneda(p.precio), nota: p.estable === false ? `Se cumple desde ahí, pero recién queda estable desde ${moneda(p.precioEstable)}` : `Hoy vendés a ${moneda(r.precio)}`, ok: null }
    : { id, etiqueta, valor: 'sin solución', nota: motivo(p.motivo) + (typeof p.margenMaximo === 'number' ? ` El máximo posible es ${porcentaje(p.margenMaximo)}.` : ''), ok: null });
  if (piso) filas.push(precio('piso', piso, 'Precio mínimo para no perder'));
  const mo = o?.precioPiso?.margenObjetivo, go = o?.precioPiso?.gananciaObjetivo;
  if (mo) filas.push(precio('margenObjetivo', mo, `Precio para ${porcentaje(mo.objetivo.margenPct)} de margen`));
  if (go) filas.push(precio('gananciaObjetivo', go, `Precio para ganar ${moneda(go.objetivo.gananciaUnidad)} por unidad`));

  const ac = o?.acosEquilibrio;
  if (ac && ac.acos !== null) filas.push({ id: 'acos', etiqueta: 'ACOS máximo', valor: porcentaje(ac.acos), nota: ac.motivo ? motivo(ac.motivo) : 'Lo máximo que podés invertir en publicidad (sobre las ventas) sin bajar del objetivo', ok: null });
  else if (ac && ac.motivo && ac.motivo !== 'IVA_MODO_REQUERIDO') filas.push({ id: 'acos', etiqueta: 'ACOS máximo', valor: 'sin solución', nota: motivo(ac.motivo), ok: null });

  const cm = o?.costoMaximoProveedor, regimen = r.entrada?.fiscal?.regimen;
  if (cm && cm.costoMaximo !== null) filas.push({ id: 'costoMaximo', etiqueta: 'Costo máximo del proveedor', valor: moneda(cm.costoMaximo), nota: regimen === 'sin_iva' ? 'Para no bajar del objetivo' : `${cm.ivaIncluido ? 'Con IVA incluido' : 'Sin IVA'}, para no bajar del objetivo`, ok: null });
  else if (cm && cm.motivo === 'OBJETIVO_INALCANZABLE_AUN_SIN_COSTO') filas.push({ id: 'costoMaximo', etiqueta: 'Costo máximo del proveedor', valor: 'sin solución', nota: motivo(cm.motivo), ok: null });

  const ue = o?.unidades?.equilibrio;
  if (ue && ue.fijosMes > 0) filas.push(ue.unidades !== null
    ? { id: 'unidadesEquilibrio', etiqueta: 'Punto de equilibrio', valor: `${entero(ue.unidades)} unidades por mes`, nota: `Para cubrir ${moneda(ue.fijosMes)} de costos fijos`, ok: null }
    : { id: 'unidadesEquilibrio', etiqueta: 'Punto de equilibrio', valor: 'sin solución', nota: motivo(ue.motivo), ok: null });

  const uo = o?.unidades?.objetivoMes;
  if (completo && uo && uo.motivo !== 'SIN_OBJETIVO_MENSUAL') filas.push(uo.unidades !== null
    ? { id: 'unidadesObjetivo', etiqueta: 'Para tu objetivo del mes', valor: `${entero(uo.unidades)} unidades por mes`, nota: `Para ganar ${moneda(uo.gananciaMes)} por mes además de cubrir ${moneda(uo.fijosMes)} de costos fijos`, ok: null }
    : { id: 'unidadesObjetivo', etiqueta: 'Para tu objetivo del mes', valor: 'sin solución', nota: motivo(uo.motivo), ok: null });
  return filas;
}

/** Avisos listos para mostrar { codigo, severidad, titulo, texto }. El texto lo escribió el motor; el título es copy de presentación. */
export function avisosVista(r, o) {
  return avisos(r, o).map(a => ({ codigo: a.codigo, severidad: a.severidad, titulo: AVISO_TITULO[a.codigo] ?? a.codigo, texto: a.texto }));
}

/**
 * Resumen guardable de un resultado del motor (la forma que entiende lib/resultados.js › limpiarResumen):
 * { titulo, veredicto, numero, etiqueta, cobertura, puntos:[{ ok, t, s }], noVerificado }.
 */
export function resumenGuardable(r, o) {
  const negativa = (r.advertencias ?? []).some(a => a.codigo === 'GANANCIA_NEGATIVA');          // lo decidió el motor
  const piso = o?.precioPiso?.equilibrio, regimen = r.entrada?.fiscal?.regimen;
  // El resumen guardable admite 8 filas: los avisos más graves (hasta 2) siempre entran y los resultados ocupan el resto, por prioridad.
  // Lo que no entra queda completo en `datos`.
  const graves = avisos(r, o).filter(a => a.severidad !== 'baja' && a.codigo !== 'GANANCIA_NEGATIVA').slice(0, 2)
    .map(a => ({ ok: false, t: AVISO_TITULO[a.codigo] ?? a.codigo, s: a.texto }));
  const filas = filasVista(r, o).slice(0, 8 - graves.length).map(f => ({ ok: f.ok, t: `${f.etiqueta}: ${f.valor}`, s: f.nota }));

  const nSup = (r.supuestos ?? []).length;
  const veredicto = [
    negativa ? 'Con estos datos perdés plata en cada unidad.' : `Con estos datos ganás ${moneda(r.ganancia)} por unidad.`,
    piso && piso.precio !== null ? `Para no perder, el precio mínimo es ${moneda(piso.precio)}.` : '',
    nSup ? `Usé ${entero(nSup)} ${nSup === 1 ? 'valor supuesto' : 'valores supuestos'}: están en el resultado completo.` : '',
  ].filter(Boolean).join(' ');

  return {
    titulo: `Rentabilidad: ${moneda(r.ganancia)} por unidad (${porcentaje(r.margenNeto)} de margen)`,
    veredicto,
    numero: redondear(r.ganancia, 2),
    etiqueta: REGIMEN_TEXTO[regimen] ?? '',
    cobertura: null,
    puntos: [...filas, ...graves],
    noVerificado: [],
  };
}
