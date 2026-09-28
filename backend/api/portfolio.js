// api/portfolio.js
// GET    /api/portfolio                         → publicaciones destacadas (pública)
// GET    /api/portfolio?all=1                   → todas, con datos internos (admin)
// GET    /api/portfolio?scrape=1&url=…&desde=…&hasta=… → extrae datos de un link de ML (admin)
// POST   /api/portfolio                         → agregar publicación (admin)
// PATCH  /api/portfolio?id=…                    → editar (destacar, logro, título…) (admin)
// DELETE /api/portfolio?id=… | ?ids=a,b | ?marca=…[&employer=…] → eliminar (admin)
// POST   /api/portfolio?fuente=1                → guarda extracciones de tools/extraer-ml.py (admin)
import { getDB } from './db.js';
import { verifyToken } from './login.js';
import { ObjectId } from 'mongodb';
import { extraerPublicacion, guardarFuentes, CLASES } from '../lib/portfolio-ml.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SECRET = process.env.ADMIN_TOKEN || null   // sin ADMIN_TOKEN no se aceptan sesiones;

function auth(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  return verifyToken(token, SECRET);
}

// Lo que la web pública necesita (sin notas internas ni evidencia de atribución)
const PUBLICO = { url: 1, title: 1, image: 1, brand: 1, employer: 1, category: 1, metrics: 1, order: 1, clase: 1, vendidos: 1, opiniones: 1, rating: 1 };

const str = (v, max = 300) => String(v ?? '').trim().slice(0, max);
const num = v => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v));
const mes = v => (/^\d{4}-\d{2}$/.test(String(v || '')) ? String(v) : null);

