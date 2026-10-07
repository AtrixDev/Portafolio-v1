// api/audit.js
// POST /api/audit  { url } → score de salud + plan de acción de una publicación de ML
//   · con sesión del panel: resultado completo
//   · público (chequeo rápido de sistema.html): solo datos verificables, sin puntaje; 5 por persona por día,
//     100 por día en total y memoria de 24 h por publicación (una publicación repetida no gasta consultas)
// POST /api/audit?action=web  { url } → diagnóstico de la web de un negocio (web.html); 5 por persona por día, memoria de 24 h
// POST /api/audit?action=web-velocidad  { url } → velocidad real en celular con PageSpeed (solo si hay PAGESPEED_KEY)
// POST /api/audit?action=conectar  { nombre, email, whatsapp } → link de Mercado Libre para conectar la cuenta
//      (auditoría completa gratis; el pedido llega a Mensajes del admin cuando se conecta)
// GET  /api/audit?action=estado&id=…  → sincroniza por tandas y, al terminar, devuelve el resumen de la auditoría
// Mercado Libre no deja leer publicaciones de otros vendedores: el puntaje real solo sale con la cuenta conectada.
import { getDB } from './db.js';
import { guardarResultado, resumenChequeo, limpiarResumen } from '../lib/resultados.js';
import { randomBytes } from 'node:crypto';
import { cors, clientIp, rateLimit, isAdmin, ADMIN_SECRET } from '../lib/http.js';
import { fetchPublicacion, MLNotLinked, MLForbidden, ML, makeState, authorizeUrl } from '../lib/ml.js';
import { sincronizar, datosCuenta } from '../lib/tracker-sync.js';
import { analizarCuenta } from '../lib/tracker.js';
import { resumenAuditoria } from '../lib/auditoria-cuenta.js';
import { diagnosticarWeb, velocidadWeb, WebError } from '../lib/diagnostico-web.js';
import { parseMlaId, esUrlCatalogo, esUrlUserProduct, tituloDesdeUrl, scorePublicacion, planDeAccion, noVerificables, tituloConIA } from '../lib/audit.js';

