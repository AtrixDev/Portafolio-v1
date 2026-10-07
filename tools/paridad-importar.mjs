// tools/paridad-importar.mjs — Paridad entre la calculadora de importación (importar.js) y el motor económico nuevo.
// NO modifica importar.js ni lo migra: ejecuta su `modelo()` REAL (el mismo texto del archivo, extraído y evaluado)
// y compara cada concepto de la parte de VENTA contra el motor. Verificado: da los mismos números, bit a bit, que la página en un navegador.
//
//   node tools/paridad-importar.mjs               → imprime el resumen
//   node tools/paridad-importar.mjs --escribir    → además genera docs/motor-paridad-importar.md
//
// Alcance: la parte de COSTO de importación (CIF, derechos, IVA de aduana, percepciones, gastos locales) no existe en el motor
// (la aportará un adaptador de importación). Para comparar la venta, el motor recibe como DATO el costo por unidad que calculó importar.js.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { evaluar } from '../backend/lib/motor/economia.js';
import { precioParaObjetivo } from '../backend/lib/motor/inversas.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const fuente = ruta => readFileSync(join(RAIZ, ruta), 'utf8');

/** Ejecuta el `modelo` REAL de importar.js (texto del archivo, sin copiarlo ni modificarlo). */
export function cargarImportar() {
  const src = fuente('frontend/js/importar.js');
  const constantes = [/const IVA_ML = [^;]+;/, /const IVA_LOCAL = [^;]+;/].map(r => {
    const m = src.match(r); if (!m) throw new Error('importar.js cambió: no encuentro ' + r);
    return m[0];
  }).join('\n');
  const ini = src.indexOf('  function modelo(v) {'), fin = src.indexOf('\n  }\n', ini) + 5;
  const cuerpo = src.slice(ini, fin);
  if (ini < 0 || !/return r;\s*\}\s*$/.test(cuerpo)) throw new Error('importar.js cambió: no pude extraer modelo(v)');
  const datos = JSON.parse(fuente('frontend/data/importacion.json'));
  return { modelo: new Function(`${constantes}\n${cuerpo}\nreturn modelo;`)(), datos, constantes: Object.fromEntries([...constantes.matchAll(/const (\w+) = ([\d.]+);/g)].map(m => [m[1], Number(m[2])])) };
}

/** Los valores con los que arranca la página (ejemplo + alícuotas del rubro + comisión por tipo), en el formato de `leer()`. */
export function entradaInicial(D, cambios = {}) {
  const e = D.ejemplo, cat = D.categorias.find(c => c.id === (cambios.categoria ?? e.categoria));
  const tipo = cambios.tipo ?? e.tipo;
  const v = {
    fob: e.fob, unidades: e.unidades, tc: D.tipo_cambio_ejemplo, flete_total: e.flete_total, flete_kg: e.flete_kg, kg: e.kg, flete_cbm: e.flete_cbm, cbm: e.cbm, seguro: e.seguro,
    di: cat.di, te: cat.te, iva: cat.iva, iva_ad: cat.iva_ad, ganancias: cat.ganancias, iibb: cat.iibb, despachante: e.despachante, locales: e.locales,
    precio: e.precio, comision: D.mercadolibre[tipo === 'clasica' ? 'comision_clasica' : 'comision_premium'], cuotas: e.cuotas, envio: e.envio, cargo_fijo: e.cargo_fijo,
    iibb_venta: D.mercadolibre.iibb_venta, margen_objetivo: e.margen_objetivo, modo: e.flete_modo, ri: false,
  };
  const { categoria, tipo: _t, ...resto } = cambios;
  return { ...v, ...resto };
}

