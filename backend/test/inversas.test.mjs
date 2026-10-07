// Pruebas de las inversas del motor (S2). Correr: node --test backend/test/inversas.test.mjs
// Puras y deterministas (sin red, base, reloj ni azar: las "aleatorias" usan semilla fija). Valores esperados calculados a mano.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validar } from '../lib/motor/validar.js';
import { evaluar, valorEn } from '../lib/motor/economia.js';
import { estructura, precioParaObjetivo, precioPiso, acosEquilibrio, costoMaximoProveedor, unidadesEquilibrio, unidadesParaObjetivo, resolverObjetivos } from '../lib/motor/inversas.js';

const cerca = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);
const ganancia = (e, precio) => evaluar({ ...e, precio }).ganancia;
const margen = (e, precio) => evaluar({ ...e, precio }).margenNeto;

// Caso A (monotributo): costo 6.000 (IVA incl.), comisión 14%, impuestos 3,5%, cargo fijo 2.740 → a = 0,825 ; b = 8.740
const A = (extra = {}) => ({
  precio: 15000, fiscal: { regimen: 'monotributo' }, costo: { producto: 6000, ivaIncluido: true },
  canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'incluido' }, impuestosVentaPct: 0.035, ...extra,
});
const conFijo = (fijo, costo = 6000) => A({ costo: { producto: costo, ivaIncluido: true }, canal: { ventaPct: 0.14, fijo, ivaModo: 'incluido' } });
const TRAMOS = [{ hasta: 12000, monto: 1330 }, { hasta: null, monto: 2740 }];     // tramos SINTÉTICOS de prueba

