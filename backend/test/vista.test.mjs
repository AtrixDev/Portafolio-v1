// Pruebas de vista.js (S6): la presentación formatea lo que el motor calculó y NO calcula nada.
// Correr: node --test backend/test/vista.test.mjs   — puras y deterministas (semilla fija).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluar } from '../lib/motor/economia.js';
import { resolverObjetivos } from '../lib/motor/inversas.js';
import { moneda, porcentaje, entero, avisos, descripcionEntrada, resumenGuardable, REGIMEN_TEXTO, AVISO_TITULO, MOTIVO_TEXTO } from '../lib/motor/vista.js';
import { limpiarResumen } from '../lib/resultados.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FUENTE = readFileSync(join(AQUI, '../lib/motor/vista.js'), 'utf8');
const CODIGO = FUENTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const clon = x => structuredClone(x);
const sinOrden = r => ({ r: evaluar(r), }).r;
const preparar = e => { const r = evaluar(e); return { r, o: resolverObjetivos(r.entrada) }; };

// Caso A (monotributo): ganancia 3.635 · margen 24,23% · markup 60,58% · piso 10.594 · costo máximo 9.635
const A = (extra = {}) => ({ precio: 15000, fiscal: { regimen: 'monotributo' }, costo: { producto: 6000, ivaIncluido: true }, canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'incluido' }, impuestosVentaPct: 0.035, ...extra });

// ═══ formato ═══
test('formato es-AR sin Intl: miles con punto, decimales con coma, sin ceros de relleno, menos tipográfico', () => {
  const casos = [[3635, '$ 3.635'], [4405.35005, '$ 4.405,35'], [-1315, '−$ 1.315'], [0, '$ 0'], [-0, '$ 0'], [0.004, '$ 0'], [0.005, '$ 0,01'], [-0.005, '−$ 0,01'], [1234.5, '$ 1.234,5'], [1e9, '$ 1.000.000.000'], [999999999.99, '$ 999.999.999,99'], [2.675, '$ 2,68']];
  for (const [n, t] of casos) assert.equal(moneda(n), t, String(n));
  for (const x of [null, undefined, NaN, Infinity, -Infinity, '5', {}]) assert.equal(moneda(x), '—', String(x));
  assert.deepEqual([0.24233, 0.33, 1.5, -0.0549, 0, 0.0777].map(porcentaje), ['24,2%', '33%', '150%', '−5,5%', '0%', '7,8%']);
  assert.equal(porcentaje(null), '—'); assert.equal(porcentaje(NaN), '—');
  assert.deepEqual([28, 1234567, 0, 2.5].map(entero), ['28', '1.234.567', '0', '3']);
  assert.doesNotMatch(CODIGO, /Intl|toLocale/, 'el formato no puede depender del ICU de cada entorno');
});
test('rótulos de texto: ninguno menciona un marketplace ni inventa un código', () => {
  assert.deepEqual(Object.keys(REGIMEN_TEXTO), ['monotributo', 'ri', 'sin_iva']);
  for (const t of [...Object.values(AVISO_TITULO), ...Object.values(MOTIVO_TEXTO)]) assert.doesNotMatch(t, /mercado|libre|meli/i);
});