// F0: cada chequeo público queda guardado (link compartible). Si falla, el chequeo igual responde.
const conResultado = async (db, rapido, mlaId) => {
  const resumen = limpiarResumen(resumenChequeo(rapido));   // el mismo resumen se muestra en vivo y se guarda: no hay dos versiones
  const g = await guardarResultado(db, { herramienta: 'chequeo', entrada: mlaId, resumen, datos: rapido }).catch(() => null);
  return { ...rapido, resumen, ...(g ? { resultadoId: g.id } : {}) };
};

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const accion = req.query?.action;
  if (accion === 'conectar' || accion === 'estado') return auditoriaCuenta(req, res, accion);
  if (accion === 'web' || accion === 'web-velocidad') return auditoriaWeb(req, res, accion);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const admin = isAdmin(req);

  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || url.length > 600) {
    return res.status(400).json({ error: 'Pegá el link de tu publicación de Mercado Libre y arrancamos.' });
  }
  // En los links de catálogo (/p/MLA…) manda el número del catálogo, aunque el link compartido traiga
  // también el de una publicación (?wid=MLA… o pdp_filters=item_id:MLA…)
  const catalogo = url.match(/\/p\/(MLA\d+)/i)?.[1]?.toUpperCase() || null;
  const mlaId = catalogo || parseMlaId(url);
  if (!mlaId && esUrlUserProduct(url)) {
    return res.status(400).json({ error: 'Ese link es de la ficha del producto y no trae el número de la publicación. Bajá hasta el final de la publicación en Mercado Libre, copiá el número que dice «Publicación #…» y pegalo acá.', code: 'user_product' });
  }
  if (!mlaId) {
    return res.status(400).json({ error: 'Mmm, ese link no parece de una publicación. Abrí tu producto en Mercado Libre y copiá la dirección de esa página (la que tiene MLA en el medio).' });
  }

  let db;
  try { db = await getDB(); } catch { return res.status(503).json({ error: 'El servicio no está disponible en este momento.', code: 'no_db' }); }

  // Mini auditoría pública: memoria de 24 h y límites para cuidar la cuota de la API de Mercado Libre
  const cache = db.collection('audit_cache');
  if (!admin) {
    await cache.createIndex({ at: 1 }, { expireAfterSeconds: 86400 }).catch(() => {});
    if (!(await rateLimit(db, `auditpub:${clientIp(req)}`, 5, 86400))) {
      return res.status(429).json({ code: 'limite_persona', error: '¡Ya auditaste 5 publicaciones hoy! Mañana tenés 5 más. Y si querés que mire tu cuenta entera, escribime: ahí es donde aparecen las ventas grandes.' });
    }
    const guardado = await cache.findOne({ _id: mlaId });
    if (guardado?.res?.v === 2) return res.status(200).json({ ...(await conResultado(db, guardado.res, mlaId)), memoria: true });   // v:2 = con cobertura; las anteriores se recalculan
    if (!(await rateLimit(db, 'auditpub:global', 100, 86400))) {
      return res.status(429).json({ code: 'limite_global', error: 'Hoy ya 100 vendedores auditaron sus publicaciones y se llevaron sus mejoras. Por hoy llegamos al tope: volvé mañana o escribime y la reviso yo personalmente.' });
    }
  } else if (!(await rateLimit(db, `audit:${clientIp(req)}`, 30, 3600))) {
    return res.status(429).json({ error: 'Llegaste al límite de 30 análisis por hora. Probá de nuevo más tarde.' });
  }

  const esCatalogo = !!catalogo || esUrlCatalogo(url);
  try {
    const item = await fetchPublicacion(db, mlaId, esCatalogo, { titulo: tituloDesdeUrl(url) });
    if (!item) return res.status(404).json({ error: 'No encontré esa publicación. Revisá que el link esté completo y que siga activa, y probamos de nuevo.' });

    const { score, problemas, mejoras, checks, cobertura } = scorePublicacion(item);
    const ai = planDeAccion(item, score, problemas, mejoras, cobertura);
    if (item._faltan && score !== null) {
      const ok = Object.values(checks).filter(v => v !== null).length;
      ai.resumen = `Auditoría parcial: de 8 controles se pudieron verificar ${ok}, y sobre esos da ${score}/100. ${(problemas[0] || mejoras[0]) ? `Lo de mayor impacto: ${(problemas[0] || mejoras[0]).toLowerCase()}.` : 'No hay problemas en lo verificable.'} Si la publicación es tuya, escribime y la audito completa.`;
    }
    if (!admin) {
      // Chequeo rápido: solo lo que Mercado Libre muestra de una publicación ajena, sin puntaje
      const fotos = item._faltan?.includes('fotos') ? null : item.pictures?.length ?? null;
      const atributos = item._faltan?.includes('atributos') || item._datos_parciales ? null : item.attributes?.length ?? null;   // en un catálogo sin ganador son del producto, no de la publicación
      const desc = (item.descripcion || '').length;
      const rapido = {
        rapido: true, v: 2, catalogo: esCatalogo,
        cobertura: { verificados: cobertura.verificados, total: cobertura.total }, noVerificado: noVerificables(item),
        item: { title: item.title || null, permalink: item.permalink || null, foto: item.pictures?.[0]?.secure_url || null },
        datos: {
          fotos, atributos,
          descripcion: esCatalogo ? null : desc,
          opiniones: item._extras?.opiniones ?? null, preguntas: item._extras?.preguntas ?? null, visitas: item._extras?.visitas ?? null,
        },
      };
      await cache.updateOne({ _id: mlaId }, { $set: { res: rapido, at: new Date() } }, { upsert: true }).catch(() => {});
      return res.status(200).json(await conResultado(db, rapido, mlaId));
    }
    const ia = await tituloConIA(item, score, problemas);
    if (ia) {
      ai.titulo_optimizado = ia.titulo_optimizado;
      if (ia.resumen_ejecutivo) ai.resumen = ia.resumen_ejecutivo;
      ai.fuente = 'reglas+ia';
      ai._llm = 'groq';
    }

    return res.status(200).json({
      mla_id: item.id || mlaId,
      es_catalogo: esCatalogo,
      aviso: item._datos_parciales
        ? 'Es un producto de catálogo sin publicación ganadora: faltan datos como descripción, stock y atributos, así que no se penalizan.'
        : item._faltan
        ? `Mercado Libre sólo deja leer completas las publicaciones propias. De esta publicación de otro vendedor se analizó lo público: ${item._titulo_del_link ? 'el título (tomado del link), ' : ''}la descripción, las visitas, las preguntas y las opiniones. Fotos, stock y atributos no se pueden verificar y no se penalizan.`
        : null,
      extras: item._extras || null,
      parcial: !!item._faltan,
      item: {
        id: item.id, title: item.title, price: item.price, status: item.status,
        available_quantity: item.available_quantity, sold_quantity: item.sold_quantity,
        pictures: item.pictures.slice(0, 5).map(p => p.secure_url),
        pictures_count: item.pictures.length,
        attributes_count: item._datos_parciales || item._faltan ? null : item.attributes.length,
        warranty: item.warranty, permalink: item.permalink,
      },
      score, problemas, mejoras, checks, cobertura, ai,
      fuente_datos: item._source,
      analizado_en: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof MLNotLinked) {
      console.error('[audit] ML no vinculado:', err.message);
      return res.status(503).json({ code: 'ml_not_linked', error: admin ? 'La auditoría en vivo está en mantenimiento.' : 'La auditoría se está tomando un mate. Volvé en un rato o escribime y la reviso yo.' });
    }
    if (err instanceof MLForbidden) {
      return res.status(422).json({ error: 'No encontré esa publicación o Mercado Libre no permite leerla. Revisá el número o probá con otra.' });
    }
    console.error('[audit] Error:', err.message);
    return res.status(502).json({ error: 'Mercado Libre no me contestó a tiempo. Dale unos minutos y probá de nuevo.' });
  }
}

