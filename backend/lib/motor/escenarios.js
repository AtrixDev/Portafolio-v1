// motor/escenarios.js — "¿qué pasa si…?": cambiar datos de una entrada y comparar el resultado contra la base.
// Puro y determinístico. NO tiene fórmulas económicas propias: cada escenario es la misma entrada con cambios aplicados,
// y todo número sale de `evaluar` y de las inversas. Lo único nuevo son transformaciones de datos (aplicar cambios) y
// diferencias entre resultados (restas y variaciones relativas).
//
// Un escenario = { id?, nombre, cambios }. `cambios` repite la forma de la entrada y en cada campo numérico acepta
// un valor (reemplaza) o UN operador:
//    { set: v }      reemplaza                         { delta: n }   suma n (puntos / pesos)
//    { factor: x }   multiplica                        { pct: f }     variación relativa; f es fracción: -0.10 = −10%
// Los operadores numéricos sobre cargos escalonados (canal.fijo, canal.envio) se aplican a cada tramo.
import { validar } from './validar.js';
import { evaluar } from './economia.js';
import { precioPiso, acosEquilibrio, costoMaximoProveedor, unidadesEquilibrio } from './inversas.js';
import { MOTOR_VERSION } from './version.js';

const OPERADORES = ['set', 'delta', 'factor', 'pct'];
const MAX_ESCENARIOS = 20, MAX_PUNTOS = 200;
const TOL = 1e-9;
const esObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);

// ── rutas válidas: salen de la forma de una entrada normalizada, así que nunca se desincronizan de `validar` ──
const hojas = (o, pre = '') => Object.entries(o).flatMap(([k, v]) => (esObj(v) ? hojas(v, `${pre}${k}.`) : [`${pre}${k}`]));
const MUESTRA = validar({ precio: 1, fiscal: { regimen: 'sin_iva' }, costo: { producto: 0 } }).entrada;
const RUTAS = new Set(hojas(MUESTRA));
const PREFIJOS = new Set([...RUTAS].flatMap(r => r.split('.').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join('.'))));
const leer = (o, ruta) => ruta.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
function escribir(o, ruta, v) {
  const ks = ruta.split('.');
  let x = o;
  for (const k of ks.slice(0, -1)) { if (!esObj(x[k])) x[k] = {}; x = x[k]; }
  x[ks[ks.length - 1]] = v;
}
const esTramos = v => Array.isArray(v) && v.length > 0 && v.every(t => esObj(t) && 'monto' in t);

function aplicarOperador(actual, op, v) {
  if (op === 'set') return { valor: v };
  if (typeof v !== 'number' || !Number.isFinite(v)) return { error: 'El operador necesita un número finito.' };
  const f = x => (op === 'delta' ? x + v : op === 'factor' ? x * v : x * (1 + v));
  if (typeof actual === 'number') return { valor: f(actual) };
  if (esTramos(actual)) return { valor: actual.map(t => ({ ...t, monto: f(t.monto) })) };
  return { error: 'Ese campo no es numérico: usá un valor directo o { set }.' };
}

/**
 * Aplica `cambios` a una entrada y devuelve una entrada NUEVA (cruda, con la misma forma que la original).
 * No muta nada. Un campo que el usuario no declaró sigue sin declararse (así las advertencias se conservan).
 * @returns {{ ok:true, entrada } | { ok:false, errores }}
 */
export function aplicarCambios(entradaCruda, cambios) {
  const base = validar(entradaCruda);
  if (!base.ok) return { ok: false, errores: base.errores };
  if (!esObj(cambios)) return { ok: false, errores: [{ campo: 'cambios', codigo: 'CAMBIOS_INVALIDOS', texto: 'Los cambios tienen que ser un objeto con la forma de la entrada.' }] };
  const salida = structuredClone(entradaCruda), errores = [];
  const err = (campo, codigo, texto) => errores.push({ campo, codigo, texto });
  (function recorrer(patch, pre) {
    for (const [k, valor] of Object.entries(patch)) {
      const ruta = pre ? `${pre}.${k}` : k;
      if (PREFIJOS.has(ruta) && esObj(valor) && !OPERADORES.includes(Object.keys(valor)[0])) { recorrer(valor, ruta); continue; }
      if (!RUTAS.has(ruta)) { err(ruta, 'CAMBIO_DESCONOCIDO', `"${ruta}" no es un campo de la entrada.`); continue; }
      let op = 'set', v = valor;
      if (esObj(valor)) {
        const claves = Object.keys(valor);
        if (claves.length !== 1 || !OPERADORES.includes(claves[0])) { err(ruta, 'OPERADOR_INVALIDO', `${ruta}: usá un valor o exactamente un operador (${OPERADORES.join(', ')}).`); continue; }
        [op] = claves; v = valor[op];
      }
      const actual = leer(entradaCruda, ruta) ?? leer(base.entrada, ruta);
      if (op !== 'set' && (actual === null || actual === undefined)) { err(ruta, 'CAMPO_SIN_VALOR_BASE', `${ruta} no tiene un valor de base sobre el cual aplicar "${op}".`); continue; }
      const r = aplicarOperador(actual, op, v);
      if (r.error) err(ruta, 'OPERADOR_INVALIDO', `${ruta}: ${r.error}`); else escribir(salida, ruta, r.valor);
    }
  })(cambios, '');
  return errores.length ? { ok: false, errores } : { ok: true, entrada: salida };
}

