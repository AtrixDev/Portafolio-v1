// api/tracker.js — ML Tracker (privado, sólo con sesión del panel)
// GET  ?action=cuentas                  → cuentas vinculadas + demo
// GET  ?action=cuenta&id=ID|demo        → resumen, alertas y publicaciones analizadas
// GET  ?action=item&cuenta=ID&id=MLA…   → análisis completo + serie diaria de una publicación
// POST ?action=sync&id=ID               → sincroniza una tanda (el panel repite hasta que listo=true)
// GET  ?action=invitar                  → link para que un cliente vincule su cuenta
// POST ?action=desvincular&id=ID        → desvincula una cuenta y borra sus datos
// POST ?action=costos  { cuenta, costos: { MLA…: 1234 | null } } → guarda el costo unitario de cada producto
// POST ?action=config  { cuenta, impuestosPct }                 → impuestos sobre el precio (IIBB, etc.)
// GET  ?action=competencia&cuenta=ID&id=MLA…                   → otros vendedores del mismo producto de catálogo
// GET  ?action=ficha&cuenta=ID&id=MLA…                         → atributos, fotos y atributos que faltan según la categoría (Academia IA)
// GET  ?action=opiniones&cuenta=ID&ref=LINK|MLA…               → opiniones de cualquier publicación (propia o de la competencia)
// GET  ?action=demo                   → PÚBLICO: análisis de la cuenta demo (datos simulados) para sistema.html
// GET  ?action=tendencias&cat=MLA…|todas → PÚBLICO: términos en tendencia de /trends/MLA (3 completos; el admin ve todos).
//                                          Límite por IP, memoria de 24 h por categoría y demo:true si no hay token
// GET  ?action=cron                    → sincronización diaria (Vercel Cron, con CRON_SECRET)
import { getDB } from './db.js';
import { cors, isAdmin, ADMIN_SECRET, clientIp, rateLimit } from '../lib/http.js';
import { listAccounts, unlink, makeInvite, getAccessToken, MLNotLinked } from '../lib/ml.js';
import { analizarCuenta, CLASES } from '../lib/tracker.js';
import { cuentaDemo } from '../lib/tracker-demo.js';
import { sincronizar, datosCuenta } from '../lib/tracker-sync.js';
import { categoriasML, terminosML, recortar, respuestaDemo, catValida, TODAS } from '../lib/tendencias.js';


// Ficha de ejemplo para la cuenta demo (la real sale de /items y /categories/…/attributes)
function fichaDemo(id) {
  return {
    demo: true,
    categoria: { id: 'MLA1234', nombre: 'Categoría de ejemplo', ruta: 'Cuenta demo > Categoría de ejemplo' },
    condicion: 'new', tipo: 'gold_special', garantia: 'Garantía del vendedor · 30 días',
    fotos: id.endsWith('3') ? 7 : 4, variaciones: 0, descripcionLargo: 420,
    atributos: [
      { id: 'BRAND', nombre: 'Marca', valor: 'Genérica' },
      { id: 'ITEM_CONDITION', nombre: 'Condición del ítem', valor: 'Nuevo' },
    ],
    faltantes: [
      { id: 'GTIN', nombre: 'Código universal de producto', tipo: 'obligatorio' },
      { id: 'MODEL', nombre: 'Modelo', tipo: 'obligatorio' },
      { id: 'MATERIAL', nombre: 'Material', tipo: 'recomendado' },
      { id: 'COLOR', nombre: 'Color', tipo: 'recomendado' },
    ],
  };
}

