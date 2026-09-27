// api/ml.js — Vinculación de cuentas de Mercado Libre
// GET /api/ml?action=status            → { linked }            (público, sin detalles)
// GET /api/ml?action=status  + admin   → estado de la cuenta principal
// GET /api/ml?action=login&t=TOKEN     → redirige a ML para autorizar (admin: cuenta principal)
// GET /api/ml?action=login&inv=INVITE  → redirige a ML para autorizar (cliente con link de invitación)
// POST /api/ml?action=unlink + admin   → desvincula la cuenta principal
import { getDB } from './db.js';
import { cors, isAdmin, ADMIN_SECRET } from '../lib/http.js';
import { ML, makeState, authorizeUrl, linkStatus, unlink, checkInvite } from '../lib/ml.js';

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const action = req.query.action || 'status';

  if (action === 'login') {
    const invitado = req.query.inv && checkInvite(req.query.inv, ADMIN_SECRET);
    if (!invitado && !isAdmin(req)) {
      return res.status(401).send(req.query.inv ? 'El link de vinculación venció. Pedile uno nuevo a Darío.' : 'No autorizado. Iniciá sesión en el admin primero.');
    }
    if (!ML.appId || !ML.secret || !ML.redirectUri) {
      return res.status(500).send('Faltan las variables ML_APP_ID, ML_SECRET o ML_REDIRECT_URI en el servidor.');
    }
    return res.redirect(302, authorizeUrl(makeState(ADMIN_SECRET, invitado ? 'cliente' : 'admin')));
  }

  let db;
  try { db = await getDB(); } catch { return res.status(503).json({ linked: false, error: 'sin base de datos' }); }

  if (action === 'status') {
    const st = await linkStatus(db);
    return res.status(200).json(isAdmin(req) ? st : { linked: st.linked });
  }

  if (action === 'unlink' && req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    await unlink(db);
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Acción desconocida' });
}