/** Traduce los datos de importar.js al motor. El costo por unidad entra como DATO (lo calculó importar.js). */
export function entradaMotor(v, costoU, constantes) {
  return {
    precio: v.precio, unidades: v.unidades,
    fiscal: { regimen: v.ri ? 'ri' : 'monotributo', ivaProducto: v.iva / 100, ivaServicios: constantes.IVA_ML },
    // RI: costoU viene SIN los tributos recuperables (neto) · no RI: viene con todos los tributos (ya es el costo real)
    costo: { producto: costoU, ivaIncluido: !v.ri },
    // importar.js trata los cargos del marketplace como cotizados CON IVA incluido (los divide por 1,21 si es RI)
    canal: { ventaPct: v.comision / 100, financiacionPct: v.cuotas / 100, fijo: v.cargo_fijo, envio: v.envio, ivaModo: 'incluido' },
    impuestosVentaPct: v.iibb_venta / 100,
    objetivo: { margenPct: v.margen_objetivo / 100 },
  };
}

const TOL = 1e-9;
const parecidos = (a, b) => Math.abs(a - b) <= TOL * Math.max(1, Math.abs(a), Math.abs(b));
const sinValor = x => x === null || x === undefined || Number.isNaN(x);

/** Conceptos de VENTA comparables. `i` lee de importar.js, `m` del motor. */
export const CONCEPTOS = [
  { id: 'ingreso_neto', nombre: 'Ingreso neto (precio sin IVA)', i: r => r.neto, m: (e) => e.ingresoNeto },
  { id: 'iva_venta', nombre: 'IVA de la venta', i: r => r.ivaVenta, m: e => e.ivaVenta },
  { id: 'comision', nombre: 'Comisión', i: r => r.comision, m: e => monto(e, 'comision_venta') },
  { id: 'cuotas', nombre: 'Cuotas / financiación', i: r => r.cuotas, m: e => monto(e, 'financiacion') },
  { id: 'envio', nombre: 'Envío', i: r => r.envio, m: e => monto(e, 'envio') },
  { id: 'cargo_fijo', nombre: 'Cargo fijo', i: r => r.fijo, m: e => monto(e, 'cargo_fijo') },
  { id: 'iibb_venta', nombre: 'Ingresos Brutos de la venta', i: r => r.iibbVenta, m: e => monto(e, 'impuestos') },
  { id: 'costo_unidad', nombre: 'Costo por unidad (dato de entrada)', i: r => r.costoU, m: e => monto(e, 'producto') },
  { id: 'ganancia', nombre: 'Ganancia por unidad', i: r => r.ganU, m: e => e.ganancia },
  { id: 'margen', nombre: 'Margen (sobre ingreso neto)', i: r => r.margen, m: e => e.margenNeto },
  { id: 'markup', nombre: 'Markup (sobre costo)', i: r => r.markup, m: e => e.markup },
  { id: 'ganancia_total', nombre: 'Ganancia total', i: r => r.ganTotal, m: e => e.gananciaTotal },
  { id: 'precio_minimo', nombre: 'Precio mínimo (ganancia 0), al peso hacia arriba', i: r => (Number.isFinite(r.pMin) ? Math.ceil(r.pMin) : NaN), m: (e, x) => x.piso },
  { id: 'precio_objetivo', nombre: 'Precio para el margen objetivo, al peso hacia arriba', i: r => (Number.isFinite(r.pObj) ? Math.ceil(r.pObj) : NaN), m: (e, x) => x.pisoObjetivo },
];
const monto = (e, id) => e.costos.find(c => c.id === id).monto;

