// motor/economia.js — el cálculo económico de UNA unidad. Determinístico y puro: sin red, sin DOM, sin azar, sin reloj, sin IA.
//
// Definiciones (son las de este modelo; la interfaz las rotula):
//   ingresoNeto = precio / (1 + ivaProducto)  si el régimen es "ri"; en los demás casos = precio
//   ganancia    = ingresoNeto − Σ costos      (cada costo ya neto del IVA que el vendedor puede recuperar)
//   margenNeto  = ganancia / ingresoNeto
//   markup      = ganancia / costo del producto (producto + extras, netos)   → null si el costo es cero
//
// Tratamiento de IVA de un monto "cotizado" q (lo que dice el canal, el proveedor o la factura):
//                         incluido        adicional        sin
//   ri (recupera crédito)  q/(1+iva)       q                q
//   monotributo (es costo) q               q·(1+iva)        q
//   sin_iva                q               q                q
// No se redondea nada acá: el redondeo es asunto de la presentación (ver redondear*).
import { validar } from './validar.js';
import { MOTOR_VERSION } from './version.js';

const sinCeroNegativo = x => (x === 0 ? 0 : x);

/** Factor que convierte un monto cotizado en costo real para el vendedor. */
export function factorIva(modo, regimen, alicuota) {
  if (regimen === 'sin_iva' || (modo !== 'incluido' && modo !== 'adicional')) return 1;   // «sin» o no declarado (solo ocurre con monto cero)
  if (modo === 'incluido') return regimen === 'ri' ? 1 / (1 + alicuota) : 1;
  return regimen === 'ri' ? 1 : 1 + alicuota;            // adicional
}

/** Valor de un monto que puede ser constante o escalonado por precio ([{ hasta, monto }], aplica mientras precio < hasta). */
export function valorEn(spec, precio) {
  if (!Array.isArray(spec)) return spec;
  for (const t of spec) if (t.hasta === null || precio < t.hasta) return t.monto;
  return spec[spec.length - 1].monto;
}

/** Redondeo de presentación: mitad lejos de cero, sin "-0". Devuelve null si no es un número finito. */
export function redondear(x, decimales = 2) {
  if (typeof x !== 'number' || !Number.isFinite(x)) return null;
  const f = 10 ** decimales;
  const r = Math.sign(x) * Math.round((Math.abs(x) + 1e-9) * f) / f;
  return sinCeroNegativo(r);
}
export const redondearDinero = x => redondear(x, 2);

/** Evalúa una entrada (cruda o ya normalizada). Nunca lanza. */
export function evaluar(entradaCruda) {
  const v = validar(entradaCruda);
  if (!v.ok) return { ok: false, motor: { version: MOTOR_VERSION }, errores: v.errores, advertencias: v.advertencias };

  const e = v.entrada, regimen = e.fiscal.regimen, P = e.precio;
  const kP = regimen === 'ri' ? 1 / (1 + e.fiscal.ivaProducto) : 1;
  const N = P * kP;

  const costos = [];
  const add = (id, nombre, categoria, cotizado, factor) => costos.push({ id, nombre, categoria, cotizado: sinCeroNegativo(cotizado), factorIva: factor, monto: sinCeroNegativo(cotizado * factor) });

  // Producto y extras
  const fProd = incluido => factorIva(incluido ? 'incluido' : 'adicional', regimen, e.costo.ivaCompra);
  add('producto', 'Costo del producto', 'producto', e.costo.producto, fProd(e.costo.ivaIncluido));
  e.costo.extras.forEach((x, i) => add(`extra_${i + 1}`, x.nombre || `Costo extra ${i + 1}`, 'producto', x.monto, fProd(x.ivaIncluido)));
  const costoProducto = costos.reduce((s, c) => s + c.monto, 0);

  // Canal de venta (sus cargos se calculan sobre el precio publicado)
  const fc = factorIva(e.canal.ivaModo, regimen, e.fiscal.ivaServicios);
  add('comision_venta', 'Comisión por venta', 'canal', P * e.canal.ventaPct, fc);
  add('financiacion', 'Financiación (cuotas)', 'canal', P * e.canal.financiacionPct, fc);
  add('cargo_fijo', 'Cargo fijo por unidad', 'canal', valorEn(e.canal.fijo, P), fc);
  add('envio', 'Envío a cargo del vendedor', 'canal', valorEn(e.canal.envio, P), fc);

  // Publicidad: lo que pesa es el TACOS (ACOS × participación de las ventas que vienen de publicidad)
  const tacos = e.publicidad.acos * e.publicidad.ventasPorAdsPct;
  add('publicidad', 'Publicidad', 'publicidad', (e.publicidad.base === 'neto' ? N : P) * tacos, factorIva(e.publicidad.ivaModo, regimen, e.fiscal.ivaServicios));

  // Impuestos y pérdidas sobre el ingreso neto
  add('impuestos', 'Impuestos sobre ventas', 'impuesto', N * e.impuestosVentaPct, 1);
  add('devoluciones', 'Devoluciones y reclamos', 'otro', N * e.devolucionesPct, 1);

  const costoTotal = costos.reduce((s, c) => s + c.monto, 0);
  const ganancia = sinCeroNegativo(N - costoTotal);
  const advertencias = [...v.advertencias];
  if (ganancia < 0) advertencias.push({ codigo: 'GANANCIA_NEGATIVA', severidad: 'alta', texto: 'Con estos datos perdés plata en cada unidad.' });

  return {
    ok: true,
    motor: { version: MOTOR_VERSION },
    entrada: e,
    precio: P, ingresoNeto: N, ivaVenta: P - N,
    costos,
    costoProducto, costoTotal,
    ganancia,
    gananciaTotal: sinCeroNegativo(ganancia * e.unidades),
    margenNeto: ganancia / N,
    markup: costoProducto > 0 ? ganancia / costoProducto : null,
    tacos,
    advertencias,
    supuestos: v.supuestos,
  };
}