// ═══ precio piso ═══
test('A: precio de equilibrio = 8.740 / 0,825 = 10.593,94 → $10.594 (redondeo hacia arriba, verificado)', () => {
  const r = precioParaObjetivo(A());
  assert.equal(r.ok, true); assert.equal(r.precio, 10594);
  cerca(r.ganancia, 0.05, 1e-6);                                  // 0,825 × 10.594 − 8.740
  assert.ok(ganancia(A(), 10593) < 0, 'un peso menos ya pierde');
  assert.equal(r.estable, true); assert.equal(r.precioEstable, 10594);
  assert.deepEqual(r.tramo, { desde: 0, hasta: null });
});
test('B: cargo fijo escalonado — el piso busca el tramo más barato que sirve', () => {
  // tramo 1 (P < 12.000): a=0,825 ; b=6.000+1.330 → 8.884,85 → $8.885 ; tramo 2 daría 10.594
  const e = conFijo(TRAMOS);
  const r = precioParaObjetivo(e);
  assert.equal(r.precio, 8885); assert.deepEqual(r.tramo, { desde: 0, hasta: 12000 });
  assert.ok(ganancia(e, 8885) >= 0 && ganancia(e, 8884) < 0);
  assert.equal(r.estable, true);
});
test('B: margen 30% — el tramo 1 no lo alcanza (máx. 21,4%) y se resuelve en el tramo 2: $16.648', () => {
  const e = conFijo(TRAMOS);
  const r = precioParaObjetivo(e, { margenPct: 0.30 });
  assert.equal(r.precio, 16648); assert.deepEqual(r.tramo, { desde: 12000, hasta: null });
  assert.ok(margen(e, 16648) >= 0.30 && margen(e, 16647) < 0.30);
  cerca(margen(e, 16648), 0.3000120134550696, 1e-9);
});
test('caso límite: el redondeo hacia arriba cruza de tramo y ahí ya no cumple — se sigue buscando', () => {
  // Con costo 8.569,5875 el equilibrio exacto del tramo 1 es 11.999,5 → ceil = 12.000, que cae en el tramo 2 (fijo más caro) y pierde.
  const e = conFijo(TRAMOS, 8569.5875);
  assert.ok(ganancia(e, 12000) < 0, 'precondición: 12.000 pierde');
  const r = precioParaObjetivo(e);
  assert.equal(r.precio, 13709);                                  // 11.309,5875 / 0,825 = 13.708,59
  assert.ok(ganancia(e, 13709) >= 0 && ganancia(e, 13708) < 0);
  assert.deepEqual(r.tramo, { desde: 12000, hasta: null });
});
test('caso límite: piso NO estable — un salto de cargo lo rompe más arriba (se informa desde cuándo es estable)', () => {
  // fijo 1.330 hasta 12.000 y 9.000 desde ahí: gana en [8.885, 12.000), pierde en 12.000 y recién vuelve a ganar desde 15.000/0,825 = 18.181,8
  const e = conFijo([{ hasta: 12000, monto: 1330 }, { hasta: null, monto: 9000 }]);
  const r = precioParaObjetivo(e);
  assert.equal(r.precio, 8885); assert.equal(r.estable, false); assert.equal(r.precioEstable, 18182);
  assert.ok(ganancia(e, 12000) < 0 && ganancia(e, 18182) >= 0 && ganancia(e, 18181) < 0);
  const p = precioPiso(e);
  assert.ok(p.advertencias.some(a => a.codigo === 'PISO_NO_ESTABLE' && a.severidad === 'alta' && /18182/.test(a.texto)));
});
test('ganancia objetivo por unidad: (8.740 + 1.000) / 0,825 = 11.806,06 → $11.807', () => {
  const r = precioParaObjetivo(A(), { gananciaUnidad: 1000 });
  assert.equal(r.precio, 11807); assert.ok(ganancia(A(), 11807) >= 1000 && ganancia(A(), 11806) < 1000);
});
test('margen objetivo 20%: 8.740 / 0,625 = 13.984 exacto — el redondeo no sube un peso de más', () => {
  const r = precioParaObjetivo(A(), { margenPct: 0.2 });
  assert.equal(r.precio, 13984); cerca(r.ganancia, 2796.8); cerca(r.margenNeto, 0.2, 1e-12);
  assert.ok(margen(A(), 13983) < 0.2);
});
test('margen y ganancia a la vez se cumplen los dos', () => {
  const r = precioParaObjetivo(A(), { margenPct: 0.2, gananciaUnidad: 3000 });     // (8.740+3.000)/0,625 = 18.784
  assert.equal(r.precio, 18784); assert.ok(r.margenNeto >= 0.2 && r.ganancia >= 3000);
});
test('RI: el piso se verifica contra el cálculo directo (IVA de producto y de cargos)', () => {
  const e = { precio: 12100, fiscal: { regimen: 'ri' }, costo: { producto: 5000, ivaIncluido: false }, canal: { ventaPct: 0.14, ivaModo: 'incluido' }, impuestosVentaPct: 0.03 };
  const r = precioParaObjetivo(e);
  assert.equal(r.precio, 7290);                                   // 5.000 / 0,68595
  assert.ok(ganancia(e, 7290) >= 0 && ganancia(e, 7289) < 0);
});
test('sin precio posible: cargos que se comen el ingreso (a = 0)', () => {
  const r = precioParaObjetivo(A({ canal: { ventaPct: 0.6, ivaModo: 'incluido' }, impuestosVentaPct: 0.4 }));
  assert.equal(r.ok, true); assert.equal(r.precio, null); assert.equal(r.motivo, 'CARGOS_SUPERAN_INGRESO');
});
test('margen inalcanzable: se informa el techo (a / kP) en vez de un número absurdo', () => {
  const r = precioParaObjetivo(A(), { margenPct: 0.9 });
  assert.equal(r.precio, null); assert.equal(r.motivo, 'MARGEN_INALCANZABLE'); cerca(r.margenMaximo, 0.825);
  assert.equal(precioParaObjetivo(A(), { margenPct: 0.8 }).precio !== null, true);       // 0,8 < 0,825: posible, aunque caro
});
test('sin costos el piso es 0 (cualquier precio positivo gana)', () => {
  const r = precioParaObjetivo({ precio: 100, fiscal: { regimen: 'sin_iva' }, costo: { producto: 0 }, canal: { ventaPct: 0.1 }, impuestosVentaPct: 0 });
  assert.equal(r.precio, 0); assert.equal(r.estable, true);
});
test('precio fuera de rango: más de $1.000.000.000', () => {
  const r = precioParaObjetivo(A({ costo: { producto: 9e8, ivaIncluido: true } }), { gananciaUnidad: 9e8 });
  assert.equal(r.precio, null); assert.equal(r.motivo, 'PRECIO_FUERA_DE_RANGO');
});
test('precioPiso devuelve equilibrio + objetivos declarados, y avisa si un cargo fijo constante puede cambiar con el precio', () => {
  const p = precioPiso(A({ objetivo: { margenPct: 0.2, gananciaUnidad: 1000 } }));
  assert.equal(p.equilibrio.precio, 10594); assert.equal(p.margenObjetivo.precio, 13984); assert.equal(p.gananciaObjetivo.precio, 11807);
  assert.ok(p.advertencias.some(a => a.codigo === 'CARGO_PUEDE_CAMBIAR_CON_EL_PRECIO' && a.campo === 'canal.fijo'));
  const sin = precioPiso(A());
  assert.equal(sin.margenObjetivo, null); assert.equal(sin.gananciaObjetivo, null);
  assert.ok(!precioPiso(conFijo(TRAMOS)).advertencias.some(a => a.codigo === 'CARGO_PUEDE_CAMBIAR_CON_EL_PRECIO'), 'con tramos no hace falta avisar');
});