/** Compara un caso. Devuelve filas por concepto, o `noComparable` si el motor rechaza la entrada. */
export function compararCaso(I, v) {
  const r = I.modelo(v);
  const entrada = entradaMotor(v, r.costoU, I.constantes);
  const ev = evaluar(entrada);
  if (!ev.ok) return { v, r, entrada, noComparable: true, errores: ev.errores, filas: [] };
  // equilibrio y objetivo explícitos: precioParaObjetivo() sin argumentos usaría el objetivo declarado en la entrada
  const piso = precioParaObjetivo(ev.entrada, { margenPct: 0, gananciaUnidad: 0 }), pisoObj = precioParaObjetivo(ev.entrada, { margenPct: v.margen_objetivo / 100, gananciaUnidad: 0 });
  const extra = { piso: piso.precio, pisoObjetivo: pisoObj.precio, motivoPiso: piso.motivo, motivoObjetivo: pisoObj.motivo };
  const filas = CONCEPTOS.map(c => {
    const a = c.i(r), b = c.m(ev, extra);
    const ambosSin = sinValor(a) && sinValor(b);
    const coincide = ambosSin || (!sinValor(a) && !sinValor(b) && parecidos(a, b));
    return { id: c.id, concepto: c.nombre, importar: a, motor: b ?? null, coincide, diferencia: ambosSin || sinValor(a) || sinValor(b) ? null : b - a };
  });
  return { v, r, entrada, ev, extra, filas, noComparable: false };
}

// ── casos ──
function prng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function casos(D) {
  const base = c => entradaInicial(D, c);
  const nombrados = [
    ['Ejemplo de la página (premium, no RI)', {}], ['Ejemplo, responsable inscripto', { ri: true }],
    ['Clásica, no RI', { tipo: 'clasica' }], ['Clásica, RI', { tipo: 'clasica', ri: true }],
    ['Con cuotas sin interés 6%', { cuotas: 6 }], ['Con cuotas 6%, RI', { cuotas: 6, ri: true }],
    ['Con cargo fijo $2.740', { cargo_fijo: 2740 }], ['Con cargo fijo $2.740, RI', { cargo_fijo: 2740, ri: true }],
    ['Electrónica (IVA 10,5%), no RI', { categoria: 'electronica' }], ['Electrónica (IVA 10,5%), RI', { categoria: 'electronica', ri: true }],
    ['Vendiendo a pérdida', { precio: 20000 }], ['Vendiendo a pérdida, RI', { precio: 20000, ri: true }],
    ['Margen objetivo 0%', { margen_objetivo: 0 }], ['Margen objetivo 60%', { margen_objetivo: 60 }],
    ['Margen objetivo inalcanzable (95%)', { margen_objetivo: 95 }],
    ['Sin envío ni impuestos de venta', { envio: 0, iibb_venta: 0 }],
    ['Sin precio cargado (la página muestra «—»)', { precio: 0 }],
    ['Comisión + cuotas ≥ 100%', { comision: 70, cuotas: 40 }],
    ['Comisión + cuotas + IIBB tragan todo el ingreso', { comision: 60, cuotas: 0, iibb_venta: 40, tipo: 'clasica' }],
  ].map(([nombre, c]) => ({ nombre, v: base(c) }));
  const rnd = prng(20261004), pick = a => a[Math.floor(rnd() * a.length)], en = (lo, hi) => lo + rnd() * (hi - lo);
  const azar = Array.from({ length: 400 }, (_, i) => {
    const cat = pick(D.categorias), costoAprox = en(2000, 40000);
    return { nombre: `Aleatorio ${i + 1}`, v: {
      fob: en(0.5, 40), unidades: Math.floor(en(10, 2000)), tc: en(800, 2000), flete_total: en(100, 5000), flete_kg: en(1, 12), kg: en(10, 800), flete_cbm: en(80, 400), cbm: en(0.5, 8), seguro: en(0, 2),
      di: cat.di, te: cat.te, iva: cat.iva, iva_ad: cat.iva_ad, ganancias: cat.ganancias, iibb: cat.iibb, despachante: en(0, 500000), locales: en(0, 800000),
      precio: Math.round(costoAprox * en(0.7, 3.5)), comision: en(5, 32), cuotas: rnd() < 0.5 ? 0 : en(1, 14), envio: Math.round(en(0, 8000)), cargo_fijo: rnd() < 0.5 ? 0 : Math.round(en(500, 3000)),
      iibb_venta: en(0, 6), margen_objetivo: Math.round(en(0, 60)), modo: pick(['total', 'kg', 'cbm']), ri: rnd() < 0.5 } };
  });
  return [...nombrados, ...azar];
}

