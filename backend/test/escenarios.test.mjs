// Pruebas de los escenarios del motor (S3). Correr: node --test backend/test/escenarios.test.mjs
// Puras y deterministas (sin red, base, reloj ni azar; las "aleatorias" usan semilla fija). Valores esperados calculados a mano.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluar } from '../lib/motor/economia.js';
import { precioParaObjetivo } from '../lib/motor/inversas.js';
import { aplicarCambios, compararEscenarios, escenariosTipicos, barrer, rango, METRICAS } from '../lib/motor/escenarios.js';

const cerca = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);
const clon = x => structuredClone(x);
const esc = (id, cambios) => ({ id, nombre: id, cambios });
const por = (r, id) => r.escenarios.find(e => e.id === id);

// Caso A (monotributo): precio 15.000 → ganancia 3.635 ; comisión 14%, fijo 2.740, impuestos 3,5%, costo 6.000
const A = (extra = {}) => ({
  precio: 15000, fiscal: { regimen: 'monotributo' }, costo: { producto: 6000, ivaIncluido: true },
  canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'incluido' }, impuestosVentaPct: 0.035, ...extra,
});
const conAds = () => A({ publicidad: { acos: 0, ivaModo: 'incluido' } });

// ═══ aplicarCambios ═══
test('los cuatro operadores y el valor directo producen la misma entrada cuando significan lo mismo', () => {
  const m = c => compararEscenarios(A(), [esc('x', c)]).escenarios[0].metricas;
  const ref = m({ precio: 13500 });
  for (const c of [{ precio: { set: 13500 } }, { precio: { delta: -1500 } }, { precio: { factor: 0.9 } }, { precio: { pct: -0.10 } }])
    assert.deepEqual(m(c), ref);
  cerca(ref.ganancia, 2397.5);                                    // 13.500 − 1.890 − 2.740 − 472,5 − 6.000
});
test('aplicarCambios devuelve una entrada NUEVA y no muta nada (ni la base ni los cambios)', () => {
  const base = A(), cambios = { precio: { pct: -0.1 }, canal: { fijo: 3000 } };
  const b0 = clon(base), c0 = clon(cambios);
  const r = aplicarCambios(base, cambios);
  assert.equal(r.ok, true); assert.equal(r.entrada.precio, 13500); assert.equal(r.entrada.canal.fijo, 3000); assert.equal(r.entrada.canal.ventaPct, 0.14);
  assert.deepEqual(base, b0); assert.deepEqual(cambios, c0);
  r.entrada.canal.ventaPct = 0.99; assert.equal(base.canal.ventaPct, 0.14, 'no comparte referencias');
});
test('un campo no declarado sigue sin declararse (las advertencias se conservan en el escenario)', () => {
  const sinImp = A(); delete sinImp.impuestosVentaPct;
  const r = compararEscenarios(sinImp, [esc('x', { precio: { pct: 0.1 } })]);
  assert.ok(r.base.advertencias.some(a => a.codigo === 'IMPUESTOS_NO_DECLARADOS'));
  assert.ok(por(r, 'x').advertencias.some(a => a.codigo === 'IMPUESTOS_NO_DECLARADOS'));
  assert.equal(aplicarCambios(sinImp, { precio: 1000 }).entrada.impuestosVentaPct, undefined);
});
test('operadores sobre cargos escalonados: se aplican a cada tramo', () => {
  const e = A({ canal: { ventaPct: 0.14, fijo: [{ hasta: 12000, monto: 1000 }, { hasta: null, monto: 2000 }], ivaModo: 'incluido' } });
  const pct = aplicarCambios(e, { canal: { fijo: { pct: 0.1 } } }).entrada.canal.fijo;
  assert.deepEqual(pct.map(t => t.hasta), [12000, null]); cerca(pct[0].monto, 1100); cerca(pct[1].monto, 2200);
  assert.deepEqual(aplicarCambios(e, { canal: { fijo: { delta: -500 } } }).entrada.canal.fijo.map(t => t.monto), [500, 1500]);
  assert.deepEqual(aplicarCambios(e, { canal: { fijo: 900 } }).entrada.canal.fijo, 900);            // reemplazo completo por un valor
});
test('cambios inválidos: se explican uno por uno y nunca lanzan', () => {
  const codigos = c => aplicarCambios(A(), c).errores?.map(e => `${e.campo}:${e.codigo}`);
  assert.deepEqual(codigos({ preci0: 5 }), ['preci0:CAMBIO_DESCONOCIDO']);
  assert.deepEqual(codigos({ canal: { comision: 0.1 } }), ['canal.comision:CAMBIO_DESCONOCIDO']);
  assert.deepEqual(codigos({ precio: { pct: -0.1, delta: 5 } }), ['precio:OPERADOR_INVALIDO']);
  assert.deepEqual(codigos({ precio: { raro: 5 } }), ['precio:OPERADOR_INVALIDO']);
  assert.deepEqual(codigos({ precio: { pct: '10%' } }), ['precio:OPERADOR_INVALIDO']);
  assert.deepEqual(codigos({ precio: { pct: NaN } }), ['precio:OPERADOR_INVALIDO']);
  assert.deepEqual(codigos({ fiscal: { regimen: { pct: 0.1 } } }), ['fiscal.regimen:OPERADOR_INVALIDO']);          // no es numérico
  assert.deepEqual(codigos({ publicidad: { ivaModo: { delta: 1 } } }), ['publicidad.ivaModo:CAMPO_SIN_VALOR_BASE']);  // no hay valor sobre el cual operar
  assert.deepEqual(codigos({ canal: 5 }), ['canal:CAMBIO_DESCONOCIDO']);
  for (const x of [null, undefined, 'x', 5, []]) assert.equal(aplicarCambios(A(), x).ok, false);
  assert.equal(aplicarCambios(null, { precio: 1 }).ok, false);                                                        // base inválida
});

