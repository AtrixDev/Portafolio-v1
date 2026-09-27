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
// GET  ?action=cron                    → sincronización diaria (Vercel Cron, con CRON_SECRET)
import { getDB } from './db.js';
import { cors, isAdmin, ADMIN_SECRET } from '../lib/http.js';
import { listAccounts, unlink, makeInvite, getAccessToken, MLNotLinked } from '../lib/ml.js';
import { analizarCuenta, CLASES } from '../lib/tracker.js';
import { cuentaDemo } from '../lib/tracker-demo.js';
import { sincronizar, datosCuenta } from '../lib/tracker-sync.js';


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

async function analisis(db, id) {
  const datos = id === 'demo' ? cuentaDemo() : await datosCuenta(db, id);
  return analizarCuenta(datos);
}

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const action = req.query.action;

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


