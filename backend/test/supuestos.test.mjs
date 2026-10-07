// Pruebas del registro de supuestos (S4). Correr: node --test backend/test/supuestos.test.mjs
// Contrasta lo que el registro DICE con lo que validar HACE, campo por campo, y verifica que las referencias orientativas
// nunca se apliquen solas. Puras y deterministas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validar } from '../lib/motor/validar.js';
import { evaluar } from '../lib/motor/economia.js';
import { OBLIGATORIOS, DEFAULTS, OPCIONALES_SIN_EFECTO } from '../lib/motor/supuestos.js';
import { REFERENCIAS, ESTADOS, SUPUESTOS_IMPLICITOS_IMPORTAR } from '../lib/fuentes/referencias.js';

const AQUI = dirname(fileURLToPath(import.meta.url)), MOTOR = join(AQUI, '../lib/motor');
const clon = x => structuredClone(x);
const leer = (o, ruta) => ruta.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
const borrar = (o, ruta) => { const ks = ruta.split('.'), ult = ks.pop(); const p = ks.reduce((x, k) => x?.[k], o); if (p) delete p[ult]; };
const hojas = (o, pre = '') => Object.entries(o).flatMap(([k, v]) => (v !== null && typeof v === 'object' && !Array.isArray(v) ? hojas(v, `${pre}${k}.`) : [`${pre}${k}`]));

// Una entrada con TODO declarado explícitamente: cada prueba le quita un campo y mira qué hace el motor.
const COMPLETA = () => ({
  precio: 15000, unidades: 2, fijosMes: 100,
  fiscal: { regimen: 'monotributo', ivaProducto: 0.21, ivaServicios: 0.21 },
  costo: { producto: 6000, ivaIncluido: true, ivaCompra: 0.21, extras: [{ nombre: 'Caja', monto: 100, ivaIncluido: true }] },
  canal: { ventaPct: 0.14, financiacionPct: 0.05, fijo: 2740, envio: 1000, ivaModo: 'incluido' },
  publicidad: { acos: 0.1, ventasPorAdsPct: 1, base: 'precio', ivaModo: 'incluido' },
  impuestosVentaPct: 0.035, devolucionesPct: 0.01,
});
// Contexto en el que cada default se usa de verdad (algunos solo aplican con cierto régimen o tratamiento de IVA)
const CONTEXTO = {
  'fiscal.ivaProducto': e => { e.fiscal.regimen = 'ri'; },
  'costo.ivaCompra': e => { e.fiscal.regimen = 'ri'; e.costo.ivaIncluido = true; e.costo.extras[0].ivaIncluido = true; },
  'fiscal.ivaServicios': e => { e.fiscal.regimen = 'ri'; e.canal.ivaModo = 'incluido'; },
};

test('el registro cubre TODOS los campos de la entrada normalizada (si aparece un campo nuevo, este test obliga a clasificarlo)', () => {
  const normal = hojas(validar(COMPLETA()).entrada);
  const registrados = new Set([...OBLIGATORIOS.map(o => o.campo), ...DEFAULTS.map(d => d.campo), ...OPCIONALES_SIN_EFECTO]);
  assert.deepEqual(normal.filter(c => !registrados.has(c)), [], 'campos sin clasificar');
  const reales = new Set(normal);
  for (const c of registrados) assert.ok(reales.has(c) || c === 'canal', `el registro menciona «${c}», que no es un campo`);
  assert.equal(new Set([...OBLIGATORIOS.map(o => o.campo), ...DEFAULTS.map(d => d.campo)]).size, OBLIGATORIOS.length + DEFAULTS.length, 'ningún campo duplicado entre obligatorios y defaults');
});