// ═══ ACOS de equilibrio ═══
test('D: ACOS de equilibrio = 3.635 / 15.000 = 24,23% (y con ese ACOS la ganancia es 0)', () => {
  const e = A({ publicidad: { acos: 0.10, ivaModo: 'incluido' } });
  const r = acosEquilibrio(e);
  cerca(r.acos, 3635 / 15000, 1e-12); cerca(r.tacos, 3635 / 15000, 1e-12); cerca(r.gananciaSinPublicidad, 3635);
  cerca(evaluar({ ...e, publicidad: { ...e.publicidad, acos: r.acos } }).ganancia, 0, 1e-9);
  cerca(evaluar(e).ganancia, 2135);                                // 3.635 − 10% × 15.000
});
test('ACOS para un margen objetivo del 10%: (3.635 − 1.500) / 15.000 = 14,23%', () => {
  const e = A({ publicidad: { acos: 0, ivaModo: 'incluido' } });
  const r = acosEquilibrio(e, { margenPct: 0.10 });
  cerca(r.acos, 2135 / 15000, 1e-12);
  cerca(evaluar({ ...e, publicidad: { ...e.publicidad, acos: r.acos } }).margenNeto, 0.10, 1e-12);
});
test('ACOS con participación: si solo la mitad de las ventas viene de ads, el ACOS tolerable se duplica y el TACOS no cambia', () => {
  const full = acosEquilibrio(A({ publicidad: { acos: 0, ivaModo: 'incluido' } }));
  const mitad = acosEquilibrio(A({ publicidad: { acos: 0, ventasPorAdsPct: 0.5, ivaModo: 'incluido' } }));
  cerca(mitad.acos, full.acos * 2, 1e-12); cerca(mitad.tacos, full.tacos, 1e-12);
});
test('ACOS con RI y base neto: verificado contra el cálculo directo', () => {
  const e = { precio: 12100, fiscal: { regimen: 'ri' }, costo: { producto: 5000, ivaIncluido: false }, canal: { ventaPct: 0.14, ivaModo: 'incluido' }, impuestosVentaPct: 0.03,
    publicidad: { acos: 0.05, ventasPorAdsPct: 0.7, base: 'neto', ivaModo: 'adicional' } };
  const r = acosEquilibrio(e);
  cerca(evaluar({ ...e, publicidad: { ...e.publicidad, acos: r.acos } }).ganancia, 0, 1e-9);
});
test('ACOS: casos límite — sin margen, sin ventas por ads, IVA de publicidad sin declarar', () => {
  const sinMargen = acosEquilibrio(A({ precio: 9000, publicidad: { acos: 0.1, ivaModo: 'incluido' } }));      // pierde incluso sin ads
  assert.equal(sinMargen.acos, 0); assert.equal(sinMargen.motivo, 'SIN_MARGEN_PARA_PUBLICIDAD');
  const sinVentas = acosEquilibrio(A({ publicidad: { acos: 0, ventasPorAdsPct: 0, ivaModo: 'incluido' } }));
  assert.equal(sinVentas.acos, null); assert.equal(sinVentas.motivo, 'SIN_VENTAS_POR_PUBLICIDAD');
  const sinIva = acosEquilibrio(A());                                                                           // monotributo, nunca dijo cómo factura la publicidad
  assert.equal(sinIva.acos, null); assert.equal(sinIva.motivo, 'IVA_MODO_REQUERIDO'); assert.equal(sinIva.campo, 'publicidad.ivaModo');
  assert.equal(acosEquilibrio({ ...A(), fiscal: { regimen: 'sin_iva' } }).acos !== null, true);                 // sin IVA no hay nada que declarar
});

