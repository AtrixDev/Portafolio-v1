// lib/tracker-sync.js — Sincroniza una cuenta de ML con Mongo para ML Tracker
// Trabaja por tandas con un presupuesto de tiempo: si no termina, guarda por dónde iba
// y la próxima llamada sigue desde ahí (el panel la llama en bucle mostrando el progreso).
//
// Colecciones:
//   tk_items   { _id: itemId, seller, title, price, available_quantity, status, ..., ptw }
//   tk_visitas { _id: itemId, seller, dias: { 'YYYY-MM-DD': n } }
//   tk_ordenes { _id: orderId, seller, dia, status, items: [{ id, u, p }] }
//   tk_fotos   { _id: 'itemId:dia', item, seller, dia, precio, stock }   ← foto diaria de precio y stock
import { getAccessToken, MLNotLinked } from './ml.js';
import { diaAR, sumarDias, HISTORIA } from './tracker.js';

const API = 'https://api.mercadolibre.com';
const CAMPOS = 'id,title,price,original_price,available_quantity,sold_quantity,status,thumbnail,secure_thumbnail,permalink,catalog_listing,catalog_product_id,listing_type_id,date_created,category_id,health,shipping';
const CAMPOS_BULK = CAMPOS.split(',').map(c => `body.${c}`).join(',');

async function ml(path, token, intentos = 3) {
  for (let i = 0; i < intentos; i++) {
    const res = await fetch(API + path, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12000) }).catch(() => null);
    if (res?.status === 401) throw new MLNotLinked('El token de Mercado Libre fue rechazado');
    if (res?.ok) return res.json();
    if (res && res.status !== 429 && res.status < 500) return null;      // 403/404: no hay dato
    await new Promise(r => setTimeout(r, 600 * (i + 1)));              // 429/5xx: reintento
  }
  return null;
}

// Ejecuta tareas con N en paralelo, cortando si se acaba el tiempo
async function enParalelo(tareas, n, vence) {
  let i = 0;
  const hechas = [];
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < tareas.length && Date.now() < vence) { const k = i++; hechas[k] = await tareas[k](); }
  }));
  return hechas.filter(x => x !== undefined).length;
}

