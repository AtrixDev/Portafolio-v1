// lib/http.js — helpers compartidos por los endpoints
import { verifyToken } from '../api/login.js';

export const ADMIN_SECRET = process.env.ADMIN_TOKEN || null   // sin ADMIN_TOKEN no se aceptan sesiones;

export function cors(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function isAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '') || req.query?.t || '';
  return verifyToken(token, ADMIN_SECRET);
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
