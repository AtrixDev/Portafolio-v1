// Pruebas del motor económico (S1). Correr: node --test backend/test/economia.test.mjs
// Puras y deterministas: sin red, sin base, sin reloj, sin azar. Los valores esperados están calculados a mano (ver comentarios).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validar } from '../lib/motor/validar.js';
import { evaluar, factorIva, valorEn, redondear, redondearDinero } from '../lib/motor/economia.js';
import { MOTOR_VERSION } from '../lib/motor/version.js';

const MOTOR = join(dirname(fileURLToPath(import.meta.url)), '../lib/motor');
const cerca = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);
const monto = (r, id) => r.costos.find(c => c.id === id).monto;
const clon = x => JSON.parse(JSON.stringify(x));

// Caso A (monotributo): precio 15.000, costo 6.000 con IVA incluido, comisión 14% + fijo 2.740, impuestos 3,5%
const A = () => ({
  precio: 15000,
  fiscal: { regimen: 'monotributo' },
  costo: { producto: 6000, ivaIncluido: true },
  canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'incluido' },
  impuestosVentaPct: 0.035,
});
// Caso C (responsable inscripto): precio 12.100 con IVA 21% → ingreso neto 10.000; costo neto 5.000; comisión 14%; IIBB 3%
const C = (regimen, canalIva, costoIva) => ({
  precio: 12100,
  fiscal: { regimen },
  costo: { producto: 5000, ivaIncluido: costoIva },
  canal: { ventaPct: 0.14, ivaModo: canalIva },
  impuestosVentaPct: 0.03,
});

// ═══ A · ganancia, margen y markup ═══
test('A: monotributo — ganancia 3.635, margen 24,23%, markup 60,58%', () => {
  // 15.000 − 2.100 (14%) − 2.740 (fijo) − 525 (3,5%) − 6.000 = 3.635
  const r = evaluar(A());
  assert.equal(r.ok, true);
  cerca(r.ingresoNeto, 15000); cerca(r.ganancia, 3635);
  cerca(r.margenNeto, 3635 / 15000); cerca(r.markup, 3635 / 6000);
  cerca(monto(r, 'comision_venta'), 2100); cerca(monto(r, 'cargo_fijo'), 2740); cerca(monto(r, 'impuestos'), 525); cerca(monto(r, 'producto'), 6000);
  assert.deepEqual(r.advertencias, []);
});
test('el desglose cierra: ingreso neto − Σ costos = ganancia, y el costo total es la suma de las filas', () => {
  for (const e of [A(), C('ri', 'adicional', false), { ...A(), unidades: 3, publicidad: { acos: 0.1, ivaModo: 'adicional' }, devolucionesPct: 0.02, costo: { producto: 6000, ivaIncluido: false, extras: [{ nombre: 'Caja', monto: 300, ivaIncluido: true }] } }]) {
    const r = evaluar(e);
    cerca(r.costos.reduce((s, c) => s + c.monto, 0), r.costoTotal);
    cerca(r.ingresoNeto - r.costoTotal, r.ganancia);
    cerca(r.gananciaTotal, r.ganancia * r.entrada.unidades);
  }
});
test('el desglose tiene un orden y unas filas fijas (la interfaz puede confiar en él)', () => {
  assert.deepEqual(evaluar(A()).costos.map(c => c.id), ['producto', 'comision_venta', 'financiacion', 'cargo_fijo', 'envio', 'publicidad', 'impuestos', 'devoluciones']);
});
test('ganancia negativa: se informa y el margen es negativo', () => {
  const r = evaluar({ ...A(), precio: 9000 });          // 9.000 − 1.260 − 2.740 − 315 − 6.000 = −1.315
  cerca(r.ganancia, -1315); assert.ok(r.margenNeto < 0);
  assert.ok(r.advertencias.some(a => a.codigo === 'GANANCIA_NEGATIVA' && a.severidad === 'alta'));
});
test('costo cero: markup null (no Infinity) y advertencia', () => {
  const r = evaluar({ ...A(), costo: { producto: 0, ivaIncluido: true } });
  assert.equal(r.markup, null); assert.ok(r.advertencias.some(a => a.codigo === 'COSTO_CERO'));
  assert.ok(Number.isFinite(r.margenNeto));
});