test('OBLIGATORIOS: faltar el dato es un error con el código documentado', () => {
  for (const o of OBLIGATORIOS) {
    const e = COMPLETA();
    if (o.campo === 'fiscal.regimen') borrar(e, o.campo);
    else if (o.campo === 'canal.ivaModo') borrar(e, o.campo);
    else if (o.campo === 'costo.ivaIncluido') { borrar(e, o.campo); e.costo.extras = []; }
    else if (o.campo === 'publicidad.ivaModo') borrar(e, o.campo);
    else borrar(e, o.campo);
    const v = validar(e);
    assert.equal(v.ok, false, o.campo);
    assert.ok(v.errores.some(x => x.campo === o.campo && x.codigo === o.codigo), `${o.campo}: esperaba ${o.codigo}, hubo ${JSON.stringify(v.errores.map(x => `${x.campo}:${x.codigo}`))}`);
  }
});
test('OBLIGATORIOS: cuando la condición NO se cumple, no se exige (sin_iva, o sin cargos / sin costo / sin ads)', () => {
  const sinIva = COMPLETA(); sinIva.fiscal.regimen = 'sin_iva'; for (const c of ['canal.ivaModo', 'costo.ivaIncluido', 'publicidad.ivaModo']) borrar(sinIva, c); borrar(sinIva, 'costo.extras.0.ivaIncluido');
  assert.equal(validar(sinIva).ok, true);
  const sinCargos = COMPLETA(); sinCargos.canal = { ventaPct: 0 }; sinCargos.publicidad = { acos: 0 }; assert.equal(validar(sinCargos).ok, true);
  const sinCosto = COMPLETA(); sinCosto.costo = { producto: 0 }; assert.equal(validar(sinCosto).ok, true);
});

test('DEFAULTS: cada uno hace lo que el registro dice (valor, supuesto registrado, aviso)', () => {
  for (const d of DEFAULTS) {
    const e = COMPLETA(); (CONTEXTO[d.campo] || (() => {}))(e);
    if (d.campo === 'canal') delete e.canal; else borrar(e, d.campo);
    const v = validar(e);
    assert.equal(v.ok, true, `${d.campo}: ${JSON.stringify(v.errores)}`);
    if (d.campo === 'canal') {
      assert.deepEqual([v.entrada.canal.ventaPct, v.entrada.canal.fijo, v.entrada.canal.envio], [0, 0, 0]);
    } else {
      assert.deepEqual(leer(v.entrada, d.campo), d.valor, `${d.campo}: valor`);
    }
    assert.equal(v.supuestos.some(s => s.campo === d.campo), d.registrado, `${d.campo}: ¿queda registrado en supuestos?`);
    if (d.registrado) assert.deepEqual(v.supuestos.find(s => s.campo === d.campo).valor, d.valor);
    assert.equal(v.advertencias.some(a => a.codigo === d.aviso), d.aviso !== null, `${d.campo}: aviso ${d.aviso}`);
    if (d.aviso === null) assert.equal(v.advertencias.length, 0, `${d.campo}: no debería avisar nada`);
  }
});
test('DEFAULTS: un default «registrado» NO se anota cuando no se usa', () => {
  const e = COMPLETA(); borrar(e, 'fiscal.ivaServicios');                  // monotributo + cargos «incluido»: la alícuota no influye
  assert.equal(validar(e).supuestos.some(s => s.campo === 'fiscal.ivaServicios'), false);
  const sinAds = COMPLETA(); sinAds.publicidad = { acos: 0, ivaModo: 'incluido' };
  assert.equal(validar(sinAds).supuestos.some(s => s.campo.startsWith('publicidad.')), false);
});

test('BRECHAS CONOCIDAS (S1): estos defaults en 0 cambian el resultado en pesos y NO dejan supuesto ni aviso', () => {
  const brechas = DEFAULTS.filter(d => d.brecha);
  assert.deepEqual(brechas.map(b => b.campo).sort(), ['canal.envio', 'canal.fijo', 'canal.financiacionPct', 'canal.ventaPct', 'costo.extras', 'devolucionesPct', 'fijosMes', 'publicidad.acos']);
  const valorNoCero = { 'canal.ventaPct': 0.14, 'canal.financiacionPct': 0.05, 'canal.fijo': 2740, 'canal.envio': 1000, devolucionesPct: 0.01, 'publicidad.acos': 0.1 };
  for (const b of brechas.filter(x => x.campo in valorNoCero)) {
    const sin = COMPLETA(); borrar(sin, b.campo);
    const gSin = evaluar(sin).ganancia, gCon = evaluar(COMPLETA()).ganancia;
    assert.ok(gSin > gCon, `${b.campo}: omitirlo sube la ganancia (${gSin} > ${gCon}): el resultado cambia en pesos…`);
    assert.equal(validar(sin).supuestos.length, 0, `${b.campo}: …y no queda registrado como supuesto`);
    assert.deepEqual(validar(sin).advertencias, [], `${b.campo}: …ni como advertencia`);
  }
});

