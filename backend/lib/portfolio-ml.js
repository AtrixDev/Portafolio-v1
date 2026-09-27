// lib/portfolio-ml.js — Extrae de un link de Mercado Libre lo que sirve para el portfolio
// y estima si la publicación la creaste o la rehiciste vos en un período.
//
// Cómo se atribuye: cada foto de ML lleva en su ID el mes en que se subió
// (…-MLA100079639351_122025 → dic 2025). Si el catálogo se creó en tu período es "Creado";
// si varias fotos de la galería (sin contar la portada, que ML reprocesa sola) son de tu
// período es "Rehecho". No es prueba absoluta: la marca o ML también pueden subir fotos.
import { getAccessToken } from './ml.js';

const API = 'https://api.mercadolibre.com';
export const TIENDA_VENI = 203884;   // official_store_id de Vení a la Cocina

export const CLASES = {
  creado:   'Catálogo creado',
  rehecho:  'Publicación rehecha',
  retocado: 'Retocada',
  ninguna:  'Sin evidencia',
};

// IDs que se pueden sacar del link
export function parseLink(url) {
  const u = String(url || '');
  const catalogo = u.match(/\/p\/(MLA\d+)/)?.[1] || null;
  const up = u.match(/\/up\/(MLAU\d+)/)?.[1] || null;
  const item = u.match(/[?&#](?:wid|item_id)=(MLA\d+)/)?.[1]
    || u.match(/articulo\.mercadolibre\.com\.ar\/(MLA)-?(\d+)/)?.slice(1, 3).join('')
    || null;
  return { catalogo, up, item };
}

// "…-MLA100079639351_122025-F.jpg" o "756859-MLA100079639351_122025" → "2025-12"
export function mesDeFoto(ref) {
  const m = String(ref || '').match(/ML[AU]\d+_(\d{2})(\d{4})/);
  return m ? `${m[2]}-${m[1]}` : '';
}

export function clasificar({ catalogoCreado, meses, desde, hasta }) {
  const en = m => m && m >= desde && m <= hasta;
  const resto = meses.slice(1);
  const tuyas = resto.filter(en).length;
  let clase = 'ninguna';
  if (en((catalogoCreado || '').slice(0, 7))) clase = 'creado';
  else if (tuyas >= 3 || (resto.length >= 2 && tuyas / resto.length >= 0.6)) clase = 'rehecho';
  else if (tuyas >= 1) clase = 'retocado';
  return { clase, fotosPeriodo: tuyas + (en(meses[0]) ? 1 : 0) };
}

// "+5 mil vendidos" → 5000 · "+1000 vendidos" → 1000 · "4 vendidos" → 4
export function parseVendidos(txt) {
  const m = String(txt || '').match(/\+?\s*([\d.]+)\s*(mil)?\s*vendid/i);
  return m ? Number(m[1].replace(/\./g, '')) * (m[2] ? 1000 : 1) : null;
}

export function formatoVendidos(n) {
  if (!n) return '';
  if (n >= 1000 && n % 1000 === 0 && n > 1000) return `+${n / 1000} mil vendidos`;
  if (n >= 5) return `+${n.toLocaleString('es-AR')} vendidos`;
  return `${n} vendido${n === 1 ? '' : 's'}`;
}

export function logroSugerido({ vendidos, opiniones, rating }) {
  return [
    formatoVendidos(vendidos),
    opiniones ? `★ ${rating ? rating.toFixed(1).replace('.', ',') : '-'} (${opiniones.toLocaleString('es-AR')} opiniones)` : '',
  ].filter(Boolean).join(' · ');
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!res?.ok) return null;
  return res.json().catch(() => null);
}

// ML suele bloquear las páginas desde servidores: si responde, sacamos vendidos, título y galería
async function leerHTML(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)', 'Accept-Language': 'es-AR,es;q=0.9' },
      redirect: 'follow', signal: AbortSignal.timeout(5000),
    });
    if (!res.ok || /account-verification|captcha/.test(res.url)) return null;
    const html = await res.text();
    if (!html.includes('ui-pdp')) return null;
    const sub = html.match(/ui-pdp-subtitle[^>]*>([^<]*)</)?.[1] || '';
    const galeria = [...new Set([...html.matchAll(/ui-pdp-gallery__figure[\s\S]*?(?:data-zoom|src)="(https:\/\/http2\.mlstatic\.com[^"]+)"/g)].map(m => m[1]))];
    const rv = html.replace(/<[^>]+>/g, ' ').match(/Calificación ([\d.]+) de 5\. (\d+) opiniones/);
    return {
      titulo: html.match(/<h1[^>]*ui-pdp-title[^>]*>([^<]+)</)?.[1]?.trim() || '',
      vendidos: parseVendidos(sub),
      galeria,
      rating: rv ? Number(rv[1]) : null,
      opiniones: rv ? Number(rv[2]) : null,
      item: html.match(/"item_id":"(MLA\d+)"/)?.[1] || null,
    };
  } catch { return null; }
}

const fotoURL = id => `https://http2.mlstatic.com/D_NQ_NP_${id}-O.webp`;

