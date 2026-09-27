// api/login.js — valida credenciales y devuelve token HMAC-SHA256
import { createHmac, timingSafeEqual } from 'crypto';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function makeToken(secret) {
  const payload = Buffer.from(JSON.stringify({
    user: 'admin',
    iat:  Math.floor(Date.now() / 1000),
    exp:  Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 días
  })).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const [payload, sig] = (token || '').split('.');
  if (!payload || !sig) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  if (expected !== sig) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Date.now() / 1000 < exp;
  } catch { return false; }
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { user, pass } = req.body || {};
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;
  const secret       = process.env.ADMIN_TOKEN;
  // Sin credenciales configuradas no se puede entrar (antes había valores por defecto conocidos)
  if (!expectedUser || !expectedPass || !secret) {
    return res.status(503).json({ error: 'El acceso de administración no está configurado en el servidor.' });
  }

  // Límite por IP: 8 intentos FALLIDOS cada 15 minutos (entrar bien no cuenta y limpia el contador)
  let col = null, key = '';
  try {
    const { getDB } = await import('./db.js');
    const { clientIp } = await import('../lib/http.js');
    col = (await getDB()).collection('ratelimits'); key = `login:${clientIp(req)}`;
    const prev = await col.findOne({ _id: key, resetAt: { $gt: new Date() } });
    if (prev && prev.count >= 8) {
      return res.status(429).json({ error: 'Demasiados intentos fallidos. Probá de nuevo en 15 minutos.' });
    }
  } catch (e) { col = null; /* si la base no responde, seguimos con la demora de abajo */ }

  const same = (a, b) => {
    const x = Buffer.from(String(a ?? '')), y = Buffer.from(String(b));
    return x.length === y.length && timingSafeEqual(x, y);
  };
  if (same(user, expectedUser) && same(pass, expectedPass)) {
    if (col) await col.deleteOne({ _id: key }).catch(() => {});
    return res.status(200).json({ ok: true, token: makeToken(secret) });
  }
  if (col) {
    const { rateLimit } = await import('../lib/http.js');
    await rateLimit(await (await import("./db.js")).getDB(), key, 8, 900).catch(() => {});
  }
  await new Promise(r => setTimeout(r, 600)); // ralentiza la fuerza bruta
  return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
}
