// lib/cors.js — política de CORS de la API (sin dependencias: la usan login, content, portfolio y http)
//
// Antes: «Access-Control-Allow-Origin: *» en todo. Ahora solo pueden leer las respuestas desde un navegador:
//   · el mismo origen del sitio (el único que usa el frontend: todas sus llamadas son relativas);
//   · PUBLIC_URL y los orígenes de CORS_ORIGINS (lista separada por comas, para sumar un dominio propio sin tocar código);
//   · localhost, solo fuera de producción (dev-server).
// Los endpoints de lectura pública que alguien podría embeber (`publicRead`) siguen respondiendo «*» a GET.
// Nada de esto es una barrera de seguridad por sí sola (la API se protege con el token Bearer y los límites de uso);
// es defensa en profundidad: una web ajena ya no puede leer respuestas privadas desde el navegador de Darío.

export function allowedOrigin(req) {
  const origin = req?.headers?.origin;
  if (!origin) return null;
  let u;
  try { u = new URL(origin); } catch { return null; }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host && u.host === host) return origin;
  const extras = [process.env.PUBLIC_URL, ...String(process.env.CORS_ORIGINS || '').split(',')]
    .map(s => String(s || '').trim().replace(/\/$/, '')).filter(Boolean);
  if (extras.includes(origin)) return origin;
  if (process.env.NODE_ENV !== 'production' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return origin;
  return null;
}

export function cors(res, methods = 'GET, POST, OPTIONS', req = null, { publicRead = false, headers = 'Content-Type, Authorization' } = {}) {
  res.setHeader('Vary', 'Origin');
  const ok = allowedOrigin(req);
  if (ok) res.setHeader('Access-Control-Allow-Origin', ok);
  else if (publicRead && (!req || req.method === 'GET' || req.method === 'OPTIONS')) res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
}