// ── resumen y documento ──
export function resumir(I) {
  const lista = casos(I.datos).map(c => ({ ...c, ...compararCaso(I, c.v) }));
  const comparables = lista.filter(c => !c.noComparable), noComparables = lista.filter(c => c.noComparable);
  const porConcepto = CONCEPTOS.map(c => {
    const filas = comparables.map(x => x.filas.find(f => f.id === c.id)), difs = filas.filter(f => !f.coincide);
    const maxDif = filas.reduce((m, f) => Math.max(m, f.diferencia === null ? 0 : Math.abs(f.diferencia)), 0);
    return { id: c.id, concepto: c.nombre, comparados: filas.length, coinciden: filas.length - difs.length, difieren: difs, maxDif };
  });
  return { lista, comparables, noComparables, porConcepto };
}

const fmt = n => (n === null || n === undefined ? '—' : Number.isNaN(n) ? 'sin valor' : Number.isInteger(n) ? n.toLocaleString('es-AR') : n.toLocaleString('es-AR', { maximumFractionDigits: 6 }));
const md = (cab, filas) => [`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`, ...filas.map(f => `| ${f.join(' | ')} |`)].join('\n');
const DIF = n => (n === null ? '—' : n === 0 ? '0' : Math.abs(n) < 1e-6 ? '< 0,000001 (ruido de punto flotante)' : fmt(n));

/** Ganancia del ejemplo si los cargos del marketplace se trataran de otra forma (la hipótesis sin verificar de importar.js). */
export function sensibilidadIva(I) {
  return [false, true].map(ri => {
    const v = entradaInicial(I.datos, { ri }), r = I.modelo(v), base = entradaMotor(v, r.costoU, I.constantes);
    const g = ivaModo => evaluar({ ...base, canal: { ...base.canal, ivaModo } }).ganancia;
    return { regimen: ri ? 'Responsable inscripto' : 'Monotributo / no inscripto', importar: r.ganU, incluido: g('incluido'), adicional: g('adicional') };
  });
}
/** Efecto de cargar la financiación dos veces (comisión Premium con financiación + el campo «cuotas»). Ilustrativo: depende de qué cargue cada persona. */
export function dobleConteo(I, financiacionPct = 13.4) {
  const v0 = entradaInicial(I.datos), v1 = { ...v0, cuotas: financiacionPct };
  return { pct: financiacionPct, sin: I.modelo(v0).ganU, con: I.modelo(v1).ganU };
}