// Campos editables desde el admin
function limpiar(body) {
  const it = {};
  for (const k of ['url', 'image', 'brand', 'employer', 'category', 'notes']) if (k in body) it[k] = str(body[k], k === 'url' || k === 'image' ? 600 : 300);
  if ('title' in body) it.title = str(body.title, 200);
  if ('metrics' in body) it.metrics = str(body.metrics, 120);
  if ('order' in body) it.order = num(body.order) ?? 99;
  if ('destacada' in body) it.destacada = !!body.destacada;
  for (const k of ['vendidos', 'opiniones', 'rating', 'fotosPeriodo']) if (k in body) it[k] = num(body[k]);
  if ('clase' in body) it.clase = CLASES[body.clase] ? body.clase : 'ninguna';
  if ('catalogoCreado' in body) it.catalogoCreado = str(body.catalogoCreado, 10);
  if ('meses' in body && Array.isArray(body.meses)) it.meses = body.meses.slice(0, 30).map(m => str(m, 7));
  if ('galeria' in body && Array.isArray(body.galeria)) it.galeria = body.galeria.slice(0, 20).map(u => str(u, 300)).filter(u => /^https:\/\/http2\.mlstatic\.com\//.test(u));
  return it;
}

function oid(id) { try { return new ObjectId(String(id)); } catch { return null; } }

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db  = await getDB();
  const col = db.collection('portfolio');
  const q = req.query || {};

  // ─── GET pública: sólo las destacadas ─────────────────────────────────────
  if (req.method === 'GET' && !q.scrape && !q.all) {
    const items = await col.find({ destacada: { $ne: false } }, { projection: PUBLICO })
      .sort({ order: 1, vendidos: -1, createdAt: -1 }).limit(60).toArray();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.json({ items });
  }

  // ─── A partir de acá se necesita auth ─────────────────────────────────────
  if (!auth(req)) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET' && q.all) {
    const items = await col.find({}).sort({ destacada: -1, order: 1, vendidos: -1, createdAt: -1 }).toArray();
    return res.json({ items });
  }

  // GET ?scrape=1&url=... → datos del link para completar el formulario
  if (req.method === 'GET' && q.scrape) {
    if (!/mercadolibre\.com\.ar/.test(String(q.url || ''))) return res.status(400).json({ error: 'Pegá un link de mercadolibre.com.ar' });
    const d = await extraerPublicacion(db, q.url, { desde: mes(q.desde) || '2025-06', hasta: mes(q.hasta) || '2025-12' });
    const dup = await col.findOne({ url: d.url }, { projection: { _id: 1 } });
    return res.json({ ...d, yaCargada: !!dup });
  }

  // POST ?fuente=1 → guarda extracciones hechas con navegador real (tools/extraer-ml.py)
  if (req.method === 'POST' && q.fuente) {
    const registros = Array.isArray(req.body?.registros) ? req.body.registros.slice(0, 1000) : [];
    return res.json({ success: true, guardadas: await guardarFuentes(db, registros) });
  }

  // POST → agregar ítem
  if (req.method === 'POST') {
    const body = req.body || {};
    let auto = {};
    if (body.url && !body.skipScrape) {
      const d = await extraerPublicacion(db, body.url, { desde: mes(body.desde) || '2025-06', hasta: mes(body.hasta) || '2025-12' });
      auto = { url: d.url, title: d.titulo, image: d.imagen, brand: d.marca, metrics: d.logro, clase: d.clase, vendidos: d.vendidos,
        opiniones: d.opiniones, rating: d.rating, fotosPeriodo: d.fotosPeriodo, catalogoCreado: d.catalogoCreado, meses: d.meses, galeria: d.galeria };
    }
    const datos = limpiar({ ...auto, ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== '' && v != null)) });
    if (!datos.url && !datos.title) return res.status(400).json({ error: 'Falta el link o el título' });
    if (datos.url && await col.findOne({ url: datos.url }, { projection: { _id: 1 } })) {
      return res.status(409).json({ error: 'Esa publicación ya está cargada' });
    }
    const item = { order: 99, destacada: true, ...datos, createdAt: new Date() };
    const result = await col.insertOne(item);
    return res.status(201).json({ success: true, id: result.insertedId.toString(), item });
  }

  // PATCH ?action=orden  { ids: [...] } → guarda el orden de las destacadas (1, 2, 3…) en una sola escritura
  if (req.method === 'PATCH' && q.action === 'orden') {
    const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).slice(0, 200).map(oid).filter(Boolean);
    if (!ids.length) return res.status(400).json({ error: 'Falta el orden' });
    await col.bulkWrite(ids.map((_id, i) => ({ updateOne: { filter: { _id }, update: { $set: { order: i + 1 } } } })), { ordered: false });
    return res.json({ success: true, ordenadas: ids.length });
  }

  // PATCH ?id=... → editar
  if (req.method === 'PATCH') {
    const _id = oid(q.id);
    if (!_id) return res.status(400).json({ error: 'ID inválido' });
    const cambios = limpiar(req.body || {});
    if (!Object.keys(cambios).length) return res.status(400).json({ error: 'No hay cambios' });
    const r = await col.updateOne({ _id }, { $set: { ...cambios, updatedAt: new Date() } });
    if (!r.matchedCount) return res.status(404).json({ error: 'No existe' });
    return res.json({ success: true });
  }

  // DELETE ?id= | ?ids=a,b | ?marca=X[&employer=Y]
  if (req.method === 'DELETE') {
    let filtro = null;
    if (q.id) { const _id = oid(q.id); if (_id) filtro = { _id }; }
    else if (q.ids) {
      const ids = String(q.ids).split(',').map(oid).filter(Boolean);
      if (ids.length) filtro = { _id: { $in: ids } };
    } else if (q.marca) {
      filtro = { brand: String(q.marca) };
      if (q.employer) filtro.employer = String(q.employer);
    }
    if (!filtro) return res.status(400).json({ error: 'Falta qué eliminar' });
    const r = await col.deleteMany(filtro);
    return res.json({ success: true, eliminadas: r.deletedCount });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