/** Las métricas que se comparan, en orden fijo. Todas salen de `evaluar` o de las inversas. */
export const METRICAS = ['precio', 'ingresoNeto', 'costoTotal', 'ganancia', 'gananciaTotal', 'margenNeto', 'markup', 'tacos',
  'precioEquilibrio', 'precioMargenObjetivo', 'precioGananciaObjetivo', 'acosEquilibrio', 'costoMaximoProveedor', 'unidadesEquilibrio'];

function medir(entradaCruda) {
  const r = evaluar(entradaCruda);
  if (!r.ok) return { ok: false, errores: r.errores };
  const piso = precioPiso(r.entrada);
  const m = {
    precio: r.precio, ingresoNeto: r.ingresoNeto, costoTotal: r.costoTotal, ganancia: r.ganancia, gananciaTotal: r.gananciaTotal,
    margenNeto: r.margenNeto, markup: r.markup, tacos: r.tacos,
    precioEquilibrio: piso.equilibrio.precio, precioMargenObjetivo: piso.margenObjetivo?.precio ?? null, precioGananciaObjetivo: piso.gananciaObjetivo?.precio ?? null,
    acosEquilibrio: acosEquilibrio(r.entrada).acos ?? null, costoMaximoProveedor: costoMaximoProveedor(r.entrada).costoMaximo ?? null,
    unidadesEquilibrio: unidadesEquilibrio(r.entrada).unidades ?? null,
  };
  return { ok: true, resultado: r, metricas: m, piso };
}

const diferencia = (base, valor) => {
  if (typeof base !== 'number' || typeof valor !== 'number') return null;           // alguna de las dos no existe: no hay diferencia que mostrar
  const abs = valor - base;
  return { abs: abs === 0 ? 0 : abs, pct: base === 0 ? null : (abs === 0 ? 0 : abs / Math.abs(base)) };
};
const deltasDe = (mb, ms) => Object.fromEntries(METRICAS.map(k => [k, diferencia(mb[k], ms[k])]));
// Por id (no por posición): un escenario puede cambiar la cantidad de costos extra.
const deltaCostos = (rb, rs) => {
  const b = new Map(rb.costos.map(c => [c.id, c])), s = new Map(rs.costos.map(c => [c.id, c]));
  return [...new Set([...b.keys(), ...s.keys()])]
    .map(id => ({ id, nombre: (s.get(id) ?? b.get(id)).nombre, abs: (s.get(id)?.monto ?? 0) - (b.get(id)?.monto ?? 0) }))
    .map(c => ({ ...c, abs: c.abs === 0 ? 0 : c.abs })).filter(c => Math.abs(c.abs) > TOL);
};
const efecto = d => (!d ? null : d.abs > TOL ? 'mejora' : d.abs < -TOL ? 'empeora' : 'igual');

/**
 * Compara escenarios contra la entrada base. Cada escenario es independiente de los demás (el orden no cambia sus números).
 * Un escenario inválido NO frena a los otros: queda como { ok:false, errores }.
 */
export function compararEscenarios(entradaBase, escenarios) {
  const b = medir(entradaBase);
  if (!b.ok) return { ok: false, errores: b.errores };
  if (!Array.isArray(escenarios) || escenarios.length === 0 || escenarios.length > MAX_ESCENARIOS)
    return { ok: false, errores: [{ campo: 'escenarios', codigo: 'ESCENARIOS_INVALIDOS', texto: `Pasá entre 1 y ${MAX_ESCENARIOS} escenarios.` }] };
  const ids = new Set(['base']);
  const lista = [];
  for (const [i, esc] of escenarios.entries()) {
    const id = String(esc?.id ?? `esc_${i + 1}`), nombre = String(esc?.nombre ?? id).slice(0, 60);
    if (ids.has(id)) return { ok: false, errores: [{ campo: `escenarios.${i}.id`, codigo: 'ID_DUPLICADO', texto: `El id "${id}" está repetido (o es "base", que está reservado).` }] };
    ids.add(id);
    const ap = aplicarCambios(entradaBase, esc?.cambios);
    if (!ap.ok) { lista.push({ id, nombre, ok: false, cambios: esc?.cambios ?? null, errores: ap.errores }); continue; }
    const s = medir(ap.entrada);
    if (!s.ok) { lista.push({ id, nombre, ok: false, cambios: esc.cambios, errores: s.errores }); continue; }
    const deltas = deltasDe(b.metricas, s.metricas);
    lista.push({ id, nombre, ok: true, cambios: esc.cambios, entrada: s.resultado.entrada, metricas: s.metricas, deltas,
      deltaCostos: deltaCostos(b.resultado, s.resultado), efectoGanancia: efecto(deltas.ganancia),
      advertencias: s.resultado.advertencias, supuestos: s.resultado.supuestos });
  }
  const ranking = [{ id: 'base', ganancia: b.metricas.ganancia }, ...lista.filter(e => e.ok).map(e => ({ id: e.id, ganancia: e.metricas.ganancia }))]
    .map((x, i) => ({ ...x, i })).sort((x, y) => y.ganancia - x.ganancia || x.i - y.i).map(x => x.id);   // empate → orden de entrada
  return {
    ok: true, motor: { version: MOTOR_VERSION },
    base: { entrada: b.resultado.entrada, metricas: b.metricas, advertencias: b.resultado.advertencias, supuestos: b.resultado.supuestos },
    escenarios: lista, ranking,
  };
}