// ═══ compararEscenarios ═══
test('los 4 escenarios típicos sobre el caso A, con números calculados a mano', () => {
  const r = compararEscenarios(conAds(), escenariosTipicos());
  assert.equal(r.ok, true);
  const G = id => por(r, id).metricas.ganancia, D = id => por(r, id).deltas.ganancia;
  cerca(r.base.metricas.ganancia, 3635);
  cerca(G('precio_menos_10'), 2397.5); cerca(D('precio_menos_10').abs, -1237.5); cerca(D('precio_menos_10').pct, -1237.5 / 3635);
  cerca(G('precio_mas_10'), 4872.5);   cerca(D('precio_mas_10').abs, 1237.5);
  cerca(G('costo_mas_10'), 3035);      cerca(D('costo_mas_10').abs, -600);        // 6.000 → 6.600
  cerca(G('acos_mas_10'), 2135);       cerca(D('acos_mas_10').abs, -1500);        // 10 puntos de ACOS sobre 15.000
  assert.deepEqual(['precio_menos_10', 'precio_mas_10', 'costo_mas_10', 'acos_mas_10'].map(id => por(r, id).efectoGanancia), ['empeora', 'mejora', 'empeora', 'empeora']);
  assert.deepEqual(r.ranking, ['precio_mas_10', 'base', 'costo_mas_10', 'precio_menos_10', 'acos_mas_10']);     // 4.872,5 · 3.635 · 3.035 · 2.397,5 · 2.135
});
test('las métricas derivadas también cambian: el precio piso depende de costos y publicidad, no del precio cargado', () => {
  const r = compararEscenarios(conAds(), escenariosTipicos());
  assert.equal(r.base.metricas.precioEquilibrio, 10594);
  assert.equal(por(r, 'precio_menos_10').metricas.precioEquilibrio, 10594);      // bajar el precio no mueve el piso
  assert.equal(por(r, 'costo_mas_10').metricas.precioEquilibrio, 11322);         // 9.340 / 0,825 = 11.321,2
  assert.equal(por(r, 'acos_mas_10').metricas.precioEquilibrio, 12056);          // 8.740 / 0,725 = 12.055,2
  assert.equal(por(r, 'costo_mas_10').deltas.precioEquilibrio.abs, 728);
  cerca(por(r, 'acos_mas_10').metricas.acosEquilibrio, 3635 / 15000);            // el ACOS tolerable no depende del ACOS actual
  assert.equal(por(r, 'acos_mas_10').deltas.acosEquilibrio.abs, 0);
  cerca(por(r, 'precio_menos_10').metricas.acosEquilibrio, 2397.5 / 13500);
  cerca(por(r, 'costo_mas_10').metricas.costoMaximoProveedor, 9635);
});
test('margen y markup se comparan en puntos; el desglose dice qué costo cambió', () => {
  const r = compararEscenarios(A(), [esc('p', { precio: { pct: -0.1 } }), esc('c', { canal: { ventaPct: 0.12 } })]);
  cerca(por(r, 'p').deltas.margenNeto.abs, 2397.5 / 13500 - 3635 / 15000);
  const dc = (id, e) => por(r, id).deltaCostos.map(c => c.id);
  assert.deepEqual(dc('p'), ['comision_venta', 'impuestos']);                    // el resto del desglose no cambió
  cerca(por(r, 'p').deltaCostos[0].abs, -210, 1e-9); cerca(por(r, 'p').deltaCostos[1].abs, -52.5, 1e-9);   // −1.500 de precio × 14% de comisión · × 3,5% de impuestos
  cerca(por(r, 'c').deltas.ganancia.abs, 300);                                    // 2 puntos de comisión sobre 15.000
  assert.deepEqual(dc('c'), ['comision_venta']); cerca(por(r, 'c').deltaCostos[0].abs, -300);
  cerca(compararEscenarios(A(), [esc('i', { impuestosVentaPct: 0.05 })]).escenarios[0].deltas.ganancia.abs, -225);
});
test('el desglose se compara por id: cambiar la cantidad de costos extra no desalinea nada', () => {
  const r = compararEscenarios(A(), [esc('e', { costo: { extras: [{ nombre: 'Caja', monto: 300, ivaIncluido: true }] } })]);
  assert.deepEqual(por(r, 'e').deltaCostos, [{ id: 'extra_1', nombre: 'Caja', abs: 300 }]);
  cerca(por(r, 'e').deltas.ganancia.abs, -300);
});
test('diferencias: null cuando falta un lado o la base es cero; «igual» cuando no cambia', () => {
  // base sin IVA de publicidad declarado → acosEquilibrio null; el escenario lo declara → número; la diferencia no existe
  const r = compararEscenarios(A(), [esc('n', { precio: { delta: 0 } }), esc('ads', { publicidad: { ivaModo: 'incluido' } })]);
  assert.equal(r.base.metricas.acosEquilibrio, null); assert.equal(por(r, 'ads').deltas.acosEquilibrio, null);
  assert.equal(por(r, 'n').efectoGanancia, 'igual'); assert.deepEqual(por(r, 'n').deltas.ganancia, { abs: 0, pct: 0 }); assert.deepEqual(por(r, 'n').deltaCostos, []);
  // base con ganancia exactamente 0 (costo = costo máximo) → la variación relativa no está definida
  const cero = compararEscenarios(A({ costo: { producto: 9635, ivaIncluido: true } }), [esc('sube', { precio: { pct: 0.1 } })]);
  assert.equal(cero.base.metricas.ganancia, 0); assert.equal(por(cero, 'sube').deltas.ganancia.pct, null); assert.ok(por(cero, 'sube').deltas.ganancia.abs > 0);
});
test('un escenario inválido no frena a los demás y explica por qué', () => {
  const r = compararEscenarios(A(), [esc('ok', { precio: 16000 }), esc('typo', { preci0: 1 }), esc('cero', { precio: { pct: -1 } }), esc('ads', { publicidad: { acos: { delta: 0.1 } } }), esc('porc', { canal: { ventaPct: 14 } })]);
  assert.equal(r.ok, true);
  assert.equal(por(r, 'ok').ok, true);
  assert.deepEqual(por(r, 'typo').errores.map(e => e.codigo), ['CAMBIO_DESCONOCIDO']);
  assert.deepEqual(por(r, 'cero').errores.map(e => e.codigo), ['PRECIO_INVALIDO']);
  assert.deepEqual(por(r, 'ads').errores.map(e => e.codigo), ['IVA_MODO_REQUERIDO']);        // nunca se inventa el IVA de la publicidad
  assert.deepEqual(por(r, 'porc').errores.map(e => e.codigo), ['PORCENTAJE_FUERA_DE_RANGO']);
  assert.deepEqual(r.ranking, ['ok', 'base']);                                               // los inválidos no entran al ranking
});
test('lista de escenarios y base inválidas', () => {
  const cod = r => r.errores.map(e => e.codigo);
  assert.deepEqual(cod(compararEscenarios(A(), [])), ['ESCENARIOS_INVALIDOS']);
  assert.deepEqual(cod(compararEscenarios(A(), Array(21).fill(esc('x', {})))), ['ESCENARIOS_INVALIDOS']);
  assert.deepEqual(cod(compararEscenarios(A(), 'x')), ['ESCENARIOS_INVALIDOS']);
  assert.deepEqual(cod(compararEscenarios(A(), [esc('a', {}), esc('a', {})])), ['ID_DUPLICADO']);
  assert.deepEqual(cod(compararEscenarios(A(), [esc('base', {})])), ['ID_DUPLICADO']);
  assert.equal(compararEscenarios(null, [esc('a', {})]).ok, false);
  assert.equal(compararEscenarios({ ...A(), precio: -1 }, [esc('a', {})]).ok, false);
});
test('determinismo e independencia: mismo resultado siempre, y el orden de los escenarios no cambia sus números', () => {
  const lista = escenariosTipicos();
  const r1 = compararEscenarios(conAds(), lista), r2 = compararEscenarios(conAds(), lista), r3 = compararEscenarios(conAds(), [...lista].reverse());
  assert.deepEqual(r1, r2);
  for (const e of r1.escenarios) assert.deepEqual(por(r3, e.id), e);
  assert.deepEqual(r1.ranking, r3.ranking);
  assert.deepEqual(r1, JSON.parse(JSON.stringify(r1)), 'JSON puro (sin Infinity, NaN, undefined ni -0)');
  assert.deepEqual(Object.keys(r1.escenarios[0].metricas), METRICAS);
});
test('empate en el ranking: gana el que se pasó primero', () => {
  const r = compararEscenarios(A(), [esc('b', { precio: 16000 }), esc('a', { precio: 16000 })]);
  assert.deepEqual(r.ranking, ['b', 'a', 'base']);
});
test('no muta lo que recibe', () => {
  const base = conAds(), lista = escenariosTipicos(), b0 = clon(base), l0 = clon(lista);
  compararEscenarios(base, lista); barrer(base, 'precio', [1000, 2000]);
  assert.deepEqual(base, b0); assert.deepEqual(lista, l0);
});

