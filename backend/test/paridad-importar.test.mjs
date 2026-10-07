// Paridad entre importar.js y el motor económico nuevo (S4). Correr: node --test backend/test/paridad-importar.test.mjs
// Ejecuta el modelo REAL de frontend/js/importar.js (sin modificarlo) y lo contrasta con el motor. Ver docs/motor-paridad-importar.md.
// Determinista: sin red ni base; los casos «aleatorios» usan semilla fija.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluar } from '../lib/motor/economia.js';
import { cargarImportar, entradaInicial, entradaMotor, compararCaso, resumir, casos, documento, sensibilidadIva, dobleConteo, CONCEPTOS } from '../../tools/paridad-importar.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');
const I = cargarImportar();
const R = resumir(I);
const cerca = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b)), `${a} ≉ ${b}`);

test('el modelo extraído de importar.js es el real: reproduce lo que dio la página en un navegador (window.__importar.modelo, 02/10/2026)', () => {
  assert.deepEqual(I.constantes, { IVA_ML: 0.21, IVA_LOCAL: 0.21 });
  const r = I.modelo(entradaInicial(I.datos));
  // Valores obtenidos corriendo la página real en Chromium con los mismos datos: idénticos hasta el último decimal
  assert.equal(r.costoU, 18093.97495); assert.equal(r.neto, 39999); assert.equal(r.comision, 11599.71);
  assert.equal(r.ganU, 4405.350050000001); assert.equal(r.margen, 0.11013650466261658); assert.equal(r.markup, 0.24347055095265294);
  assert.equal(r.pMin, 33472.55548148148); assert.equal(r.pObj, 47566.26305263158);
});
test('verificación independiente (a mano) del ejemplo: ni importar.js ni el motor — solo aritmética', () => {
  // 500 u. × USD 4,2 = 2.100 FOB · flete 900 · seguro 1% de 3.000 = 30 → CIF 3.030 · DI 20% = 606 · TE 3% = 90,9 → base 3.726,9
  const base = 3726.9, tc = 1450;
  const tributos = base * (0.21 + 0.20 + 0.06 + 0.025);                        // IVA, IVA adicional, Ganancias, IIBB de aduana (USD)
  const local = 350000 + 450000;                                                 // despachante + terminal/depósito (pesos)
  const costoTotal = base * tc + local + tributos * tc + local * 0.21;           // no RI: todo es costo, también el IVA de los gastos locales
  const costoU = costoTotal / 500;
  cerca(costoU, 18093.97495);
  // venta a 39.999: comisión 29%, envío 4.500, Ingresos Brutos 3,5%
  const ganancia = 39999 - 39999 * 0.29 - 4500 - 39999 * 0.035 - costoU;
  cerca(ganancia, 4405.35005);
  const e = evaluar(entradaMotor(entradaInicial(I.datos), costoU, I.constantes));
  cerca(e.ganancia, ganancia); cerca(I.modelo(entradaInicial(I.datos)).ganU, ganancia);
});

test('PARIDAD: los 14 conceptos de venta coinciden en todos los casos comparables', () => {
  assert.equal(R.lista.length, 419);
  assert.equal(R.comparables.length, 417);
  assert.equal(R.porConcepto.length, CONCEPTOS.length);
  for (const c of R.porConcepto) {
    assert.equal(c.coinciden, c.comparados, `${c.concepto}: difiere en ${c.difieren.length} casos. Primero: ${JSON.stringify(c.difieren[0])}`);
    assert.ok(c.maxDif < 1e-6, `${c.concepto}: diferencia máxima ${c.maxDif}`);
  }
});
test('PARIDAD: el caso base y el caso RI, concepto por concepto', () => {
  for (const nombre of ['Ejemplo de la página (premium, no RI)', 'Ejemplo, responsable inscripto']) {
    const c = R.lista.find(x => x.nombre === nombre);
    assert.equal(c.filas.length, 14); assert.ok(c.filas.every(f => f.coincide), nombre);
  }
  const base = R.lista.find(x => x.nombre.startsWith('Ejemplo de la página')), g = id => base.filas.find(f => f.id === id);
  assert.equal(g('precio_minimo').motor, 33473); assert.equal(g('precio_objetivo').motor, 47567); cerca(g('ganancia').motor, 4405.35005);
  const ri = R.lista.find(x => x.nombre === 'Ejemplo, responsable inscripto'), h = id => ri.filas.find(f => f.id === id);
  cerca(h('ingreso_neto').motor, 39999 / 1.21); cerca(h('comision').motor, 39999 * 0.29 / 1.21); cerca(h('ganancia').motor, 6186.473471, 1e-9); assert.equal(h('precio_minimo').motor, 28910);
});
test('PARIDAD: los casos límite coinciden también cuando «no hay valor» (cargos que tragan todo el ingreso: ambos dicen sin precio)', () => {
  const c = R.lista.find(x => x.nombre.startsWith('Comisión + cuotas + IIBB tragan'));
  assert.equal(c.noComparable, false);
  const f = id => c.filas.find(x => x.id === id);
  assert.ok(Number.isNaN(f('precio_minimo').importar) && f('precio_minimo').motor === null && f('precio_minimo').coincide);
  assert.ok(Number.isNaN(f('precio_objetivo').importar) && f('precio_objetivo').motor === null && f('precio_objetivo').coincide);
  assert.equal(c.extra.motivoPiso, 'CARGOS_SUPERAN_INGRESO');
  const objetivoImposible = R.lista.find(x => x.nombre.startsWith('Margen objetivo inalcanzable'));
  assert.ok(Number.isNaN(objetivoImposible.filas.find(x => x.id === 'precio_objetivo').importar) && objetivoImposible.filas.find(x => x.id === 'precio_objetivo').motor === null);
  assert.equal(objetivoImposible.extra.motivoObjetivo, 'MARGEN_INALCANZABLE');
  const perdida = R.lista.find(x => x.nombre === 'Vendiendo a pérdida'); assert.ok(perdida.ev.ganancia < 0 && perdida.filas.every(x => x.coincide));
});