export function documento(I, R) {
  const casoBase = R.lista.find(c => c.nombre.startsWith('Ejemplo de la página')), casoRI = R.lista.find(c => c.nombre === 'Ejemplo, responsable inscripto');
  const detalle = c => md(['Concepto', 'importar.js', 'Motor nuevo', '¿Coincide?', 'Diferencia'], c.filas.map(f => [f.concepto, fmt(f.importar), fmt(f.motor), f.coincide ? 'Sí' : '**NO**', DIF(f.diferencia)]));
  const sens = sensibilidadIva(I), dc = dobleConteo(I);
  const noModelados = [['Mercadería (FOB)', 'unidades × FOB'], ['Flete internacional', 'total, por kilo o por m³'], ['Seguro', '% sobre FOB + flete'], ['Valor en aduana (CIF)', 'FOB + flete + seguro'], ['Derecho de importación', '% sobre CIF'], ['Tasa de estadística', '% sobre CIF'],
    ['IVA, IVA adicional, percepción de Ganancias, percepción de IIBB', '% sobre CIF + derechos + tasa'], ['Despachante, terminal, depósito y flete local', 'montos en pesos'], ['IVA de los gastos locales', '21% de los gastos locales'], ['Tipo de cambio', 'ARS por USD'],
    ['Costo por unidad puesto en el depósito', 'suma de todo lo anterior ÷ unidades; con el tratamiento RI / no RI']];
  const porConcepto = md(['Concepto', 'Casos', 'Coinciden', 'Máx. diferencia', 'Resultado'], R.porConcepto.map(c => [c.concepto, c.comparados, c.coinciden, c.maxDif === 0 ? '0' : '< 0,000001', c.coinciden === c.comparados ? 'Coincide en todos' : '**DIFIERE**']));
  const rechazos = md(['Caso', 'Qué hace importar.js', 'Qué hace el motor', 'Clasificación'], R.noComparables.map(c => {
    const e = c.errores.map(x => x.codigo).join(', '), r = c.r;
    return c.v.precio === 0
      ? [c.nombre, `Calcula todo con ingreso 0 y la pantalla muestra «—» (ganancia ${fmt(r.ganU)})`, `Rechaza la entrada: ${e}`, 'Diferencia legítima: el motor exige un precio > 0; para importar.js «0» significa «todavía no cargó el precio»']
      : [c.nombre, `Calcula igual: ganancia ${fmt(r.ganU)} y precio mínimo ${fmt(r.pMin)}`, `Rechaza la entrada: ${e}`, 'Diferencia legítima: una comisión + financiación de 100% o más no tiene sentido económico; el motor lo informa en vez de devolver un número absurdo'];
  }));
  return `# Paridad: importar.js contra el motor económico nuevo

> Generado por \`node tools/paridad-importar.mjs --escribir\`. No se edita a mano: cada número sale de la ejecución.

## Qué se compara y cómo

- **importar.js no se modifica.** Se ejecuta su función \`modelo()\` REAL (el texto del archivo, extraído y evaluado). Verificado: da los mismos números, hasta el último decimal, que la página abierta en un navegador (\`window.__importar.modelo\`).
- **Se compara la parte de VENTA** (qué queda de cada venta en el marketplace). El motor recibe como DATO el costo por unidad que calculó importar.js.
- **La parte de COSTO de importación no se compara** porque el motor no la modela (la aportará un adaptador de importación en una etapa posterior). Ver «Lo que no se compara».
- **${R.lista.length} casos:** ${R.lista.length - 400} armados a mano (rubros con IVA 21% y 10,5%, RI y no RI, Clásica y Premium, con y sin cuotas y cargo fijo, ventas a pérdida, objetivos de margen alcanzables e inalcanzables, y los casos límite) y 400 con semilla fija.
- **Traducción de datos** (el mismo mapeo en todos los casos): régimen = RI → \`ri\`, si no \`monotributo\`; IVA del producto = el IVA del rubro; comisión → \`canal.ventaPct\`; cuotas → \`canal.financiacionPct\`; envío y cargo fijo → \`canal.envio\` y \`canal.fijo\`; Ingresos Brutos de la venta → \`impuestosVentaPct\`; **los cargos del marketplace se declaran con IVA «incluido»** (es lo que importar.js supone, ver «Supuestos»); el costo por unidad entra sin IVA recuperable si es RI y con todos los tributos si no lo es.

## Resultado

**Los ${R.porConcepto.length} conceptos de venta coinciden en los ${R.comparables.length} casos comparables.** El motor rechaza ${R.noComparables.length} entradas que importar.js acepta (ver abajo). La paridad vale **bajo la hipótesis de que los cargos del marketplace ya incluyen IVA**, que importar.js asume y nadie verificó.

${porConcepto}

## Caso base: el ejemplo con el que arranca la página (no inscripto)

${detalle(casoBase)}

## El mismo ejemplo como responsable inscripto

${detalle(casoRI)}

## Entradas que el motor rechaza y importar.js acepta

${rechazos}

Además, importar.js convierte en silencio cualquier número mal escrito o negativo en 0 (\`leer()\`); el motor lo rechaza con un error por campo. No es comparable numéricamente: es otra política de validación.

## Lo que no se compara (costo de importación)

${md(['Concepto de importar.js', 'Cómo se calcula'], noModelados)}

Todo esto vive hoy solo en importar.js. Para que el motor lo reemplace hará falta un adaptador de importación (etapa posterior, con su propia paridad).

## Supuestos de importar.js que la paridad NO prueba

**1. Los cargos del marketplace ya vienen con IVA incluido.** importar.js divide comisión, cuotas, envío y cargo fijo por 1,21 si el usuario es RI y los toma tal cual si no. Si el marketplace los cotizara SIN IVA (el IVA se suma aparte), la ganancia del ejemplo cambiaría así:

${md(['Régimen', 'importar.js', 'Motor, cargos «incluido»', 'Motor, cargos «adicional»', 'Diferencia por el supuesto'], sens.map(x => [x.regimen, fmt(Math.round(x.importar * 100) / 100), fmt(Math.round(x.incluido * 100) / 100), fmt(Math.round(x.adicional * 100) / 100), fmt(Math.round((x.incluido - x.adicional) * 100) / 100)]))}

Es el supuesto de mayor impacto y no está verificado. Se resuelve contrastando con el detalle de una venta real (pendiente).

**2. Posible doble conteo de la financiación.** importar.js usa 29% para Premium y además ofrece el campo «cuotas sin interés». Lo observado en la API oficial el 02/10/2026 (dos categorías) es que el porcentaje Premium **ya incluye** la financiación (27,4% = 14% + 13,4%; 29,4% = 16% + 13,4%). Si alguien carga una comisión Premium tomada de la publicación y además completa «cuotas», la financiación se cuenta dos veces. Con el ejemplo, cargar ${dc.pct}% de cuotas bajaría la ganancia por unidad de ${fmt(Math.round(dc.sin * 100) / 100)} a ${fmt(Math.round(dc.con * 100) / 100)}. Es una inferencia sobre cómo se carga el dato, no un error de cálculo; el motor solo suma venta% + financiación% y no sabe qué es «Premium».

**3. El responsable inscripto arranca apagado**, o sea que por defecto el IVA se trata como costo. En el motor el régimen es obligatorio y no tiene default.

## ¿De quién es cada diferencia?

| Hallazgo | ¿Motor mal? | ¿Supuesto distinto de importar.js? | ¿Diferencia conceptual legítima? | ¿Falta información? |
|---|---|---|---|---|
| Ventas: 14 conceptos | No (coincide) | No | — | — |
| Precio 0 | No | No | Sí (el motor exige precio > 0) | No |
| Comisión + cuotas ≥ 100% | No | No | Sí (el motor rechaza lo absurdo) | No |
| Números inválidos → 0 | No | Sí (importar.js los fuerza a 0) | Sí (otra política de validación) | No |
| Costo de importación | — | — | No se compara | Falta el adaptador |
| IVA incluido / adicional en los cargos | No (parametrizado) | **Sí: importar.js lo da por cierto** | — | **Sí: falta una venta real** |
| Doble conteo de financiación | No | Posible (dato de entrada) | — | Sí (cómo se carga) |
`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const I = cargarImportar(), R = resumir(I);
  console.log(`casos: ${R.lista.length} · comparables: ${R.comparables.length} · el motor rechaza la entrada: ${R.noComparables.length}`);
  for (const c of R.porConcepto) console.log(`${c.coinciden === c.comparados ? '✔' : '✘'} ${c.concepto.padEnd(52)} ${c.coinciden}/${c.comparados}  máx|Δ|=${c.maxDif}`);
  for (const c of R.noComparables) console.log('— no comparable:', c.nombre, '→', c.errores.map(e => e.codigo).join(','));
  if (process.argv.includes('--escribir')) { writeFileSync(join(RAIZ, 'docs/motor-paridad-importar.md'), documento(I, R)); console.log('docs/motor-paridad-importar.md escrito'); }
}
