// lib/resultados.js — persistencia de resultados de herramientas con link compartible.
// El resultado lo escribe SIEMPRE el servidor, a partir de lo que calculó. No hay endpoint para
// que el navegador "guarde" un resultado propio: así nadie puede fabricar un informe con mi nombre.
import { randomBytes } from 'node:crypto';

export const HERRAMIENTAS = ['chequeo', 'voz', 'catalogo', 'rentabilidad', 'importacion'];
const DIAS_VIDA = 90;
const ID_OK = /^[A-Za-z0-9_-]{8,16}$/;
const cortar = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// resumen = { titulo, veredicto, numero?, etiqueta?, cobertura?:{verificados,total}, puntos:[{ ok:true|false|null, t, s }], noVerificado:[{ t, s }] }
export function limpiarResumen(r = {}) {
  const c = r.cobertura;
  return {
    titulo: cortar(r.titulo, 160),
    veredicto: cortar(r.veredicto, 420),
    numero: Number.isFinite(r.numero) ? r.numero : null,
    etiqueta: cortar(r.etiqueta, 40),
    cobertura: c && Number.isFinite(c.verificados) && Number.isFinite(c.total) ? { verificados: c.verificados, total: c.total } : null,
    puntos: (Array.isArray(r.puntos) ? r.puntos : [])
      .map(p => ({ ok: p?.ok === true ? true : p?.ok === false ? false : null, t: cortar(p?.t, 120), s: cortar(p?.s, 200) }))
      .filter(p => p.t).slice(0, 8),
    noVerificado: (Array.isArray(r.noVerificado) ? r.noVerificado : [])
      .map(p => ({ t: cortar(p?.t, 80), s: cortar(p?.s, 200) })).filter(p => p.t).slice(0, 10),
  };
}

export async function guardarResultado(db, { herramienta, entrada, resumen, datos = null, fuente = 'reglas' }) {
  if (!HERRAMIENTAS.includes(herramienta)) throw new Error('herramienta desconocida: ' + herramienta);
  const col = db.collection('resultados');
  await col.createIndex({ expiraEn: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  const ahora = new Date();
  const doc = {
    _id: randomBytes(8).toString('base64url'),
    herramienta,
    entrada: cortar(entrada, 300),
    resumen: limpiarResumen(resumen),
    datos: datos && JSON.stringify(datos).length <= 20000 ? datos : null,
    fuente: fuente === 'ia' ? 'ia' : 'reglas',
    creadoEn: ahora,
    expiraEn: new Date(ahora.getTime() + DIAS_VIDA * 86400000),
  };
  await col.insertOne(doc);
  await sumarMetrica(db, herramienta, 'resultado');
  return { id: doc._id, url: `/herramientas.html?r=${doc._id}` };
}

export async function leerResultado(db, id) {
  if (!ID_OK.test(String(id || ''))) return null;
  const d = await db.collection('resultados').findOne({ _id: String(id) });
  if (!d) return null;
  return { id: d._id, herramienta: d.herramienta, entrada: d.entrada, resumen: d.resumen, datos: d.datos, fuente: d.fuente, creadoEn: d.creadoEn };
}

export const EVENTOS = ['resultado', 'compartir', 'lead'];
export async function sumarMetrica(db, herramienta, evento) {
  if (!HERRAMIENTAS.includes(herramienta) || !EVENTOS.includes(evento)) return;
  const dia = new Date().toISOString().slice(0, 10);
  await db.collection('metricas').updateOne(
    { _id: `${dia}:${herramienta}` },
    { $inc: { [evento]: 1 }, $setOnInsert: { dia, herramienta } },
    { upsert: true },
  ).catch(() => {});
}

// Texto plano del resultado (mail y mensaje del admin). Solo lo que el servidor guardó.
export function textoResultado(r, linkAbs) {
  const l = [r.resumen.titulo, r.resumen.veredicto].filter(Boolean);
  for (const p of r.resumen.puntos) l.push(`${p.ok === true ? '[OK]' : p.ok === false ? '[ATENCIÓN]' : '[-]'} ${p.t}${p.s ? ': ' + p.s : ''}`);
  if (r.resumen.noVerificado?.length) l.push('', 'Lo que no pude ver:', ...r.resumen.noVerificado.map(p => `- ${p.t}: ${p.s}`));
  if (linkAbs) l.push('', `Resultado completo: ${linkAbs}`);
  return l.join('\n');
}

// Resumen del chequeo público (reglas fijas, mismos umbrales que antes). Nunca declara "bien" sobre poca evidencia.
export function resumenChequeo(rapido) {
  const x = rapido.datos || {}, p = [];
  if (x.fotos != null) p.push({ ok: x.fotos >= 7, t: `${x.fotos} fotos`, s: x.fotos >= 7 ? 'Buena secuencia' : 'Lo ideal son 7 o más' });
  if (x.atributos != null) p.push({ ok: x.atributos >= 10, t: `${x.atributos} atributos`, s: x.atributos >= 10 ? 'Aparece en los filtros' : 'Cada atributo que falta te saca de un filtro' });
  if (x.descripcion != null) p.push({ ok: x.descripcion > 300, t: x.descripcion ? `Descripción de ${x.descripcion} caracteres` : 'Sin descripción', s: x.descripcion > 300 ? 'Tiene contenido' : 'No está ayudando a vender' });
  if (x.visitas != null) p.push({ ok: null, t: `${x.visitas} visitas`, s: 'Interés que recibe la publicación' });
  if (x.preguntas != null) p.push({ ok: null, t: `${x.preguntas} preguntas`, s: '' });
  if (x.opiniones != null) p.push({ ok: null, t: `${x.opiniones} opiniones`, s: '' });
  const evaluados = p.filter(q => q.ok !== null), mal = evaluados.filter(q => q.ok === false).length;
  const c = rapido.cobertura || null;
  const parcial = !c || c.verificados < c.total;
  const lo_visto = mal ? ` De lo que pude ver, ${mal} de ${evaluados.length} puntos necesitan trabajo.` : evaluados.length ? ' Lo que pude evaluar está bien, pero eso no alcanza para calificar la publicación.' : '';
  let veredicto;
  if (!p.length) veredicto = 'No pude leer datos de esta publicación.';
  else if (c && parcial) veredicto = `Auditoría parcial: Mercado Libre me dejó verificar ${c.verificados} de ${c.total} criterios. No doy puntaje porque sería engañoso.${lo_visto}`;
  else if (c) veredicto = mal ? `${mal} de ${evaluados.length} puntos verificables necesitan trabajo.` : 'Los puntos verificables están bien.';
  else veredicto = `Auditoría parcial: solo pude leer ${p.length} datos.${lo_visto}`;
  return {
    titulo: rapido.item?.title || 'Publicación de Mercado Libre',
    veredicto,
    etiqueta: parcial ? 'Auditoría parcial' : rapido.catalogo ? 'Catálogo' : 'Publicación',
    cobertura: c,
    puntos: p,
    noVerificado: rapido.noVerificado || [],
  };
}
