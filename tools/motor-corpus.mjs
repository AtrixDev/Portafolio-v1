// tools/motor-corpus.mjs — corre TODO el motor económico sobre un conjunto fijo de entradas y devuelve una huella por resultado.
// `correrCorpus` es una función AUTOCONTENIDA (no usa nada de afuera): el mismo texto se ejecuta en Node y dentro de un navegador,
// para demostrar que el motor da lo mismo en ambos. No tiene lógica económica: solo llama al motor y resume lo que devuelve.
//
//   node tools/motor-corpus.mjs            → imprime el resultado del corpus en Node (JSON)
//   node tools/motor-corpus.mjs --fuente   → imprime el texto de la función (para ejecutarla en un navegador)
//   Lo usa tools/paridad-navegador.py
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * @param {string} base  Dónde están los módulos del motor, terminado en «/». Node: URL de archivo · navegador: «/js/motor/».
 * @param {{detalle?: number}} [opciones]  `detalle: n` devuelve el JSON completo del caso n (para diagnosticar una diferencia).
 */
export async function correrCorpus(base, opciones = {}) {
  const NOMBRES = ['validar', 'economia', 'inversas', 'escenarios', 'supuestos', 'version', 'vista'];
  const M = Object.fromEntries(await Promise.all(NOMBRES.map(async n => [n, await import(base + n + '.js')])));
  const { validar } = M.validar, { evaluar } = M.economia;
  const { precioPiso, acosEquilibrio, costoMaximoProveedor, unidadesEquilibrio, unidadesParaObjetivo, resolverObjetivos } = M.inversas;
  const { compararEscenarios, escenariosTipicos, barrer, rango } = M.escenarios;
  const { resumenGuardable, descripcionEntrada, filasVista, avisosVista } = M.vista;

  // Huella FNV-1a de 32 bits (dos pasadas con semillas distintas → 64 bits): suficiente para detectar cualquier diferencia de texto
  const huella = (txt) => {
    let a = 0x811c9dc5, b = 0x9747b28c;
    for (let i = 0; i < txt.length; i++) { const c = txt.charCodeAt(i); a = Math.imul(a ^ c, 16777619) >>> 0; b = Math.imul(b ^ c, 2246822519) >>> 0; }
    return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
  };
  const prng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // ── entradas ──
  const A = { precio: 15000, fiscal: { regimen: 'monotributo' }, costo: { producto: 6000, ivaIncluido: true }, canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'incluido' }, impuestosVentaPct: 0.035 };
  const nombrados = [
    ['A monotributo', A],
    ['A con publicidad y objetivos', { ...A, publicidad: { acos: 0.1, ivaModo: 'incluido' }, objetivo: { margenPct: 0.2, gananciaUnidad: 1000, gananciaMes: 500000 }, fijosMes: 100000, unidades: 3 }],
    ['RI cargos incluido', { precio: 12100, fiscal: { regimen: 'ri' }, costo: { producto: 5000, ivaIncluido: false }, canal: { ventaPct: 0.14, ivaModo: 'incluido' }, impuestosVentaPct: 0.03 }],
    ['RI cargos adicional', { precio: 12100, fiscal: { regimen: 'ri' }, costo: { producto: 5000, ivaIncluido: false }, canal: { ventaPct: 0.14, ivaModo: 'adicional' }, impuestosVentaPct: 0.03 }],
    ['monotributo cargos adicional', { precio: 12100, fiscal: { regimen: 'monotributo' }, costo: { producto: 5000, ivaIncluido: true }, canal: { ventaPct: 0.14, ivaModo: 'adicional' }, impuestosVentaPct: 0.03 }],
    ['cargo fijo escalonado', { ...A, canal: { ventaPct: 0.14, fijo: [{ hasta: 12000, monto: 1330 }, { hasta: null, monto: 2740 }], ivaModo: 'incluido' } }],
    ['piso no estable', { ...A, canal: { ventaPct: 0.14, fijo: [{ hasta: 12000, monto: 1330 }, { hasta: null, monto: 9000 }], ivaModo: 'incluido' } }],
    ['el redondeo cruza de tramo', { ...A, costo: { producto: 8569.5875, ivaIncluido: true }, canal: { ventaPct: 0.14, fijo: [{ hasta: 12000, monto: 1330 }, { hasta: null, monto: 2740 }], ivaModo: 'incluido' } }],
    ['cargos tragan todo', { ...A, canal: { ventaPct: 0.6, ivaModo: 'incluido' }, impuestosVentaPct: 0.4 }],
    ['vende a pérdida', { ...A, precio: 9000 }],
    ['costo cero', { ...A, costo: { producto: 0, ivaIncluido: true } }],
    ['sin costo declarado (costo máximo)', { ...A, costo: { ivaIncluido: true } }],
    ['sin_iva con extras', { precio: 100, fiscal: { regimen: 'sin_iva' }, costo: { producto: 40, extras: [{ nombre: 'Caja', monto: 5 }] }, canal: { ventaPct: 0.1, financiacionPct: 0.05, envio: 3 }, devolucionesPct: 0.02, publicidad: { acos: 0.08, ventasPorAdsPct: 0.5, base: 'neto' } }],
    ['porcentaje mal cargado', { ...A, canal: { ventaPct: 14, ivaModo: 'incluido' } }],
    ['sin régimen', { ...A, fiscal: {} }],
    ['sin IVA de cargos declarado', { ...A, canal: { ventaPct: 0.14, fijo: 2740 } }],
    ['valores extremos', { precio: 999999999, fiscal: { regimen: 'ri' }, costo: { producto: 0.01, ivaIncluido: true }, canal: { ventaPct: 0.0001, ivaModo: 'incluido' }, impuestosVentaPct: 0 }],
    ['basura: null', null], ['basura: undefined', undefined], ['basura: texto', 'x'], ['basura: número', 42], ['basura: lista', []], ['basura: vacío', {}], ['basura: tipos', { precio: '15000', fiscal: 5, costo: [] }],
  ];
  const rnd = prng(20261005), pick = a => a[Math.floor(rnd() * a.length)], en = (lo, hi) => lo + rnd() * (hi - lo);
  const azar = Array.from({ length: 200 }, (_, i) => {
    const regimen = pick(['monotributo', 'ri', 'sin_iva']), modo = () => pick(['incluido', 'adicional', 'sin']), precio = Math.round(en(2000, 200000));
    const e = {
      precio, unidades: Math.floor(en(1, 50)), fiscal: { regimen },
      costo: { producto: Math.round(precio * en(0.05, 0.8)), ivaIncluido: rnd() < 0.5 },
      canal: { ventaPct: en(0.02, 0.3), financiacionPct: rnd() < 0.5 ? en(0, 0.15) : 0,
        fijo: rnd() < 0.5 ? Math.round(en(0, 3000)) : [{ hasta: Math.round(en(3000, 100000)), monto: Math.round(en(0, 1500)) }, { hasta: null, monto: Math.round(en(1500, 4000)) }],
        envio: rnd() < 0.5 ? Math.round(en(0, 5000)) : 0, ivaModo: modo() },
      publicidad: { acos: rnd() < 0.5 ? en(0, 0.3) : 0, ventasPorAdsPct: en(0.2, 1), base: pick(['precio', 'neto']), ivaModo: modo() },
      impuestosVentaPct: en(0, 0.1), devolucionesPct: rnd() < 0.5 ? en(0, 0.05) : 0, fijosMes: rnd() < 0.5 ? Math.round(en(0, 300000)) : 0,
      objetivo: { margenPct: rnd() < 0.6 ? en(0, 0.4) : null, gananciaUnidad: rnd() < 0.4 ? Math.round(en(0, 3000)) : null, gananciaMes: rnd() < 0.4 ? Math.round(en(0, 600000)) : null },
    };
    if (rnd() < 0.3) e.costo.extras = [{ nombre: 'Extra', monto: Math.round(en(10, 500)), ivaIncluido: rnd() < 0.5 }];
    return [`azar ${i + 1}`, e];
  });
  const entradas = [...nombrados, ...azar];

  // ── todo lo que el motor sabe hacer, sobre cada entrada ──
  const piezas = (e) => {
    const copia = e === undefined ? undefined : structuredClone(e);
    const r = {
      validar: validar(copia), evaluar: evaluar(copia), piso: precioPiso(copia), acos: acosEquilibrio(copia), costoMaximo: costoMaximoProveedor(copia),
      unidades: [unidadesEquilibrio(copia), unidadesParaObjetivo(copia)], objetivos: resolverObjetivos(copia),
      escenarios: compararEscenarios(copia, escenariosTipicos()), barrido: barrer(copia, 'precio', rango(1000, 60000, 12)),
    };
    // presentación: solo si el motor pudo calcular (es lo que hace la API)
    const ev = r.evaluar;
    r.vista = ev && ev.ok ? { resumen: resumenGuardable(ev, r.objetivos), descripcion: descripcionEntrada(ev.entrada), filas: filasVista(ev, r.objetivos, { completo: true }), avisos: avisosVista(ev, r.objetivos) } : null;
    return r;
  };
  const texto = (x) => JSON.stringify(x === undefined ? null : x);

  if (opciones.detalle !== undefined) { const [nombre, e] = entradas[opciones.detalle]; return JSON.stringify({ nombre, entrada: e ?? null, resultado: piezas(e) }, null, 1); }

  const casos = entradas.map(([nombre, e], i) => {
    const p = piezas(e), h = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, huella(texto(v))]));
    return { i, nombre, h };
  });
  const [, ejA] = nombrados[0];
  return JSON.stringify({
    version: M.version.MOTOR_VERSION,
    exportaciones: Object.fromEntries(NOMBRES.map(n => [n, Object.keys(M[n]).sort()])),
    registro: huella(texto({ o: M.supuestos.OBLIGATORIOS, d: M.supuestos.DEFAULTS, x: M.supuestos.OPCIONALES_SIN_EFECTO })),
    metricas: M.escenarios.METRICAS,
    totalCasos: casos.length,
    casos,
    // un resultado completo, para verlo con los ojos además de las huellas
    muestra: { evaluar: evaluar(structuredClone(ejA)), piso: precioPiso(structuredClone(ejA)).equilibrio },
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--fuente')) process.stdout.write(correrCorpus.toString());
  else {
    const base = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '../backend/lib/motor/')).href;
    const iDetalle = process.argv.indexOf('--detalle');
    process.stdout.write(await correrCorpus(base, iDetalle > 0 ? { detalle: Number(process.argv[iDetalle + 1]) } : {}));
  }
}
