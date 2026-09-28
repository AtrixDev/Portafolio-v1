// api/audit.js
// POST /api/audit  { url } → score de salud + plan de acción de una publicación de ML
//   · con sesión del panel: resultado completo
//   · público (mini auditoría de sistema.html): resultado resumido, 5 por persona por día, 100 por día en total
//     y memoria de 24 h por publicación (una publicación repetida no gasta consultas a la API)
import { getDB } from './db.js';
import { cors, clientIp, rateLimit, isAdmin } from '../lib/http.js';
import { fetchPublicacion, MLNotLinked, MLForbidden } from '../lib/ml.js';
import { parseMlaId, esUrlCatalogo, esUrlUserProduct, tituloDesdeUrl, scorePublicacion, planDeAccion, tituloConIA } from '../lib/audit.js';

export default async function handler(req, res) {
  cors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
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
    if (guardado) return res.status(200).json({ ...guardado.res, memoria: true });
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

    const { score, problemas, mejoras, checks } = scorePublicacion(item);
    const ai = planDeAccion(item, score, problemas, mejoras);
    if (item._faltan) {
      const ok = Object.values(checks).filter(v => v !== null).length;
      ai.resumen = `Auditoría parcial: de 8 controles se pudieron verificar ${ok}, y sobre esos da ${score}/100. ${(problemas[0] || mejoras[0]) ? `Lo de mayor impacto: ${(problemas[0] || mejoras[0]).toLowerCase()}.` : 'No hay problemas en lo verificable.'} Si la publicación es tuya, escribime y la audito completa.`;
    }
    if (!admin) {
      // Con muy pocos controles verificables (publicación de otro vendedor que no es de catálogo) no se inventa un puntaje
      const verificados = Object.values(checks).filter(v => v !== null).length;
      if (verificados < 4) {
        const lim = { limitada: true, item: { title: item.title || null, permalink: item.permalink || null }, extras: item._extras || null };
        await cache.updateOne({ _id: mlaId }, { $set: { res: lim, at: new Date() } }, { upsert: true }).catch(() => {});
        return res.status(200).json(lim);
      }
      // Versión pública: el diagnóstico completo, pero el paso a paso sólo de la primera acción
      const acciones = (ai.acciones || []).slice(0, 5).map((a, i) => ({ titulo: a.titulo, impacto: a.impacto, tiempo: a.tiempo_estimado, como: i === 0 ? a.como : null }));
      const pub = {
        score, problemas, mejoras, checks, parcial: !!item._faltan, score_potencial: ai.score_potencial, acciones, mas: Math.max(0, (ai.acciones || []).length - 5),
        item: { title: item.title, price: item.price, foto: item.pictures?.[0]?.secure_url || null, fotos: item.pictures?.length || 0, permalink: item.permalink || null },
      };
      await cache.updateOne({ _id: mlaId }, { $set: { res: pub, at: new Date() } }, { upsert: true }).catch(() => {});
      return res.status(200).json(pub);
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
      score, problemas, mejoras, checks, ai,
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