// ═══ costo máximo del proveedor ═══
test('E: costo máximo para margen 20% = 15.000 − 2.100 − 2.740 − 525 − 3.000 = $6.635', () => {
  const sinCosto = A({ costo: { ivaIncluido: true } });             // el costo es justamente lo que se averigua
  const r = costoMaximoProveedor(sinCosto, { margenPct: 0.2 });
  cerca(r.costoMaximo, 6635); cerca(r.costoMaximoNeto, 6635); assert.equal(r.motivo, null);
  cerca(margen({ ...sinCosto, costo: { producto: r.costoMaximo, ivaIncluido: true } }, 15000), 0.2, 1e-12);
});
test('costo máximo sin objetivo = no perder plata: 15.000 − 2.100 − 2.740 − 525 = $9.635', () => {
  cerca(costoMaximoProveedor(A({ costo: { ivaIncluido: true } })).costoMaximo, 9635);
});
test('costo máximo: se devuelve en los términos en que se carga (con IVA si el costo lleva IVA)', () => {
  const ri = { precio: 12100, fiscal: { regimen: 'ri' }, costo: { ivaIncluido: true }, canal: { ventaPct: 0.14, ivaModo: 'incluido' }, impuestosVentaPct: 0.03 };
  const r = costoMaximoProveedor(ri, { margenPct: 0.2 });          // neto: 10.000 − 1.400 − 300 − 2.000 = 6.300 → con IVA 7.623
  cerca(r.costoMaximoNeto, 6300); cerca(r.costoMaximo, 7623);
  cerca(margen({ ...ri, costo: { producto: r.costoMaximo, ivaIncluido: true } }, 12100), 0.2, 1e-12);
});
test('costo máximo con costos extra: se descuentan antes de repartir', () => {
  const e = A({ costo: { ivaIncluido: true, extras: [{ nombre: 'Caja', monto: 500, ivaIncluido: true }] } });
  const r = costoMaximoProveedor(e, { margenPct: 0.2 });
  cerca(r.costoMaximo, 6135);
  cerca(margen({ ...e, costo: { ...e.costo, producto: r.costoMaximo } }, 15000), 0.2, 1e-12);
});
test('costo máximo: límites — IVA del costo sin declarar y objetivo inalcanzable aun regalado el producto', () => {
  const sinIva = costoMaximoProveedor(A({ costo: {} }));
  assert.equal(sinIva.costoMaximo, null); assert.equal(sinIva.motivo, 'IVA_COSTO_REQUERIDO'); assert.equal(sinIva.campo, 'costo.ivaIncluido');
  const imposible = costoMaximoProveedor(A({ costo: { ivaIncluido: true } }), { margenPct: 0.9 });
  assert.equal(imposible.costoMaximo, null); assert.equal(imposible.motivo, 'OBJETIVO_INALCANZABLE_AUN_SIN_COSTO');
  assert.equal(costoMaximoProveedor(null).ok, false);
});