// ═══ referencias orientativas: jamás se aplican solas ═══
test('el motor no usa las referencias: ni las importa ni contiene sus números', () => {
  for (const f of readdirSync(MOTOR).filter(x => x.endsWith('.js'))) {
    const src = readFileSync(join(MOTOR, f), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(src, /fuentes|referencias/, `${f} importa fuentes`);
    for (const n of [/\b0\.29\b/, /\b0\.14\b/, /\b0\.035\b/, /\b1450\b/, /\b27\.4\b|\b0\.274\b|\b0\.134\b/]) assert.doesNotMatch(src, n, `${f} contiene un número de referencia ${n}`);
  }
});
test('sin comisión declarada el motor NO usa 14% ni 29%: la toma como 0 y avisa', () => {
  const e = COMPLETA(); delete e.canal;
  const v = validar(e);
  assert.deepEqual([v.entrada.canal.ventaPct, v.entrada.canal.financiacionPct], [0, 0]);
  assert.ok(v.advertencias.some(a => a.codigo === 'CANAL_NO_DECLARADO' && a.severidad === 'alta'));
});
test('las referencias están completas, con procedencia, y coinciden con los archivos de donde salen', () => {
  const ids = REFERENCIAS.map(r => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const r of REFERENCIAS) {
    assert.ok(ESTADOS.includes(r.estado), `${r.id}: estado ${r.estado}`);
    assert.ok(r.fuente && r.fuente.length > 15, `${r.id}: sin fuente`); assert.match(r.revisado, /^\d{4}-\d{2}(-\d{2})?$/, `${r.id}: fecha`);
    assert.ok(r.nota && r.nota.length > 10, `${r.id}: sin nota`);
    if (r.estado === 'observado_api') assert.equal(r.revisado, '2026-10-02', `${r.id}: se observó ese día`);
  }
  const D = JSON.parse(readFileSync(join(AQUI, '../../frontend/data/importacion.json'), 'utf8')), ref = id => REFERENCIAS.find(r => r.id === id).valor;
  const igual = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
  igual(ref('comision_clasica') * 100, D.mercadolibre.comision_clasica); igual(ref('comision_premium') * 100, D.mercadolibre.comision_premium);
  igual(ref('iibb_venta') * 100, D.mercadolibre.iibb_venta); assert.equal(ref('tipo_cambio_ejemplo'), D.tipo_cambio_ejemplo);
  assert.equal(D.revisado, '2026-09');
  const src = readFileSync(join(AQUI, '../../frontend/js/importar.js'), 'utf8');
  assert.equal(Number(src.match(/const IVA_ML = ([\d.]+);/)[1]), ref('iva_general')); assert.equal(Number(src.match(/const IVA_LOCAL = ([\d.]+);/)[1]), ref('iva_general'));
});
test('lo observado en la API es internamente coherente (Premium = venta + financiación) y marcado como caso, no regla', () => {
  for (const id of ['obs_MLA1574_premium', 'obs_MLA3530_premium']) {
    const v = REFERENCIAS.find(r => r.id === id).valor;
    assert.ok(Math.abs(v.ventaPct + v.financiacionPct - v.totalPct) < 1e-12, id);
  }
  assert.ok(REFERENCIAS.filter(r => r.estado === 'observado_api').every(r => /categor/i.test(r.concepto)));
  assert.ok(REFERENCIAS.find(r => r.id === 'cargos_con_iva_incluido').estado === 'supuesto_sin_verificar');
  assert.ok(SUPUESTOS_IMPLICITOS_IMPORTAR.length >= 6 && SUPUESTOS_IMPLICITOS_IMPORTAR.every(s => s.texto && s.motor));
});