// ── Extracciones guardadas (colección pf_fuente) ──────────────────────────
// ML bloquea las páginas desde el servidor, así que los vendidos y las galerías de las
// publicaciones /up/ se leen con un navegador real (tools/extraer-ml.py) y se guardan acá.
export function normalizarFuente(r = {}) {
  const galeria = (Array.isArray(r.galeria) ? r.galeria : []).map(u => String(u)).filter(u => /^https:\/\/http2\.mlstatic\.com\//.test(u)).slice(0, 20);
  const ids = parseLink(r.url || '');
  const item = /^MLA\d+$/.test(r.item || '') ? r.item : ids.item;
  if (!item) return null;
  return {
    _id: item, item,
    catalogo: /^MLA\d+$/.test(r.catalogo || '') ? r.catalogo : ids.catalogo,
    up: /^MLAU\d+$/.test(r.up || '') ? r.up : ids.up,
    url: String(r.url || '').split(/[?#]/)[0].slice(0, 400),
    titulo: String(r.titulo || '').slice(0, 200),
    marca: String(r.marca || '').slice(0, 80),
    vendidos: Number.isFinite(+r.vendidos) && r.vendidos !== null ? +r.vendidos : null,
    opiniones: Number.isFinite(+r.opiniones) && r.opiniones !== null ? +r.opiniones : null,
    rating: Number.isFinite(+r.rating) && r.rating ? +r.rating : null,
    galeria, meses: galeria.map(mesDeFoto),
    catalogoCreado: String(r.catalogoCreado || '').slice(0, 10),
    tienda: Number(r.tienda) || null,
    actualizado: new Date(),
  };
}

export async function guardarFuentes(db, registros) {
  const docs = (registros || []).map(normalizarFuente).filter(Boolean);
  if (!docs.length) return 0;
  const col = db.collection('pf_fuente');
  await col.bulkWrite(docs.map(d => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } })));
  return docs.length;
}

async function buscarFuente(db, { item, up, catalogo }) {
  const or = [item && { item }, up && { up }, catalogo && { catalogo }].filter(Boolean);
  if (!or.length) return null;
  return db.collection('pf_fuente').findOne({ $or: or }, { sort: { tienda: -1 } }).catch(() => null);
}

// Todo lo que se puede saber de un link. Nunca tira error por datos faltantes: devuelve `faltan`.
export async function extraerPublicacion(db, url, { desde = '2025-06', hasta = '2025-12', tienda = TIENDA_VENI } = {}) {
  const ids = parseLink(url);
  const out = {
    url: String(url || '').split('#')[0], ids, titulo: '', marca: '', imagen: '', galeria: [], meses: [],
    catalogoCreado: '', vendidos: null, opiniones: null, rating: null, item: ids.item, fuentes: [], faltan: [],
  };

  let token = null;
  try { token = await getAccessToken(db); } catch { out.faltan.push('cuenta de ML vinculada (para leer el catálogo)'); }

  if (ids.catalogo && token) {
    const p = await get(`/products/${ids.catalogo}`, token);
    if (p) {
      out.fuentes.push('catálogo');
      out.titulo = p.name || '';
      out.marca = (p.attributes || []).find(a => a.id === 'BRAND')?.value_name || '';
      out.catalogoCreado = (p.date_created || '').slice(0, 10);
      out.galeria = (p.pictures || []).map(x => fotoURL(x.id));
      out.meses = (p.pictures || []).map(x => mesDeFoto(x.id));
      out.url = `https://www.mercadolibre.com.ar/p/${ids.catalogo}`;
      // La publicación de la tienda dentro del catálogo (para sus opiniones)
      if (!out.item) {
        const its = await get(`/products/${ids.catalogo}/items?limit=100`, token);
        out.item = its?.results?.find(r => r.official_store_id === tienda)?.item_id || null;
      }
    }
  }

  // Extracción guardada (vendidos, galería y opiniones leídos con navegador real)
  const f = await buscarFuente(db, { item: out.item, up: ids.up, catalogo: ids.catalogo });
  if (f) {
    out.fuentes.push('extracción guardada');
    out.item ||= f.item;
    out.titulo ||= f.titulo; out.marca ||= f.marca;
    out.catalogoCreado ||= f.catalogoCreado;
    if (!out.galeria.length && f.galeria?.length) { out.galeria = f.galeria; out.meses = f.meses; }
    out.vendidos = f.vendidos; out.opiniones = f.opiniones; out.rating = f.rating;
    if (!ids.catalogo && f.url) out.url = f.url;
  }

  const html = f ? null : await leerHTML(out.item ? `https://articulo.mercadolibre.com.ar/MLA-${out.item.slice(3)}` : url);
  if (html) {
    out.fuentes.push('página');
    out.titulo ||= html.titulo;
    out.vendidos = html.vendidos;
    out.item ||= html.item;
    if (!out.galeria.length && html.galeria.length) { out.galeria = html.galeria; out.meses = html.galeria.map(mesDeFoto); }
    out.opiniones = html.opiniones; out.rating = html.rating;
  }

  if (out.item && token && out.opiniones == null) {
    const r = await get(`/reviews/item/${out.item}?limit=1`, token);
    if (r) { out.fuentes.push('opiniones'); out.opiniones = r.paging?.total ?? null; out.rating = r.rating_average || null; }
  }

  out.imagen = out.galeria[0] || '';
  const c = clasificar({ catalogoCreado: out.catalogoCreado, meses: out.meses, desde, hasta });
  out.clase = c.clase; out.claseTxt = CLASES[c.clase]; out.fotosPeriodo = c.fotosPeriodo;
  out.logro = logroSugerido(out);
  if (!out.titulo) out.faltan.push('título');
  if (!out.galeria.length) out.faltan.push('fotos (sin ellas no se puede atribuir)');
  if (out.vendidos == null) out.faltan.push('vendidos (ML no deja leerlos desde el servidor: cargalos a mano si los sabés)');
  return out;
}