// ═══ unidades ═══
test('F: unidades de equilibrio y para un objetivo mensual', () => {
  const e = A({ fijosMes: 100000 });                                // ganancia por unidad 3.635
  const eq = unidadesEquilibrio(e); assert.equal(eq.unidades, 28); cerca(eq.gananciaUnidad, 3635);   // 27,5 → 28
  assert.equal(unidadesParaObjetivo(e, { gananciaMes: 500000 }).unidades, 166);                      // 165,06 → 166
  assert.equal(unidadesParaObjetivo(A({ fijosMes: 100000, objetivo: { gananciaMes: 500000 } })).unidades, 166);
});
test('unidades: sin error de punto flotante en los exactos, y casos límite', () => {
  assert.equal(unidadesEquilibrio(A({ fijosMes: 36350 })).unidades, 10);                // 36.350 / 3.635 = 10 exacto
  assert.equal(unidadesEquilibrio(A()).unidades, 0);                                    // sin fijos no hay nada que cubrir
  const pierde = unidadesEquilibrio(A({ precio: 9000, fijosMes: 100000 }));
  assert.equal(pierde.unidades, null); assert.equal(pierde.motivo, 'SIN_GANANCIA_POR_UNIDAD');
  const enorme = unidadesEquilibrio(A({ precio: 10594, fijosMes: 1e9 }));               // ganancia por unidad = 0,05 → 2×10¹⁰ unidades: absurdo
  assert.equal(enorme.unidades, null); assert.equal(enorme.motivo, 'VOLUMEN_INVIABLE');
  const sinObj = unidadesParaObjetivo(A({ fijosMes: 1000 }));
  assert.equal(sinObj.unidades, null); assert.equal(sinObj.motivo, 'SIN_OBJETIVO_MENSUAL');
});

// ═══ objetivos y entrada inválida ═══
test('resolverObjetivos junta todo con los objetivos de la entrada', () => {
  const e = A({ objetivo: { margenPct: 0.2, gananciaUnidad: 1000, gananciaMes: 500000 }, fijosMes: 100000, publicidad: { acos: 0.1, ivaModo: 'incluido' } });
  const r = resolverObjetivos(e);
  assert.equal(r.ok, true);
  // con 10% de publicidad a = 0,825 − 0,10 = 0,725: equilibrio 8.740/0,725 = 12.055,2 · margen 20%: 8.740/0,525 = 16.647,6 · ganancia 1.000: 9.740/0,725 = 13.434,5
  assert.equal(r.precioPiso.equilibrio.precio, 12056); assert.equal(r.precioPiso.margenObjetivo.precio, 16648); assert.equal(r.precioPiso.gananciaObjetivo.precio, 13435);
  assert.equal(r.unidades.equilibrio.unidades, Math.ceil(100000 / evaluar(e).ganancia - 1e-9)); assert.ok(r.unidades.objetivoMes.unidades > r.unidades.equilibrio.unidades);
  assert.equal(r.acosEquilibrio.objetivo.margenPct, 0.2);
  assert.equal(r.costoMaximoProveedor.objetivo.gananciaUnidad, 1000);
});
test('entrada inválida → ok:false con errores, sin lanzar', () => {
  for (const f of [precioParaObjetivo, precioPiso, acosEquilibrio, costoMaximoProveedor, unidadesEquilibrio, unidadesParaObjetivo, resolverObjetivos])
    for (const x of [null, undefined, 'x', 5, [], {}, A({ canal: { ventaPct: 14, ivaModo: 'incluido' } })]) {
      const r = f(x); assert.equal(r.ok, false, `${f.name}(${JSON.stringify(x)})`); assert.ok(r.errores.length);
    }
});
test('validar es idempotente: la entrada normalizada vuelve a normalizarse a sí misma', () => {
  for (const e of [A(), conFijo(TRAMOS), A({ publicidad: { acos: 0.1, ivaModo: 'adicional' }, costo: { producto: 1, ivaIncluido: false, extras: [{ nombre: 'x', monto: 2, ivaIncluido: true }] } })]) {
    const n = validar(e).entrada; assert.deepEqual(validar(n).entrada, n);
  }
});

