// Calidad base del sitio: SEO técnico, landmarks, movimiento reducido y seguridad de la API.
// Correr: node --test backend/test/sitio-calidad.test.mjs   (sin red ni Mongo; solo lee archivos y usa objetos falsos)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FRONT = join(ROOT, 'frontend');
const leer = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const paginas = readdirSync(FRONT).filter(f => f.endsWith('.html')).sort();
const html = Object.fromEntries(paginas.map(f => [f, readFileSync(join(FRONT, f), 'utf8')]));
const noindex = f => /<meta name="robots" content="[^"]*noindex/i.test(html[f]) || f === '404.html';
const publicas = paginas.filter(f => !noindex(f));

// ═══ SEO técnico ═══
test('SEO: son 26 páginas y 21 indexables (admin, vinculado, 404 y los dos redirects no lo son)', () => {
  assert.equal(paginas.length, 26);
  assert.deepEqual(paginas.filter(noindex), ['404.html', 'admin.html', 'ia.html', 'tracker.html', 'vinculado.html']);
});

test('SEO: tools/seo-tecnico.py --check no encuentra nada desactualizado', t => {
  const r = spawnSync('python3', [join(ROOT, 'tools', 'seo-tecnico.py'), '--check'], { encoding: 'utf8' });
  if (r.error) return t.skip('sin python3');
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('SEO: cada página indexable tiene UN canonical absoluto, limpio (sin parámetros) y un og:url igual', () => {
  for (const f of publicas) {
    const c = [...html[f].matchAll(/<link rel="canonical" href="([^"]*)"/g)].map(m => m[1]);
    assert.equal(c.length, 1, f);
    assert.match(c[0], /^https:\/\/[^/?#]+\/[^?#]*$/, `${f}: ${c[0]}`);
    assert.equal(c[0], f === 'index.html' ? c[0].replace(/\/[^/]*$/, '/') : c[0].replace(/[^/]*$/, f));
    assert.ok(html[f].includes(`<meta property="og:url" content="${c[0]}">`), f);
  }
});

test('SEO: sitemap.xml lista exactamente las indexables y todas existen', () => {
  const xml = leer('frontend', 'sitemap.xml');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(locs.length, publicas.length);
  for (const l of locs) {
    assert.ok(!/[?#]/.test(l), l);
    const nombre = new URL(l).pathname.slice(1) || 'index.html';
    assert.ok(existsSync(join(FRONT, nombre)), nombre);
    assert.ok(!noindex(nombre), `${nombre} es noindex y está en el sitemap`);
  }
});

test('SEO: robots.txt apunta al sitemap, bloquea /api/ y NO bloquea URLs con parámetros (?r=, ?asunto=, ?pub=)', () => {
  const r = leer('frontend', 'robots.txt');
  assert.match(r, /^Sitemap: https:\/\/\S+\/sitemap\.xml$/m);
  assert.match(r, /^Disallow: \/api\/$/m);
  assert.ok(!/Disallow:.*[?*]/.test(r), 'no debe haber Disallow con ? o *');
  assert.ok(!/Disallow: \/$/m.test(r));
});

test('SEO: los parámetros públicos siguen leyéndose donde corresponde', () => {
  assert.match(leer('frontend', 'js', 'contacto.js'), /get\('asunto'\)[\s\S]*get\('pub'\)/);
  assert.match(leer('frontend', 'js', 'herr.js'), /get\('r'\)/);
  assert.match(leer('frontend', 'js', 'rentabilidad.js'), /get\('r'\)/);
});

// ═══ Accesibilidad base ═══
test('A11y: cada página con contenido tiene un único <main> visible (admin: login y panel, solo uno visible a la vez)', () => {
  for (const f of paginas.filter(f => !['ia.html', 'tracker.html'].includes(f))) {
    // admin: el panel arranca dentro de un contenedor `hidden`; su <main> no cuenta hasta iniciar sesión
    const visible = f === 'admin.html' ? html[f].split('<div id="panel"')[0] : html[f];
    const mains = [...visible.matchAll(/<main\b[^>]*>/g)].map(m => m[0]);
    const visibles = mains.filter(m => !/\bhidden\b/.test(m));
    assert.equal(visibles.length, 1, `${f}: ${mains.length} <main>`);
  }
});

test('A11y: el enlace «Saltar al contenido» existe y apunta a un id presente (salvo redirects y la vuelta de OAuth)', () => {
  for (const f of paginas.filter(f => !['ia.html', 'tracker.html', 'vinculado.html'].includes(f))) {
    const m = html[f].match(/<a href="#([^"]+)" class="skip-link"/);
    assert.ok(m, `${f}: falta skip link`);
    assert.ok(html[f].includes(`id="${m[1]}"`), `${f}: no existe #${m[1]}`);
  }
});

test('A11y: la <nav> de cada página está etiquetada (hay más de una por página)', () => {
  for (const f of paginas) for (const n of html[f].matchAll(/<nav\b[^>]*>/g)) assert.match(n[0], /aria-label/, `${f}: ${n[0]}`);
});

test('A11y: el movimiento se reduce globalmente (root.css) y ningún scroll suave de JS lo ignora', () => {
  assert.match(leer('frontend', 'css', 'root.css'), /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration[\s\S]*transition-duration/);
  for (const f of paginas.filter(f => !['ia.html', 'tracker.html'].includes(f))) assert.ok(html[f].includes('css/root.css'), f);
  for (const j of readdirSync(join(FRONT, 'js')).filter(j => j.endsWith('.js'))) {
    leer('frontend', 'js', j).split('\n').forEach((l, i) => {
      if (/behavior\s*:\s*'smooth'/.test(l) && !/reduce|Reduced|reducido/i.test(l)) assert.fail(`${j}:${i + 1} scroll suave sin respetar prefers-reduced-motion`);
    });
  }
});

// ═══ Seguridad de la API ═══
function restaurarEnv(v) { if (v === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = v; }
process.env.ADMIN_TOKEN = 'secreto-de-prueba';
// api/ml.js importa db.js, que abre una conexión al cargarse. En desarrollo db.js reutiliza global._mongoClientPromise:
// le dejamos una base falsa para que no se conecte a nada. Ninguno de estos tests usa la base (solo ramas que responden antes).
process.env.MONGODB_URI = 'mongodb://sin-conexion.invalid/';
const NODE_ENV_ANTES = process.env.NODE_ENV;
process.env.NODE_ENV = 'development';
globalThis._mongoClientPromise = Promise.resolve({ db: () => ({ collection: () => ({ findOne: async () => null }) }) });
const { allowedOrigin, cors } = await import('../lib/cors.js');
const { isAdmin, adminDesdeUrl } = await import('../lib/http.js');
const { makeToken, verifyToken } = await import('../api/login.js');
const ml = (await import('../api/ml.js')).default;
const academia = (await import('../api/academia.js')).default;
restaurarEnv(NODE_ENV_ANTES);
const S = 'secreto-de-prueba';

const fakeRes = () => { const h = {}; return { h, setHeader: (k, v) => { h[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, send(b) { this.body = b; return this; }, end() { return this; }, redirect(c, u) { this.code = c; this.loc = u; return this; } }; };
const req = (o = {}) => ({ method: 'GET', headers: {}, query: {}, ...o });

test('CORS: mismo origen y orígenes configurados sí; ajenos no; sin Origin no hay cabecera', () => {
  assert.equal(allowedOrigin(req({ headers: { origin: 'https://sitio.test', host: 'sitio.test' } })), 'https://sitio.test');
  assert.equal(allowedOrigin(req({ headers: { origin: 'https://mala.test', host: 'sitio.test' } })), null);
  assert.equal(allowedOrigin(req({ headers: { host: 'sitio.test' } })), null);
  process.env.CORS_ORIGINS = 'https://otro.test, https://mas.test';
  assert.equal(allowedOrigin(req({ headers: { origin: 'https://mas.test', host: 'sitio.test' } })), 'https://mas.test');
  delete process.env.CORS_ORIGINS;
  assert.equal(allowedOrigin(req({ headers: { origin: 'not a url', host: 'x' } })), null);
});

test('CORS: localhost solo fuera de producción', () => {
  const r = req({ headers: { origin: 'http://localhost:3000', host: 'sitio.test' } });
  const antes = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production'; assert.equal(allowedOrigin(r), null);
  process.env.NODE_ENV = 'development'; assert.equal(allowedOrigin(r), 'http://localhost:3000');
  restaurarEnv(antes);
});

test('CORS: una web ajena no recibe Allow-Origin (ni «*») en endpoints privados; publicRead mantiene «*» solo para GET', () => {
  const ajena = { origin: 'https://mala.test', host: 'sitio.test' };
  let res = fakeRes(); cors(res, 'GET, POST', req({ headers: ajena }));
  assert.equal(res.h['Access-Control-Allow-Origin'], undefined); assert.equal(res.h.Vary, 'Origin');
  res = fakeRes(); cors(res, 'GET, POST', req({ headers: ajena, method: 'POST' }), { publicRead: true });
  assert.equal(res.h['Access-Control-Allow-Origin'], undefined);
  res = fakeRes(); cors(res, 'GET, POST', req({ headers: ajena }), { publicRead: true });
  assert.equal(res.h['Access-Control-Allow-Origin'], '*');
  res = fakeRes(); cors(res, 'GET', req({ headers: { origin: 'https://sitio.test', host: 'sitio.test' } }));
  assert.equal(res.h['Access-Control-Allow-Origin'], 'https://sitio.test');
});

test('CORS: ningún endpoint vuelve a fijar «*» a mano', () => {
  for (const f of readdirSync(join(ROOT, 'backend', 'api')).filter(f => f.endsWith('.js'))) {
    assert.ok(!/Access-Control-Allow-Origin/.test(leer('backend', 'api', f)), f);
  }
  assert.ok(!/Allow-Origin', '\*'\)\;\n/.test(leer('backend', 'lib', 'http.js')));
  for (const f of readdirSync(join(ROOT, 'backend', 'api')).filter(f => f.endsWith('.js') && f !== 'db.js' && f !== 'ml-callback.js')) {
    assert.match(leer('backend', 'api', f), /cors\(res/, `${f} no aplica la política`);
  }
});

test('Token: la sesión normal sigue igual (30 días, sin alcance); un ticket con alcance NO sirve como sesión y viceversa', () => {
  const sesion = makeToken(S), ticket = makeToken(S, { scope: 'ml-login', ttlSec: 120 });
  const dec = t => JSON.parse(Buffer.from(t.split('.')[0], 'base64url'));
  assert.equal(dec(sesion).scope, undefined);
  assert.ok(Math.abs(dec(sesion).exp - dec(sesion).iat - 2592000) <= 1);
  assert.equal(dec(ticket).exp - dec(ticket).iat, 120);
  assert.ok(verifyToken(sesion, S));
  assert.ok(!verifyToken(ticket, S), 'ticket usado como sesión');
  assert.ok(verifyToken(ticket, S, 'ml-login'));
  assert.ok(!verifyToken(sesion, S, 'ml-login'), 'sesión usada como ticket');
  assert.ok(!verifyToken(ticket.slice(0, -2) + 'xx', S, 'ml-login'));
  assert.ok(!verifyToken(sesion, 'otro-secreto'));
});

test('Token: un ticket vencido no sirve', () => {
  const t = makeToken(S, { scope: 'ml-login', ttlSec: -5 });
  assert.ok(!verifyToken(t, S, 'ml-login'));
});

test('Admin: isAdmin solo acepta el header Authorization; ?t= ya no abre endpoints comunes', () => {
  const sesion = makeToken(S);
  assert.ok(isAdmin(req({ headers: { authorization: `Bearer ${sesion}` } })));
  assert.ok(!isAdmin(req({ query: { t: sesion } })));
  assert.ok(!isAdmin(req()));
});

test('Admin: el login de ML acepta header, ticket y (compat.) la sesión completa en ?t=; se apaga con ADMIN_QUERY_TOKEN=off', () => {
  const sesion = makeToken(S), ticket = makeToken(S, { scope: 'ml-login', ttlSec: 120 });
  assert.ok(adminDesdeUrl(req({ headers: { authorization: `Bearer ${sesion}` } })));
  assert.ok(adminDesdeUrl(req({ query: { t: ticket } })));
  assert.ok(adminDesdeUrl(req({ query: { t: sesion } })), 'compatibilidad con enlaces/pestañas anteriores');
  process.env.ADMIN_QUERY_TOKEN = 'off';
  assert.ok(!adminDesdeUrl(req({ query: { t: sesion } })));
  assert.ok(adminDesdeUrl(req({ query: { t: ticket } })), 'el ticket sigue valiendo');
  delete process.env.ADMIN_QUERY_TOKEN;
  assert.ok(!adminDesdeUrl(req({ query: { t: 'basura' } })));
});

test('Endpoint común (academia): el Bearer pasa; ?t= con la sesión o con un ticket NO pasan', async () => {
  const sesion = makeToken(S), ticket = makeToken(S, { scope: 'ml-login', ttlSec: 120 });
  const llamar = async o => { const res = fakeRes(); try { await academia(req(o), res); } catch { /* sigue más allá de la autorización: no importa cómo termine */ } return res.code; };
  assert.notEqual(await llamar({ headers: { authorization: `Bearer ${sesion}` } }), 401);
  assert.equal(await llamar({ query: { t: sesion } }), 401);
  assert.equal(await llamar({ headers: { authorization: `Bearer ${ticket}` } }), 401);
  assert.equal(await llamar({ query: { t: ticket } }), 401);
});

test('ML: action=ticket exige sesión admin por header y entrega un ticket de 2 minutos que solo sirve para el login', async () => {
  let res = fakeRes(); await ml(req({ method: 'POST', query: { action: 'ticket' } }), res);
  assert.equal(res.code, 401);
  res = fakeRes(); await ml(req({ method: 'POST', query: { action: 'ticket', t: makeToken(S) } }), res);
  assert.equal(res.code, 401, 'la sesión por query no alcanza para pedir tickets');
  res = fakeRes(); await ml(req({ method: 'POST', headers: { authorization: `Bearer ${makeToken(S)}` }, query: { action: 'ticket' } }), res);
  assert.equal(res.code, 200);
  assert.ok(verifyToken(res.body.ticket, S, 'ml-login') && !verifyToken(res.body.ticket, S));
});

test('ML: action=login sin credenciales válidas responde 401 (no redirige); con invitación inválida, mensaje propio', async () => {
  let res = fakeRes(); await ml(req({ query: { action: 'login' } }), res);
  assert.equal(res.code, 401);
  res = fakeRes(); await ml(req({ query: { action: 'login', t: 'basura' } }), res);
  assert.equal(res.code, 401);
  res = fakeRes(); await ml(req({ query: { action: 'login', inv: 'basura' } }), res);
  assert.equal(res.code, 401); assert.match(String(res.body), /venció/);
});

test('Cabeceras de seguridad: build-deploy.py las aplica a todo el sitio sin restringir scripts ni estilos', () => {
  const b = leer('tools', 'build-deploy.py');
  for (const h of ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Content-Security-Policy', 'Permissions-Policy']) assert.ok(b.includes(h), h);
  assert.match(b, /\{"source": "\/\(\.\*\)", "headers": SEGURIDAD\}/);
  const csp = b.match(/"Content-Security-Policy", "value": "([^"]+)"/)[1];
  assert.ok(!/script-src|style-src|default-src/.test(csp), 'una CSP de scripts/estilos necesita un inventario previo (docs/seguridad.md)');
  assert.match(csp, /frame-ancestors 'self'/);
  assert.match(b, /NO_STORE/); // el no-store del admin se conserva
  assert.match(b, /"crons"/);
});

test('Frontend admin: el botón de ML pide un ticket y no pone la sesión en la URL salvo que el ticket falle', () => {
  const a = leer('frontend', 'js', 'admin.js');
  assert.match(a, /action=ticket/);
  assert.ok(!/action=login&t=' \+ encodeURIComponent\(TOKEN\)/.test(a));
});
