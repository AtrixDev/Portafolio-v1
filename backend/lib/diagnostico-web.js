// lib/diagnostico-web.js — Diagnóstico de la web de un negocio (web.html → /api/audit?action=web)
// Baja el HTML de la página (con cuidado: solo hosts públicos, 5 redirecciones, 2,5 MB y 9 s como máximo)
// y revisa lo que decide si una web le trae clientes a un negocio: celular, velocidad, Google, contacto y confianza.
// Todo lo que informa sale de la página real; nada se estima ni se inventa.
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36 DarioColangelo-Diagnostico/1.0';
const MAX_BYTES = 2_500_000, TIMEOUT = 9000, MAX_REDIR = 5;

export class WebError extends Error {
  constructor(code, msg) { super(msg); this.code = code; }
}

// ── URL y red ─────────────────────────────────────────────
export function normalizarUrl(input) {
  let s = String(input || '').trim();
  if (!s || s.length > 500) throw new WebError('url', 'Pegá la dirección de tu web, por ejemplo: tunegocio.com.ar');
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch { throw new WebError('url', 'Esa dirección no parece una web. Probá con algo como tunegocio.com.ar'); }
  if (!/^https?:$/.test(u.protocol) || (u.port && !['80', '443'].includes(u.port)) || u.username || u.password) throw new WebError('url', 'Solo puedo revisar webs públicas (http o https).');
  const h = u.hostname.toLowerCase();
  if (isIP(h) || !h.includes('.') || /(^|\.)(localhost|local|internal|lan|home|corp)$/.test(h)) throw new WebError('url', 'Solo puedo revisar webs públicas, con su dominio.');
  if (/(^|\.)(mercadolibre\.com|mercadolibre\.com\.ar|instagram\.com|facebook\.com|wa\.me|linktr\.ee)$/.test(h)) {
    throw new WebError('no_web', 'Eso es un perfil en otra plataforma, no una web propia. Si no tenés web, te cuento qué conviene armar.');
  }
  u.hash = '';
  return u;
}

const privada = ip => {
  if (ip.includes(':')) { const x = ip.toLowerCase(); return x === '::1' || x === '::' || /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || x.startsWith('::ffff:') && privada(x.slice(7)); }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
};
async function hostPublico(host) {
  let ips;
  try { ips = await lookup(host, { all: true }); } catch { throw new WebError('dns', 'No encuentro esa web: revisá que la dirección esté bien escrita.'); }
  if (!ips.length || ips.some(x => privada(x.address))) throw new WebError('url', 'Solo puedo revisar webs públicas.');
}

// GET con redirecciones manuales (cada salto se valida de nuevo) y corte por tamaño
async function traer(url, { cuerpo = true, timeout = TIMEOUT } = {}) {
  const inicio = Date.now(), saltos = [];
  let actual = url;
  for (let i = 0; i <= MAX_REDIR; i++) {
    await hostPublico(actual.hostname);
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), Math.max(500, timeout - (Date.now() - inicio)));
    let r;
    try {
      r = await fetch(actual, { redirect: 'manual', signal: ctl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'Accept-Language': 'es-AR,es;q=0.9' } });
    } catch (e) {
      clearTimeout(t);
      throw new WebError('red', e.name === 'AbortError' ? 'Tu web tardó más de 9 segundos en responder: eso solo ya espanta visitas.' : 'No pude conectarme con tu web. ¿Está online?');
    }
    const ttfb = Date.now() - inicio;
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      clearTimeout(t);
      saltos.push({ de: actual.href, estado: r.status });
      actual = new URL(r.headers.get('location'), actual);
      if (!/^https?:$/.test(actual.protocol)) throw new WebError('url', 'La web redirige a una dirección que no puedo revisar.');
      continue;
    }
    let html = '', bytes = 0;
    if (cuerpo && r.body) {
      const reader = r.body.getReader(), dec = new TextDecoder();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          bytes += value.length;
          if (bytes > MAX_BYTES) { ctl.abort(); break; }
          html += dec.decode(value, { stream: true });
        }
      } catch { /* cortado por tamaño o por tiempo: se analiza lo que llegó */ }
    }
    clearTimeout(t);
    return { url: actual, status: r.status, headers: r.headers, html, bytes, ttfb, total: Date.now() - inicio, saltos };
  }
  throw new WebError('red', 'La web redirige demasiadas veces.');
}

