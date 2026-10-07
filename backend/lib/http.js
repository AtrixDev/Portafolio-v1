// lib/http.js — helpers compartidos por los endpoints
import { verifyToken } from '../api/login.js';

export const ADMIN_SECRET = process.env.ADMIN_TOKEN || null   // sin ADMIN_TOKEN no se aceptan sesiones;

export { cors } from './cors.js';

// Sesión de administración: SOLO por el header Authorization: Bearer. Antes también se aceptaba `?t=` en cualquier
// endpoint, lo que dejaba el token de 30 días en URLs (historial, logs, Referer). Ver adminTicketDeUrl() para el único caso que lo necesita.
export function isAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  return verifyToken(token, ADMIN_SECRET);
}

// Excepción: el login de Mercado Libre es una NAVEGACIÓN (302), no un fetch, y no puede mandar headers.
// Acepta (1) un ticket de 2 minutos con alcance «ml-login» (lo pide el admin con POST /api/ml?action=ticket) y
// (2) por compatibilidad, el token de sesión completo en `?t=`. (2) se apaga con ADMIN_QUERY_TOKEN=off; ver docs/seguridad.md.
export function adminDesdeUrl(req) {
  if (isAdmin(req)) return true;
  const t = req.query?.t || '';
  if (!t) return false;
  if (verifyToken(t, ADMIN_SECRET, 'ml-login')) return true;
  return process.env.ADMIN_QUERY_TOKEN !== 'off' && verifyToken(t, ADMIN_SECRET);
}

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

// Límite simple por clave (IP + endpoint) guardado en Mongo, porque en serverless la memoria no persiste
export async function rateLimit(db, key, limit, windowSec) {
  const now = new Date();
  const col = db.collection('ratelimits');
  await col.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  const doc = await col.findOneAndUpdate(
    { _id: key, resetAt: { $gt: now } },
    { $inc: { count: 1 } },
    { returnDocument: 'after' }
  );
  if (doc) return doc.count <= limit;
  await col.updateOne(
    { _id: key },
    { $set: { count: 1, resetAt: new Date(now.getTime() + windowSec * 1000) } },
    { upsert: true }
  );
  return true;
}
