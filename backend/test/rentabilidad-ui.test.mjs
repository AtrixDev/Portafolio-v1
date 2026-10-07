// Pruebas de la UI de Rentabilidad (S7): el formulario arma la entrada sin inventar valores y la pantalla muestra
// lo que calculó el motor, sin recalcular nada.
// Correr: node --test backend/test/rentabilidad-ui.test.mjs   — puras, sin red, sin base, sin navegador.
//
// Los módulos de frontend/js son ES modules, pero frontend/ no declara "type":"module": se copian a una carpeta temporal que sí lo declara.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, copyFileSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluar } from '../lib/motor/economia.js';
import { resolverObjetivos } from '../lib/motor/inversas.js';
import { compararEscenarios, escenariosTipicos } from '../lib/motor/escenarios.js';
import * as V from '../lib/motor/vista.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');
const leer = ruta => readFileSync(join(RAIZ, ruta), 'utf8');
const sinComentarios = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const UI = ['num-ar.js', 'rentabilidad-form.js', 'rentabilidad-render.js'];

const dir = mkdtempSync(join(tmpdir(), 'rt-ui-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
for (const a of UI) copyFileSync(join(RAIZ, 'frontend/js', a), join(dir, a));
const N = await import(pathToFileURL(join(dir, 'num-ar.js')).href);
const F = await import(pathToFileURL(join(dir, 'rentabilidad-form.js')).href);
const R = await import(pathToFileURL(join(dir, 'rentabilidad-render.js')).href);

const preparar = e => { const r = evaluar(e); return { r, o: resolverObjetivos(r.entrada) }; };
const texto = html => html.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const valores = v => ({ ...F.valoresVacios(), ...v });

// Cifras que aparecen en pantalla: montos («$ 1.234,5», «−$ 2.140») y porcentajes («24,2%»).
const MONTOS = /−?\$ [\d.]+(?:,\d+)?/g, PORCENTAJES = /[−+]?\d[\d.]*(?:,\d+)?%/g;
/** Todos los textos formateados que puede producir cualquier número del objeto (recorrido completo), más los textos de vista.js. */
function permitidos(...objetos) {
  const set = new Set();
  const visitar = x => {
    if (typeof x === 'number') { set.add(V.moneda(x)); set.add(V.porcentaje(x)); set.add(V.porcentaje(Math.abs(x))); set.add(V.moneda(Math.abs(x))); }
    else if (typeof x === 'string') { for (const t of x.match(MONTOS) ?? []) set.add(t); for (const t of x.match(PORCENTAJES) ?? []) set.add(t); }
    else if (x && typeof x === 'object') Object.values(x).forEach(visitar);
  };
  objetos.forEach(visitar);
  return set;
}
const cifrasDe = html => { const t = texto(html); return [...(t.match(MONTOS) ?? []), ...(t.match(PORCENTAJES) ?? []).map(p => p.replace(/^[+]/, ''))]; };

// Caso A (monotributo) con objetivo de margen: lo mismo que carga el botón «ejemplo».
const A = { precio: 15000, fiscal: { regimen: 'monotributo' }, costo: { producto: 6000, ivaIncluido: true }, canal: { ventaPct: 0.14, fijo: 2740, ivaModo: 'incluido' }, impuestosVentaPct: 0.035, objetivo: { margenPct: 0.2 } };
const RICO = {
  precio: 15000, unidades: 3, fiscal: { regimen: 'ri', ivaProducto: 0.21 },
  costo: { producto: 6000, ivaIncluido: false, extras: [{ nombre: 'Caja', monto: 300, ivaIncluido: true }, { monto: 120, ivaIncluido: false }] },
  canal: { ventaPct: 0.14, financiacionPct: 0.134, fijo: [{ hasta: 12000, monto: 1330 }, { hasta: null, monto: 2740 }], envio: 1800, ivaModo: 'adicional' },
  publicidad: { acos: 0.12, ventasPorAdsPct: 0.4, base: 'neto', ivaModo: 'incluido' },
  impuestosVentaPct: 0.035, devolucionesPct: 0.02, objetivo: { margenPct: 0.15, gananciaUnidad: 1000, gananciaMes: 200000 }, fijosMes: 150000,
};

// ═══ números es-AR ═══
test('num-ar: lee números como los escribe una persona en Argentina y rechaza lo que no es número', () => {
  const casos = [['15.000', 15000], ['1.450,5', 1450.5], ['$ 2.740', 2740], ['14%', 14], ['3,5', 3.5], ['0', 0], ['  7 ', 7], ['1.450', 1450], ['-5', -5]];
  for (const [t, n] of casos) assert.equal(N.parsearNumero(t), n, t);
  assert.equal(N.parsearNumero(''), null); assert.equal(N.parsearNumero('   '), null);
  for (const t of ['abc', '1,2,3', '12a', '1..2']) assert.ok(Number.isNaN(N.parsearNumero(t)), t);
  for (const n of [15000, 1450.5, 0.134, 2740, 0, 3.5]) assert.equal(N.parsearNumero(N.escribirNumero(n)), n, String(n));
});

// ═══ modelo del formulario ═══
test('el ejemplo arma exactamente el caso A (y queda rotulado como inventado en la pantalla)', () => {
  const { entrada, invalidos, faltan } = F.construirEntrada(F.EJEMPLO);
  assert.deepEqual(entrada, A); assert.deepEqual(invalidos, []); assert.deepEqual(faltan, []);
  assert.match(texto(R.htmlVacio()), /números inventados/);
  assert.match(leer('frontend/rentabilidad.html'), /ejemplo \(números inventados\)/);
});
test('formulario vacío: no manda ningún valor económico, solo el régimen visible; pide precio y costo', () => {
  const { entrada, faltan, invalidos } = F.construirEntrada(F.valoresVacios());
  assert.deepEqual(entrada, { fiscal: { regimen: 'monotributo' } });
  assert.deepEqual(faltan, ['precio', 'costo.producto']); assert.deepEqual(invalidos, []);
  assert.match(texto(R.htmlIncompleto(faltan)), /Precio de venta y Costo del producto/);
});
test('el 0 escrito a propósito se manda; el campo vacío no', () => {
  const { entrada } = F.construirEntrada(valores({ precio: '1000', costo: '0', impuestos: '0', ventaPct: '' }));
  assert.equal(entrada.costo.producto, 0); assert.equal(entrada.impuestosVentaPct, 0); assert.equal(entrada.canal, undefined);
});
test('ida y vuelta: entrada guardada → formulario → la misma entrada (con tramos, extras, publicidad y objetivos)', () => {
  for (const e of [A, RICO, { precio: 999.99, fiscal: { regimen: 'sin_iva' }, costo: { producto: 0.5 } }]) {
    const v = F.aValores(e);
    assert.deepEqual(F.construirEntrada(v).entrada, e);
  }
});
test('textos que no son números y tramos incompletos van a «invalidos» y no se mandan', () => {
  const v = valores({ precio: '15mil', costo: '6000', ventaPct: 'catorce',
    fijo: { modo: 'tramos', valor: '', tramos: [{ hasta: '12.000', monto: '' }, { hasta: '', monto: '2.740' }] } });
  const { entrada, invalidos } = F.construirEntrada(v);
  assert.equal(entrada.precio, undefined);
  assert.deepEqual(invalidos.map(i => i.campo).sort(), ['canal.fijo.0.monto', 'canal.ventaPct', 'precio']);
  assert.equal(invalidos.find(i => i.campo === 'canal.fijo.0.monto').texto, '');
  const html = R.htmlRevisar({ invalidos }, F.campoAControl, F.construirEntrada(v).mapa);
  assert.match(html, /role="alert"/); assert.match(html, /data-ir="precio"/); assert.match(html, /data-ir="fijoMonto-0"/);
  assert.match(texto(html), /«15mil» no es un número/);
});
test('cada error del motor apunta al control correcto, aunque haya filas vacías en el medio', () => {
  const v = valores({ precio: '1000', costo: '100', extras: [{ nombre: '', monto: '', iva: '' }, { nombre: 'Caja', monto: '50', iva: '' }] });
  const { entrada, mapa } = F.construirEntrada(v);
  const r = evaluar(entrada);
  const campos = r.ok ? [] : r.errores.map(e => e.campo);
  assert.equal(F.campoAControl('costo.extras.0.ivaIncluido', mapa), 'extraIva-1');
  assert.equal(F.campoAControl('costo.extras.0.monto', mapa), 'extraMonto-1');
  for (const c of ['precio', 'canal.ivaModo', 'costo.ivaIncluido', 'publicidad.ivaModo', 'objetivo.margenPct']) assert.ok(F.campoAControl(c, mapa), c);
  for (const c of campos) assert.ok(F.campoAControl(c, mapa), `error del motor sin control: ${c}`);
  // todo control al que apunta un error existe en la página
  const html = leer('frontend/rentabilidad.html') + leer('frontend/js/rentabilidad.js');
  for (const c of ['precio', 'costo', 'costoIva', 'regimen', 'ivaProducto', 'ventaPct', 'financiacionPct', 'fijo', 'envio', 'canalIva', 'acos', 'ventasPorAds', 'adsBase', 'adsIva', 'impuestos', 'devoluciones', 'objMargen', 'objGanancia', 'objMes', 'fijosMes', 'extras'])
    assert.match(html, new RegExp(`data-err="${c}"`), c);
});

// ═══ la pantalla muestra lo que calculó el motor ═══
test('A: veredicto, precios, costos, avisos y supuestos salen del resultado real del motor', () => {
  const { r, o } = preparar(A);
  const html = R.htmlResultado({ r, o }, V), t = texto(html);
  assert.match(t, /^Ganás \$ 3\.635 por unidad/);
  for (const f of V.filasVista(r, o, { completo: true })) { assert.ok(t.includes(f.etiqueta), f.etiqueta); assert.ok(t.includes(f.valor), f.valor); }
  for (const c of r.costos.filter(x => x.monto !== 0)) assert.ok(t.includes(`${c.nombre} ${V.moneda(c.monto)}`), c.nombre);
  assert.ok(r.costos.some(x => x.monto === 0) && !t.includes('Financiación'), 'los costos en cero no ocupan lugar');
  for (const a of V.avisosVista(r, o)) assert.ok(t.includes(a.titulo), a.titulo);
  assert.equal((html.match(/rt-tag">Supuesto</g) ?? []).length, r.supuestos.length);
  for (const s of r.supuestos) assert.ok(t.includes(s.texto), s.texto);
  // jerarquía: ganancia → precios → costos → avisos → supuestos → métricas secundarias
  const orden = ['rt-veredicto', 'rt-h-precios', 'rt-h-costos', 'rt-h-avisos', 'rt-h-sup', 'rt-h-decidir'].map(x => html.indexOf(x));
  assert.ok(orden.every((p, i) => p >= 0 && (i === 0 || p > orden[i - 1])), `orden ${orden}`);
});
test('pérdida: el veredicto lo decide el motor (aviso de ganancia negativa) y se dice «Perdés»', () => {
  const { r, o } = preparar({ ...A, precio: 8000 });
  const t = texto(R.htmlResultado({ r, o }, V));
  assert.match(t, /^Perdés plata: −\$ 2\.140 por unidad/);
  assert.match(t, /no alcanza para cubrir los costos/);
});
test('ninguna cifra en pantalla es inventada: cada monto y porcentaje es el formato de un número del resultado', () => {
  const casos = [A, RICO, { ...A, precio: 8000 }, { precio: 5000, fiscal: { regimen: 'monotributo' }, costo: { producto: 1000, ivaIncluido: false } }];
  for (const e of casos) {
    const { r, o } = preparar(e);
    assert.ok(r.ok, JSON.stringify(r.errores));
    const ok = permitidos(r, o, V.filasVista(r, o, { completo: true }), V.avisosVista(r, o));
    for (const c of cifrasDe(R.htmlResultado({ r, o }, V))) assert.ok(ok.has(c), `cifra que no viene del motor: «${c}»`);
    const cmp = compararEscenarios(e, escenariosTipicos());
    const okE = permitidos(cmp);
    for (const c of cifrasDe(R.htmlEscenarios(cmp, V))) assert.ok(okE.has(c), `cifra de escenario que no viene del motor: «${c}»`);
  }
});
test('invariancia: con un resultado fabricado e incoherente, la pantalla muestra esos números tal cual (no recalcula)', () => {
  const { r, o } = preparar(A);
  const f = structuredClone(r);
  f.ganancia = 777.77; f.ingresoNeto = 50000; f.costoTotal = 12; f.margenNeto = 0.9; f.markup = 3;
  f.costos = f.costos.map((c, i) => ({ ...c, monto: 1111 * (i + 1) }));
  const fo = structuredClone(o);
  const t = texto(R.htmlResultado({ r: f, o: fo }, V));
  assert.match(t, /^Ganás \$ 777,77 por unidad/);
  for (const c of f.costos) assert.ok(t.includes(V.moneda(c.monto)), c.nombre);
  assert.ok(t.includes('Costo total $ 12 '), 'el costo total es el del resultado, no la suma de las filas');
  assert.ok(t.includes('Ingreso neto $ 50.000'));
  assert.ok(!t.includes('$ 3.635'), 'apareció la ganancia «verdadera»: la UI está recalculando');
  // escenarios: los deltas se muestran como vienen
  const cmp = compararEscenarios(A, escenariosTipicos()), g = structuredClone(cmp);
  g.escenarios[0].deltas.ganancia = { abs: -4242, pct: -0.5 }; g.escenarios[0].metricas.ganancia = 31337;
  const te = texto(R.htmlEscenarios(g, V));
  assert.ok(te.includes('−$ 4.242 (−50%)')); assert.ok(te.includes('$ 31.337'));
});
test('escenarios: base, efecto decidido por el motor y escenario que no se puede calcular por falta de un dato', () => {
  const cmp = compararEscenarios(A, escenariosTipicos());
  const html = R.htmlEscenarios(cmp, V), t = texto(html);
  assert.match(t, /Hoy \$ 3\.635/);
  for (const e of cmp.escenarios.filter(x => x.ok)) assert.match(html, new RegExp(`data-efecto="${e.efectoGanancia}"`));
  const sinDato = cmp.escenarios.find(x => !x.ok);
  assert.ok(sinDato, 'el caso A no declara IVA de publicidad: el escenario de ACOS no se puede calcular');
  assert.match(t, /Para calcularlo falta un dato: IVA de la publicidad/);
  assert.equal(R.htmlEscenarios({ ok: false }, V).includes('No se pudieron'), true);
});
test('resultado compartido: aviso de versión distinta y botón para usar los datos', () => {
  assert.doesNotMatch(R.htmlCompartido({ version: '1', mismaVersion: true, fecha: '02/10/2026' }), /otra/);
  const t = texto(R.htmlCompartido({ version: '0.9', mismaVersion: false, fecha: '' }));
  assert.match(t, /versión 0\.9 del motor/); assert.match(t, /no se recalcularon/);
  assert.match(R.htmlCompartido({ version: '1', mismaVersion: true }), /data-accion="usar-datos"/);
});
test('los errores del motor se muestran con su texto, sin las pistas técnicas', () => {
  const r = evaluar({ precio: 1000, fiscal: { regimen: 'monotributo' }, costo: { producto: 100 } });
  assert.equal(r.ok, false);
  const t = texto(R.htmlRevisar({ errores: r.errores }, F.campoAControl, undefined));
  assert.doesNotMatch(t, /\((true|false|"\w+")\)/);
  assert.match(t, /Indicá si el costo del producto ya incluye IVA/);
});
test('todo texto que viene de afuera se escapa', () => {
  const { r, o } = preparar({ ...A, costo: { ...A.costo, extras: [{ nombre: '<img src=x onerror=alert(1)>', monto: 10, ivaIncluido: true }] } });
  const html = R.htmlResultado({ r, o }, V);
  assert.doesNotMatch(html, /<img/); assert.match(html, /&lt;img/);
  assert.doesNotMatch(R.htmlRevisar({ errores: [{ campo: 'precio', texto: '<b>x</b>' }] }, F.campoAControl, undefined), /<b>x/);
});

// ═══ detalles de la pantalla que una mutación podría romper sin que nadie lo note ═══
test('los nombres de costos adicionales se recortan y los textos se escapan también con comillas', () => {
  const { entrada } = F.construirEntrada(valores({ precio: '1000', costo: '100', costoIva: 'si', extras: [{ nombre: '  Caja  ', monto: '5', iva: 'si' }] }));
  assert.equal(entrada.costo.extras[0].nombre, 'Caja');
  assert.equal(R.esc(`a"b'c<d>&`), 'a&quot;b&#39;c&lt;d&gt;&amp;');
});
test('caso con 3 unidades y objetivos: ganancia total, nota repetida una sola vez, anclas de accesibilidad existentes y barra consistente', () => {
  const { r, o } = preparar({ ...A, unidades: 3, fijosMes: 150000, objetivo: { margenPct: 0.2, gananciaUnidad: 1000, gananciaMes: 200000 } }), html = R.htmlResultado({ r, o }, V), t = texto(html);
  assert.match(t, /^Ganás/);
  assert.match(t, /En 3 unidades: \$ 10\.905/, 'falta la ganancia total');
  assert.equal((t.match(/Hoy vendés a \$ 15\.000/g) ?? []).length, 1, 'la misma nota seguida se repite');
  for (const [, id] of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`), `aria-labelledby sin destino: ${id}`);
  const ganaA = preparar(A), pierde = preparar({ ...A, precio: 8000 });
  assert.match(R.htmlResultado(ganaA, V), /data-cat="ganancia"/); assert.doesNotMatch(R.htmlResultado(pierde, V), /data-cat="ganancia"/);
  for (const c of r.costos.filter(x => x.monto !== 0)) assert.ok(html.includes(`--v:${c.monto}`), c.nombre);
});

// ═══ reglas sobre el código de la UI ═══
const FUENTES = { 'frontend/js/rentabilidad.js': null, 'frontend/js/rentabilidad-render.js': null, 'frontend/js/rentabilidad-form.js': null, 'frontend/js/num-ar.js': null };
for (const f of Object.keys(FUENTES)) FUENTES[f] = sinComentarios(leer(f));
const CAMPOS = 'ganancia|gananciaTotal|ingresoNeto|costoTotal|margenNeto|markup|monto|cotizado|precio|equilibrio|abs|pct|acos|producto|ventaPct|financiacionPct|fijo|envio|factorIva|precioEquilibrio|valor';
test('la UI no hace cuentas con valores económicos (ni del motor ni del formulario)', () => {
  const opDespues = new RegExp(`\\.(${CAMPOS})\\b\\s*(?:[-+*/%]|<=?|>=?)(?!=)`), opAntes = new RegExp(`(?:[-+*/%]|[<>]=?)\\s*[\\w$.?]*\\.(${CAMPOS})\\b`);
  for (const [f, src] of Object.entries(FUENTES)) {
    const lineas = src.split('\n').filter(l => !/^\s*import\b/.test(l));
    for (const l of lineas) {
      const sinTextos = l.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/`(?:[^`$]|\$(?!\{))*`/g, '``').replace(/=>/g, '⇒');
      assert.doesNotMatch(sinTextos, opDespues, `${f}: ${l.trim()}`);
      assert.doesNotMatch(sinTextos, opAntes, `${f}: ${l.trim()}`);
    }
    assert.doesNotMatch(src, /\.reduce\s*\(/, `${f}: reduce suele ser una suma de montos`);
    if (f !== 'frontend/js/num-ar.js') assert.doesNotMatch(src, /\bMath\./, `${f}: Math en la UI`);
  }
});
test('capas: el formulario y el render no importan el motor; el orquestador lo usa solo desde js/motor/', () => {
  const imports = src => [...src.matchAll(/^\s*import\b[^'"]*['"]([^'"]+)['"]/gm)].map(m => m[1]);
  assert.deepEqual(imports(FUENTES['frontend/js/rentabilidad-form.js']), ['./num-ar.js']);
  assert.deepEqual(imports(FUENTES['frontend/js/rentabilidad-render.js']), ['./rentabilidad-form.js']);
  assert.deepEqual(imports(FUENTES['frontend/js/num-ar.js']), []);
  const orq = imports(FUENTES['frontend/js/rentabilidad.js']);
  for (const m of orq) assert.match(m, /^\.\/(motor\/(economia|inversas|escenarios|vista|version)\.js|num-ar\.js|rentabilidad-(form|render)\.js|salida\.js)$/, m);
  assert.equal(orq.length, 9, 'se perdieron imports al quitar comentarios: ¿un «/*» dentro de un comentario de línea?');
  assert.ok(orq.includes('./motor/economia.js') && orq.includes('./motor/vista.js'));
});
test('la UI no redefine ninguna función del motor', () => {
  const NOMBRES = 'evaluar|resolverObjetivos|precioPiso|precioParaObjetivo|acosEquilibrio|costoMaximoProveedor|unidadesEquilibrio|unidadesParaObjetivo|compararEscenarios|aplicarCambios|factorIva|valorEn|redondear|filasVista|avisosVista|moneda|porcentaje';
  const def = new RegExp(`(function\\s+(${NOMBRES})\\b|(const|let|var)\\s+(${NOMBRES})\\s*=)`);
  for (const [f, src] of Object.entries(FUENTES)) assert.doesNotMatch(src, def, f);
});
test('ninguna clase con «ad-» (AdBlock las oculta) y ningún nombre de marketplace en la página', () => {
  const todo = leer('frontend/rentabilidad.html') + leer('frontend/css/rentabilidad.css') + Object.values(FUENTES).join('\n');
  assert.doesNotMatch(todo, /class="[^"]*\bad-|\.ad-[\w-]|\bad-[a-z]+["\s{,]/);
  // Lo que se protege es el texto PROPIO de la calculadora (marketplace-agnóstica). El menú y el pie son el shell global
  // (tools/site-shell.py), común a todas las páginas, y sí nombran «Mercado Libre»: no son parte de la calculadora.
  const sinShell = leer('frontend/rentabilidad.html').replace(/<!-- NAV:start -->[\s\S]*?<!-- NAV:end -->/, '').replace(/<footer>[\s\S]*?<\/footer>/, '');
  assert.ok(!/<nav\b|<footer\b/.test(sinShell), 'el recorte del shell dejó restos: la prueba dejaría de ver el texto propio');
  assert.doesNotMatch(sinShell.replace(/<!--[\s\S]*?-->/g, ''), /mercado ?libre|meli\b/i);
});
test('la duplicación económica conocida sigue siendo solo importar.js, perdida.js y tracker.js (la UI nueva no suma otra)', () => {
  const MARCAS = /\b(ganU|pMin|pObj|kML|kP|acosEquilibrio|precioEquilibrio|margenEn)\b\s*[:=][^=]|\br\.(max|ganHoy|ganObj|deMas|paraGanar)\s*=/;
  const nuevos = readdirSync(join(RAIZ, 'frontend/js')).filter(f => /^(rentabilidad|num-ar)/.test(f));
  assert.ok(nuevos.length >= 4, nuevos.join());
  for (const f of nuevos) assert.doesNotMatch(sinComentarios(leer(`frontend/js/${f}`)), MARCAS, f);
});
