// motor/inversas.js — las preguntas al revés: dado un objetivo, ¿qué precio / ACOS / costo / volumen lo cumple?
// Puro y determinístico. Todo se despeja con álgebra exacta (nada de búsquedas numéricas) y cada resultado se
// VERIFICA contra el cálculo directo (`evaluar`), que es la única fuente de verdad de la ganancia.
//
// Estructura que permite despejar: dentro de un tramo de precios (los cargos escalonados cambian de valor en
// ciertos precios) la ganancia es una recta  G(P) = a·P − b :
//   a = kP·(1 − tasasSobreNeto) − tasasSobrePrecio          b = costo del producto + cargos fijos del tramo
// Un objetivo se expresa como  G(P) ≥ m·N(P) + g   (m = margen neto buscado, g = ganancia por unidad buscada).
// Con  A = a − m·kP  y  B = b + g  la condición queda  A·P ≥ B  dentro de cada tramo.
import { validar } from './validar.js';
import { evaluar, factorIva, valorEn } from './economia.js';

const EPS = 1e-7;                 // tolerancia de verificación (pesos)
const AJUSTE = 1e-9;              // tolerancia al redondear hacia arriba un valor que "debería" ser entero
const MAX_PRECIO = 1e9;
// HEURÍSTICA DE PRESENTACIÓN, no una regla económica del motor: si el precio piso queda a más de este porcentaje
// del precio cargado y un cargo (fijo o envío) se tomó como constante, se avisa que ese cargo podría cambiar con el precio.
// No altera ningún cálculo; solo decide cuándo mostrar la advertencia CARGO_PUEDE_CAMBIAR_CON_EL_PRECIO. Se puede ajustar sin riesgo.
export const UMBRAL_CARGO_CONSTANTE_RELEVANTE = 0.25;
const MAX_UNIDADES = 1e9;
const sinCero = x => (x === 0 ? 0 : x);

/** Vista algebraica de una entrada ya normalizada: pendiente `a`, costo del producto `C` y factores. */
export function estructura(e) {
  const reg = e.fiscal.regimen;
  const kP = reg === 'ri' ? 1 / (1 + e.fiscal.ivaProducto) : 1;
  const fc = factorIva(e.canal.ivaModo, reg, e.fiscal.ivaServicios);
  const fa = factorIva(e.publicidad.ivaModo, reg, e.fiscal.ivaServicios);
  const tacos = e.publicidad.acos * e.publicidad.ventasPorAdsPct;
  const sobrePrecio = fc * (e.canal.ventaPct + e.canal.financiacionPct) + (e.publicidad.base === 'precio' ? fa * tacos : 0);
  const sobreNeto = (e.publicidad.base === 'neto' ? fa * tacos : 0) + e.impuestosVentaPct + e.devolucionesPct;
  const fProd = incluido => factorIva(incluido ? 'incluido' : 'adicional', reg, e.costo.ivaCompra);
  const C = e.costo.producto * fProd(e.costo.ivaIncluido) + e.costo.extras.reduce((s, x) => s + x.monto * fProd(x.ivaIncluido), 0);
  return { reg, kP, fc, fa, tacos, C, fProd, a: kP * (1 - sobreNeto) - sobrePrecio };
}

/** Tramos de precio donde los cargos escalonados son constantes: [{ desde, hasta }] con hasta = Infinity en el último. */
function tramos(e) {
  const cortes = [...new Set([e.canal.fijo, e.canal.envio].filter(Array.isArray).flatMap(a => a.map(t => t.hasta).filter(h => h !== null)))].sort((x, y) => x - y);
  const puntos = [0, ...cortes, Infinity];
  return puntos.slice(0, -1).map((desde, i) => ({ desde, hasta: puntos[i + 1] }));
}
const publico = t => (t ? { desde: t.desde, hasta: t.hasta === Infinity ? null : t.hasta } : null);   // Infinity no sobrevive a JSON
const bEn = (e, est, P) => est.C + est.fc * (valorEn(e.canal.fijo, P) + valorEn(e.canal.envio, P));