// ═══ C · IVA: responsable inscripto ═══
test('C: RI con cargos «incluido» — ingreso neto 10.000, comisión neta 1.400, ganancia 3.300, margen 33%', () => {
  const r = evaluar(C('ri', 'incluido', false));
  cerca(r.ingresoNeto, 10000); cerca(r.ivaVenta, 2100);
  cerca(monto(r, 'comision_venta'), 1400);     // 12.100 × 14% = 1.694 con IVA → /1,21
  cerca(monto(r, 'impuestos'), 300);
  cerca(r.ganancia, 3300); cerca(r.margenNeto, 0.33); cerca(r.markup, 3300 / 5000);
});
test('C2: las cuatro combinaciones de régimen × tratamiento del IVA de los cargos', () => {
  cerca(evaluar(C('ri', 'incluido', false)).ganancia, 3300);        // 10.000 − 1.400 − 300 − 5.000
  cerca(evaluar(C('ri', 'adicional', false)).ganancia, 3006);       // 10.000 − 1.694 − 300 − 5.000
  cerca(evaluar(C('monotributo', 'incluido', true)).ganancia, 5043);        // 12.100 − 1.694 − 363 − 5.000
  cerca(evaluar(C('monotributo', 'adicional', true)).ganancia, 4687.26);    // 12.100 − 2.049,74 − 363 − 5.000
});
test('IVA del costo: el monotributista paga el IVA de lo que compra, el RI lo recupera', () => {
  cerca(monto(evaluar(C('monotributo', 'sin', false)), 'producto'), 6050);   // 5.000 sin IVA → 6.050 reales
  cerca(monto(evaluar(C('monotributo', 'sin', true)), 'producto'), 5000);
  cerca(monto(evaluar(C('ri', 'sin', true)), 'producto'), 5000 / 1.21);      // 5.000 con IVA → 4.132,23 neto
  cerca(monto(evaluar(C('ri', 'sin', false)), 'producto'), 5000);
});
test('sin_iva: ningún tratamiento de IVA, sea cual sea lo que se declare', () => {
  const r = evaluar({ ...C('sin_iva', 'adicional', false), publicidad: { acos: 0.1, ivaModo: 'adicional' } });
  cerca(r.ingresoNeto, 12100); cerca(monto(r, 'comision_venta'), 1694); cerca(monto(r, 'producto'), 5000); cerca(monto(r, 'publicidad'), 1210);
});
test('factorIva: tabla completa', () => {
  const t = [['incluido', 'ri', 1 / 1.21], ['adicional', 'ri', 1], ['sin', 'ri', 1], ['incluido', 'monotributo', 1], ['adicional', 'monotributo', 1.21], ['sin', 'monotributo', 1], ['adicional', 'sin_iva', 1], ['incluido', 'sin_iva', 1]];
  for (const [m, rg, esperado] of t) cerca(factorIva(m, rg, 0.21), esperado);
});