test('DIFERENCIAS: exactamente dos entradas que el motor rechaza, con su causa — nada oculto', () => {
  assert.deepEqual(R.noComparables.map(c => [c.nombre, c.errores.map(e => e.codigo)]), [
    ['Sin precio cargado (la página muestra «—»)', ['PRECIO_INVALIDO']],
    ['Comisión + cuotas ≥ 100%', ['PORCENTAJE_FUERA_DE_RANGO']],
  ]);
  const sinPrecio = R.noComparables[0], cien = R.noComparables[1];
  assert.equal(sinPrecio.r.neto, 0);                                             // importar.js sí calcula, con ingreso 0
  assert.ok(Number.isNaN(cien.r.pMin) && cien.r.ganU < 0);                       // importar.js sí calcula: ganancia absurda y precio mínimo NaN
});
test('DIFERENCIAS: importar.js convierte en silencio los números inválidos en 0; el motor los rechaza', () => {
  const src = readFileSync(join(RAIZ, 'frontend/js/importar.js'), 'utf8');
  assert.match(src, /v\[k\] = malo \? 0 : n;/, 'importar.js ya no fuerza a 0: actualizar docs/motor-paridad-importar.md');
  assert.equal(evaluar({ ...entradaMotor(entradaInicial(I.datos), 1000, I.constantes), precio: -5 }).ok, false);
});

test('LA PARIDAD DEPENDE DE UN SUPUESTO SIN VERIFICAR: con los cargos «adicional» deja de coincidir (el arnés sí lo detecta)', () => {
  for (const ri of [false, true]) {
    const v = entradaInicial(I.datos, { ri }), r = I.modelo(v), ent = entradaMotor(v, r.costoU, I.constantes);
    cerca(evaluar(ent).ganancia, r.ganU);                                                                   // «incluido»: igual
    const rota = evaluar({ ...ent, canal: { ...ent.canal, ivaModo: 'adicional' } });
    assert.ok(Math.abs(rota.ganancia - r.ganU) > 1000, `ri=${ri}: el arnés no detectaría el cambio`);
  }
  const redondeo = x => Math.round(x * 100) / 100;
  const [noRi, ri] = sensibilidadIva(I);
  assert.deepEqual([noRi, ri].map(x => [redondeo(x.importar), redondeo(x.incluido), redondeo(x.adicional)]), [[4405.35, 4405.35, 1024.41], [6186.47, 6186.47, 3392.31]]);
});
test('el posible doble conteo de la financiación se cuantifica con el ejemplo (ilustrativo)', () => {
  const d = dobleConteo(I, 13.4);
  cerca(d.con, d.sin - 39999 * 0.134);                                           // 13,4% extra sobre 39.999
  assert.equal(Math.round(d.sin * 100) / 100, 4405.35); assert.equal(Math.round(d.con * 100) / 100, -954.52);
});

test('el documento generado está al día con el código (si falla: node tools/paridad-importar.mjs --escribir)', () => {
  assert.equal(readFileSync(join(RAIZ, 'docs/motor-paridad-importar.md'), 'utf8'), documento(I, R));
});
test('la herramienta de paridad no modifica importar.js ni nada fuera de docs/', () => {
  const src = readFileSync(join(RAIZ, 'tools/paridad-importar.mjs'), 'utf8').replace(/\/\/.*$/gm, '');
  const escrituras = [...src.matchAll(/writeFileSync\(([^;]+)\)/g)].map(m => m[1]);
  assert.equal(escrituras.length, 1); assert.match(escrituras[0], /docs\/motor-paridad-importar\.md/);
  assert.doesNotMatch(escrituras[0], /frontend/);                                  // y nunca apunta a frontend/
});
test('los casos son reproducibles (semilla fija) y suficientes', () => {
  const a = casos(I.datos), b = casos(I.datos);
  assert.deepEqual(a, b); assert.equal(a.length, 419); assert.ok(a.filter(c => c.v.ri).length > 150 && a.filter(c => !c.v.ri).length > 150);
  assert.ok(new Set(a.map(c => c.v.iva)).size >= 2, 'incluye rubros con IVA distinto de 21%');
  void compararCaso;
});
