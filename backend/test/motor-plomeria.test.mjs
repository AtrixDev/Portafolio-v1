// Plomería del motor (S5): una sola fuente, servida a Node y al navegador. Correr: node --test backend/test/motor-plomeria.test.mjs
// Deterministas y sin navegador. La comparación Node ↔ Chromium/Firefox vive en tools/paridad-navegador.py (necesita navegadores).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { correrCorpus } from '../../tools/motor-corpus.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MOTOR = join(RAIZ, 'backend/lib/motor');
const MODULOS = ['validar', 'economia', 'inversas', 'escenarios', 'supuestos', 'version', 'vista'];
const leer = ruta => readFileSync(join(RAIZ, ruta), 'utf8');
const sinComentarios = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

// ═══ el corpus: la prueba que corre igual en Node y en el navegador ═══
test('el corpus es determinista y cubre todo el motor', async () => {
  const base = pathToFileURL(MOTOR + '/').href;
  const a = await correrCorpus(base), b = await correrCorpus(base);
  assert.equal(a, b, 'dos corridas dan el mismo texto, byte a byte');
  const r = JSON.parse(a);
  assert.equal(r.totalCasos, 224); assert.equal(r.casos.length, 224);
  assert.deepEqual(Object.keys(r.exportaciones), MODULOS);
  for (const n of MODULOS) assert.ok(r.exportaciones[n].length >= 1, n);
  for (const c of r.casos) assert.deepEqual(Object.keys(c.h), ['validar', 'evaluar', 'piso', 'acos', 'costoMaximo', 'unidades', 'objetivos', 'escenarios', 'barrido', 'vista'], c.nombre);
  assert.equal(r.muestra.evaluar.ganancia, 3635); assert.equal(r.muestra.piso.precio, 10594);
  assert.match(r.version, /^\d+\.\d+\.\d+$/);
  assert.equal(r.casos.filter(c => c.nombre.startsWith('basura')).length, 7);
});
test('el corpus no depende de nada de Node: es una función autocontenida (se puede ejecutar en un navegador)', () => {
  const src = sinComentarios(correrCorpus.toString());
  for (const prohibido of [/\bprocess\b/, /\brequire\b/, /\bBuffer\b/, /node:/, /__dirname|__filename|import\.meta/, /\bfs\b/, /\bfetch\b/, /Math\.random/, /\bDate\b/])
    assert.doesNotMatch(src, prohibido, `el corpus usa ${prohibido}`);
  assert.match(correrCorpus.toString(), /^async function correrCorpus\(/);
  assert.equal(new Function(`return (${correrCorpus.toString()})`)().length, 1, 'se reconstruye desde su texto sin contexto externo');
});
test('el corpus detecta una diferencia: un motor alterado da otras huellas', async () => {
  const base = pathToFileURL(MOTOR + '/').href, ref = JSON.parse(await correrCorpus(base));
  const detalle = JSON.parse(await correrCorpus(base, { detalle: 0 }));
  assert.equal(detalle.nombre, 'A monotributo'); assert.equal(detalle.resultado.evaluar.ganancia, 3635);
  assert.notEqual(ref.casos[0].h.evaluar, ref.casos[1].h.evaluar, 'casos distintos → huellas distintas');
  assert.notEqual(ref.casos[0].h.piso, ref.casos[2].h.piso);
});

// ═══ el servidor local sirve exactamente el motor, y solo el motor ═══
const puertoLibre = () => new Promise(ok => { const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
test('dev-server sirve /js/motor/* idéntico a la fuente (bytes), como JavaScript, y nada más', async t => {
  const puerto = await puertoLibre();
  const srv = spawn('node', ['tools/dev-server.mjs'], { cwd: RAIZ, env: { ...process.env, PORT: String(puerto) }, stdio: ['ignore', 'pipe', 'ignore'] });
  t.after(() => srv.kill());
  await new Promise((ok, mal) => { const t0 = setTimeout(() => mal(new Error('dev-server no arrancó')), 15000); srv.stdout.on('data', d => { if (String(d).includes('Portfolio')) { clearTimeout(t0); ok(); } }); });
  const pedir = ruta => fetch(`http://127.0.0.1:${puerto}${ruta}`);
  for (const m of MODULOS) {
    const r = await pedir(`/js/motor/${m}.js`);
    assert.equal(r.status, 200, m); assert.match(r.headers.get('content-type'), /javascript/, m);
    assert.deepEqual(Buffer.from(await r.arrayBuffer()), readFileSync(join(MOTOR, `${m}.js`)), `${m}.js: los bytes servidos son los de la fuente`);
  }
  for (const ruta of ['/js/motor/inexistente.js', '/js/motor/LEEME.md', '/js/motor/', '/js/motor/validar.mjs', '/js/motor/Validar.js', '/js/motor/%2e%2e/dev-server.mjs', '/js/motor/..%2fdev-server.mjs', '/js/motor/..%2f..%2f..%2fbackend%2f.env', '/js/motor/validar.js%00.png']) {
    const r = await pedir(ruta); assert.equal(r.status, 404, `${ruta} debería dar 404 y dio ${r.status}`);
    assert.doesNotMatch(await r.text(), /MONGODB|ADMIN_TOKEN|import \{/, ruta);
  }
});

// ═══ build: la copia es del build, no del repo ═══
test('build-deploy.py copia el motor al sitio público sin documentación, y el repo no guarda ninguna copia', () => {
  const py = leer('tools/build-deploy.py');
  assert.match(py, /copytree\(ROOT \/ "backend" \/ "lib" \/ "motor", OUT \/ "public" \/ "js" \/ "motor", ignore=shutil\.ignore_patterns\("\*\.md"\)\)/);
  assert.ok(py.indexOf('"public" / "js" / "motor"') > py.indexOf('copytree(ROOT / "frontend"'), 'se copia DESPUÉS del frontend');
  assert.ok(py.includes('copytree(ROOT / "backend" / "lib", OUT / "lib")'), 'el servidor sigue recibiendo lib/ completo (incluye motor/)');
  assert.equal(existsSync(join(RAIZ, 'frontend/js/motor')), false, 'no debe haber una copia versionada del motor en frontend/');
  assert.equal(existsSync(join(RAIZ, 'frontend/js/economia.js')), false);
  const dev = leer('tools/dev-server.mjs');
  assert.match(dev, /const MOTOR = join\(ROOT, 'backend', 'lib', 'motor'\)/); assert.match(dev, /\^\[a-z\]\+\\\.js\$/);
});

// ═══ duplicación ═══
test('ningún archivo del frontend define el motor: solo hay (a lo sumo) importaciones', () => {
  const archivos = ['frontend', 'frontend/js'].flatMap(d => readdirSync(join(RAIZ, d)).filter(f => /\.(js|html)$/.test(f)).map(f => `${d}/${f}`));
  for (const f of archivos)
    assert.doesNotMatch(leer(f), /function (factorIva|evaluar|precioParaObjetivo|precioPiso|acosEquilibrio|costoMaximoProveedor|unidadesEquilibrio|compararEscenarios|resolverObjetivos|aplicarCambios|barrer)\b/, `${f} define una función del motor`);
});
test('DUPLICACIÓN CONOCIDA (a migrar con paridad): solo estos tres archivos calculan economía por unidad fuera del motor', () => {
  const MARCAS = /\b(ganU|pMin|pObj|kML|kP|acosEquilibrio|precioEquilibrio|margenEn)\b\s*[:=][^=]|\br\.(max|ganHoy|ganObj|deMas|paraGanar)\s*=/;
  const candidatos = [...readdirSync(join(RAIZ, 'frontend/js')).filter(f => f.endsWith('.js')).map(f => `frontend/js/${f}`),
    ...readdirSync(join(RAIZ, 'frontend')).filter(f => f.endsWith('.html')).map(f => `frontend/${f}`),
    ...readdirSync(join(RAIZ, 'backend/lib')).filter(f => f.endsWith('.js')).map(f => `backend/lib/${f}`),
    ...readdirSync(join(RAIZ, 'backend/api')).filter(f => f.endsWith('.js')).map(f => `backend/api/${f}`)];
  const duplicados = candidatos.filter(f => MARCAS.test(sinComentarios(leer(f)))).sort();
  assert.deepEqual(duplicados, ['backend/lib/tracker.js', 'frontend/js/importar.js', 'frontend/js/perdida.js'],
    'apareció (o desapareció) un archivo que calcula economía fuera del motor: si desapareció, sacarlo de esta lista; si apareció, usar el motor');
  // tracker-app.js solo MUESTRA lo que calcula el servidor (más un promedio ponderado): no es una fórmula de la economía por unidad
  assert.doesNotMatch(sinComentarios(leer('frontend/js/tracker-app.js')), MARCAS);
});

// ═══ el motor es portable ═══
test('los módulos del motor son JavaScript de navegador: solo import relativo a ./x.js, sin APIs de Node, y con sintaxis soportada', () => {
  for (const f of readdirSync(MOTOR).filter(x => x.endsWith('.js'))) {
    const src = sinComentarios(readFileSync(join(MOTOR, f), 'utf8'));
    for (const imp of [...src.matchAll(/from\s+'([^']+)'/g)].map(m => m[1])) assert.match(imp, /^\.\/[a-z]+\.js$/, `${f}: ${imp}`);
    assert.doesNotMatch(src, /\b(process|require|Buffer|__dirname|__filename)\b|node:/, f);
    assert.doesNotMatch(src, /\bawait\b/, `${f}: sin await de nivel superior`);
    assert.ok(statSync(join(MOTOR, f)).size < 30000, `${f}: liviano para el navegador`);
  }
  assert.match(readFileSync(join(MOTOR, 'escenarios.js'), 'utf8'), /structuredClone/, 'documentado: structuredClone (Chrome 98+, Firefox 94+, Safari 15.4+)');
});