// ═══ cargos escalonados, publicidad, unidades ═══
test('cargo fijo escalonado: toma el tramo que corresponde al precio (aplica mientras precio < hasta)', () => {
  const fijo = [{ hasta: 12000, monto: 1330 }, { hasta: null, monto: 2740 }];
  assert.equal(valorEn(fijo, 8000), 1330); assert.equal(valorEn(fijo, 11999.99), 1330); assert.equal(valorEn(fijo, 12000), 2740); assert.equal(valorEn(fijo, 15000), 2740);
  assert.equal(valorEn(5, 99999), 5);
  cerca(monto(evaluar({ ...A(), canal: { ventaPct: 0.14, fijo, ivaModo: 'incluido' } }), 'cargo_fijo'), 2740);
  cerca(monto(evaluar({ ...A(), precio: 8000, canal: { ventaPct: 0.14, fijo, ivaModo: 'incluido' } }), 'cargo_fijo'), 1330);
});
test('publicidad: TACOS = ACOS × participación; la base puede ser precio o neto', () => {
  const ads = (p) => evaluar({ ...C('ri', 'incluido', false), publicidad: { ivaModo: 'incluido', ...p } });
  const r = ads({ acos: 0.10, ventasPorAdsPct: 0.5 });
  cerca(r.tacos, 0.05); cerca(monto(r, 'publicidad'), 12100 * 0.05 / 1.21);       // base precio, cotizado con IVA → neto
  cerca(monto(ads({ acos: 0.10, ventasPorAdsPct: 0.5, base: 'neto' }), 'publicidad'), 10000 * 0.05 / 1.21);
  cerca(monto(evaluar({ ...A(), publicidad: { acos: 0.10, ivaModo: 'incluido' } }), 'publicidad'), 1500);   // monotributo, 100% por ads (supuesto registrado)
});
test('los defaults quedan registrados como supuestos, y solo si se usaron', () => {
  const campos = r => r.supuestos.map(s => s.campo).sort();
  // monotributo con cargos «incluido»: la alícuota de 21% no influye → no se menciona
  const r = evaluar({ ...A(), publicidad: { acos: 0.1, ivaModo: 'incluido' } });
  assert.deepEqual(campos(r), ['publicidad.base', 'publicidad.ventasPorAdsPct', 'unidades']);
  assert.ok(r.supuestos.every(s => s.fuente === 'default'));
  // RI con cargos «incluido»: la alícuota sí influye → se registra
  assert.ok(campos(evaluar(C('ri', 'incluido', false))).includes('fiscal.ivaServicios'));
  assert.ok(campos(evaluar(C('ri', 'incluido', false))).includes('fiscal.ivaProducto'));
  // monotributo con cargos «adicional» y costo sin IVA: ambas influyen
  assert.deepEqual(campos(evaluar(C('monotributo', 'adicional', false))), ['costo.ivaCompra', 'fiscal.ivaServicios', 'unidades']);
  // nada que suponer
  assert.deepEqual(evaluar({ ...A(), unidades: 2, canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'sin' } }).supuestos, []);
});