// ═══ barridos ═══
test('barrido de precio: la ganancia cruza el cero donde el piso dice (10.594)', () => {
  const b = barrer(A(), 'precio', rango(8000, 20000, 7));
  assert.deepEqual(b.filas.map(f => [f.valor, Math.round(f.ganancia)]), [[8000, -2140], [10000, -490], [12000, 1160], [14000, 2810], [16000, 4460], [18000, 6110], [20000, 7760]]);
  assert.deepEqual(b.cambiosDeSigno, [{ entre: [10000, 12000] }]);
  assert.deepEqual(b.equilibrio, { valor: 10594, motivo: null });
  assert.deepEqual(b.base, { valor: 15000, ganancia: 3635, margenNeto: 3635 / 15000 });
});
test('barrido de ACOS y de costo: el equilibrio sale de las inversas', () => {
  const ads = barrer(conAds(), 'publicidad.acos', [0, 0.1, 0.2, 0.3]);
  assert.deepEqual(ads.filas.map(f => Math.round(f.ganancia)), [3635, 2135, 635, -865]);
  assert.deepEqual(ads.cambiosDeSigno, [{ entre: [0.2, 0.3] }]); cerca(ads.equilibrio.valor, 3635 / 15000);
  const costo = barrer(A(), 'costo.producto', [5000, 6000, 9635, 10000]);
  assert.deepEqual(costo.filas.map(f => f.ganancia), [4635, 3635, 0, -365]); assert.equal(costo.equilibrio.valor, 9635);
});
test('barrido de una variable sin inversa propia: sin «equilibrio», pero con cambio de signo', () => {
  const b = barrer(A(), 'canal.ventaPct', [0.1, 0.3, 0.5]);
  assert.equal(b.equilibrio, null); assert.deepEqual(b.filas.map(f => f.ok), [true, true, true]); assert.ok(b.filas[0].ganancia > b.filas[2].ganancia);
});
test('barrido: valores que hacen inválida la entrada no tiran el resto', () => {
  const b = barrer(A(), 'precio', [-5, 0, 10000]);
  assert.deepEqual(b.filas.map(f => f.ok), [false, false, true]); assert.equal(b.filas[0].errores[0].campo, 'precio');
  assert.deepEqual(b.cambiosDeSigno, []);
});
test('barrido: variable y valores inválidos', () => {
  const cod = r => r.errores.map(e => e.codigo);
  assert.deepEqual(cod(barrer(A(), 'nada', [1])), ['VARIABLE_DESCONOCIDA']);
  assert.deepEqual(cod(barrer(A(), 'canal.ivaModo', [1])), ['VARIABLE_NO_NUMERICA']);
  assert.equal(barrer(A(), 'canal.fijo', [1000, 3000]).ok, true, 'un cargo fijo numérico sí se puede barrer');
});
test('barrido: un cargo escalonado no es barrible; valores fuera de lo permitido', () => {
  const tr = A({ canal: { ventaPct: 0.14, fijo: [{ hasta: 12000, monto: 1 }, { hasta: null, monto: 2 }], ivaModo: 'incluido' } });
  assert.deepEqual(barrer(tr, 'canal.fijo', [1]).errores.map(e => e.codigo), ['VARIABLE_NO_NUMERICA']);
  for (const v of [[], Array(201).fill(1), [NaN], [1, '2'], 'x', null]) assert.deepEqual(barrer(A(), 'precio', v).errores.map(e => e.codigo), ['VALORES_INVALIDOS']);
  assert.equal(barrer(null, 'precio', [1]).ok, false);
});
test('rango: equiespaciado, inclusivo y sin ruido de punto flotante', () => {
  assert.deepEqual(rango(0, 1, 3), [0, 0.5, 1]);
  assert.deepEqual(rango(0.1, 0.4, 4), [0.1, 0.2, 0.3, 0.4]);                      // sin 0.30000000000000004
  assert.deepEqual(rango(5, 5, 2), [5, 5]);
  for (const x of [rango(1, 2, 1), rango(1, 2, 201), rango(NaN, 2, 3), rango(1, Infinity, 3), rango(1, 2, 2.5)]) assert.deepEqual(x, []);
});