export async function sincronizar(db, sellerId, { presupuestoMs = 8000 } = {}) {
  const inicio = Date.now(), vence = inicio + presupuestoMs;
  const cuentas = db.collection('ml_accounts');
  const cuenta = await cuentas.findOne({ _id: String(sellerId) });
  if (!cuenta) throw new MLNotLinked('Cuenta no vinculada');
  const token = await getAccessToken(db, sellerId);
  const seller = String(sellerId);
  const hoy = diaAR();
  let st = cuenta.sync?.fase && cuenta.sync.fase !== 'listo' ? cuenta.sync : { fase: 'ids', iniciada: new Date() };
  const guardar = extra => cuentas.updateOne({ _id: seller }, { $set: { sync: { ...st, ...extra } } });

  const items = db.collection('tk_items'), visitas = db.collection('tk_visitas'), ordenes = db.collection('tk_ordenes'), fotos = db.collection('tk_fotos');

  // 1. Todas las publicaciones activas y pausadas de la cuenta
  if (st.fase === 'ids') {
    const ids = [];
    for (const status of ['active', 'paused']) {
      let scroll = null;
      for (let pag = 0; pag < 200; pag++) {
        const q = `/users/${seller}/items/search?status=${status}&search_type=scan&limit=100${scroll ? `&scroll_id=${scroll}` : ''}`;
        const r = await ml(q, token);
        if (!r?.results?.length) break;
        ids.push(...r.results); scroll = r.scroll_id;
        if (!scroll) break;
      }
    }
    st = { ...st, fase: 'items', ids: [...new Set(ids)], cursor: 0 };
    await guardar();
  }

  // 2. Detalle de cada publicación (de a 20) + foto diaria de precio y stock
  if (st.fase === 'items') {
    const lotes = [];
    for (let i = st.cursor; i < st.ids.length; i += 20) lotes.push(st.ids.slice(i, i + 20));
    let hechos = 0;
    await enParalelo(lotes.map(lote => async () => {
      // /items/bulk reemplaza a /items?ids= (ML lo depreca el 25/10/2026): los campos van con prefijo body.
      const r = await ml(`/items/bulk?ids=${lote.join(',')}&attributes=${CAMPOS_BULK}`, token);
      const ops = [], fops = [];
      for (const x of r || []) {
        if (!x.body || (x.status_code ?? x.code ?? 200) !== 200) continue;
        const b = x.body;
        const doc = {
          seller, title: b.title, price: b.price, original_price: b.original_price ?? null,
          available_quantity: b.available_quantity, sold_quantity: b.sold_quantity, status: b.status,
          thumbnail: (b.secure_thumbnail || b.thumbnail || '').replace(/^http:/, 'https:'), permalink: b.permalink,
          catalog_listing: !!b.catalog_listing, catalog_product_id: b.catalog_product_id || null,
          listing_type_id: b.listing_type_id, date_created: b.date_created, category_id: b.category_id,
          health: b.health ?? null, envioGratis: !!b.shipping?.free_shipping, logistica: b.shipping?.logistic_type || null, actualizado: new Date(),
        };
        ops.push({ updateOne: { filter: { _id: b.id }, update: { $set: doc }, upsert: true } });
        fops.push({ updateOne: { filter: { _id: `${b.id}:${hoy}` }, update: { $set: { item: b.id, seller, dia: hoy, precio: b.price, stock: b.available_quantity } }, upsert: true } });
      }
      if (ops.length) await items.bulkWrite(ops, { ordered: false });
      if (fops.length) await fotos.bulkWrite(fops, { ordered: false });
      hechos += lote.length;
    }), 4, vence);
    st.cursor += hechos;
    if (st.cursor >= st.ids.length) { st = { ...st, fase: 'catalogo', cursor: 0 }; }
    await guardar();
    if (Date.now() >= vence) return progreso(st);
  }

  // 3. Precio para ganar en publicaciones de catálogo
  if (st.fase === 'catalogo') {
    const cat = await items.find({ seller, catalog_listing: true, status: 'active' }, { projection: { _id: 1 } }).toArray();
    const pendientes = cat.slice(st.cursor);
    const n = await enParalelo(pendientes.map(it => async () => {
      const r = await ml(`/items/${it._id}/price_to_win?siteId=MLA&version=v2`, token);
      if (r) await items.updateOne({ _id: it._id }, { $set: { ptw: { status: r.status, price_to_win: r.price_to_win, current_price: r.current_price, visit_share: r.visit_share, competidores: r.competitors_sharing_first_place, reason: r.reason, dia: hoy } } });
      return true;
    }), 6, vence);
    st.cursor += n;
    if (st.cursor >= cat.length) st = { ...st, fase: 'calidad', cursor: 0 };
    await guardar();
    if (Date.now() >= vence) return progreso(st);
  }

  // 3b. Calidad de publicación según Mercado Libre (puntaje y qué falta completar)
  if (st.fase === 'calidad') {
    const pendientes = st.ids.slice(st.cursor);
    const n = await enParalelo(pendientes.map(id => async () => {
      const r = await ml(`/item/${id}/performance`, token);
      if (r?.score != null) {
        const faltan = [];
        for (const b of r.buckets || []) for (const v of b.variables || []) {
          if (v.status !== 'PENDING') continue;
          faltan.push({ grupo: b.title, titulo: v.title, detalle: (v.rules || []).filter(x => x.status === 'PENDING').map(x => x.wordings?.title).filter(Boolean) });
        }
        await items.updateOne({ _id: id }, { $set: { calidad: { score: r.score, nivel: r.level_wording || r.level, faltan, dia: hoy } } });
      }
      return true;
    }), 8, vence);
    st.cursor += n;
    if (st.cursor >= st.ids.length) st = { ...st, fase: 'costos', cursor: 0 };
    await guardar();
    if (Date.now() >= vence) return progreso(st);
  }

  // 3c. Comisión de venta (según precio, tipo de publicación y categoría) y costo del envío gratis
  if (st.fase === 'costos') {
    const lista = await items.find({ seller, status: 'active' }, { projection: { price: 1, listing_type_id: 1, category_id: 1, envioGratis: 1 } }).toArray();
    const pendientes = lista.slice(st.cursor);
    const comisiones = new Map();
    const n = await enParalelo(pendientes.map(it => async () => {
      const clave = `${it.price}|${it.listing_type_id}|${it.category_id}`;
      if (!comisiones.has(clave)) comisiones.set(clave, ml(`/sites/MLA/listing_prices?price=${it.price}&listing_type_id=${it.listing_type_id}&category_id=${it.category_id}`, token));
      const [lp, envio] = await Promise.all([
        comisiones.get(clave),
        it.envioGratis ? ml(`/users/${seller}/shipping_options/free?item_id=${it._id}`, token) : null,
      ]);
      await items.updateOne({ _id: it._id }, { $set: {
        comision: lp ? { monto: lp.sale_fee_amount, pct: lp.sale_fee_details?.percentage_fee ?? null, fijo: lp.sale_fee_details?.fixed_fee ?? 0, tipo: lp.listing_type_name } : null,
        costoEnvio: envio?.coverage?.all_country?.list_cost ?? null,
      } });
      return true;
    }), 6, vence);
    st.cursor += n;
    if (st.cursor >= lista.length) st = { ...st, fase: 'visitas', cursor: 0 };
    await guardar();
    if (Date.now() >= vence) return progreso(st);
  }

  // 4. Visitas por día de cada publicación (la primera vez, 150 días; después, lo que falte)
  if (st.fase === 'visitas') {
    const desde = cuenta.visitasHasta || sumarDias(hoy, -HISTORIA - 1);
    const ultimos = Math.min(HISTORIA, Math.max(2, Math.round((Date.parse(hoy) - Date.parse(desde)) / 864e5) + 2));
    const pendientes = st.ids.slice(st.cursor);
    const n = await enParalelo(pendientes.map(id => async () => {
      const r = await ml(`/items/${id}/visits/time_window?last=${ultimos}&unit=day`, token);
      const set = {};
      for (const d of r?.results || []) { const dia = d.date.slice(0, 10); if (dia < hoy) set[`dias.${dia}`] = d.total; }
      await visitas.updateOne({ _id: id }, { $set: { seller, ...set } }, { upsert: true });
      return true;
    }), 8, vence);
    st.cursor += n;
    if (st.cursor >= st.ids.length) st = { ...st, fase: 'ventas', cursor: 0, ventasDesde: null };
    await guardar();
    if (Date.now() >= vence) return progreso(st);
  }

  // 5. Ventas (órdenes). Se releen los últimos 15 días para tomar cancelaciones.
  if (st.fase === 'ventas') {
    const desdeDia = st.ventasDesde || (cuenta.ventasHasta ? sumarDias(cuenta.ventasHasta, -15) : sumarDias(hoy, -HISTORIA - 1));
    let desde = new Date(desdeDia + 'T03:00:00.000Z');
    const fin = new Date();
    while (desde < fin && Date.now() < vence) {
      const hasta = new Date(Math.min(fin.getTime(), desde.getTime() + 7 * 864e5));
      for (let offset = 0; offset < 10000; offset += 50) {
        const q = `/orders/search?seller=${seller}&order.date_created.from=${desde.toISOString()}&order.date_created.to=${hasta.toISOString()}&sort=date_asc&limit=50&offset=${offset}`;
        const r = await ml(q, token);
        const ops = (r?.results || []).map(o => ({ updateOne: { filter: { _id: String(o.id) }, upsert: true, update: { $set: {
          seller, dia: diaAR(o.date_created), status: o.status,
          items: (o.order_items || []).map(oi => ({ id: oi.item?.id, u: oi.quantity, p: oi.unit_price })),
        } } } }));
        if (ops.length) await ordenes.bulkWrite(ops, { ordered: false });
        if (!r || offset + 50 >= (r.paging?.total || 0)) break;
      }
      desde = hasta;
      st.ventasDesde = diaAR(desde);
    }
    if (desde >= fin) st = { ...st, fase: 'extras' };
    await guardar();
    if (Date.now() >= vence) return progreso(st);
  }

  // 6. Reputación y preguntas sin responder
  if (st.fase === 'extras') {
    const [u, q] = await Promise.all([
      ml(`/users/${seller}`, token),
      ml(`/questions/search?seller_id=${seller}&status=UNANSWERED&limit=50&sort_fields=date_created&sort_types=ASC&api_version=4`, token),
    ]);
    const preguntas = (q?.questions || []).map(x => ({ id: x.id, item: x.item_id, texto: String(x.text || '').slice(0, 400), fecha: x.date_created }));
    const rep = u?.seller_reputation || {};
    await cuentas.updateOne({ _id: seller }, { $set: {
      reputacion: { nivel: rep.level_id || null, medalla: rep.power_seller_status || null, ventas: rep.transactions?.completed ?? null,
        reclamos: rep.metrics?.claims?.rate ?? null, demoras: rep.metrics?.delayed_handling_time?.rate ?? null, canceladas: rep.metrics?.cancellations?.rate ?? null },
      preguntasSinResponder: q?.total ?? null, preguntas,
      visitasHasta: sumarDias(hoy, -1), ventasHasta: hoy, ultimaSync: new Date(),
    } });
    st = { fase: 'listo', terminada: new Date() };
    await guardar();
  }
  return progreso(st);
}