// ═══ el resumen del caso A, con texto esperado escrito a mano ═══
test('A: resumen guardable — texto, números y filas esperados', () => {
  const { r, o } = preparar(A());
  const v = resumenGuardable(r, o);
  assert.equal(v.titulo, 'Rentabilidad: $ 3.635 por unidad (24,2% de margen)');
  assert.equal(v.veredicto, 'Con estos datos ganás $ 3.635 por unidad. Para no perder, el precio mínimo es $ 10.594. Usé 1 valor supuesto: están en el resultado completo.');
  assert.equal(v.numero, 3635); assert.equal(v.etiqueta, 'Monotributo'); assert.equal(v.cobertura, null); assert.deepEqual(v.noVerificado, []);
  assert.deepEqual(v.puntos, [
    { ok: true, t: 'Ganancia por unidad: $ 3.635', s: 'Margen 24,2% sobre el ingreso neto · markup 60,6% sobre el costo del producto' },
    { ok: null, t: 'Precio mínimo para no perder: $ 10.594', s: 'Hoy vendés a $ 15.000' },
    { ok: null, t: 'Costo máximo del proveedor: $ 9.635', s: 'Con IVA incluido, para no bajar del objetivo' },
    { ok: false, t: 'Un cargo puede cambiar con el precio', s: v.puntos[3].s },
  ]);
  assert.match(v.puntos[3].s, /cargo fijo se tomó como constante/);          // el texto del aviso es el del motor, tal cual
  assert.equal(descripcionEntrada(r.entrada), 'Precio $ 15.000 · Monotributo');
  assert.equal(descripcionEntrada({ ...r.entrada, unidades: 1200, fiscal: { regimen: 'ri' } }), 'Precio $ 15.000 · Responsable inscripto · 1.200 u.');
});
test('con publicidad, objetivos, fijos y varias unidades aparecen todas las filas, en orden', () => {
  const { r, o } = preparar(A({ unidades: 3, publicidad: { acos: 0.1, ivaModo: 'incluido' }, objetivo: { margenPct: 0.2, gananciaUnidad: 1000 }, fijosMes: 100000 }));
  const v = resumenGuardable(r, o);
  assert.deepEqual(v.puntos.map(p => p.t.split(':')[0]), ['Ganancia por unidad', 'Ganancia total', 'Precio mínimo para no perder', 'Precio para 20% de margen', 'Precio para ganar $ 1.000 por unidad', 'ACOS máximo', 'Costo máximo del proveedor', 'Punto de equilibrio', 'Un cargo puede cambiar con el precio'].slice(0, 8));
  assert.equal(v.puntos.length, 8); assert.equal(v.puntos[1].t, 'Ganancia total: $ 6.405'); assert.equal(v.puntos[1].s, '3 unidades');
  assert.match(v.puntos.find(p => p.t.startsWith('Punto de equilibrio')).t, /unidades por mes/);
  assert.match(v.veredicto, /Usé 2 valores supuestos/);
});
test('a pérdida: lo dice el motor (GANANCIA_NEGATIVA) y la vista solo lo repite', () => {
  const { r, o } = preparar(A({ precio: 9000 }));
  assert.ok(r.advertencias.some(a => a.codigo === 'GANANCIA_NEGATIVA'));
  const v = resumenGuardable(r, o);
  assert.match(v.veredicto, /^Con estos datos perdés plata en cada unidad\./); assert.equal(v.puntos[0].ok, false); assert.equal(v.puntos[0].t, 'Ganancia por unidad: −$ 1.315');
  assert.ok(!v.puntos.some(p => p.t === AVISO_TITULO.GANANCIA_NEGATIVA), 'no se repite como aviso');
});
test('sin solución: el motivo viene del motor y la vista lo traduce a texto', () => {
  const { r, o } = preparar(A({ canal: { ventaPct: 0.6, ivaModo: 'incluido' }, impuestosVentaPct: 0.4 }));
  const v = resumenGuardable(r, o);
  assert.equal(v.puntos[1].t, 'Precio mínimo para no perder: sin solución'); assert.equal(v.puntos[1].s, MOTIVO_TEXTO.CARGOS_SUPERAN_INGRESO);
  assert.doesNotMatch(v.veredicto, /precio mínimo es/);
  const mi = resumenGuardable(...Object.values(preparar(A({ objetivo: { margenPct: 0.9 } }))));
  assert.match(mi.puntos.find(p => p.t.includes('90% de margen')).s, /no se puede alcanzar.*82,5%/);
});
test('avisos del motor: faltantes graves entran al resumen (máx. 2) y los de severidad baja no', () => {
  const r = evaluar({ precio: 100, fiscal: { regimen: 'sin_iva' }, costo: { producto: 40 } });          // sin canal ni impuestos declarados
  const o = resolverObjetivos(r.entrada), v = resumenGuardable(r, o);
  assert.deepEqual(avisos(r, o).map(a => a.codigo), ['CANAL_NO_DECLARADO', 'IMPUESTOS_NO_DECLARADOS']);      // alta antes que media
  assert.deepEqual(v.puntos.slice(-2).map(p => [p.ok, p.t]), [[false, AVISO_TITULO.CANAL_NO_DECLARADO], [false, AVISO_TITULO.IMPUESTOS_NO_DECLARADOS]]);
  assert.equal(avisos({ advertencias: [{ codigo: 'X', severidad: 'baja', texto: 't' }, { codigo: 'Y', severidad: 'alta', texto: 'u' }, { codigo: 'X', severidad: 'alta', texto: 'dup' }] }, { advertencias: [] }).map(a => a.codigo).join(), 'Y,X');
  const baja = resumenGuardable({ ...r, advertencias: [{ codigo: 'Z', severidad: 'baja', texto: 'z' }] }, { ...o, advertencias: [] });
  assert.ok(!baja.puntos.some(p => p.ok === false));
});