/** Menor precio ≥ `desde` que cumple G ≥ m·N + g, recorriendo los tramos de menor a mayor. null si ninguno. */
function menorPrecio(e, est, m, g, desde, ts) {
  const A = est.a - m * est.kP;
  for (const t of ts) {
    const lo = Math.max(t.desde, desde);
    if (lo >= t.hasta) continue;
    const B = bEn(e, est, lo) + g;
    if (A > 0) { const cand = Math.max(lo, B / A); if (cand < t.hasta) return cand; }
    else if (A * lo - B >= -EPS) return lo;                   // pendiente ≤ 0: solo vale desde el inicio del tramo, si ya cumple
  }
  return null;
}
/** ¿Cumple el objetivo en el precio P? (cálculo directo, independiente del despeje) */
function cumple(e, P, m, g) {
  const r = evaluar({ ...e, precio: P });
  return { ok: r.ok && r.ganancia - m * r.ingresoNeto - g >= -EPS * Math.max(1, P), r };
}
/** Desde qué precio el objetivo se cumple para TODO precio mayor (los saltos de un cargo escalonado pueden romperlo). */
function desdeEstable(e, est, m, g, p0, ts) {
  const A = est.a - m * est.kP;
  let p = p0;
  for (let vuelta = 0; vuelta < 12; vuelta++) {
    let violacion = null;
    for (const t of ts) {
      const lo = Math.max(t.desde, p);
      if (lo >= t.hasta) continue;
      const B = bEn(e, est, lo) + g;
      if (A < 0 || (A === 0 && B > EPS)) return null;                       // la recta decrece: tarde o temprano deja de cumplir
      if (A * lo - B < -EPS) { violacion = lo; break; }
    }
    if (violacion === null) return p;
    const sig = menorPrecio(e, est, m, g, violacion, ts);
    if (sig === null) return null;
    p = Math.ceil(sig - AJUSTE);
  }
  return null;
}

const objetivoDe = (e, o = {}) => ({ margenPct: o.margenPct ?? e.objetivo.margenPct ?? 0, gananciaUnidad: o.gananciaUnidad ?? e.objetivo.gananciaUnidad ?? 0 });
const normalizar = cruda => { const v = validar(cruda); return v.ok ? { ok: true, e: v.entrada, v } : { ok: false, resp: { ok: false, errores: v.errores, advertencias: v.advertencias } }; };

/**
 * Precio mínimo (entero, redondeado hacia ARRIBA) para cumplir un objetivo.
 * Sin objetivo → precio de equilibrio (ganancia 0). Con `margenPct` y/o `gananciaUnidad` → ambos a la vez.
 * Devuelve { precio, estable, precioEstable, ganancia, margenNeto, tramo, objetivo } o { precio: null, motivo, … }.
 */
export function precioParaObjetivo(cruda, objetivo = {}) {
  const n = normalizar(cruda); if (!n.ok) return n.resp;
  return { ok: true, ...resolverPrecio(n.e, objetivoDe(n.e, objetivo)) };
}
function resolverPrecio(e, obj) {
  const est = estructura(e), ts = tramos(e), { margenPct: m, gananciaUnidad: g } = obj;
  const imposible = (motivo, extra = {}) => ({ precio: null, motivo, objetivo: obj, ...extra });
  if (est.a <= 0) return imposible('CARGOS_SUPERAN_INGRESO');                               // ningún precio alcanza ni el equilibrio
  let desde = 0;
  for (let intento = 0; intento < 6; intento++) {
    const p = menorPrecio(e, est, m, g, desde, ts);
    if (p === null) return imposible(est.a - m * est.kP <= 0 ? 'MARGEN_INALCANZABLE' : 'OBJETIVO_INALCANZABLE', { margenMaximo: est.a / est.kP });
    const pc = p <= 0 ? 0 : Math.ceil(p - AJUSTE);
    if (pc > MAX_PRECIO) return imposible('PRECIO_FUERA_DE_RANGO');
    if (pc === 0) return { precio: 0, estable: true, precioEstable: 0, ganancia: 0, margenNeto: null, tramo: publico(ts[0]), objetivo: obj };   // sin costos: cualquier precio positivo gana
    const { ok, r } = cumple(e, pc, m, g);
    if (ok) {
      const est2 = desdeEstable(e, est, m, g, pc, ts);
      return { precio: pc, estable: est2 === pc, precioEstable: est2, ganancia: r.ganancia, margenNeto: r.margenNeto, tramo: publico(ts.find(t => pc >= t.desde && pc < t.hasta)), objetivo: obj };
    }
    desde = pc;                                                                             // el redondeo cruzó a otro tramo y ya no cumple: seguir desde ahí
  }
  return imposible('NO_CONVERGE');
}