// ── Auditoría completa gratis con la cuenta conectada ──
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const limpio = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

async function auditoriaCuenta(req, res, accion) {
  let db;
  try { db = await getDB(); } catch { return res.status(503).json({ error: 'El servicio no está disponible en este momento.' }); }
  const col = db.collection('auditorias');

  if (accion === 'conectar') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    const b = req.body || {};
    if (b.website) return res.status(200).json({ ok: true });   // honeypot
    const pedido = { nombre: limpio(b.nombre, 80), email: limpio(b.email, 120).toLowerCase(), whatsapp: limpio(b.whatsapp, 40) };
    const errores = {};
    if (pedido.nombre.length < 2) errores.nombre = 'Decime cómo te llamás.';
    if (!emailOk(pedido.email)) errores.email = 'Ese email no parece válido.';
    if (Object.keys(errores).length) return res.status(400).json({ error: 'Revisá los datos marcados.', errores });
    if (!ML.appId || !ML.redirectUri) return res.status(503).json({ error: 'La conexión con Mercado Libre está en mantenimiento. Escribime y la hacemos juntos.' });
    if (!(await rateLimit(db, `auditcon:${clientIp(req)}`, 3, 86400))) {
      return res.status(429).json({ error: 'Ya pediste tres auditorías hoy desde tu conexión. Si algo no funcionó, escribime y lo resolvemos.' });
    }
    const id = randomBytes(16).toString('hex');
    await col.insertOne({ _id: id, ...pedido, estado: 'esperando', createdAt: new Date() });
    return res.status(200).json({ url: authorizeUrl(makeState(ADMIN_SECRET, 'lead', { lid: id })) });
  }

  // estado: el id es el comprobante del pedido (32 caracteres aleatorios)
  const id = String(req.query.id || '');
  if (!/^[a-f0-9]{32}$/.test(id)) return res.status(400).json({ error: 'Pedido inválido' });
  const p = await col.findOne({ _id: id });
  if (!p) return res.status(404).json({ error: 'No encontré ese pedido.' });
  if (p.estado === 'listo') return res.status(200).json({ estado: 'listo', nombre: p.nombre, nickname: p.nickname, resumen: p.resumen });
  if (!p.cuenta) return res.status(200).json({ estado: 'esperando' });
  try {
    const prog = await sincronizar(db, p.cuenta, { presupuestoMs: 7000 });
    if (!prog.listo) return res.status(200).json({ estado: 'sincronizando', nickname: p.nickname, progreso: prog });
    const resumen = resumenAuditoria(analizarCuenta(await datosCuenta(db, p.cuenta)));
    await col.updateOne({ _id: id }, { $set: { estado: 'listo', resumen, listoAt: new Date() } });
    return res.status(200).json({ estado: 'listo', nombre: p.nombre, nickname: p.nickname, resumen });
  } catch (err) {
    console.error('[audit estado]', err.message);
    return res.status(200).json({ estado: 'sincronizando', nickname: p.nickname, progreso: { fase: 'reintentando', texto: 'Mercado Libre está lento: sigo intentando' } });
  }
}