// Opiniones simuladas para la cuenta demo (freidora de aire: la propia vs. un competidor)
function opinionesDemo(ref) {
  const propia = /MLA2000000004/.test(ref);
  const r = (rate, texto, fecha = '2026-08-10') => ({ rate, titulo: '', texto, fecha });
  const reviews = propia ? [
    r(5, 'Excelente, la canasta es grande y entran papas para 4 personas. Muy fácil de limpiar.'), r(5, 'Cocina rápido y parejo. El antiadherente viene muy bien.'),
    r(4, 'Buena calidad, un poco ruidosa pero cumple.'), r(5, 'Llegó al otro día, muy bien embalada.'), r(5, 'Fácil de usar, el panel digital es claro.'),
    r(3, 'Anda bien pero el cable es corto.'), r(5, 'La uso todos los días, muy práctica y fácil de limpiar.'), r(4, 'Buena relación precio calidad.'),
  ] : [
    r(2, 'La canasta es muy chica, entran papas para una sola persona.'), r(1, 'A los dos meses se empezó a pelar el antiadherente. Mala calidad.'),
    r(2, 'Muy ruidosa y el olor a plástico no se va.'), r(3, 'Cocina bien pero es chica para una familia.'), r(1, 'Dejó de funcionar al mes y la garantía no respondió.'),
    r(4, 'Buen precio, cumple.'), r(2, 'Difícil de limpiar, la grasa queda pegada.'), r(5, 'Llegó rápido y funciona bien.'), r(2, 'Chica, para dos personas no alcanza. El antiadherente se raya.'),
    r(3, 'El panel es confuso y el manual viene en inglés.'), r(4, 'Buena por el precio.'), r(1, 'Se peló el recubrimiento, no la recomiendo.'),
  ];
  const niveles = [1, 2, 3, 4, 5].reduce((o, n) => ({ ...o, [['one', 'two', 'three', 'four', 'five'][n - 1]]: reviews.filter(x => x.rate === n).length }), {});
  return { demo: true, id: propia ? 'MLA2000000004' : 'MLA3000000099', titulo: propia ? 'Freidora De Aire 4 Litros Digital 1500w Antiadherente' : 'Freidora De Aire 3,5 L Competidor', precio: propia ? 106000 : 84999,
    link: null, foto: null, promedio: +(reviews.reduce((t, x) => t + x.rate, 0) / reviews.length).toFixed(1), total: reviews.length, niveles, reviews };
}