// ═══ I · validación ═══
const campos = r => r.errores.map(e => `${e.campo}:${e.codigo}`);
test('I: un porcentaje como 14 en vez de 0,14 se rechaza y se sugiere la fracción', () => {
  const v = validar({ ...A(), canal: { ventaPct: 14, ivaModo: 'incluido' } });
  assert.equal(v.ok, false); assert.deepEqual(campos(v), ['canal.ventaPct:PORCENTAJE_FUERA_DE_RANGO']);
  assert.match(v.errores[0].texto, /¿Quisiste decir 0\.14\?/);
});
test('I: precio, costo y tipos inválidos', () => {
  assert.deepEqual(campos(validar({ ...A(), precio: -5 })), ['precio:MONTO_FUERA_DE_RANGO']);
  assert.deepEqual(campos(validar({ ...A(), precio: 0 })), ['precio:PRECIO_INVALIDO']);
  assert.deepEqual(campos(validar({ ...A(), precio: NaN })), ['precio:TIPO_INVALIDO']);
  assert.deepEqual(campos(validar({ ...A(), precio: '15000' })), ['precio:TIPO_INVALIDO']);
  assert.deepEqual(campos(validar({ ...A(), precio: undefined })), ['precio:CAMPO_REQUERIDO']);
  assert.deepEqual(campos(validar({ ...A(), costo: { producto: Infinity, ivaIncluido: true } })), ['costo.producto:TIPO_INVALIDO']);
  assert.deepEqual(campos(validar({ ...A(), costo: { ivaIncluido: true } })), ['costo.producto:CAMPO_REQUERIDO']);
  assert.deepEqual(campos(validar({ ...A(), unidades: 1.5 })), ['unidades:UNIDADES_INVALIDAS']);
});
test('I: régimen obligatorio y sin default', () => {
  assert.deepEqual(campos(validar({ ...A(), fiscal: {} })), ['fiscal.regimen:REGIMEN_INVALIDO']);
  assert.deepEqual(campos(validar({ ...A(), fiscal: { regimen: 'otro' } })), ['fiscal.regimen:REGIMEN_INVALIDO']);
  assert.deepEqual(campos(validar({ ...A(), fiscal: undefined })), ['fiscal.regimen:REGIMEN_INVALIDO']);
});
test('I: el tratamiento del IVA no tiene default cuando importa', () => {
  assert.deepEqual(campos(validar({ ...A(), canal: { ventaPct: 0.14, fijo: 2740 } })), ['canal.ivaModo:IVA_MODO_REQUERIDO']);
  assert.deepEqual(campos(validar({ ...A(), canal: { ventaPct: 0.14, ivaModo: null } })), ['canal.ivaModo:IVA_MODO_REQUERIDO']);
  assert.deepEqual(campos(validar({ ...A(), costo: { producto: 6000 } })), ['costo.ivaIncluido:IVA_COSTO_REQUERIDO']);
  assert.deepEqual(campos(validar({ ...A(), publicidad: { acos: 0.1 } })), ['publicidad.ivaModo:IVA_MODO_REQUERIDO']);
  // …y no se exige cuando no hay nada que tratar
  assert.equal(validar({ ...A(), canal: { ventaPct: 0, fijo: 0 } }).ok, true);
  assert.equal(validar({ ...A(), publicidad: { acos: 0 } }).ok, true);
  assert.equal(validar({ precio: 100, fiscal: { regimen: 'sin_iva' }, costo: { producto: 40 }, canal: { ventaPct: 0.1 } }).ok, true);
});
test('I: sin canal declarado hay advertencia (ganancia sobreestimada); sin impuestos también', () => {
  const v = validar({ precio: 100, fiscal: { regimen: 'sin_iva' }, costo: { producto: 40 } });
  assert.equal(v.ok, true); assert.deepEqual(v.advertencias.map(a => a.codigo).sort(), ['CANAL_NO_DECLARADO', 'IMPUESTOS_NO_DECLARADOS']);
  assert.deepEqual(validar({ ...A(), impuestosVentaPct: 0 }).advertencias, []);      // declarado explícitamente en 0: sin aviso
});
test('I: tramos inválidos, comisión que suma 100% y listas demasiado largas', () => {
  const t = fijo => campos(validar({ ...A(), canal: { ventaPct: 0.14, fijo, ivaModo: 'incluido' } }));
  assert.deepEqual(t([{ hasta: 12000, monto: 1 }]), ['canal.fijo:TRAMOS_INVALIDOS']);                       // el último tiene tope
  assert.deepEqual(t([{ hasta: 12000, monto: 1 }, { hasta: 5000, monto: 2 }, { hasta: null, monto: 3 }]), ['canal.fijo:TRAMOS_INVALIDOS']);   // no creciente
  assert.deepEqual(t([]), ['canal.fijo:TRAMOS_INVALIDOS']);
  assert.deepEqual(t([{ hasta: null, monto: -1 }]), ['canal.fijo.0.monto:MONTO_FUERA_DE_RANGO']);
  assert.equal(validar({ ...A(), canal: { ventaPct: 0.6, financiacionPct: 0.4, ivaModo: 'incluido' } }).ok, false);
  assert.deepEqual(campos(validar({ ...A(), costo: { producto: 1, ivaIncluido: true, extras: Array(21).fill({ monto: 1, ivaIncluido: true }) } })), ['costo.extras:EXTRAS_INVALIDOS']);
});
test('I: validar y evaluar nunca lanzan, con cualquier basura', () => {
  for (const x of [null, undefined, 'x', 42, [], () => 1, { precio: {} }, { fiscal: 5 }, { canal: 'x', precio: 1, fiscal: { regimen: 'ri' } }, { costo: { extras: 'x' } }]) {
    assert.equal(validar(x).ok, false); assert.equal(evaluar(x).ok, false);
  }
});
test('I: no muta la entrada, no comparte referencias y es reproducible', () => {
  const e = A(), copia = clon(e);
  const r1 = evaluar(e), r2 = evaluar(e);
  assert.deepEqual(e, copia);
  assert.deepEqual(r1, r2);
  assert.deepEqual(r1, JSON.parse(JSON.stringify(r1)), 'el resultado es JSON puro (sin Infinity, undefined ni -0)');
  r1.entrada.precio = 1; assert.equal(e.precio, 15000);
});
test('el resultado lleva la versión del motor', () => assert.equal(evaluar(A()).motor.version, MOTOR_VERSION));

