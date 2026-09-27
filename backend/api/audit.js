// api/audit.js
// POST /api/audit  { url } → score de salud + plan de acción de una publicación de ML (sólo admin)
import { getDB } from './db.js';
import { cors, clientIp, rateLimit, isAdmin } from '../lib/http.js';
import { fetchPublicacion, MLNotLinked, MLForbidden } from '../lib/ml.js';
import { parseMlaId, esUrlCatalogo, esUrlUserProduct, tituloDesdeUrl, scorePublicacion, planDeAccion, tituloConIA } from '../lib/audit.js';

export default async function handler(req, res) {
  cors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  // ML Tracker es privado: sólo con sesión del panel
  if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });

  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || url.length > 600) {
    return res.status(400).json({ error: 'Pasá el link de una publicación de Mercado Libre.' });
  }
  const mlaId = parseMlaId(url);
  if (!mlaId && esUrlUserProduct(url)) {
    return res.status(400).json({ error: 'Ese link es de la ficha del producto (/up/…) y no trae el número de la publicación. Abrila, bajá hasta el final y copiá el número que dice «Publicación #…»: pegalo acá y lo analizo.', code: 'user_product' });
  }
  if (!mlaId) {
    return res.status(400).json({ error: 'No encontré el código de la publicación (MLA…) en ese link. Usá el link del producto, no el de una búsqueda.' });
  }

  let db;
  try { db = await getDB(); } catch { return res.status(503).json({ error: 'El servicio no está disponible en este momento.', code: 'no_db' }); }

  if (!(await rateLimit(db, `audit:${clientIp(req)}`, 10, 3600))) {
    return res.status(429).json({ error: 'Llegaste al límite de 10 análisis por hora. Probá de nuevo más tarde.' });
  }

  const esCatalogo = esUrlCatalogo(url);
  try {
    const item = await fetchPublicacion(db, mlaId, esCatalogo, { titulo: tituloDesdeUrl(url) });
    if (!item) return res.status(404).json({ error: 'No encontré esa publicación. Revisá que el link esté completo y que la publicación exista.' });

    const { score, problemas, mejoras, checks } = scorePublicacion(item);
    const ai = planDeAccion(item, score, problemas, mejoras);
    if (item._faltan) {
      const ok = Object.values(checks).filter(v => v !== null).length;
      ai.resumen = `Auditoría parcial: de 8 controles se pudieron verificar ${ok}, y sobre esos da ${score}/100. ${(problemas[0] || mejoras[0]) ? `Lo de mayor impacto: ${(problemas[0] || mejoras[0]).toLowerCase()}.` : 'No hay problemas en lo verificable.'} Si la publicación es tuya, escribime y la audito completa.`;
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
      return res.status(503).json({ error: 'La auditoría en vivo está en mantenimiento.', code: 'ml_not_linked' });
    }
    if (err instanceof MLForbidden) {
      return res.status(422).json({ error: 'No encontré esa publicación o Mercado Libre no permite leerla. Revisá el número o probá con otra.' });
    }
    console.error('[audit] Error:', err.message);
    return res.status(502).json({ error: 'No pude consultar Mercado Libre en este momento. Probá de nuevo en unos minutos.' });
  }
}
