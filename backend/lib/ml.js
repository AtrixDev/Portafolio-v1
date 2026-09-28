// lib/ml.js — Acceso a la API de Mercado Libre con las cuentas vinculadas (la de Darío y las de clientes)
// ML ya no permite leer publicaciones sin autenticación, así que el servidor
// usa el token de una cuenta vinculada (OAuth) guardado en Mongo y lo renueva solo.
import { createHash, createHmac, randomBytes } from 'crypto';

const API  = 'https://api.mercadolibre.com';
const AUTH = 'https://auth.mercadolibre.com.ar/authorization';

export const ML = {
  appId:       process.env.ML_APP_ID,
  secret:      process.env.ML_SECRET,
  redirectUri: process.env.ML_REDIRECT_URI,   // ej: https://tu-dominio/api/ml-callback
};

export class MLNotLinked extends Error {
  constructor(msg = 'La cuenta de Mercado Libre no está vinculada') { super(msg); this.code = 'ml_not_linked'; }
}
export class MLForbidden extends Error {
  constructor() { super('Mercado Libre no permite leer esta publicación desde la API'); this.code = 'ml_forbidden'; }
}

// ── OAuth ──────────────────────────────────────────────────────
function sign(data, secret) { return createHmac('sha256', secret).update(data).digest('base64url'); }

// El state lleva el tipo de vínculo: 'admin' (desde el panel), 'cliente' (link de invitación)
// o 'lead' (auditoría gratis de la web, con el id del pedido en `extra.lid`)
export function makeState(secret, tipo = 'admin', extra = {}) {
  const payload = Buffer.from(JSON.stringify({ ...extra, n: randomBytes(8).toString('hex'), tipo, exp: Date.now() + 10 * 60 * 1000 })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

// Devuelve el contenido del state si es válido, o null
export function checkState(state, secret) {
  const [payload, sig] = String(state || '').split('.');
  if (!payload || sig !== sign(payload, secret)) return null;
  try { const d = JSON.parse(Buffer.from(payload, 'base64url').toString()); return d.exp > Date.now() ? d : null; } catch { return null; }
}

// Link para que un cliente vincule su cuenta sin entrar al panel (vale 7 días)
export function makeInvite(secret) {
  const payload = Buffer.from(JSON.stringify({ inv: 1, exp: Date.now() + 7 * 864e5 })).toString('base64url');
  return `${payload}.${sign('inv:' + payload, secret)}`;
}
export function checkInvite(token, secret) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || sig !== sign('inv:' + payload, secret)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}

// PKCE sin guardar nada: el code_verifier se deriva del state firmado con el secreto del servidor.
// Nadie puede calcularlo sin ese secreto, y así funciona tenga o no tildado "Requiere PKCE" en el DevCenter.
function pkceVerifier(state) {
  return createHmac('sha256', ML.secret || 'pkce').update('pkce:' + state).digest('base64url');   // 43 caracteres
}

export function authorizeUrl(state) {
  const challenge = createHash('sha256').update(pkceVerifier(state)).digest('base64url');
  const q = new URLSearchParams({
    response_type: 'code', client_id: ML.appId, redirect_uri: ML.redirectUri, state,
    code_challenge: challenge, code_challenge_method: 'S256',
  });
  return `${AUTH}?${q}`;
}

async function tokenRequest(params) {
  const res = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: ML.appId, client_secret: ML.secret, ...params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(data.message || data.error || `oauth ${res.status}`);
  return data;
}

function tokenDoc(data) {
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    new Date(Date.now() + (data.expires_in || 21600) * 1000),
  };
}

// ── Cuentas vinculadas (colección ml_accounts, _id = user id de ML) ──
// La cuenta "principal" es la del panel; las demás son de clientes.
async function cuentas(db) {
  const col = db.collection('ml_accounts');
  // Migración: antes había una sola cuenta en settings/ml
  const vieja = await db.collection('settings').findOne({ _id: 'ml' });
  if (vieja?.userId) {
    const { _id, userId, ...resto } = vieja;
    await col.updateOne({ _id: String(userId) }, { $setOnInsert: { ...resto, principal: true } }, { upsert: true });
    await db.collection('settings').deleteOne({ _id: 'ml' });
  }
  return col;
}