// ── Diagnóstico de la web de un negocio (web.html) ──
async function auditoriaWeb(req, res, accion) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const url = String(req.body?.url || '').trim();
  if (!url) return res.status(400).json({ error: 'Pegá la dirección de tu web, por ejemplo: tunegocio.com.ar' });
  let db;
  try { db = await getDB(); } catch { return res.status(503).json({ error: 'El servicio no está disponible en este momento.' }); }
  const admin = isAdmin(req), cache = db.collection('web_cache');
  await cache.createIndex({ at: 1 }, { expireAfterSeconds: 86400 }).catch(() => {});
  let clave;
  try { const u = new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url); clave = (accion === 'web' ? 'w:' : 'v:') + u.hostname.replace(/^www\./, '').toLowerCase() + u.pathname.replace(/\/$/, ''); }
  catch { return res.status(400).json({ error: 'Esa dirección no parece una web. Probá con algo como tunegocio.com.ar' }); }

  const guardado = await cache.findOne({ _id: clave });
  if (guardado) return res.status(200).json({ ...guardado.res, memoria: true });

  if (accion === 'web-velocidad') {
    if (!process.env.PAGESPEED_KEY) return res.status(200).json({ sinClave: true });
    if (!admin && !(await rateLimit(db, 'webvel:global', 400, 86400))) return res.status(200).json({ sinClave: true });
    try {
      const v = await velocidadWeb(url, process.env.PAGESPEED_KEY);
      await cache.updateOne({ _id: clave }, { $set: { res: v, at: new Date() } }, { upsert: true });
      return res.status(200).json(v);
    } catch (e) { return res.status(502).json({ error: e.message || 'Google no pudo medir la velocidad.' }); }
  }

  if (!admin) {
    if (!(await rateLimit(db, `webpub:${clientIp(req)}`, 5, 86400))) return res.status(429).json({ code: 'limite_persona', error: 'Ya revisaste 5 webs hoy: mañana tenés 5 más. Si querés que la mire yo, escribime.' });
    if (!(await rateLimit(db, 'webpub:global', 150, 86400))) return res.status(429).json({ code: 'limite_global', error: 'Por hoy llegamos al tope de revisiones. Volvé mañana o escribime y la reviso yo.' });
  }
  try {
    const d = await diagnosticarWeb(url);
    await cache.updateOne({ _id: clave }, { $set: { res: d, at: new Date() } }, { upsert: true });
    return res.status(200).json(d);
  } catch (e) {
    if (e instanceof WebError) return res.status(e.code === 'no_web' ? 422 : 400).json({ code: e.code, error: e.message });
    console.error('[audit web]', e.message);
    return res.status(502).json({ error: 'No pude revisar esa web ahora. Probá de nuevo en un rato.' });
  }
}
