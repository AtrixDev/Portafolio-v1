// api/contact.js
// POST   /api/contact            → guarda un mensaje del formulario (público)
// GET    /api/contact            → lista de mensajes (admin)
// PATCH  /api/contact?id=…       → marcar leído / no leído (admin)
// DELETE /api/contact?id=…       → eliminar (admin)
import { ObjectId } from 'mongodb';
import { getDB } from './db.js';
import { cors, isAdmin, clientIp, rateLimit } from '../lib/http.js';

const MOTIVOS = ['oferta', 'freelance', 'consulta', 'otro'];
const clean = (v, max) => String(v ?? '').replace(/\s+\n/g, '\n').trim().slice(0, max);

// Aviso por mail opcional (Resend). Si no hay clave, el mensaje igual queda en el admin.
async function notificar(msg) {
  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO;
  if (!key || !to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Portfolio <onboarding@resend.dev>',
        to: [to],
        reply_to: msg.email,
        subject: `Nuevo contacto: ${msg.name}${msg.company ? ` (${msg.company})` : ''}`,
        text: `Motivo: ${msg.reason}\nNombre: ${msg.name}\nEmail: ${msg.email}\nEmpresa: ${msg.company || '-'}\n\n${msg.message}`,
      }),
      signal: AbortSignal.timeout(6000),
    });
    return r.ok;
  } catch { return false; }
}

export default async function handler(req, res) {
  cors(res, 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let db;
  try { db = await getDB(); } catch { return res.status(503).json({ error: 'Servicio no disponible', code: 'no_db' }); }
  const col = db.collection('messages');

  if (req.method === 'POST') {
    const b = req.body || {};
    if (b.website) return res.status(200).json({ ok: true });   // honeypot: bots
    const msg = {
      name:    clean(b.name, 80),
      email:   clean(b.email, 120).toLowerCase(),
      company: clean(b.company, 100),
      reason:  MOTIVOS.includes(b.reason) ? b.reason : 'otro',
      message: clean(b.message, 3000),
      asunto:  /^[a-z0-9-]{1,30}$/.test(String(b.asunto || '')) ? String(b.asunto) : '',
    };
    const errors = {};
    if (msg.name.length < 2) errors.name = 'Decime tu nombre.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(msg.email)) errors.email = 'Ese email no parece válido.';
    if (msg.message.length < 10) errors.message = 'Contame un poco más (mínimo 10 caracteres).';
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Revisá los campos marcados.', errors });

    if (!(await rateLimit(db, `contact:${clientIp(req)}`, 5, 3600))) {
      return res.status(429).json({ error: 'Recibí varios mensajes seguidos desde tu conexión. Probá más tarde o escribime por WhatsApp.' });
    }
    const { insertedId } = await col.insertOne({ ...msg, read: false, createdAt: new Date() });
    if (await notificar(msg)) await col.updateOne({ _id: insertedId }, { $set: { emailed: true } });
    return res.status(201).json({ ok: true });
  }

  if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    const items = await col.find({}).sort({ createdAt: -1 }).limit(300).toArray();
    return res.status(200).json({ items, unread: items.filter(i => !i.read).length });
  }

  let _id;
  try { _id = new ObjectId(String(req.query.id)); } catch { return res.status(400).json({ error: 'ID inválido' }); }

  if (req.method === 'PATCH') {
    await col.updateOne({ _id }, { $set: { read: req.body?.read !== false } });
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'DELETE') {
    await col.deleteOne({ _id });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Método no permitido' });
}
