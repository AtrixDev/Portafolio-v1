// api/content.js
// GET  /api/content  → devuelve contenido del portfolio (público)
// POST /api/content  → guarda contenido (requiere token de admin)
import { getDB } from './db.js';
import { verifyToken } from './login.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: público ──
  if (req.method === 'GET') {
    try {
      const db  = await getDB();
      const doc = await db.collection('content').findOne({ _id: 'portfolio' });
      if (doc) {
        const { _id, ...content } = doc;
        return res.status(200).json(content);
      }
      return res.status(200).json({});   // sin contenido guardado: el HTML ya trae los textos
    } catch (err) {
      console.error('MongoDB GET error:', err.message);
      return res.status(200).json({});
    }
  }

  // ── POST: protegido ──
  if (req.method === 'POST') {
    const authHeader = req.headers['authorization'] || '';
    const token  = authHeader.replace('Bearer ', '');
    const secret = process.env.ADMIN_TOKEN || null   // sin ADMIN_TOKEN no se aceptan sesiones;

    if (!verifyToken(token, secret)) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    try {
      const db = await getDB();
      const { _id, ...body } = req.body;
      await db.collection('content').updateOne(
        { _id: 'portfolio' },
        { $set: { ...body } },
        { upsert: true }
      );
      return res.status(200).json({ ok: true, saved: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ error: 'Error al guardar', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