// ═══ propiedades: los escenarios no calculan nada por su cuenta ═══
function prng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
test('PROPIEDADES (400 casos con semilla fija): cada número de un escenario es EXACTAMENTE el de evaluar/inversas sobre la entrada con cambios', () => {
  const rnd = prng(20261003), pick = a => a[Math.floor(rnd() * a.length)], en = (lo, hi) => lo + rnd() * (hi - lo);
  let comparados = 0;
  for (let i = 0; i < 400; i++) {
    const regimen = pick(['monotributo', 'ri', 'sin_iva']), modo = () => pick(['incluido', 'adicional', 'sin']), precio = Math.round(en(3000, 150000));
    const base = {
      precio, fiscal: { regimen }, costo: { producto: Math.round(precio * en(0.1, 0.7)), ivaIncluido: rnd() < 0.5 },
      canal: { ventaPct: en(0.03, 0.25), fijo: rnd() < 0.5 ? Math.round(en(0, 2500)) : [{ hasta: Math.round(en(5000, 90000)), monto: Math.round(en(0, 1200)) }, { hasta: null, monto: Math.round(en(1200, 3000)) }], ivaModo: modo() },
      publicidad: { acos: rnd() < 0.5 ? en(0, 0.2) : 0, ivaModo: modo() }, impuestosVentaPct: en(0, 0.08),
    };
    const op = () => pick([v => ({ pct: v - 0.5 }), v => ({ factor: 0.5 + v }), v => ({ delta: Math.round((v - 0.5) * 1000) }), v => ({ set: Math.round(en(2000, 150000)) })]);
    const cambios = pick([{ precio: op()(rnd()) }, { costo: { producto: { pct: rnd() - 0.4 } } }, { canal: { ventaPct: { delta: (rnd() - 0.5) * 0.1 } } }, { impuestosVentaPct: { factor: 0.5 + rnd() } }, { precio: { pct: rnd() - 0.5 }, publicidad: { acos: { delta: rnd() * 0.1 } } }]);
    const r = compararEscenarios(base, [esc('x', cambios)]);
    assert.equal(r.ok, true);
    const e = r.escenarios[0], ap = aplicarCambios(base, cambios);
    assert.equal(e.ok, ap.ok && evaluar(ap.entrada).ok);
    if (!e.ok) continue;
    comparados++;
    const directo = evaluar(ap.entrada), piso = precioParaObjetivo(ap.entrada);
    assert.equal(e.metricas.ganancia, directo.ganancia); assert.equal(e.metricas.margenNeto, directo.margenNeto); assert.equal(e.metricas.markup, directo.markup);
    assert.equal(e.metricas.precioEquilibrio, piso.precio);
    const gb = r.base.metricas.ganancia, gs = directo.ganancia;
    assert.equal(e.deltas.ganancia.abs, gs - gb === 0 ? 0 : gs - gb);
    assert.equal(e.efectoGanancia, gs - gb > 1e-9 ? 'mejora' : gs - gb < -1e-9 ? 'empeora' : 'igual');
    assert.deepEqual(JSON.parse(JSON.stringify(r)), r);
  }
  assert.ok(comparados > 300, `muestra significativa (${comparados})`);
});

// ═══ capas ═══
test('escenarios.js no tiene fórmulas económicas propias: no conoce IVA, comisiones ni factores', () => {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../lib/motor/escenarios.js'), 'utf8');
  const codigo = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const token of [/\bkP\b/, /factorIva/, /ivaProducto/, /ivaServicios/, /ivaCompra/, /ventaPct/, /financiacionPct/, /\b1\s*\/\s*\(1\s*\+/, /costoTotal\s*[-+*]/])
    assert.doesNotMatch(codigo, token, `escenarios.js menciona ${token}`);
  assert.deepEqual([...codigo.matchAll(/from\s+'([^']+)'/g)].map(m => m[1]).sort(), ['./economia.js', './inversas.js', './validar.js', './version.js']);
});