/** Precio de equilibrio + los precios de los objetivos declarados en la entrada. */
export function precioPiso(cruda) {
  const n = normalizar(cruda); if (!n.ok) return n.resp;
  const { e } = n, o = e.objetivo;
  const advertencias = [];
  const equilibrio = resolverPrecio(e, { margenPct: 0, gananciaUnidad: 0 });
  const margenObjetivo = o.margenPct !== null ? resolverPrecio(e, { margenPct: o.margenPct, gananciaUnidad: 0 }) : null;
  const gananciaObjetivo = o.gananciaUnidad !== null ? resolverPrecio(e, { margenPct: 0, gananciaUnidad: o.gananciaUnidad }) : null;
  for (const [campo, spec] of [['canal.fijo', e.canal.fijo], ['canal.envio', e.canal.envio]]) {
    const lejos = [equilibrio, margenObjetivo, gananciaObjetivo].some(p => p && p.precio !== null && Math.abs(p.precio / e.precio - 1) > UMBRAL_CARGO_CONSTANTE_RELEVANTE);
    if (!Array.isArray(spec) && spec > 0 && lejos) advertencias.push({ codigo: 'CARGO_PUEDE_CAMBIAR_CON_EL_PRECIO', severidad: 'media', campo, texto: `${campo === 'canal.fijo' ? 'El cargo fijo' : 'El envío'} se tomó como constante, pero el precio piso queda lejos del precio que cargaste. Si tu canal lo cambia según el precio, revisalo en el precio piso.` });
  }
  for (const [nombre, p] of [['equilibrio', equilibrio], ['margenObjetivo', margenObjetivo], ['gananciaObjetivo', gananciaObjetivo]])
    if (p && p.precio !== null && p.estable === false) advertencias.push({ codigo: 'PISO_NO_ESTABLE', severidad: 'alta', campo: nombre, texto: `El objetivo se cumple desde $${p.precio} pero deja de cumplirse más arriba por un salto de cargos; recién queda estable desde $${p.precioEstable}.` });
  return { ok: true, equilibrio, margenObjetivo, gananciaObjetivo, advertencias };
}

/**
 * ACOS máximo (con el que la ganancia llega justo al objetivo; sin objetivo, a cero) para el precio cargado.
 * Devuelve { acos, tacos, … } o { acos: null, motivo } si falta un dato que no se puede suponer.
 */
export function acosEquilibrio(cruda, objetivo = {}) {
  const n = normalizar(cruda); if (!n.ok) return n.resp;
  const { e } = n, obj = objetivoDe(e, objetivo), est = estructura(e);
  if (e.fiscal.regimen !== 'sin_iva' && e.publicidad.ivaModo === null) return { ok: true, acos: null, motivo: 'IVA_MODO_REQUERIDO', campo: 'publicidad.ivaModo', objetivo: obj };
  const share = e.publicidad.ventasPorAdsPct;
  const base = e.publicidad.base === 'neto' ? est.kP * e.precio : e.precio;
  const porAcos = est.fa * share * base;                                                    // pesos de gasto por cada punto (1.0) de ACOS
  if (!(porAcos > 0)) return { ok: true, acos: null, motivo: 'SIN_VENTAS_POR_PUBLICIDAD', objetivo: obj };
  const r = evaluar(e);
  const sinAds = r.ganancia + r.costos.find(c => c.id === 'publicidad').monto;
  const margenParaAds = sinAds - obj.margenPct * r.ingresoNeto - obj.gananciaUnidad;
  if (margenParaAds <= 0) return { ok: true, acos: 0, tacos: 0, motivo: 'SIN_MARGEN_PARA_PUBLICIDAD', gananciaSinPublicidad: sinAds, objetivo: obj };
  const acos = margenParaAds / porAcos;
  return { ok: true, acos, tacos: acos * share, gananciaSinPublicidad: sinAds, objetivo: obj, motivo: null };
}

