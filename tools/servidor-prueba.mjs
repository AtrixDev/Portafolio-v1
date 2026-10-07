// tools/servidor-prueba.mjs — servidor de PRUEBA para los tests de navegador (tools/browser-rentabilidad.py).
// Sirve frontend/ y el motor (/js/motor/*) igual que dev-server, pero /api/herramientas ejecuta la lógica REAL
// (lib/herramientas.js › manejar) con una base EN MEMORIA: sin Mongo, sin red, sin tocar datos reales.
// Rutas solo de prueba (nunca existen en producción):
//   POST /__test/sembrar-chequeo  → crea un resultado de «chequeo» y devuelve su id
//   POST /__test/reset-limites    → vacía los contadores de rate limit
//   GET  /__test/base             → { resultados: n } (para comprobar que nada se guardó de más)
// Uso: PORT=4010 node tools/servidor-prueba.mjs
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { manejar } from '../backend/lib/herramientas.js';
import { guardarResultado } from '../backend/lib/resultados.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), FRONT = join(RAIZ, 'frontend'), MOTOR = join(RAIZ, 'backend', 'lib', 'motor');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.ico': 'image/x-icon' };

const coincide = (d, q) => Object.entries(q).every(([k, v]) => (v && typeof v === 'object' && '$gt' in v) ? d[k] > v.$gt : d[k] === v);
class Col {
  constructor() { this.docs = []; }
  async createIndex() {}
  async insertOne(d) { const doc = { ...structuredClone(d) }; if (doc._id === undefined) doc._id = this.docs.length + 1; this.docs.push(doc); return { insertedId: doc._id }; }
  async findOne(q) { const d = this.docs.find(x => coincide(x, q)); return d ? structuredClone(d) : null; }
  aplicar(d, u) { for (const [k, v] of Object.entries(u.$set || {})) d[k] = v; for (const [k, v] of Object.entries(u.$inc || {})) d[k] = (d[k] || 0) + v; }
  async findOneAndUpdate(q, u, o) { const d = this.docs.find(x => coincide(x, q)); if (!d) return null; const antes = structuredClone(d); this.aplicar(d, u); return o?.returnDocument === 'after' ? structuredClone(d) : antes; }
  async updateOne(q, u, o) {
    let d = this.docs.find(x => coincide(x, q));
    if (!d) { if (!o?.upsert) return { matchedCount: 0 }; d = { _id: q._id, ...(u.$setOnInsert || {}) }; this.docs.push(d); }
    this.aplicar(d, u); return { matchedCount: 1 };
  }
}
const colecciones = {};
const db = { collection: n => (colecciones[n] ||= new Col()) };

function vercelRes(res) {
  res.status = code => { res.statusCode = code; return res; };
  res.json = obj => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); return res; };
  return res;
}
async function cuerpo(req) {
  const chunks = []; for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString(); if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return raw; }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/api/herramientas') {
      req.query = Object.fromEntries(url.searchParams); req.body = await cuerpo(req);
      return await manejar(req, vercelRes(res), db);
    }
    if (url.pathname === '/__test/sembrar-chequeo') {
      const r = await guardarResultado(db, { herramienta: 'chequeo', entrada: 'https://ejemplo.test/p', resumen: { titulo: 'Chequeo de prueba', veredicto: 'Resultado sembrado por el test', puntos: [{ ok: true, t: 'Título', s: 'Correcto' }] } });
      return vercelRes(res).json(r);
    }
    if (url.pathname === '/__test/reset-limites') { colecciones.ratelimits = new Col(); return vercelRes(res).json({ ok: true }); }
    if (url.pathname === '/__test/base') return vercelRes(res).json({ resultados: colecciones.resultados?.docs.length ?? 0 });
    if (url.pathname.startsWith('/api/')) { res.statusCode = 404; return res.end('API no encontrada'); }
    if (url.pathname.startsWith('/js/motor/')) {
      const nombre = url.pathname.slice('/js/motor/'.length), file = join(MOTOR, nombre);
      if (!/^[a-z]+\.js$/.test(nombre) || !(await stat(file).catch(() => null))) { res.statusCode = 404; return res.end('No encontrado'); }
      res.setHeader('Content-Type', TYPES['.js']); return res.end(await readFile(file));
    }
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (path.endsWith('/')) path += 'index.html';
    const file = join(FRONT, path);
    if (!file.startsWith(FRONT) || !(await stat(file).catch(() => null))?.isFile()) { res.statusCode = 404; return res.end('No encontrado'); }
    res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream'); res.end(await readFile(file));
  } catch (err) {
    console.error(`[${req.method} ${url.pathname}]`, err);
    if (!res.headersSent) { res.statusCode = 500; res.end('Error interno: ' + err.message); }
  }
}).listen(Number(process.env.PORT || 4010), '127.0.0.1');
