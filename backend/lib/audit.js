// lib/audit.js — Score de salud y plan de acción de una publicación
// Portado de ML Tracker (server/utils/scoring.js + routes/audit.js)

export const PESOS = { fotos: 25, titulo: 20, descripcion: 20, stock: 15, estado: 10, atributos: 5, garantia: 5 };
// Debajo de este peso verificado (de 100) no se publica un puntaje: sería normalizar casi nada
export const EVIDENCIA_MINIMA = 50;
const U = { fotos_optimo: 7, fotos_bueno: 4, fotos_minimo: 1, titulo_optimo: 60, titulo_bueno: 40, titulo_minimo: 20, atributos_bueno: 5, stock_bajo: 3 };

export function parseMlaId(raw) {
  let input;
  try { input = decodeURIComponent(String(raw)).trim(); } catch { input = String(raw).trim(); }
  if (/^MLA\d+$/i.test(input)) return input.toUpperCase();
  const wid = input.match(/[?&#]wid=(MLA\d+)/i);
  if (wid) return wid[1].toUpperCase();
  const todos = [...input.matchAll(/MLA-?(\d+)/gi)].sort((a, b) => b[1].length - a[1].length);
  if (todos.length) return `MLA${todos[0][1]}`;
  // Número suelto, tal como aparece abajo de la publicación: "Publicación #930748913"
  const num = input.match(/^(?:publicaci[oó]n\s*)?#?\s*(\d{8,13})$/i);
  return num ? `MLA${num[1]}` : null;
}

export function esUrlCatalogo(url) {
  return /\/p\/MLA/i.test(url);
}

// Ficha de producto del vendedor (/up/MLAU…): no trae el número de la publicación
export function esUrlUserProduct(url) {
  return /\/up\/MLAU\d+/i.test(url);
}

// Título aproximado a partir del link: /lampara-infrarroja-75-w/up/MLAU… o /MLA-123-lampara-infrarroja-_JM
export function tituloDesdeUrl(url) {
  let path;
  try { path = new URL(url).pathname; } catch { return ''; }
  const seg = path.split('/').filter(Boolean);
  let slug = '';
  const i = seg.findIndex(x => /^(up|p)$/i.test(x));
  if (i > 0) slug = seg[i - 1];
  else { const m = path.match(/MLA-?\d+-(.+?)(?:-_JM)?$/i); if (m) slug = m[1]; }
  slug = decodeURIComponent(slug).replace(/-+/g, ' ').trim();
  return slug ? slug[0].toUpperCase() + slug.slice(1) : '';
}

// Datos que no se pudieron leer (no se penalizan: el score se calcula sobre lo verificable)
function desconocidos(item) {
  if (item._faltan) return new Set(item._faltan);
  return new Set(item._datos_parciales ? ['descripcion', 'atributos', 'garantia'] : []);
}

export function scorePublicacion(item) {
  const problemas = [], mejoras = [], checks = {};
  let score = 100;
  const faltan = desconocidos(item);

  // Fotos
  const fotos = item.pictures?.length || 0;
  checks.fotoHero = faltan.has('fotos') ? null : fotos >= U.fotos_minimo;
  checks.fotos7   = faltan.has('fotos') ? null : fotos >= U.fotos_optimo;
  if (faltan.has('fotos')) { /* no se pudo leer */ }
  else if (fotos === 0) { score -= PESOS.fotos; problemas.push('Sin fotos: impacto crítico en conversión'); }
  else if (fotos < U.fotos_bueno) { score -= PESOS.fotos * 0.5; mejoras.push(`${fotos} foto${fotos > 1 ? 's' : ''}: completá la secuencia de 7`); }
  else if (fotos < U.fotos_optimo) { score -= PESOS.fotos * 0.15; mejoras.push(`${fotos} fotos: podés agregar hasta 7 para máxima conversión`); }

  // Título
  const len = (item.title || '').length;
  checks.titulo = faltan.has('titulo') ? null : len >= U.titulo_bueno;
  if (faltan.has('titulo')) { /* sin título */ }
  else if (len < U.titulo_minimo) { score -= PESOS.titulo; problemas.push('Título demasiado corto: no rankea en búsquedas'); }
  else if (len < U.titulo_bueno) { score -= PESOS.titulo * 0.4; mejoras.push('Título corto: expandí con características y beneficios'); }
  else if (len < U.titulo_optimo) { score -= PESOS.titulo * 0.1; mejoras.push('Título bueno: podés aprovechar más caracteres para más keywords'); }

  // Descripción
  const tieneDesc = (item.descripcion?.length || 0) > 50;
  checks.descripcion = faltan.has('descripcion') ? null : tieneDesc;
  if (!tieneDesc && !faltan.has('descripcion')) { score -= PESOS.descripcion; problemas.push('Sin descripción: pierde conversión en el paso final'); }

  // Stock
  const qty = item.available_quantity ?? null;
  checks.stock = qty === null ? null : qty > 0;
  if (qty === 0) { score -= PESOS.stock; problemas.push('Sin stock: publicación invisible en búsquedas'); }
  else if (qty !== null && qty < U.stock_bajo) { score -= PESOS.stock * 0.4; mejoras.push(`Stock bajo (${qty} unidades): reponelo pronto`); }

  // Estado
  checks.activa = faltan.has('estado') ? null : item.status === 'active' || item.status === undefined;
  if (item.status === 'paused') { score -= PESOS.estado * 0.6; problemas.push('Publicación pausada: no genera ventas'); }
  else if (item.status === 'closed' || item.status === 'inactive') { score -= PESOS.estado; problemas.push('Publicación cerrada: requiere reactivación'); }

  // Atributos
  const attrs = item.attributes?.length || 0;
  checks.atributos = faltan.has('atributos') ? null : attrs >= U.atributos_bueno;
  if (!faltan.has('atributos')) {
    if (attrs < 2) { score -= PESOS.atributos; problemas.push('Sin atributos: ML penaliza el catálogo incompleto'); }
    else if (attrs < U.atributos_bueno) { score -= PESOS.atributos * 0.5; mejoras.push(`Solo ${attrs} atributos: completá hasta al menos 5`); }
  }

  // Garantía
  checks.garantia = faltan.has('garantia') ? null : !!item.warranty;
  if (!item.warranty && !faltan.has('garantia')) { score -= PESOS.garantia; mejoras.push('Sin garantía: reduce la confianza del comprador'); }

  // Peso de lo que sí se pudo verificar y cuántos controles se ejecutaron
  const conocido = Object.entries(PESOS).filter(([k]) => !faltan.has(k) && !(k === 'stock' && qty === null)).reduce((a, [, w]) => a + w, 0);
  const cobertura = { verificados: Object.values(checks).filter(v => v !== null).length, total: Object.keys(checks).length, peso: conocido };
  // Con datos que faltan, el score se escala sobre el peso de lo que sí se verificó
  if (item._faltan) score = conocido ? 100 - (100 - score) * 100 / conocido : 100;
  // Con poca evidencia no hay puntaje: null es más honesto que un número normalizado
  const suficiente = conocido >= EVIDENCIA_MINIMA;
  return { score: suficiente ? Math.round(Math.max(0, Math.min(100, score))) : null, problemas, mejoras, checks, cobertura };
}

// ── Plan de acción basado en reglas ───────────────────────────
// Qué no se pudo consultar y por qué (se muestra tal cual al usuario)
const SOLO_DUENO = 'Mercado Libre solo deja leer esto al dueño de la publicación.';
const ROTULO = { fotos: 'Fotos', stock: 'Stock', estado: 'Estado (activa o pausada)', atributos: 'Atributos', garantia: 'Garantía', descripcion: 'Descripción', titulo: 'Título real' };
export function noVerificables(item) {
  const f = desconocidos(item), out = [];
  const motivo = item._datos_parciales ? 'Es un producto de catálogo sin publicación ganadora: no tiene este dato.' : SOLO_DUENO;
  for (const k of Object.keys(ROTULO)) if (f.has(k)) out.push({ t: ROTULO[k], s: k === 'titulo' ? 'Tomé el título del link, que viene recortado: no lo evalúo.' : motivo });
  if (item._extras && item._extras.opiniones == null) out.push({ t: 'Opiniones de compradores', s: SOLO_DUENO });
  return out;
}

export function planDeAccion(item, score, problemas, mejoras, cobertura = null) {
  const acciones = [];
  const fotos = item.pictures?.length || 0;
  const tituloL = item.title?.length || 0;
  const tieneDesc = (item.descripcion?.length || 0) > 50;
  const attrs = item.attributes?.length || 0;
  const faltan = desconocidos(item);

  if (!tieneDesc && !faltan.has('descripcion')) acciones.push({
    titulo: 'Escribir una descripción estructurada', impacto: 'alto', impacto_pts: 20,
    como: 'Cuatro bloques: (1) beneficio principal, (2) características técnicas, (3) casos de uso y para quién es, (4) garantía y contenido de la caja. Incluí las keywords del título de forma natural.',
    tiempo_estimado: '10-20 min',
  });

  if (fotos < 7 && !faltan.has('fotos')) {
    const faltan = 7 - fotos;
    const min = fotos >= 4 ? faltan * 5 : fotos >= 1 ? faltan * 8 : 30;
    const max = fotos >= 4 ? faltan * 10 : fotos >= 1 ? faltan * 15 : 50;
    acciones.push({
      titulo: fotos === 0 ? 'Agregar galería completa' : `Agregar ${faltan} foto${faltan > 1 ? 's' : ''} (${fotos}/7)`,
      impacto: fotos < 4 ? 'alto' : 'medio', impacto_pts: fotos === 0 ? 25 : fotos < 4 ? 15 : 8,
      como: 'Secuencia sugerida: (1) producto sobre fondo blanco, (2) dimensiones, (3) uso en acción / lifestyle, (4-5) accesorios incluidos, (6) infografía de beneficios, (7) certificaciones o garantía.',
      tiempo_estimado: `${min}-${max} min`,
    });
  }

  if (faltan.has('titulo')) { /* sin título no hay sugerencia */ }
  else if (tituloL < 55) acciones.push({
    titulo: `Expandir título (${tituloL} → 55-60 caracteres)`, impacto: tituloL < 30 ? 'alto' : 'medio', impacto_pts: tituloL < 30 ? 18 : 8,
    como: `Fórmula: [Producto] [Marca] [Característica 1] [Característica 2] [Material]. Te faltan ${55 - tituloL} caracteres. Validá antes qué keywords tienen más volumen de búsqueda.`,
    tiempo_estimado: '10 min',
  });
  else if (tituloL > 60) acciones.push({
    titulo: 'Revisá que las keywords principales estén en los primeros 60 caracteres', impacto: 'bajo', impacto_pts: 2,
    como: `El título tiene ${tituloL} caracteres. En los resultados de búsqueda se ven los primeros 60 ("${item.title.slice(0, 60)}…"). Poné lo más buscado primero.`,
    tiempo_estimado: '5 min',
  });

  if (attrs < 5 && !faltan.has('atributos')) acciones.push({
    titulo: `Completar atributos (${attrs} de mínimo 5)`, impacto: attrs < 2 ? 'medio' : 'bajo', impacto_pts: attrs < 2 ? 5 : 3,
    como: 'Editar → Características → completar todo lo disponible. Prioridad: marca, modelo, material, color, dimensiones. ML usa los atributos para los filtros de búsqueda.',
    tiempo_estimado: '5-8 min',
  });

  if (!item.warranty && !faltan.has('garantia')) acciones.push({
    titulo: 'Agregar garantía', impacto: 'bajo', impacto_pts: 5,
    como: 'Editar → "Garantía del vendedor". Aunque sean 3 meses: baja las preguntas y sube la confianza del comprador.',
    tiempo_estimado: '3-5 min',
  });

  acciones.sort((a, b) => b.impacto_pts - a.impacto_pts);
  acciones.forEach((a, i) => { a.prioridad = i + 1; });

  const sinPuntaje = score === null;
  const scorePotencial = sinPuntaje ? null : Math.min(100, score + acciones.reduce((s, a) => s + a.impacto_pts, 0));
  const estado = sinPuntaje ? null : score < 40 ? 'crítico' : score < 60 ? 'mejorable' : score < 80 ? 'bueno' : 'óptimo';
  const nums = t => [...t.matchAll(/(\d+)/g)].map(m => +m[1]);
  const minT = acciones.reduce((s, a) => s + (nums(a.tiempo_estimado)[0] || 10), 0);
  const maxT = acciones.reduce((s, a) => { const n = nums(a.tiempo_estimado); return s + (n[1] || n[0] || 10); }, 0);
  const parcial = !!cobertura && cobertura.verificados < cobertura.total;
  const tiempo = !acciones.length ? (sinPuntaje ? 'Sin acciones con esta evidencia' : parcial ? 'Sin acciones para lo verificado' : 'Sin acciones necesarias')
    : maxT < 60 ? (minT === maxT ? `${minT} min` : `${minT}-${maxT} min`)
    : `${Math.round(minT / 6) / 10}-${Math.round(maxT / 6) / 10} horas`;

  const primero = (problemas[0] || mejoras[0] || '').toLowerCase();
  const verif = cobertura ? `verifiqué ${cobertura.verificados} de ${cobertura.total} controles` : 'verifiqué muy pocos controles';
  const resumen = sinPuntaje
    ? `No se puede calificar esta publicación: con los datos públicos ${verif} y un puntaje sobre tan poco sería engañoso.${acciones.length ? ` Lo que sí encontré: ${acciones[0].titulo.toLowerCase()}.` : ' No hay acciones para sugerir con esta evidencia.'}`
    : (primero
      ? `El score de ${score}/100 indica que la publicación está ${({ 'crítico': 'en estado crítico', mejorable: 'mejorable', bueno: 'en buen estado', 'óptimo': 'en estado óptimo' })[estado]}. Lo de mayor impacto: ${primero}.`
      : `El score de ${score}/100 indica que la publicación está en buen estado.`) + (scorePotencial > score ? ` Con estas acciones puede llegar a ${scorePotencial}/100.` : '');
  return {
    resumen,
    titulo_optimizado: null,
    acciones,
    score_potencial: scorePotencial,
    tiempo_total: tiempo,
    fuente: 'reglas',
  };
}

// ── Título sugerido con IA (opcional: sólo si hay GROQ_API_KEY) ──
export async function tituloConIA(item, score, problemas) {
  const key = process.env.GROQ_API_KEY;
  if (!key || !item.title || item._faltan) return null;
  const prompt = `Sos un analista experto de Mercado Libre Argentina. Respondé SOLO con JSON válido, sin texto extra.

PUBLICACIÓN: "${item.title}" (${item.title.length} caracteres)
Fotos: ${item.pictures?.length || 0}/7 | Descripción: ${(item.descripcion?.length || 0) > 50 ? 'sí' : 'NO'} | Score: ${score}/100
Problemas: ${problemas.join('; ') || 'ninguno crítico'}

Devolvé: {"titulo_optimizado": "título de 55 a 60 caracteres, sin emojis, keyword principal primero", "resumen_ejecutivo": "diagnóstico en 2 oraciones directas, en español rioplatense"}`;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], max_tokens: 300, temperature: 0.3 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const text = (await res.json()).choices?.[0]?.message?.content || '';
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || 'null');
    return json?.titulo_optimizado ? json : null;
  } catch { return null; }
}
