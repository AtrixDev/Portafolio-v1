// api/portfolio.js
// GET  /api/portfolio          → lista pública de ítems del portfolio
// GET  /api/portfolio?scrape=1&url=... → scrape ML URL (requiere auth)
// POST /api/portfolio          → agregar ítem (requiere auth)
// DELETE /api/portfolio?id=... → eliminar ítem (requiere auth)
import { getDB } from './db.js';
import { verifyToken } from './login.js';
import { ObjectId } from 'mongodb';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SECRET = process.env.ADMIN_TOKEN || null   // sin ADMIN_TOKEN no se aceptan sesiones;

function auth(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  return verifyToken(token, SECRET);
}

async function scrapeML(url) {
  const result = { title: '', image: '', description: '', price: '' };
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await resp.text();

    const mTitle = html.match(/<title>([^<]+)<\/title>/);
    if (mTitle) result.title = mTitle[1].replace(/\s*-\s*Mercado Libre.*$/i, '').trim();

    const mImg = html.match(/property="og:image"\s*content="([^"]+)"/);
    if (mImg) result.image = mImg[1];

    const mDesc = html.match(/property="og:description"\s*content="([^"]+)"/);
    if (mDesc) result.description = mDesc[1].slice(0, 300);
  } catch {
    // Scraping falló — el usuario completa manualmente
  }
  return result;
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db  = await getDB();
  const col = db.collection('portfolio');

  // ─── GET pública: lista de ítems ───────────────────────────────────────────
  if (req.method === 'GET' && !req.query.scrape) {
    const items = await col
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    return res.json({ items });
  }

  // ─── A partir de acá se necesita auth ─────────────────────────────────────
  if (!auth(req)) return res.status(401).json({ error: 'No autorizado' });

  // GET ?scrape=1&url=... → preview de datos de ML
  if (req.method === 'GET' && req.query.scrape) {
    const scraped = await scrapeML(req.query.url || '');
    return res.json(scraped);
  }

  // POST → agregar ítem
  if (req.method === 'POST') {
    const body = req.body || {};
    let auto = {};
    if (body.url && !body.skipScrape) auto = await scrapeML(body.url);

    const item = {
      url:         body.url         || '',
      title:       body.title       || auto.title       || '',
      image:       body.image       || auto.image       || '',
      description: body.description || auto.description || '',
      brand:       body.brand       || '',
      employer:    body.employer    || '',
      category:    body.category    || '',
      metrics:     body.metrics     || '',
      notes:       body.notes       || '',
      order:       Number(body.order) || 99,
      createdAt:   new Date(),
    };

    const result = await col.insertOne(item);
    return res.status(201).json({ success: true, id: result.insertedId.toString(), item });
  }

  // DELETE ?id=... → eliminar ítem
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Falta id' });
    try {
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.json({ success: true });
    } catch {
      return res.status(400).json({ error: 'ID inválido' });
    }
  }

  res.status(405).json({ error: 'Método no permitido' });
}