async function existe(url) {
  try { const r = await traer(url, { cuerpo: true, timeout: 3500 }); return r.status >= 200 && r.status < 300 && r.html.length > 20 && !/<html/i.test(r.html.slice(0, 400)); } catch { return false; }
}

// ── Lectura del HTML (liviana, sin dependencias) ──────────
const attr = (tag, n) => { const m = tag.match(new RegExp(`\\s${n}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')); return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null; };
const tags = (html, n) => html.match(new RegExp(`<${n}\\b[^>]*>`, 'gi')) || [];
const texto = s => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const meta = (html, key) => { for (const t of tags(html, 'meta')) { const k = (attr(t, 'name') || attr(t, 'property') || '').toLowerCase(); if (k === key) return attr(t, 'content'); } return null; };

// ── Diagnóstico ───────────────────────────────────────────
export async function diagnosticarWeb(input) {
  const url = normalizarUrl(input);
  let r;
  try { r = await traer(url); }
  catch (e) {
    // Si https falla, se prueba http: muchas webs chicas no tienen certificado
    if (url.protocol === 'https:' && e.code === 'red') { const u2 = new URL(url); u2.protocol = 'http:'; r = await traer(u2); }
    else throw e;
  }
  if (r.status >= 400) throw new WebError('status', `Tu web respondió con error ${r.status}${r.status === 404 ? ' (página no encontrada)' : r.status >= 500 ? ' (falla del servidor)' : ''}. Revisá la dirección o avisale a quien te la mantiene.`);
  const ct = r.headers.get('content-type') || '';
  if (!/html/i.test(ct) && !/<html|<body|<head/i.test(r.html.slice(0, 2000))) throw new WebError('no_html', 'Esa dirección no devuelve una página web.');

  const html = r.html, head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const origen = new URL('/', r.url);
  const [robots, sitemap, httpRedir] = await Promise.all([
    existe(new URL('/robots.txt', origen)),
    existe(new URL('/sitemap.xml', origen)),
    r.url.protocol === 'https:' ? traer(Object.assign(new URL(r.url), { protocol: 'http:' }), { cuerpo: false, timeout: 3500 }).then(x => x.url.protocol === 'https:').catch(() => null) : Promise.resolve(false),
  ]);

  const title = (head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
  const desc = (meta(head, 'description') || '').trim();
  const viewport = meta(head, 'viewport') || '';
  const lang = attr(html.match(/<html\b[^>]*>/i)?.[0] || '', 'lang');
  const h1 = tags(html, 'h1').length;
  const canonical = tags(head, 'link').some(t => /canonical/i.test(attr(t, 'rel') || ''));
  const robotsMeta = (meta(head, 'robots') || '').toLowerCase();
  const ogTitle = meta(head, 'og:title'), ogImage = meta(head, 'og:image');
  const favicon = tags(head, 'link').some(t => /icon/i.test(attr(t, 'rel') || ''));
  const jsonld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join(' ');
  // "@type" puede venir como texto ("Dentist") o como lista (["Dentist", "LocalBusiness"])
  const tiposLd = [...jsonld.matchAll(/"@type"\s*:\s*(\[[^\]]*\]|"[^"]*")/g)].map(m => m[1]).join(' ');
  const negocioLd = /LocalBusiness|Restaurant|Store|Dentist|Physician|MedicalBusiness|MedicalClinic|Organization|ProfessionalService|AutoRepair|BeautySalon|HairSalon|LegalService|Attorney|RealEstateAgent|HealthAndBeautyBusiness|FoodEstablishment|CafeOrCoffeeShop|Bakery|Hotel|LodgingBusiness|SportsActivityLocation|ExerciseGym|VeterinaryCare|Accountant|HomeAndConstructionBusiness|Store/i.test(tiposLd);

  const links = tags(html, 'a').map(t => attr(t, 'href') || '');
  const whatsapp = links.some(h => /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|web\.whatsapp\.com/i.test(h)) || /wa\.me\/\d/i.test(html);
  const telefono = links.some(h => /^tel:/i.test(h));
  const mail = links.some(h => /^mailto:/i.test(h));
  const formulario = /<form\b/i.test(html) && /<(input|textarea)\b/i.test(html);
  const mapa = /google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl|openstreetmap\.org|waze\.com\/ul/i.test(html);
  const instagram = links.some(h => /instagram\.com\//i.test(h));
  const analitica = /googletagmanager\.com|google-analytics\.com|gtag\(|fbq\(|connect\.facebook\.net|clarity\.ms|plausible\.io|umami/i.test(html);

  const imgs = tags(html, 'img');
  const sinAlt = imgs.filter(t => attr(t, 'alt') === null).length;
  const sinMedidas = imgs.filter(t => !attr(t, 'width') || !attr(t, 'height')).length;
  const lazy = imgs.filter(t => /lazy/i.test(attr(t, 'loading') || '')).length;
  const scripts = tags(html, 'script').filter(t => attr(t, 'src'));
  const bloqueantes = tags(head, 'script').filter(t => attr(t, 'src') && !/\s(async|defer)\b/i.test(t) && !/module/i.test(attr(t, 'type') || '')).length;
  const cuerpo = texto(html);
  const anios = [...cuerpo.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2})/gi)].map(m => +m[1]);
  const anioCopy = anios.length ? Math.max(...anios) : null;
  // Webs armadas solo con JavaScript (React, Vue…): el HTML llega casi vacío y parte de lo que se ve no se puede revisar
  const esSpa = cuerpo.length < 400 && /<div[^>]+id=["'](root|app|__next|__nuxt|svelte)["'][^>]*>\s*<\/div>/i.test(html);
  const kb = Math.round(r.bytes / 1024);

  // Cada chequeo: [área, id, ok (true/false/null = no aplica), título, detalle, por qué importa, cómo se arregla]
  const C = [];
  const add = (area, id, ok, titulo, detalle, porque, arreglo, peso = 1) => C.push({ area, id, ok, titulo, detalle, porque, arreglo, peso });

  add('celular', 'viewport', /width\s*=\s*device-width/i.test(viewport), 'Se adapta al celular',
    viewport ? `Etiqueta viewport: "${viewport.slice(0, 80)}"` : 'No tiene la etiqueta viewport.',
    'Más del 70% de las visitas de un negocio llegan desde el celular. Sin esto, la web se ve chiquita y hay que hacer zoom.',
    'Agregar <meta name="viewport" content="width=device-width, initial-scale=1"> y revisar el diseño en un celular.', 3);
  add('celular', 'zoom', !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/i.test(viewport), 'Deja hacer zoom',
    /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(viewport) ? 'El zoom está bloqueado.' : 'El zoom funciona.',
    'Bloquear el zoom complica a quien ve poco y lo penaliza Google en accesibilidad.', 'Sacar user-scalable=no y maximum-scale=1 del viewport.');

  add('velocidad', 'ttfb', r.ttfb < 800 ? true : r.ttfb < 1800 ? null : false, 'Responde rápido',
    `El servidor tardó ${(r.ttfb / 1000).toFixed(2).replace('.', ',')} s en empezar a responder${r.saltos.length ? ` (con ${r.saltos.length} redirección${r.saltos.length > 1 ? 'es' : ''})` : ''}.`,
    'Cada segundo de espera hace que más gente se vaya antes de ver la página.', 'Un hosting con CDN (Vercel, Netlify, Cloudflare) o activar caché en el servidor.', 2);
  add('velocidad', 'peso', kb < 150 ? true : kb < 500 ? null : false, 'HTML liviano',
    `La página pesa ${kb.toLocaleString('es-AR')} KB de HTML${r.bytes > MAX_BYTES ? ' (cortado: es enorme)' : ''}.`,
    'Un HTML pesado tarda en bajar con datos móviles.', 'Sacar código que no se usa, estilos repetidos y constructores que inflan la página.');
  add('velocidad', 'scripts', bloqueantes <= 2, 'No bloquea la carga',
    `${bloqueantes} script${bloqueantes === 1 ? '' : 's'} en el <head> sin async ni defer; ${scripts.length} scripts externos en total.`,
    'Los scripts que bloquean dejan la pantalla en blanco hasta que terminan de bajar.', 'Agregar defer a los scripts o moverlos al final de la página.');
  if (imgs.length) {
    add('velocidad', 'lazy', imgs.length <= 3 || lazy >= Math.floor((imgs.length - 2) * .6), 'Carga las imágenes de a poco',
      `${lazy} de ${imgs.length} imágenes tienen carga diferida (loading="lazy").`,
      'Si baja todas las fotos de entrada, la parte de arriba tarda más en aparecer.', 'Poner loading="lazy" a las imágenes que no se ven al abrir la página.');
    add('velocidad', 'medidas', sinMedidas <= Math.ceil(imgs.length * .2), 'Las imágenes no hacen saltar la página',
      `${imgs.length - sinMedidas} de ${imgs.length} imágenes declaran ancho y alto.`,
      'Sin medidas, el texto salta mientras cargan las fotos y la gente toca lo que no quería.', 'Poner width y height (o aspect-ratio) en cada imagen.');
  }

  add('google', 'title', title.length >= 15 && title.length <= 65, 'Título para Google',
    title ? `"${title.slice(0, 90)}" (${title.length} caracteres)` : 'La página no tiene título.',
    'Es lo que aparece en azul en Google. Tiene que decir qué hacés y dónde.', 'Algo como "Parrilla en Villa Crespo · Brasa": rubro + zona + nombre, entre 30 y 60 caracteres.', 2);
  add('google', 'desc', desc.length >= 70 && desc.length <= 170, 'Descripción para Google',
    desc ? `${desc.length} caracteres: "${desc.slice(0, 110)}${desc.length > 110 ? '…' : ''}"` : 'No tiene meta description.',
    'Es el texto gris debajo del título en Google: decide si hacen clic o no.', 'Una frase de 120 a 155 caracteres con lo que ofrecés y una razón para elegirte.');
  add('google', 'h1', h1 === 1, 'Un título principal', h1 ? `Tiene ${h1} títulos principales (h1).` : 'No tiene título principal (h1).',
    'Google usa el h1 para entender de qué trata la página.', 'Un solo h1 por página, con el servicio principal.');
  add('google', 'indexable', !/noindex/.test(robotsMeta), 'Google la puede mostrar', /noindex/.test(robotsMeta) ? 'Tiene "noindex": le pide a Google que no la muestre.' : 'No bloquea a Google.',
    'Con noindex la web no aparece en las búsquedas.', 'Sacar la etiqueta robots noindex (suele quedar de cuando la web estaba en construcción).', 3);
  add('google', 'sitemap', sitemap || robots, 'Mapa del sitio para Google', `sitemap.xml: ${sitemap ? 'sí' : 'no'} · robots.txt: ${robots ? 'sí' : 'no'}.`,
    'Le indica a Google qué páginas tiene que leer.', 'Generar sitemap.xml y enviarlo en Google Search Console.');
  add('google', 'datos', negocioLd, 'Ficha de negocio para Google', negocioLd ? 'Tiene datos estructurados de negocio (JSON-LD).' : 'No tiene datos estructurados de negocio.',
    'Con horario, dirección y rubro marcados, Google puede mostrarlos directo en los resultados.', 'Agregar un bloque JSON-LD de LocalBusiness con dirección, teléfono y horarios.');
  add('google', 'lang', !!lang, 'Idioma declarado', lang ? `Idioma: ${lang}.` : 'No declara el idioma.', 'Ayuda a Google y a los lectores de pantalla.', 'Poner lang="es-AR" en la etiqueta <html>.');

  add('contacto', 'whatsapp', whatsapp, 'Botón de WhatsApp', whatsapp ? 'Tiene un link directo a WhatsApp.' : 'No encontré un link a WhatsApp.',
    'En Argentina, la mayoría de las consultas de un negocio llegan por WhatsApp. Sin botón, hay que copiar el número a mano.', 'Un botón fijo con wa.me/549… y un mensaje ya armado ("Hola, vi la web y quería consultar por…").', 3);
  add('contacto', 'tel', telefono, 'Teléfono que se toca y llama', telefono ? 'El teléfono es un link (tel:).' : 'No hay un teléfono con link tel:.',
    'Desde el celular, tocar y llamar convierte más que un número suelto.', 'Poner el número como <a href="tel:+54911…">.');
  add('contacto', 'form', formulario || mail, 'Otra forma de escribirte', formulario ? 'Tiene formulario de contacto.' : mail ? 'Tiene un email con link.' : 'No tiene formulario ni email con link.',
    'Hay gente que prefiere escribir con calma, sobre todo empresas.', 'Un formulario corto (nombre, contacto y consulta) que llegue a tu mail.');
  add('contacto', 'mapa', mapa, 'Cómo llegar', mapa ? 'Tiene un mapa o link a Google Maps.' : 'No encontré mapa ni link a Google Maps.',
    'Para un local, "cómo llegar" es de lo más buscado.', 'Link a tu ficha de Google Maps (y el mapa embebido en la página de contacto).');

  add('confianza', 'https', r.url.protocol === 'https:', 'Conexión segura (https)', r.url.protocol === 'https:' ? 'La web carga con https.' : 'La web carga sin https: el navegador la marca como "No segura".',
    'El cartel de "No seguro" espanta, y Google la baja en los resultados.', 'Activar el certificado SSL (en Vercel, Netlify o Cloudflare viene gratis).', 3);
  if (r.url.protocol === 'https:') add('confianza', 'redir', httpRedir !== false, 'Lleva siempre a la versión segura', httpRedir ? 'http:// redirige a https://.' : httpRedir === null ? 'No pude comprobar la versión http.' : 'Entrando por http:// no redirige a https://.',
    'Si alguien escribe la dirección sin https, tiene que terminar en la versión segura.', 'Forzar la redirección a https en el hosting.');
  add('confianza', 'fecha', anioCopy == null ? null : anioCopy >= new Date().getFullYear() - 1, 'Se ve al día',
    anioCopy ? `El pie dice © ${anioCopy}.` : 'No encontré un año en el pie.',
    'Un "© 2019" hace pensar que el negocio cerró o que nadie atiende la web.', 'Actualizar el año (o que se ponga solo con JavaScript).');
  add('confianza', 'favicon', favicon, 'Ícono en la pestaña', favicon ? 'Tiene favicon.' : 'No declara favicon.', 'Es un detalle, pero sin ícono la pestaña se ve genérica.', 'Agregar un favicon con el logo.');
  add('confianza', 'og', !!(ogTitle && ogImage), 'Se ve bien al compartirla', ogImage ? 'Tiene imagen para compartir (Open Graph).' : 'No tiene imagen para compartir.',
    'Cuando mandás el link por WhatsApp, sale una tarjeta con foto y título. Sin esto, sale un link pelado.', 'Agregar og:title, og:description y og:image (1200×630).');
  if (imgs.length) add('confianza', 'alt', sinAlt <= Math.ceil(imgs.length * .2), 'Fotos con descripción', `${imgs.length - sinAlt} de ${imgs.length} imágenes tienen texto alternativo.`,
    'Ayuda a Google Imágenes y a personas con lectores de pantalla.', 'Describir cada foto en el alt: "Vacío a las brasas con papas".');
  add('confianza', 'medicion', analitica, 'Mide sus visitas', analitica ? 'Tiene analítica instalada (Google, Meta u otra).' : 'No encontré analítica.',
    'Sin medir, no sabés cuánta gente entra ni de dónde viene.', 'Instalar Google Analytics 4 o una alternativa simple como Plausible.');

  // Puntajes por área (los "no aplica" no cuentan)
  const AREAS = { celular: 'Celular', velocidad: 'Velocidad', google: 'Google', contacto: 'Contacto', confianza: 'Confianza' };
  const areas = Object.entries(AREAS).map(([id, nombre]) => {
    const xs = C.filter(c => c.area === id && c.ok !== null);
    const tot = xs.reduce((a, c) => a + c.peso, 0), bien = xs.reduce((a, c) => a + (c.ok ? c.peso : 0), 0);
    return { id, nombre, valor: tot ? Math.round(bien / tot * 100) : null, fallas: xs.filter(c => !c.ok).length };
  });
  const PESO_AREA = { celular: 1.2, velocidad: 1, google: 1, contacto: 1.3, confianza: .8 };
  const conValor = areas.filter(a => a.valor != null);
  const salud = Math.round(conValor.reduce((s, a) => s + a.valor * PESO_AREA[a.id], 0) / conValor.reduce((s, a) => s + PESO_AREA[a.id], 0));
  // Lo que más conviene arreglar primero: fallas con más peso, del área más importante
  const prioridad = C.filter(c => c.ok === false).sort((a, b) => b.peso * PESO_AREA[b.area] - a.peso * PESO_AREA[a.area]);

  return {
    url: r.url.href, dominio: r.url.hostname.replace(/^www\./, ''), titulo: title || null,
    imagen: ogImage && /^https:\/\//.test(new URL(ogImage, r.url).href) ? new URL(ogImage, r.url).href : null,
    medido: { ttfb: r.ttfb, total: r.total, kb, imagenes: imgs.length, scripts: scripts.length, redirecciones: r.saltos.length },
    avisoSpa: esSpa,
    salud, areas, chequeos: C.map(({ peso, ...c }) => c), prioridad: prioridad.slice(0, 5).map(c => c.id),
    fecha: new Date().toISOString(),
  };
}

// Velocidad real en celular con PageSpeed Insights (necesita PAGESPEED_KEY; sin clave, la cuota compartida de Google suele estar agotada)
export async function velocidadWeb(urlStr, key) {
  if (!key) return null;
  const u = new URL('https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed');
  u.searchParams.set('url', urlStr); u.searchParams.set('strategy', 'mobile'); u.searchParams.set('category', 'performance'); u.searchParams.set('key', key); u.searchParams.set('locale', 'es');
  const r = await fetch(u, { signal: AbortSignal.timeout(50000) });
  if (!r.ok) throw new WebError('psi', r.status === 429 ? 'Google está saturado: probá la velocidad en un rato.' : 'Google no pudo medir la velocidad de esta web.');
  const lr = (await r.json()).lighthouseResult, a = lr.audits;
  const v = k => a[k]?.numericValue ?? null;
  return {
    puntaje: Math.round((lr.categories.performance.score ?? 0) * 100),
    lcp: v('largest-contentful-paint'), cls: a['cumulative-layout-shift']?.numericValue ?? null, tbt: v('total-blocking-time'), fcp: v('first-contentful-paint'),
    captura: a['final-screenshot']?.details?.data || null,
  };
}
