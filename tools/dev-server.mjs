// tools/dev-server.mjs — Servidor local que imita a Vercel: sirve frontend/ y ejecuta backend/api/*.js
//
// Uso:
//   MONGODB_URI=mongodb://127.0.0.1:27017 node tools/dev-server.mjs      (puerto 3000 por defecto)
//   PORT=4000 node tools/dev-server.mjs
//
// Lee también backend/.env si existe (sin pisar variables ya definidas).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT  = join(dirname(fileURLToPath(import.meta.url)), '..');
const FRONT = join(ROOT, 'frontend');
const API   = join(ROOT, 'backend', 'api');
// El motor económico tiene UNA sola fuente (backend/lib/motor). El navegador lo carga como /js/motor/*.js; en el deploy lo copia tools/build-deploy.py.
const MOTOR = join(ROOT, 'backend', 'lib', 'motor');
const PORT  = Number(process.env.PORT || 3000);

const envFile = join(ROOT, 'backend', '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
process.env.NODE_ENV ||= 'development';

const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.pdf':'application/pdf', '.ico':'image/x-icon' };

function vercelRes(res) {
  res.status = code => { res.statusCode = code; return res; };
  res.json = obj => { if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); return res; };
  res.send = body => { res.end(typeof body === 'string' ? body : JSON.stringify(body)); return res; };
  res.redirect = (a, b) => { const [code, url] = typeof a === 'number' ? [a, b] : [307, a]; res.statusCode = code; res.setHeader('Location', url); res.end(); return res; };
  return res;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return undefined;
  if ((req.headers['content-type'] || '').includes('application/json')) { try { return JSON.parse(raw); } catch { return raw; } }
  return raw;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, '');
      const file = join(API, `${name}.js`);
      if (!existsSync(file)) { res.statusCode = 404; return res.end('API no encontrada'); }
      req.query = Object.fromEntries(url.searchParams);
      req.body = await readBody(req);
      const mod = await import(pathToFileURL(file).href);
      return await mod.default(req, vercelRes(res));
    }
    if (url.pathname.startsWith('/js/motor/')) {
      const nombre = url.pathname.slice('/js/motor/'.length), file = join(MOTOR, nombre);
      if (!/^[a-z]+\.js$/.test(nombre) || !existsSync(file)) { res.statusCode = 404; return res.end('No encontrado'); }
      res.setHeader('Content-Type', TYPES['.js']);
      return res.end(await readFile(file));
    }
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (path.endsWith('/')) path += 'index.html';
    const file = join(FRONT, path);
    if (!file.startsWith(FRONT) || !(await stat(file).catch(() => null))?.isFile()) { res.statusCode = 404; return res.end('No encontrado'); }
    res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch (err) {
    console.error(`[${req.method} ${url.pathname}]`, err);
    if (!res.headersSent) { res.statusCode = 500; res.end('Error interno: ' + err.message); }
  }
}).listen(PORT, () => console.log(`Portfolio + API en http://localhost:${PORT}  (Mongo: ${process.env.MONGODB_URI ? 'configurado' : 'SIN MONGODB_URI'})`));
