// api/ml.js — Vinculación de cuentas de Mercado Libre
// GET /api/ml?action=status            → { linked }            (público, sin detalles)
// GET /api/ml?action=status  + admin   → estado de la cuenta principal
// POST /api/ml?action=ticket + admin   → { ticket } de 2 minutos con alcance «ml-login» (para usar en el login de abajo)
// GET /api/ml?action=login&t=TICKET    → redirige a ML para autorizar (admin: cuenta principal)
//     (compat.: `t` también acepta el token de sesión completo hasta que se apague con ADMIN_QUERY_TOKEN=off)
// GET /api/ml?action=login&inv=INVITE  → redirige a ML para autorizar (cliente con link de invitación)
// POST /api/ml?action=unlink + admin   → desvincula la cuenta principal
import { getDB } from './db.js';
import { cors, isAdmin, adminDesdeUrl, ADMIN_SECRET } from '../lib/http.js';
import { makeToken } from './login.js';
import { ML, makeState, authorizeUrl, linkStatus, unlink, checkInvite } from '../lib/ml.js';

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS', req);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const action = req.query.action || 'status';

  if (action === 'login') {
    const invitado = req.query.inv && checkInvite(req.query.inv, ADMIN_SECRET);
    if (!invitado && !adminDesdeUrl(req)) {
      return res.status(401).send(req.query.inv ? 'El link de vinculación venció. Pedile uno nuevo a Darío.' : 'No autorizado. Iniciá sesión en el admin primero.');
    }
    if (!ML.appId || !ML.secret || !ML.redirectUri) {
      return res.status(500).send('Faltan las variables ML_APP_ID, ML_SECRET o ML_REDIRECT_URI en el servidor.');
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    return res.redirect(302, authorizeUrl(makeState(ADMIN_SECRET, invitado ? 'cliente' : 'admin')));
  }

  // Ticket de vida corta para la navegación al login de ML: evita poner la sesión de 30 días en la URL
  if (action === 'ticket' && req.method === 'POST') {
    if (!isAdmin(req) || !ADMIN_SECRET) return res.status(401).json({ error: 'No autorizado' });
    return res.status(200).json({ ticket: makeToken(ADMIN_SECRET, { scope: 'ml-login', ttlSec: 120 }) });
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