/**
 * Costo máximo que se le puede pagar al proveedor para cumplir el objetivo (sin objetivo: no perder plata).
 * El costo del producto puede faltar en la entrada (es justamente lo que se averigua). Se devuelve en los mismos
 * términos en que se ingresaría (con IVA si `costo.ivaIncluido` es true).
 */
export function costoMaximoProveedor(cruda, objetivo = {}) {
  const entrada = cruda && typeof cruda === 'object' && !Array.isArray(cruda)
    ? { ...cruda, costo: { ...(cruda.costo && typeof cruda.costo === 'object' ? cruda.costo : {}), producto: cruda.costo?.producto ?? 0 } } : cruda;
  const n = normalizar(entrada); if (!n.ok) return n.resp;
  const { e } = n, obj = objetivoDe(e, objetivo), est = estructura(e);
  if (e.fiscal.regimen !== 'sin_iva' && e.costo.ivaIncluido === null) return { ok: true, costoMaximo: null, motivo: 'IVA_COSTO_REQUERIDO', campo: 'costo.ivaIncluido', objetivo: obj };
  const sinProducto = evaluar({ ...e, costo: { ...e.costo, producto: 0 } });                // ganancia si el producto fuera gratis (extras incluidos)
  const netoMax = sinProducto.ganancia - obj.margenPct * sinProducto.ingresoNeto - obj.gananciaUnidad;
  if (netoMax < 0) return { ok: true, costoMaximo: null, motivo: 'OBJETIVO_INALCANZABLE_AUN_SIN_COSTO', gananciaConCostoCero: sinProducto.ganancia, objetivo: obj };
  const f = est.fProd(e.costo.ivaIncluido);
  return { ok: true, costoMaximo: netoMax / f, costoMaximoNeto: netoMax, ivaIncluido: e.costo.ivaIncluido, objetivo: obj, motivo: null };
}

const techo = x => Math.ceil(x - AJUSTE);
function volumen(g, necesario) {
  if (necesario <= 0) return { unidades: 0, motivo: null };
  if (!(g > 0)) return { unidades: null, motivo: 'SIN_GANANCIA_POR_UNIDAD' };
  const u = techo(necesario / g);
  return u > MAX_UNIDADES ? { unidades: null, motivo: 'VOLUMEN_INVIABLE' } : { unidades: u, motivo: null };
}
/** Unidades por mes para cubrir los costos fijos mensuales (`fijosMes`). */
export function unidadesEquilibrio(cruda) {
  const n = normalizar(cruda); if (!n.ok) return n.resp;
  const r = evaluar(n.e), { fijosMes } = n.e;
  return { ok: true, gananciaUnidad: r.ganancia, fijosMes, ...volumen(r.ganancia, fijosMes) };
}
/** Unidades por mes para cubrir los fijos Y llegar a `objetivo.gananciaMes`. */
export function unidadesParaObjetivo(cruda, { gananciaMes } = {}) {
  const n = normalizar(cruda); if (!n.ok) return n.resp;
  const gm = gananciaMes ?? n.e.objetivo.gananciaMes;
  if (gm === null || gm === undefined) return { ok: true, unidades: null, motivo: 'SIN_OBJETIVO_MENSUAL' };
  const r = evaluar(n.e), { fijosMes } = n.e;
  return { ok: true, gananciaUnidad: r.ganancia, fijosMes, gananciaMes: gm, ...volumen(r.ganancia, fijosMes + gm) };
}

/** Todo junto, con los objetivos declarados en la entrada. */
export function resolverObjetivos(cruda) {
  const n = normalizar(cruda); if (!n.ok) return n.resp;
  const piso = precioPiso(n.e);
  return {
    ok: true,
    precioPiso: { equilibrio: piso.equilibrio, margenObjetivo: piso.margenObjetivo, gananciaObjetivo: piso.gananciaObjetivo },
    acosEquilibrio: acosEquilibrio(n.e),
    costoMaximoProveedor: costoMaximoProveedor(n.e),
    unidades: { equilibrio: unidadesEquilibrio(n.e), objetivoMes: unidadesParaObjetivo(n.e) },
    advertencias: piso.advertencias,
  };
}