// ═══ J · redondeo ═══
test('J: redondeo de presentación — mitad lejos de cero, sin -0, null si no es finito', () => {
  assert.equal(redondearDinero(1.005), 1.01);          // el flotante de 1.005 queda justo debajo de la mitad
  assert.equal(redondearDinero(2.675), 2.68);
  assert.equal(redondearDinero(-1.005), -1.01);
  assert.equal(redondearDinero(0.005), 0.01);
  assert.equal(redondearDinero(0.004), 0);
  assert.ok(Object.is(redondearDinero(-0.0001), 0), 'nunca devuelve -0');
  assert.ok(Object.is(redondearDinero(-0), 0));
  assert.equal(redondearDinero(1234.5), 1234.5);
  assert.equal(redondear(24.2333333, 1), 24.2);
  assert.equal(redondear(0.285, 2), 0.29);
  for (const x of [NaN, Infinity, -Infinity, undefined, null, '1']) assert.equal(redondearDinero(x), null);
});
test('J: el motor no redondea el cálculo (solo la presentación lo hace)', () => {
  const r = evaluar(C('ri', 'incluido', false));
  assert.notEqual(r.costos.find(c => c.id === 'comision_venta').monto, redondearDinero(r.costos.find(c => c.id === 'comision_venta').monto) + 0.001);
  const r2 = evaluar({ ...A(), precio: 9999.99 });
  assert.ok(String(r2.ganancia).replace('.', '').length > 8, 'conserva decimales completos');
});

// ═══ L · capas ═══
test('L: el núcleo solo se importa a sí mismo, sin Node, sin red, sin DOM, sin azar y sin Mercado Libre', () => {
  const archivos = readdirSync(MOTOR).filter(f => f.endsWith('.js'));
  assert.ok(['validar.js', 'economia.js', 'version.js', 'inversas.js', 'escenarios.js', 'supuestos.js', 'vista.js'].every(f => archivos.includes(f)));
  const permitidos = { 'version.js': [], 'validar.js': [], 'economia.js': ['./validar.js', './version.js'], 'inversas.js': ['./validar.js', './economia.js'], 'escenarios.js': ['./validar.js', './economia.js', './inversas.js', './version.js'], 'supuestos.js': [], 'vista.js': ['./economia.js'] };
  for (const f of archivos) {
    const src = readFileSync(join(MOTOR, f), 'utf8');
    const imports = [...src.matchAll(/(?:^|\n)\s*import\s[^;]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1] || m[2]);
    if (permitidos[f]) assert.deepEqual(imports.sort(), [...permitidos[f]].sort(), `${f} importa algo no permitido`);
    for (const imp of imports) assert.match(imp, /^\.\/[a-z]+\.js$/, `${f}: import fuera del motor (${imp})`);
    const codigo = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const prohibido of [/\bfetch\b/, /\bprocess\b/, /\brequire\b/, /\bdocument\b/, /\bwindow\b/, /Math\.random/, /\bDate\b/, /\bsetTimeout\b/, /\bconsole\b/, /mercado\s*libre|mercadolibre|\bMLA\d*\b/i, /groq|anthropic|openai/i])
      assert.doesNotMatch(codigo, prohibido, `${f} usa ${prohibido}`);
  }
});