async function analisis(db, id) {
  const datos = id === 'demo' ? cuentaDemo() : await datosCuenta(db, id);
  return analizarCuenta(datos);
}

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const action = req.query.action;

  // Demo pública: solo la cuenta simulada, nunca datos reales
  if (action === 'demo') {
    const { series, config, ...a } = analizarCuenta(cuentaDemo());
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ ...a, clases: CLASES, demo: true });
  }

  if (action === 'tendencias') return tendencias(req, res);

  let db;
  try { db = await getDB(); } catch { return res.status(503).json({ error: 'Sin conexión con la base de datos' }); }

  // Cron diario: sincroniza todas las cuentas con el tiempo que dé la función
  if (action === 'cron') {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado' });
    const vence = Date.now() + 50_000, hechas = [];
    for (const c of await listAccounts(db)) {
      if (c.status !== 'ok') continue;
      try {
        // Forzar una sincronización nueva si la anterior terminó
        if (!c.sync || c.sync.fase === 'listo') await db.collection('ml_accounts').updateOne({ _id: c._id }, { $set: { 'sync.fase': 'ids' } });
        let p;
        do { p = await sincronizar(db, c._id, { presupuestoMs: Math.max(1000, vence - Date.now()) }); } while (!p.listo && Date.now() < vence);
        hechas.push({ cuenta: c.nickname, ...p });
      } catch (e) { hechas.push({ cuenta: c.nickname, error: e.message }); }
      if (Date.now() >= vence) break;
    }
    return res.status(200).json({ ok: true, hechas });
  }

  if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });

  try {
    if (action === 'cuentas') {
      const cuentas = await listAccounts(db);
      return res.status(200).json({ cuentas: [...cuentas.map(c => ({
        id: c._id, nickname: c.nickname, principal: !!c.principal, status: c.status, error: c.error || null,
        linkedAt: c.linkedAt, ultimaSync: c.ultimaSync || null, sincronizando: !!c.sync && c.sync.fase !== 'listo',
        reputacion: c.reputacion || null, preguntasSinResponder: c.preguntasSinResponder ?? null,
      })), { id: 'demo', nickname: 'Cuenta demo', demo: true, status: 'ok' }], clases: CLASES });
    }

    if (action === 'cuenta') {
      const id = String(req.query.id || '');
      if (!id) return res.status(400).json({ error: 'Falta la cuenta' });
      const a = await analisis(db, id);
      const { series, ...resto } = a;
      return res.status(200).json({ ...resto, clases: CLASES, demo: id === 'demo' });
    }

    if (action === 'item') {
      const cuenta = String(req.query.cuenta || ''), id = String(req.query.id || '');
      const a = await analisis(db, cuenta);
      const it = a.items.find(i => i.id === id);
      if (!it) return res.status(404).json({ error: 'No encontré esa publicación' });
      return res.status(200).json({ item: it, serie: a.series[id], conversionMediana: a.resumen.conversionMediana, clases: CLASES, hoy: a.hoy, ventana: a.ventana });
    }

    if (action === 'sync' && req.method === 'POST') {
      const id = String(req.query.id || '');
      if (!id || id === 'demo') return res.status(400).json({ error: 'Esa cuenta no se sincroniza' });
      if (req.query.nueva === '1') await db.collection('ml_accounts').updateOne({ _id: id }, { $set: { 'sync.fase': 'ids' } });
      const p = await sincronizar(db, id, { presupuestoMs: 8000 });
      return res.status(200).json(p);
    }

    if (action === 'costos' && req.method === 'POST') {
      const { cuenta, costos } = req.body || {};
      if (!cuenta || cuenta === 'demo' || !costos || typeof costos !== 'object') return res.status(400).json({ error: 'Datos inválidos' });
      const ops = Object.entries(costos).slice(0, 2000).map(([id, v]) => {
        const n = v === null || v === '' ? null : Number(v);
        if (n === null) return { deleteOne: { filter: { _id: String(id), seller: String(cuenta) } } };
        if (!Number.isFinite(n) || n < 0) return null;
        return { updateOne: { filter: { _id: String(id) }, update: { $set: { seller: String(cuenta), costo: n, actualizado: new Date() } }, upsert: true } };
      }).filter(Boolean);
      if (ops.length) await db.collection('tk_costos').bulkWrite(ops, { ordered: false });
      return res.status(200).json({ ok: true, guardados: ops.length });
    }

    if (action === 'config' && req.method === 'POST') {
      const { cuenta, impuestosPct } = req.body || {};
      const imp = Number(impuestosPct);
      if (!cuenta || cuenta === 'demo' || !Number.isFinite(imp) || imp < 0 || imp > 60) return res.status(400).json({ error: 'Datos inválidos' });
      await db.collection('ml_accounts').updateOne({ _id: String(cuenta) }, { $set: { 'config.impuestosPct': imp } });
      return res.status(200).json({ ok: true });
    }

    if (action === 'opiniones') {
      const cuenta = String(req.query.cuenta || ''), ref = String(req.query.ref || '').trim();
      // Acepta un ID (MLA123…), un link de publicación (MLA-123…) o de catálogo (/p/MLA…)
      const cat = ref.match(/\/p\/(MLA\d+)/i), it = ref.match(/(MLA)-?(\d{6,})/i);
      if (!cat && !it) return res.status(400).json({ error: 'Pegá el link o el ID de una publicación de Mercado Libre' });
      if (cuenta === 'demo') return res.status(200).json(opinionesDemo(ref));
      const token = await getAccessToken(db, cuenta);
      const get = p => fetch('https://api.mercadolibre.com' + p, { headers: { Authorization: `Bearer ${token}` } }).then(x => x.ok ? x.json() : null).catch(() => null);
      let itemId = it && !cat ? `MLA${it[2]}` : null, titulo = null;
      if (cat) {   // producto de catálogo: se toma la publicación ganadora
        const pr = await get(`/products/${cat[1].toUpperCase()}`);
        itemId = pr?.buy_box_winner?.item_id || (await get(`/products/${cat[1].toUpperCase()}/items?limit=1`))?.results?.[0]?.item_id || null;
        titulo = pr?.name || null;
      }
      if (!itemId) return res.status(404).json({ error: 'No encontré esa publicación' });
      const item = await get(`/items/${itemId}?attributes=id,title,price,permalink,thumbnail,seller_id`);
      const reviews = [];
      let prom = null, niveles = null, total = 0;
      for (let off = 0; off < 200; off += 50) {
        const r = await get(`/reviews/item/${itemId}?limit=50&offset=${off}`);
        if (!r) break;
        prom ??= r.rating_average; niveles ??= r.rating_levels; total = r.paging?.total ?? total;
        reviews.push(...(r.reviews || []).map(x => ({ rate: x.rate, titulo: x.title || '', texto: x.content || '', fecha: x.date_created?.slice(0, 10) || null })));
        if (!r.reviews?.length || reviews.length >= total) break;
      }
      return res.status(200).json({ id: itemId, titulo: item?.title || titulo, precio: item?.price ?? null, link: item?.permalink || null, foto: item?.thumbnail || null,
        promedio: prom, total, niveles, reviews });
    }

    if (action === 'competencia') {
      const cuenta = String(req.query.cuenta || ''), id = String(req.query.id || '');
      let catalogo, propio;
      if (cuenta === 'demo') {
        const base = id === 'MLA2000000003' ? 38500 : 11900;
        const fila = (i, v, pr, eg, full, prop) => ({ posicion: i, item: 'MLA30000000' + i, propio: prop, vendedor: v, reputacion: '5_green', medalla: i === 1 ? 'platinum' : null, precio: pr, precioOriginal: null, envioGratis: eg, full, tipo: 'gold_special', tiendaOficial: false });
        return res.status(200).json({ demo: true, catalogo: 'MLA99999', total: 4, vendedores: id === 'MLA2000000003'
          ? [fila(1, 'COCINA_TOTAL', 36900, true, true, false), fila(2, 'CUENTA_DEMO', base, true, false, true), fila(3, 'HOGARMAX', 39990, true, false, false), fila(4, 'BAZARNORTE', 41500, false, false, false)]
          : [fila(1, 'CUENTA_DEMO', base, false, false, true), fila(2, 'MADERAS_SUR', 12900, false, false, false), fila(3, 'ELBAZAR', 13400, true, false, false)] });
      }
      const it = await db.collection('tk_items').findOne({ _id: id, seller: cuenta });
      if (!it?.catalog_product_id) return res.status(404).json({ error: 'Esta publicación no está en un catálogo' });
      catalogo = it.catalog_product_id; propio = cuenta;
      const token = await getAccessToken(db, cuenta);
      const H = { headers: { Authorization: `Bearer ${token}` } };
      const r = await fetch(`https://api.mercadolibre.com/products/${catalogo}/items?limit=20`, H).then(x => x.ok ? x.json() : null).catch(() => null);
      const lista = r?.results || [];
      const ids = [...new Set(lista.map(x => x.seller_id))].slice(0, 20);
      const nicks = {};
      await Promise.all(ids.map(async sid => {
        const u = await fetch(`https://api.mercadolibre.com/users/${sid}`, H).then(x => x.ok ? x.json() : null).catch(() => null);
        if (u) nicks[sid] = { nickname: u.nickname, nivel: u.seller_reputation?.level_id || null, medalla: u.seller_reputation?.power_seller_status || null };
      }));
      return res.status(200).json({
        catalogo, total: r?.paging?.total ?? lista.length,
        vendedores: lista.map((x, i) => ({
          posicion: i + 1, item: x.item_id, propio: String(x.seller_id) === propio, vendedor: nicks[x.seller_id]?.nickname || String(x.seller_id),
          reputacion: nicks[x.seller_id]?.nivel || null, medalla: nicks[x.seller_id]?.medalla || null,
          precio: x.price, precioOriginal: x.original_price || null, envioGratis: !!x.shipping?.free_shipping,
          full: x.shipping?.logistic_type === 'fulfillment', tipo: x.listing_type_id, tiendaOficial: !!x.official_store_id,
        })),
      });
    }

    if (action === 'ficha') {
      const cuenta = String(req.query.cuenta || ''), id = String(req.query.id || '');
      if (!/^[A-Z]{3}\d+$/.test(id)) return res.status(400).json({ error: 'Publicación inválida' });
      if (cuenta === 'demo') return res.status(200).json(fichaDemo(id));
      const it = await db.collection('tk_items').findOne({ _id: id, seller: cuenta }, { projection: { _id: 1 } });
      if (!it) return res.status(404).json({ error: 'No encontré esa publicación' });
      const token = await getAccessToken(db, cuenta);
      const H = { headers: { Authorization: `Bearer ${token}` } };
      const get = p => fetch('https://api.mercadolibre.com' + p, H).then(x => x.ok ? x.json() : null).catch(() => null);
      const item = await get(`/items/${id}`);
      if (!item) return res.status(502).json({ error: 'Mercado Libre no devolvió la publicación' });
      const [desc, cat, attrs] = await Promise.all([get(`/items/${id}/description`), get(`/categories/${item.category_id}`), get(`/categories/${item.category_id}/attributes`)]);
      const cargados = new Map((item.attributes || []).filter(a => a.value_name || a.value_id).map(a => [a.id, a]));
      const faltantes = (attrs || [])
        .filter(a => !a.tags?.hidden && !a.tags?.read_only && !cargados.has(a.id))
        .map(a => ({ id: a.id, nombre: a.name, tipo: a.tags?.required || a.tags?.catalog_required ? 'obligatorio' : a.tags?.conditional_required ? 'condicional' : a.relevance === 1 ? 'recomendado' : null }))
        .filter(a => a.tipo).slice(0, 30);
      const venta = t => (item.sale_terms || []).find(s => s.id === t)?.value_name || null;
      return res.status(200).json({
        categoria: { id: item.category_id, nombre: cat?.name || null, ruta: (cat?.path_from_root || []).map(c => c.name).join(' > ') || null },
        condicion: item.condition || null, tipo: item.listing_type_id || null,
        garantia: [venta('WARRANTY_TYPE'), venta('WARRANTY_TIME')].filter(Boolean).join(' · ') || null,
        fotos: item.pictures?.length ?? 0, variaciones: item.variations?.length ?? 0,
        descripcionLargo: desc?.plain_text?.length ?? 0,
        atributos: [...cargados.values()].slice(0, 60).map(a => ({ id: a.id, nombre: a.name, valor: a.value_name })),
        faltantes,
      });
    }

    if (action === 'invitar') {
      const base = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
      return res.status(200).json({ url: `${base}/api/ml?action=login&inv=${makeInvite(ADMIN_SECRET)}`, vence: '7 días' });
    }

    if (action === 'desvincular' && req.method === 'POST') {
      const id = String(req.query.id || '');
      if (!id || id === 'demo') return res.status(400).json({ error: 'Cuenta inválida' });
      await unlink(db, id);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Acción desconocida' });
  } catch (err) {
    if (err instanceof MLNotLinked) return res.status(409).json({ error: 'La cuenta perdió el acceso a Mercado Libre: hay que volver a vincularla.', code: 'ml_not_linked' });
    console.error('[tracker]', err);
    return res.status(500).json({ error: 'Algo falló al procesar la cuenta. Probá de nuevo.' });
  }
}