/** Escenarios típicos, para arrancar sin armar nada. Son solo datos: se pueden editar o reemplazar. */
export function escenariosTipicos() {
  return [
    { id: 'precio_menos_10', nombre: 'Bajo el precio 10%', cambios: { precio: { pct: -0.10 } } },
    { id: 'precio_mas_10', nombre: 'Subo el precio 10%', cambios: { precio: { pct: 0.10 } } },
    { id: 'costo_mas_10', nombre: 'El proveedor sube el costo 10%', cambios: { costo: { producto: { pct: 0.10 } } } },
    { id: 'acos_mas_10', nombre: 'El ACOS sube 10 puntos', cambios: { publicidad: { acos: { delta: 0.10 } } } },
  ];
}

// ── barridos: una variable numérica recorre una lista de valores ──
/** n valores equiespaciados entre `desde` y `hasta` (inclusive), sin ruido de punto flotante. */
export function rango(desde, hasta, n) {
  if (![desde, hasta].every(Number.isFinite) || !Number.isInteger(n) || n < 2 || n > MAX_PUNTOS) return [];
  return Array.from({ length: n }, (_, i) => Math.round((desde + (hasta - desde) * i / (n - 1)) * 1e9) / 1e9);
}
/**
 * Evalúa la entrada para cada valor de `variable` (ruta numérica, p. ej. "precio", "publicidad.acos", "costo.producto").
 * `equilibrio` es el valor de esa variable que cumple el objetivo declarado (sin objetivo, ganancia 0) cuando existe una inversa para ella.
 */
export function barrer(entradaBase, variable, valores) {
  const b = medir(entradaBase);
  if (!b.ok) return { ok: false, errores: b.errores };
  const actual = leer(entradaBase, variable) ?? leer(b.resultado.entrada, variable);
  if (!RUTAS.has(variable)) return { ok: false, errores: [{ campo: 'variable', codigo: 'VARIABLE_DESCONOCIDA', texto: `"${variable}" no es un campo de la entrada.` }] };
  if (typeof actual !== 'number') return { ok: false, errores: [{ campo: 'variable', codigo: 'VARIABLE_NO_NUMERICA', texto: `"${variable}" no es un campo numérico simple: no se puede barrer.` }] };
  if (!Array.isArray(valores) || valores.length < 1 || valores.length > MAX_PUNTOS || !valores.every(Number.isFinite))
    return { ok: false, errores: [{ campo: 'valores', codigo: 'VALORES_INVALIDOS', texto: `Pasá entre 1 y ${MAX_PUNTOS} números finitos.` }] };
  const filas = valores.map(valor => {
    const ap = aplicarCambios(entradaBase, nest(variable, valor));
    const r = ap.ok ? evaluar(ap.entrada) : ap;
    return r.ok ? { valor, ok: true, ganancia: r.ganancia, margenNeto: r.margenNeto, markup: r.markup, gananciaTotal: r.gananciaTotal } : { valor, ok: false, errores: r.errores };
  });
  const cambiosDeSigno = [];
  for (let i = 1; i < filas.length; i++) {
    const a = filas[i - 1], c = filas[i];
    if (a.ok && c.ok && (a.ganancia < 0) !== (c.ganancia < 0)) cambiosDeSigno.push({ entre: [a.valor, c.valor] });
  }
  let equilibrio = null;
  if (variable === 'precio') { const p = precioPiso(b.resultado.entrada).equilibrio; equilibrio = { valor: p.precio, motivo: p.motivo ?? null }; }
  else if (variable === 'publicidad.acos') { const a = acosEquilibrio(b.resultado.entrada); equilibrio = { valor: a.acos, motivo: a.motivo ?? null }; }
  else if (variable === 'costo.producto') { const c = costoMaximoProveedor(b.resultado.entrada); equilibrio = { valor: c.costoMaximo, motivo: c.motivo ?? null }; }
  return { ok: true, motor: { version: MOTOR_VERSION }, variable, base: { valor: actual, ganancia: b.metricas.ganancia, margenNeto: b.metricas.margenNeto }, filas, cambiosDeSigno, equilibrio };
}
const nest = (ruta, valor) => ruta.split('.').reduceRight((acc, k) => ({ [k]: acc }), valor);