function progreso(st) {
  const pasos = ['ids', 'items', 'catalogo', 'calidad', 'costos', 'visitas', 'ventas', 'extras', 'listo'];
  const txt = { ids: 'Buscando publicaciones', items: 'Leyendo publicaciones', catalogo: 'Revisando catálogo', calidad: 'Calidad de publicaciones', costos: 'Comisiones y envíos', visitas: 'Trayendo visitas', ventas: 'Trayendo ventas', extras: 'Reputación y preguntas', listo: 'Listo' };
  const total = st.ids?.length || 0;
  return {
    listo: st.fase === 'listo', fase: st.fase, texto: txt[st.fase] || st.fase,
    paso: pasos.indexOf(st.fase) + 1, pasos: pasos.length - 1,
    detalle: ['items', 'visitas', 'calidad'].includes(st.fase) && total ? `${Math.min(st.cursor, total)} de ${total}` : st.fase === 'ventas' && st.ventasDesde ? `hasta el ${st.ventasDesde}` : '',
  };
}

// Arma los datos que necesita analizarCuenta() a partir de lo guardado
export async function datosCuenta(db, sellerId) {
  const seller = String(sellerId);
  const desde = sumarDias(diaAR(), -HISTORIA - 2);
  const [items, vis, ords, fts, costos, cuenta] = await Promise.all([
    db.collection('tk_items').find({ seller, status: { $in: ['active', 'paused'] } }).toArray(),
    db.collection('tk_visitas').find({ seller }).toArray(),
    db.collection('tk_ordenes').find({ seller, dia: { $gte: desde }, status: { $in: ['paid', 'partially_paid', 'partially_refunded'] } }).toArray(),
    db.collection('tk_fotos').find({ seller, dia: { $gte: desde } }).toArray(),
    db.collection('tk_costos').find({ seller }).toArray(),
    db.collection('ml_accounts').findOne({ _id: seller }, { projection: { config: 1, preguntas: 1 } }),
  ]);
  const datos = {
    items: items.map(i => ({ ...i, id: i._id })), visitas: {}, ventas: {}, fotos: {}, catalogo: {},
    costos: Object.fromEntries(costos.map(c => [c._id, c.costo])),
    config: { impuestosPct: 0, acosObjetivo: null, ...(cuenta?.config || {}) },
    preguntas: cuenta?.preguntas || [],
  };
  for (const v of vis) datos.visitas[v._id] = v.dias || {};
  for (const o of ords) for (const it of o.items || []) {
    const m = (datos.ventas[it.id] ||= {}), d = (m[o.dia] ||= { u: 0, r: 0 });
    d.u += it.u || 0; d.r += (it.u || 0) * (it.p || 0);
  }
  for (const f of fts) (datos.fotos[f.item] ||= {})[f.dia] = { precio: f.precio, stock: f.stock };
  for (const i of items) if (i.ptw) datos.catalogo[i._id] = i.ptw;
  return datos;
}