export async function linkAccount(db, code, state, tipo = 'admin', extra = {}) {
  const data = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: ML.redirectUri, code_verifier: pkceVerifier(state) });
  const me = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${data.access_token}` } }).then(r => r.json()).catch(() => ({}));
  if (!me.id) throw new Error('No se pudo leer el usuario de Mercado Libre');
  const col = await cuentas(db);
  const hayPrincipal = await col.findOne({ principal: true, _id: { $ne: String(me.id) } });
  await col.updateOne(
    { _id: String(me.id) },
    {
      $set: { ...tokenDoc(data), nickname: me.nickname || '', linkedAt: new Date(), status: 'ok', error: null, ...(extra.leadId ? { leadId: String(extra.leadId) } : {}) },
      $setOnInsert: { principal: tipo === 'admin' && !hayPrincipal, tipo },
    },
    { upsert: true }
  );
  return me.nickname || '';
}

export async function listAccounts(db) {
  const col = await cuentas(db);
  return col.find({}, { projection: { accessToken: 0, refreshToken: 0 } }).sort({ principal: -1, linkedAt: 1 }).toArray();
}

export async function linkStatus(db) {
  const col = await cuentas(db);
  const doc = await col.findOne({ principal: true }) || await col.findOne({});
  if (!doc) return { linked: false };
  return { linked: doc.status === 'ok', nickname: doc.nickname, linkedAt: doc.linkedAt, expiresAt: doc.expiresAt, status: doc.status };
}

export async function unlink(db, userId) {
  const col = await cuentas(db);
  const filtro = userId ? { _id: String(userId) } : { principal: true };
  const doc = await col.findOne(filtro);
  if (!doc) return;
  await col.deleteOne({ _id: doc._id });
  // Los datos sincronizados de esa cuenta también se borran
  for (const c of ['tk_items', 'tk_visitas', 'tk_ordenes', 'tk_fotos', 'tk_costos']) await db.collection(c).deleteMany({ seller: doc._id });
}

// Devuelve un access token válido de una cuenta (sin userId: la principal); si está por vencer lo renueva.
// Los refresh tokens de ML son de un solo uso: si dos funciones renuevan a la vez,
// la que pierde relee el documento y usa el token que guardó la otra.
export async function getAccessToken(db, userId) {
  const col = await cuentas(db);
  const filtro = userId ? { _id: String(userId) } : { principal: true };
  const doc = await col.findOne(filtro);
  if (!doc || !doc.refreshToken || doc.status === 'expired') throw new MLNotLinked();
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() > Date.now() + 5 * 60 * 1000) return doc.accessToken;

  try {
    const data = await tokenRequest({ grant_type: 'refresh_token', refresh_token: doc.refreshToken });
    await col.updateOne({ _id: doc._id, refreshToken: doc.refreshToken }, { $set: { ...tokenDoc(data), status: 'ok' } });
    return data.access_token;
  } catch (err) {
    const fresh = await col.findOne({ _id: doc._id });
    if (fresh && fresh.refreshToken !== doc.refreshToken && new Date(fresh.expiresAt).getTime() > Date.now()) return fresh.accessToken;
    await col.updateOne({ _id: doc._id }, { $set: { status: 'expired', error: String(err.message).slice(0, 200) } });
    throw new MLNotLinked('El acceso a Mercado Libre venció: hay que volver a vincular la cuenta');
  }
}

export async function marcarVencida(db, userId, msg) {
  const col = await cuentas(db);
  await col.updateOne(userId ? { _id: String(userId) } : { principal: true }, { $set: { status: 'expired', error: msg } });
}

// ── Lectura de publicaciones ──────────────────────────────────
async function get(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(9000) });
  if (res.status === 401) throw new MLNotLinked('El token de Mercado Libre fue rechazado');
  if (res.status === 403) throw new MLForbidden();
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

function normalizeItem(item, descripcion, source) {
  const pictures = (item.pictures || []).map(p => ({ secure_url: p.secure_url || p.url || '' })).filter(p => p.secure_url);
  return {
    id:                 item.id,
    title:              item.title || item.name || '',
    price:              item.price ?? null,
    condition:          item.condition,
    status:             item.status || 'active',
    available_quantity: item.available_quantity ?? null,
    sold_quantity:      item.sold_quantity ?? null,
    pictures,
    attributes:         (item.attributes || []).filter(a => a.value_name),
    descripcion,
    warranty:           item.warranty || (item.sale_terms || []).find(t => t.id === 'WARRANTY_TIME')?.value_name || null,
    permalink:          item.permalink || null,
    _source:            source,
    _fotos_confiables:  true,
  };
}

// Publicación directa (MLA…) o producto de catálogo (/p/MLA…)
export async function fetchPublicacion(db, mlaId, esCatalogo, pista = {}) {
  const token = await getAccessToken(db);
  try {
    return await leerPublicacion(token, mlaId, esCatalogo, pista);
  } catch (err) {
    // ML responde 403 tanto a un token inválido como a una publicación restringida:
    // si /users/me también falla, el problema es el token.
    if (err instanceof MLForbidden) {
      const me = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(6000) }).catch(() => null);
      if (!me?.ok) err = new MLNotLinked('El token de Mercado Libre fue rechazado');
    }
    // Token rechazado: marcarlo para que el estado público y el admin lo reflejen
    if (err instanceof MLNotLinked) {
      await marcarVencida(db, null, err.message);
    }
    throw err;
  }
}

async function leerPublicacion(token, mlaId, esCatalogo, pista) {
  if (!esCatalogo) {
    let item = null;
    try { item = await get(`/items/${mlaId}`, token); }
    catch (err) {
      // Desde 2025 ML sólo deja leer /items de publicaciones propias: con otras, auditamos lo público
      if (err instanceof MLForbidden) return leerPublico(token, mlaId, pista);
      throw err;
    }
    const desc = item && !item.error ? await get(`/items/${mlaId}/description`, token) : null;
    if (item && !item.error) return normalizeItem(item, desc?.plain_text || desc?.text || '', 'ml-api');
  }

  // Catálogo: el producto no tiene precio ni stock; si hay ganador de buy box, auditamos esa publicación
  const product = await get(`/products/${mlaId}`, token);
  if (!product) return null;
  const winner = product.buy_box_winner?.item_id;
  if (winner) {
    const [item, desc] = await Promise.all([get(`/items/${winner}`, token), get(`/items/${winner}/description`, token)]);
    if (item && !item.error) return { ...normalizeItem(item, desc?.plain_text || '', 'ml-api-catalogo'), id: winner };
  }
  const p = normalizeItem({ ...product, title: product.name }, product.short_description?.content || '', 'ml-api-producto');
  p._datos_parciales = true;
  return p;
}

// Publicación de otro vendedor: descripción, visitas, preguntas y opiniones son públicas;
// fotos, stock, atributos, garantía y estado no.
async function leerPublico(token, mlaId, pista) {
  const opt = path => get(path, token).catch(() => null);
  const [desc, visitas, preguntas, opiniones] = await Promise.all([
    opt(`/items/${mlaId}/description`),
    opt(`/visits/items?ids=${mlaId}`),
    opt(`/questions/search?item=${mlaId}&limit=1`),
    opt(`/reviews/item/${mlaId}`),
  ]);
  // Sin descripción ni visitas no hay forma de saber si la publicación existe
  if (!desc && !visitas?.[mlaId]) throw new MLForbidden();
  const titulo = pista.titulo || '';
  return {
    id: mlaId, title: titulo, price: null, status: undefined, available_quantity: null, sold_quantity: null,
    pictures: [], attributes: [], warranty: null,
    descripcion: desc?.plain_text || desc?.text || '',
    permalink: `https://articulo.mercadolibre.com.ar/MLA-${mlaId.slice(3)}`,
    _source: 'ml-api-publico',
    // El título sale del link (viene recortado): se muestra, pero no se puntúa
    _faltan: ['fotos', 'stock', 'estado', 'atributos', 'garantia', 'titulo'],
    _titulo_del_link: !!titulo,
    _extras: {
      visitas: visitas?.[mlaId] ?? null,
      preguntas: preguntas?.total ?? null,
      opiniones: opiniones?.paging?.total ?? null,
      rating: opiniones?.rating_average || null,
    },
  };
}