// ═══ la prueba que importa: la vista NO recalcula ═══
test('NO RECALCULA: con resultados inventados e incoherentes muestra exactamente lo que recibe', () => {
  const { r, o } = preparar(A({ unidades: 3, publicidad: { acos: 0.1, ivaModo: 'incluido' }, objetivo: { margenPct: 0.2, gananciaUnidad: 1000 }, fijosMes: 100000 }));
  const f = clon(r), g = clon(o);
  // números que NINGUNA fórmula produciría con esta entrada
  Object.assign(f, { ganancia: 1234.5, margenNeto: 0.5, markup: 2.25, gananciaTotal: 7777, precio: 777 });
  g.precioPiso.equilibrio.precio = 4321; g.precioPiso.margenObjetivo.precio = 5432; g.precioPiso.gananciaObjetivo.precio = 6543;
  g.acosEquilibrio.acos = 0.0777; g.costoMaximoProveedor.costoMaximo = 8888; g.unidades.equilibrio.unidades = 17; g.unidades.equilibrio.fijosMes = 31337;
  const v = resumenGuardable(f, g), txt = JSON.stringify(v);
  for (const esperado of ['$ 1.234,5', '50%', '225%', '$ 7.777', '$ 4.321', '$ 5.432', '$ 6.543', '7,8%', '$ 8.888', '17 unidades', '$ 31.337', '$ 777'])
    assert.ok(txt.includes(esperado), `falta «${esperado}» en ${txt}`);
  // y nada de lo que el motor habría calculado de verdad. La lista sale del resultado REAL (no escrita a mano: ya me falló una vez)
  const reales = [moneda(r.ganancia), moneda(r.gananciaTotal), porcentaje(r.margenNeto), porcentaje(r.markup), moneda(r.precio),
    moneda(o.precioPiso.equilibrio.precio), moneda(o.precioPiso.margenObjetivo.precio), moneda(o.precioPiso.gananciaObjetivo.precio), porcentaje(o.acosEquilibrio.acos),
    moneda(o.costoMaximoProveedor.costoMaximo), entero(o.unidades.equilibrio.unidades), moneda(o.unidades.equilibrio.fijosMes)];
  const inventados = [moneda(f.ganancia), moneda(f.gananciaTotal), porcentaje(f.margenNeto), porcentaje(f.markup), moneda(f.precio),
    moneda(g.precioPiso.equilibrio.precio), moneda(g.precioPiso.margenObjetivo.precio), moneda(g.precioPiso.gananciaObjetivo.precio), porcentaje(g.acosEquilibrio.acos),
    moneda(g.costoMaximoProveedor.costoMaximo), entero(g.unidades.equilibrio.unidades), moneda(g.unidades.equilibrio.fijosMes)];
  reales.forEach((real, i) => assert.notEqual(real, inventados[i], `precondición: el número inventado #${i} debe diferir del real`));
  // fila por fila, exacto: cada número inventado está en SU lugar (no basta con que aparezca en algún otro lado, p. ej. en el título)
  assert.equal(v.puntos[0].t, 'Ganancia por unidad: $ 1.234,5');
  assert.equal(v.puntos[0].s, 'Margen 50% sobre el ingreso neto · markup 225% sobre el costo del producto');
  assert.equal(v.puntos[1].t, 'Ganancia total: $ 7.777');
  assert.deepEqual(v.puntos.slice(2, 5).map(p => p.t), ['Precio mínimo para no perder: $ 4.321', 'Precio para 20% de margen: $ 5.432', 'Precio para ganar $ 1.000 por unidad: $ 6.543']);
  assert.equal(v.puntos[2].s, 'Hoy vendés a $ 777');
  assert.equal(v.puntos[5].t, 'ACOS máximo: 7,8%'); assert.equal(v.puntos[6].t, 'Costo máximo del proveedor: $ 8.888');
  assert.equal(v.puntos[7].t, 'Punto de equilibrio: 17 unidades por mes'); assert.equal(v.puntos[7].s, 'Para cubrir $ 31.337 de costos fijos');
  assert.equal(v.titulo, 'Rentabilidad: $ 1.234,5 por unidad (50% de margen)'); assert.equal(v.numero, 1234.5);
  // Se busca el número COMPLETO: «0%» no está en «50%» ni «$ 2.135» en «$ 12.135». «$ 100.000» (los fijos de la entrada) se muestra igual en ambos.
  const aparece = (texto, token) => new RegExp(`(?<![\\d.,])${token.replace(/[.*+?^${}()|[\]\\$]/g, '\\$&')}(?![\\d]|[.,]\\d)`).test(texto);
  assert.ok(aparece('xx $ 2.135 yy', '$ 2.135') && !aparece('$ 12.135', '$ 2.135') && !aparece('50%', '0%') && aparece('de 0% y', '0%'), 'el buscador de números completos funciona');
  for (const [i, real] of reales.entries()) if (real !== '$ 100.000') assert.ok(!aparece(txt, real), `apareció «${real}» (el valor REAL #${i}): la vista recalculó`);
});
test('NO DECIDE: «ok» depende solo de la advertencia del motor, no de comparar montos', () => {
  const { r, o } = preparar(A());
  const positivaConAviso = { ...clon(r), advertencias: [{ codigo: 'GANANCIA_NEGATIVA', severidad: 'alta', texto: 'x' }] };         // ganancia 3.635 pero el motor «dijo» negativa
  assert.equal(resumenGuardable(positivaConAviso, o).puntos[0].ok, false);
  const negativaSinAviso = { ...clon(r), ganancia: -50, advertencias: [] };                                                           // ganancia −50 pero el motor no avisó
  assert.equal(resumenGuardable(negativaSinAviso, o).puntos[0].ok, true);
  const g = clon(o); g.precioPiso.equilibrio.estable = false; g.precioPiso.equilibrio.precioEstable = 12345;                           // la inestabilidad la informa el motor
  assert.match(resumenGuardable(r, g).puntos[1].s, /recién queda estable desde \$ 12\.345/);
  const h = clon(o); h.precioPiso.equilibrio = { precio: null, motivo: 'MOTIVO_NUEVO_QUE_NO_CONOCE' };
  assert.equal(resumenGuardable(r, h).puntos[1].s, 'MOTIVO_NUEVO_QUE_NO_CONOCE', 'un motivo desconocido se muestra tal cual, sin inventar');
});
const CAMPOS = 'ganancia|margenNeto|markup|ingresoNeto|costoTotal|costoProducto|gananciaTotal|precio|acos|tacos|costoMaximo|costoMaximoNeto|unidades|precioEstable|margenMaximo|fijosMes|ivaVenta|margenPct|gananciaUnidad';
const RESULTADOS = 'ganancia|margenNeto|markup|ingresoNeto|costoTotal|costoProducto|gananciaTotal|precioEstable';
// Cada regla describe una forma de «calcular» en la presentación. La MISMA lista se aplica a vista.js y a los ejemplos rotos de abajo.
const REGLAS = [
  [new RegExp(`\\.(${CAMPOS})\\s*[-+*/%]`), 'aritmética sobre un campo del motor'],
  [new RegExp(`[-+*/%]\\s*\\w+(\\?)?\\.(${CAMPOS})\\b`), 'aritmética con un campo del motor'],
  [new RegExp(`\\b(${CAMPOS})\\b\\s*[-+*/%]=?\\s*\\w`), 'aritmética con un campo del motor (desestructurado)'],
  [new RegExp(`\\.(${CAMPOS})\\s*[<>]=?\\s*\\w+(\\?)?\\.(${CAMPOS})\\b`), 'comparar dos campos del motor entre sí'],
  [new RegExp(`\\.(${RESULTADOS})\\s*[<>]=?|[<>]=?\\s*\\w+(\\?)?\\.(${RESULTADOS})\\b|\\b(${RESULTADOS})\\b\\s*[<>]=?`), 'decidir comparando un resultado (ganancia, margen, markup…)'],
  [/\.reduce\(/, 'agregar con reduce'],
  [/Math\.(?!abs)\w+/, 'matemática fuera de Math.abs'],
];
test('ESTÁTICO: vista.js no contiene fórmulas — sin imports de cálculo, sin aritmética ni comparaciones sobre campos del motor', () => {
  assert.deepEqual([...CODIGO.matchAll(/from\s+'([^']+)'/g)].map(m => m[1]), ['./economia.js']);
  assert.match(CODIGO, /import \{ redondear \} from '\.\/economia\.js'/, 'solo toma el redondeo de presentación');
  for (const t of [/factorIva|estructura|evaluar|validar|precioParaObjetivo|precioPiso\(|acosEquilibrio\(|costoMaximoProveedor\(|unidadesEquilibrio\(|compararEscenarios|barrer\(/, /ivaProducto|ivaServicios|ivaCompra|ventaPct|financiacionPct|impuestosVentaPct|devolucionesPct/, /\bkP\b|\bkML\b/])
    assert.doesNotMatch(CODIGO, t, `vista.js menciona ${t}`);
  for (const [re, que] of REGLAS) assert.doesNotMatch(CODIGO, re, `vista.js: ${que}`);
});
test('el análisis estático DETECTA una fórmula escondida (se prueba con código roto a propósito)', () => {
  const rotos = ['const m = r.ganancia / r.ingresoNeto;', 'const g = r.ingresoNeto - r.costoTotal;', 'const t = r.costos.reduce((s, c) => s + c.monto, 0);', 'const p = Math.ceil(x);',
    'const buena = r.ganancia > r.costoTotal;', 'const { ganancia, costoTotal } = r; const d = ganancia - costoTotal;', 'const sube = o?.precio * 1.1;', 'if (r.margenNeto < 0.1) return 1;'];
  for (const roto of rotos) assert.ok(REGLAS.some(([re]) => re.test(roto)), `no detectaría: ${roto}`);
  // y no da falsos positivos con el código legítimo que usa la propia vista
  for (const ok of ['t: `Ganancia por unidad: ${moneda(r.ganancia)}`', 'if (nUnidades > 1) puntos.push({})', 'numero(typeof f === "number" ? f * 100 : f, 1)', 'const filas = puntos.slice(0, 8 - graves.length);', 'ue && ue.fijosMes > 0', 'p.precio !== null', 'numero: redondear(r.ganancia, 2)', 'r.markup === null ? "—" : porcentaje(r.markup)'])
    assert.ok(!REGLAS.some(([re]) => re.test(ok)), `falso positivo: ${ok}`);
});

// ═══ propiedades ═══
function prng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
test('PROPIEDADES (400 entradas con semilla fija): siempre un resumen válido, estable al limpiar, sin NaN ni undefined', () => {
  const rnd = prng(20261006), pick = a => a[Math.floor(rnd() * a.length)], en = (lo, hi) => lo + rnd() * (hi - lo);
  let n = 0, conAvisos = 0;
  for (let i = 0; i < 400; i++) {
    const regimen = pick(['monotributo', 'ri', 'sin_iva']), modo = () => pick(['incluido', 'adicional', 'sin']), precio = Math.round(en(2000, 200000));
    const e = {
      precio, unidades: Math.floor(en(1, 40)), fiscal: { regimen }, costo: { producto: Math.round(precio * en(0.05, 0.9)), ivaIncluido: rnd() < 0.5 },
      canal: rnd() < 0.9 ? { ventaPct: en(0.02, 0.3), fijo: rnd() < 0.5 ? Math.round(en(0, 3000)) : [{ hasta: Math.round(en(3000, 100000)), monto: Math.round(en(0, 1500)) }, { hasta: null, monto: Math.round(en(1500, 4000)) }], envio: Math.round(en(0, 4000)), ivaModo: modo() } : undefined,
      publicidad: { acos: rnd() < 0.5 ? en(0, 0.3) : 0, ivaModo: modo() }, impuestosVentaPct: rnd() < 0.9 ? en(0, 0.1) : undefined, fijosMes: rnd() < 0.5 ? Math.round(en(0, 300000)) : 0,
      objetivo: { margenPct: rnd() < 0.6 ? en(0, 0.4) : null, gananciaUnidad: rnd() < 0.4 ? Math.round(en(0, 3000)) : null },
    };
    const r = evaluar(e); if (!r.ok) continue;
    const o = resolverObjetivos(r.entrada), v = resumenGuardable(r, o);
    n++; if (v.puntos.some(p => p.ok === false)) conAvisos++;
    assert.deepEqual(limpiarResumen(v), v, 'el resumen ya es lo que se guardaría');
    assert.ok(v.puntos.length >= 1 && v.puntos.length <= 8 && v.titulo && v.veredicto);
    assert.doesNotMatch(JSON.stringify(v), /NaN|undefined|Infinity|\[object|null\$/);
    assert.deepEqual(JSON.parse(JSON.stringify(v)), v, 'JSON puro');
    assert.deepEqual(resumenGuardable(r, o), v, 'determinista');
    assert.ok(v.puntos.filter(p => p.ok === false).length <= 4, 'a lo sumo ganancia negativa, ganancia total y 2 avisos');
  }
  assert.ok(n > 300 && conAvisos > 20, `muestra significativa (${n}/${conAvisos})`);
});
void sinOrden;