// ── Buscador de tendencias (público) ──
// Mismo patrón que la mini auditoría: límite por IP, memoria de 24 h en Mongo y un tope global
// de consultas nuevas a Mercado Libre. Sin token o sin base, responde el ejemplo marcado demo:true.
async function tendencias(req, res) {
  const cat = String(req.query.cat || TODAS);
  if (!catValida(cat)) return res.status(400).json({ error: 'Esa categoría no existe. Elegí una de la lista.' });
  const admin = isAdmin(req);
  res.setHeader('Cache-Control', admin ? 'no-store' : 'private, max-age=600');
  const demo = motivo => res.status(200).json(respuestaDemo(cat, { completo: admin, motivo }));

  let db;
  try {
    db = await Promise.race([getDB(), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 5000))]);
  } catch { return demo('sin_base'); }

  if (!admin && !(await rateLimit(db, `tendpub:${clientIp(req)}`, 40, 86400))) {
    return res.status(429).json({ code: 'limite_persona', error: 'Hoy ya miraste un montón de categorías: mañana se renueva. Si querés la lista completa de alguna, escribime y te la paso.' });
  }

  const cache = db.collection('tendencias_cache');
  const ultima = db.collection('tendencias_ultima'); // copia permanente del último dato real, para cuando Mercado Libre no responde
  await cache.createIndex({ at: 1 }, { expireAfterSeconds: 86400 }).catch(() => {});
  // Mercado Libre a veces corta las tendencias públicas ("Not found public trends"). Mientras dure,
  // se sirve la última copia real (con su fecha) o el ejemplo rotulado, y se reintenta como mucho una vez por hora.
  const sinTendencias = async () => {
    await cache.updateOne({ _id: 'caida' }, { $set: { at: new Date() } }, { upsert: true }).catch(() => {});
    const copia = await ultima.findOne({ _id: 't:' + cat }).catch(() => null);
    const cats = (await cache.findOne({ _id: 'categorias' }).catch(() => null)) || await ultima.findOne({ _id: 'categorias' }).catch(() => null);
    if (copia && cats) {
      const categoria = cat === TODAS ? { id: TODAS, nombre: 'Todo Mercado Libre' } : cats.lista.find(c => c.id === cat) || { id: cat, nombre: 'Categoría' };
      return res.status(200).json({ demo: false, copia: true, categoria, categorias: cats.lista, actualizado: copia.at, ...recortar(copia.lista, { completo: admin }) });
    }
    return demo('ml_sin_tendencias');
  };
  try {
    let [cats, terms] = await Promise.all([cache.findOne({ _id: 'categorias' }), cache.findOne({ _id: 't:' + cat })]);
    if (!terms) {
      const caida = await cache.findOne({ _id: 'caida' });
      if (caida && Date.now() - +caida.at < 3600e3) return sinTendencias();
    }
    if (!cats || !terms) {
      if (!admin && !(await rateLimit(db, 'tendpub:global', 300, 86400))) {
        return res.status(429).json({ code: 'limite_global', error: 'Por hoy llegamos al tope de consultas a Mercado Libre. Volvé mañana o escribime y te paso las tendencias de tu rubro.' });
      }
      let token;
      try { token = await getAccessToken(db); } catch (e) { if (e instanceof MLNotLinked) return demo('sin_token'); throw e; }
      if (!cats) {
        cats = { _id: 'categorias', lista: await categoriasML(token), at: new Date() };
        await cache.updateOne({ _id: cats._id }, { $set: { lista: cats.lista, at: cats.at } }, { upsert: true });
      }
      if (cat !== TODAS && !cats.lista.some(c => c.id === cat)) {
        return res.status(400).json({ error: 'Mercado Libre solo publica tendencias de categorías amplias. Elegí una de la lista.' });
      }
      if (!terms) {
        try {
          terms = { _id: 't:' + cat, lista: await terminosML(token, cat), at: new Date() };
        } catch (e) {
          if (e.status === 401) return demo('sin_token');
          if (e.status === 403 || e.status === 404) return sinTendencias();
          throw e;
        }
        await cache.updateOne({ _id: terms._id }, { $set: { lista: terms.lista, at: terms.at } }, { upsert: true });
        await Promise.all([
          ultima.updateOne({ _id: terms._id }, { $set: { lista: terms.lista, at: terms.at } }, { upsert: true }),
          ultima.updateOne({ _id: 'categorias' }, { $set: { lista: cats.lista, at: cats.at } }, { upsert: true }),
          cache.deleteOne({ _id: 'caida' }),
        ]).catch(() => {});
      }
    }
    const categoria = cat === TODAS ? { id: TODAS, nombre: 'Todo Mercado Libre' } : cats.lista.find(c => c.id === cat) || { id: cat, nombre: 'Categoría' };
    return res.status(200).json({
      demo: false, categoria, categorias: cats.lista, actualizado: terms.at,
      ...recortar(terms.lista, { completo: admin }),
    });
  } catch (err) {
    console.error('[tendencias]', err.message);
    return res.status(502).json({ error: 'Mercado Libre no me contestó a tiempo. Dale unos minutos y probá de nuevo.' });
  }
}