// ═══ propiedades (semilla fija) ═══
function prng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function entradaAzar(rnd) {
  const pick = a => a[Math.floor(rnd() * a.length)], en = (lo, hi) => lo + rnd() * (hi - lo);
  const regimen = pick(['monotributo', 'ri', 'sin_iva']), modo = () => pick(['incluido', 'adicional', 'sin']);
  const precio = Math.round(en(2000, 200000));
  const fijo = rnd() < 0.5 ? Math.round(en(0, 3000)) : [{ hasta: Math.round(en(3000, 100000)), monto: Math.round(en(0, 1500)) }, { hasta: null, monto: Math.round(en(1500, 4000)) }];
  return {
    precio, fiscal: { regimen }, costo: { producto: Math.round(precio * en(0.05, 0.8)), ivaIncluido: rnd() < 0.5 },
    canal: { ventaPct: en(0.02, 0.3), financiacionPct: rnd() < 0.5 ? en(0, 0.15) : 0, fijo, envio: rnd() < 0.5 ? Math.round(en(0, 5000)) : 0, ivaModo: modo() },
    publicidad: { acos: rnd() < 0.5 ? en(0, 0.3) : 0, ventasPorAdsPct: en(0.2, 1), base: pick(['precio', 'neto']), ivaModo: modo() },
    impuestosVentaPct: en(0, 0.1), devolucionesPct: rnd() < 0.5 ? en(0, 0.05) : 0,
  };
}
test('PROPIEDADES (600 entradas con semilla fija): el piso es mínimo y cumple; las inversas se revierten con el cálculo directo', () => {
  const rnd = prng(20261002); let conPiso = 0, conCosto = 0, conAcos = 0;
  for (let i = 0; i < 600; i++) {
    const e = entradaAzar(rnd), v = validar(e);
    assert.equal(v.ok, true, JSON.stringify(v.errores) + JSON.stringify(e));
    const n = v.entrada, est = estructura(n);
    // 1) la ganancia es una recta por tramo: G(P) = a·P − b
    const P = Math.round(5000 + rnd() * 150000), b = est.C + est.fc * (valorEn(n.canal.fijo, P) + valorEn(n.canal.envio, P));
    cerca(evaluar({ ...n, precio: P }).ganancia, est.a * P - b, 1e-6);
    // 2) piso de equilibrio y de margen: cumple, y un peso menos NO cumple
    const m = rnd() * 0.4;
    for (const obj of [{}, { margenPct: m }, { gananciaUnidad: Math.round(rnd() * 3000) }]) {
      const r = precioParaObjetivo(n, obj);
      assert.equal(r.ok, true);
      if (r.precio === null) { assert.ok(['CARGOS_SUPERAN_INGRESO', 'MARGEN_INALCANZABLE', 'OBJETIVO_INALCANZABLE', 'PRECIO_FUERA_DE_RANGO'].includes(r.motivo), r.motivo); continue; }
      conPiso++;
      const mm = obj.margenPct ?? 0, gg = obj.gananciaUnidad ?? 0, falta = p => { const x = evaluar({ ...n, precio: p }); return x.ganancia - mm * x.ingresoNeto - gg; };
      if (r.precio > 0) {
        assert.ok(falta(r.precio) >= -1e-6, `no cumple en ${r.precio}`);
        if (r.precio > 1) assert.ok(falta(r.precio - 1) < 1e-6, `un peso menos (${r.precio - 1}) ya cumplía`);
        if (r.estable) for (const k of [1, 2, 7, 100, 5000]) assert.ok(falta(r.precio + k) >= -1e-6, `estable pero falla en ${r.precio + k}`);
        else assert.ok(r.precioEstable === null || r.precioEstable > r.precio);
      }
      assert.deepEqual(JSON.parse(JSON.stringify(r)), r, 'el resultado es JSON puro');
    }
    // 3) costo máximo: con ese costo el margen vuelve a ser el pedido
    if (n.fiscal.regimen === 'sin_iva' || typeof n.costo.ivaIncluido === 'boolean') {
      const c = costoMaximoProveedor({ ...n, costo: { ...n.costo, producto: undefined } }, { margenPct: m });
      if (c.costoMaximo !== null) { conCosto++; cerca(margen({ ...n, costo: { ...n.costo, producto: c.costoMaximo } }, n.precio), m, 1e-9); }
    }
    // 4) ACOS de equilibrio: con ese ACOS la ganancia llega justo al objetivo
    const a = acosEquilibrio(n, { margenPct: m });
    if (a.acos !== null && a.acos > 0) { conAcos++; cerca(margen({ ...n, publicidad: { ...n.publicidad, acos: a.acos } }, n.precio), m, 1e-9); }
  }
  assert.ok(conPiso > 1000 && conCosto > 300 && conAcos > 100, `la muestra debe ser significativa (${conPiso}/${conCosto}/${conAcos})`);
});
