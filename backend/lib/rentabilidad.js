// lib/rentabilidad.js — la herramienta «¿Gano plata y cuál es mi precio piso?»: entrada → motor → presentación → persistencia.
// El servidor RECALCULA todo desde cero a partir de la entrada: jamás lee ganancia, margen, precio piso ni ninguna otra métrica
// que mande el navegador. Reutiliza la infraestructura de F0/F0.1 (resultados con link compartible, métricas, límites).
import { evaluar } from './motor/economia.js';
import { resolverObjetivos } from './motor/inversas.js';
import { resumenGuardable, descripcionEntrada } from './motor/vista.js';
import { guardarResultado, limpiarResumen } from './resultados.js';

export const MAX_ENTRADA = 10000;   // caracteres de la entrada cruda (la más grande razonable ronda los 3.000)
export const MAX_DATOS = 20000;     // el tope de lib/resultados.js › guardarResultado: pasarse haría perder los datos EN SILENCIO, así que se rechaza antes

/**
 * Lo que el usuario DECLARÓ: la entrada original podada a los campos que el motor reconoce (sin claves ajenas, sin `undefined`).
 * Hace falta además de la entrada normalizada: esa ya trae los valores supuestos como si fueran declarados (p. ej. `unidades: 1`),
 * así que al recalcularla desaparecen los `supuestos` y avisos del resultado original. Desde lo declarado se reproduce TODO.
 * La forma se toma de la entrada normalizada, de modo que no hay una lista de campos que mantener acá.
 */
export function podar(cruda, forma) {
  if (Array.isArray(forma)) return Array.isArray(cruda) ? cruda.map((x, i) => (forma[i] && typeof forma[i] === 'object' && !Array.isArray(forma[i]) ? podar(x, forma[i]) : x)) : cruda;
  if (forma && typeof forma === 'object') {
    const out = {};
    if (cruda && typeof cruda === 'object') for (const k of Object.keys(forma)) if (cruda[k] !== undefined) out[k] = podar(cruda[k], forma[k]);
    return out;
  }
  return cruda;
}

/**
 * @param {object} db           Mongo (o un doble de prueba)
 * @param {any}    entradaCruda Lo único que se toma del cliente.
 * @returns {Promise<{status:number, body:object}>}
 */
export async function calcularYGuardar(db, entradaCruda) {
  let texto;
  try { texto = JSON.stringify(entradaCruda ?? null); } catch { texto = null; }
  if (texto === null) return { status: 400, body: { ok: false, error: 'La entrada no se pudo leer.', code: 'entrada_ilegible' } };
  if (texto.length > MAX_ENTRADA) return { status: 413, body: { ok: false, error: 'La entrada es demasiado grande.', code: 'entrada_grande' } };

  const r = evaluar(entradaCruda);                                   // validar + calcular, desde cero
  if (!r.ok) return { status: 400, body: { ok: false, error: 'Revisá los datos marcados.', code: 'entrada_invalida', errores: r.errores, advertencias: r.advertencias } };

  const objetivos = resolverObjetivos(r.entrada);
  const { entrada, ...resultado } = r;                               // la entrada normalizada se guarda una sola vez
  const datos = { motor: r.motor, entradaDeclarada: podar(entradaCruda, entrada), entrada, resultado, objetivos };
  if (JSON.stringify(datos).length > MAX_DATOS) return { status: 413, body: { ok: false, error: 'El resultado es demasiado grande para guardarse.', code: 'resultado_grande' } };

  const resumen = limpiarResumen(resumenGuardable(r, objetivos));    // exactamente lo que queda guardado
  const g = await guardarResultado(db, { herramienta: 'rentabilidad', entrada: descripcionEntrada(entrada), resumen, datos, fuente: 'reglas' });
  return { status: 201, body: { ok: true, resultadoId: g.id, url: g.url, motor: r.motor, entrada, resultado, objetivos, resumen } };
}
