// lib/tracker.js — Motor de análisis de ML Tracker
// Recibe publicaciones + visitas diarias + ventas diarias + fotos diarias de precio/stock
// y devuelve tendencias, clasificación, diagnóstico, stock y recomendación de precio.
// No habla con Mercado Libre ni con Mongo: es puro cálculo (lo usa también la cuenta demo).

export const VENTANA = 28;      // días del período actual (se compara contra los 28 anteriores)
export const HISTORIA = 150;    // días de historia (lo máximo que da ML para visitas)

// ── Fechas (día calendario de Argentina, UTC-3) ────────────────
export function diaAR(d = new Date()) {
  return new Date(new Date(d).getTime() - 3 * 3600e3).toISOString().slice(0, 10);
}
export function sumarDias(dia, n) {
  const d = new Date(dia + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function rangoDias(hasta, n) {
  return Array.from({ length: n }, (_, i) => sumarDias(hasta, i - n + 1));
}

// ── Estadística ────────────────────────────────────────────────
const suma = a => a.reduce((s, x) => s + x, 0);
function mediana(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
// Cambio en conteos (visitas, unidades): aproximación de Poisson
function zConteos(a, b) { return a + b ? (a - b) / Math.sqrt(a + b) : 0; }
// Cambio en conversión: test de dos proporciones
function zProporciones(u1, v1, u2, v2) {
  if (v1 < 30 || v2 < 30) return 0;
  const p = (u1 + u2) / (v1 + v2);
  const se = Math.sqrt(p * (1 - p) * (1 / v1 + 1 / v2));
  return se ? (u1 / v1 - u2 / v2) / se : 0;
}
const pct = (a, b) => b ? (a - b) / b : null;   // sin período anterior no hay variación

// ── Serie diaria de una publicación ────────────────────────────
// visitas: { 'YYYY-MM-DD': n }, ventas: { dia: { u, r } }, fotos: { dia: { precio, stock } }
export function serieDiaria(item, dias, visitas = {}, ventas = {}, fotos = {}) {
  const serie = dias.map(d => {
    const v = ventas[d] || {};
    return {
      d,
      v: visitas[d] || 0,
      u: v.u || 0,
      r: v.r || 0,
      precio: fotos[d]?.precio ?? (v.u ? v.r / v.u : null),
      precioFoto: fotos[d]?.precio != null,
      stock: fotos[d]?.stock ?? null,
    };
  });
  // Precio conocido día a día: se arrastra el último valor visto (y antes del primero, el primero)
  let ultimo = null;
  for (const p of serie) { if (p.precio != null) ultimo = p.precio; else p.precio = ultimo; }
  const primero = serie.find(p => p.precio != null)?.precio ?? item.price ?? null;
  for (const p of serie) { if (p.precio == null) p.precio = primero; else break; }
  return serie;
}

function totales(tramo) {
  const v = suma(tramo.map(p => p.v)), u = suma(tramo.map(p => p.u)), r = suma(tramo.map(p => p.r));
  return { visitas: v, unidades: u, facturacion: r, conversion: v ? u / v : null, dias: tramo.length };
}

// ── Cambios de precio y cómo reaccionó la publicación ──────────
// Un cambio cuenta si el precio se mueve 3% o más y se sostiene al menos 7 días.
export function cambiosDePrecio(serie) {
  const eventos = [];
  for (let i = 1; i < serie.length; i++) {
    const antes = serie[i - 1].precio, ahora = serie[i].precio;
    if (!antes || !ahora || Math.abs(ahora / antes - 1) < 0.03) continue;
    const sostenido = serie.slice(i, i + 7);
    if (sostenido.length < 7 || sostenido.some(p => Math.abs(p.precio / ahora - 1) > 0.015)) continue;
    eventos.push(i);
  }
  return eventos.map((i, k) => {
    const desde = Math.max(k ? eventos[k - 1] : 0, i - 21), hasta = Math.min(eventos[k + 1] ?? serie.length, i + 21);
    const a = totales(serie.slice(desde, i)), b = totales(serie.slice(i, hasta));
    const antes = serie[i - 1].precio, despues = serie[i].precio;
    const z = zProporciones(b.unidades, b.visitas, a.unidades, a.visitas);
    const porDia = (t, campo) => t.dias ? t[campo] / t.dias : 0;
    return {
      dia: serie[i].d, precioAntes: antes, precioDespues: despues, cambio: despues / antes - 1,
      diasAntes: a.dias, diasDespues: b.dias,
      conversionAntes: a.conversion, conversionDespues: b.conversion,
      visitasDiaAntes: porDia(a, 'visitas'), visitasDiaDespues: porDia(b, 'visitas'),
      unidadesDiaAntes: porDia(a, 'unidades'), unidadesDiaDespues: porDia(b, 'unidades'),
      facturacionDiaAntes: porDia(a, 'facturacion'), facturacionDiaDespues: porDia(b, 'facturacion'),
      efecto: a.dias < 7 || b.dias < 7 || a.visitas < 30 || b.visitas < 30 ? 'sin_datos'
        : z <= -1.96 ? 'bajo_conversion' : z >= 1.96 ? 'subio_conversion' : 'sin_efecto',
    };
  });
}

// ── Rentabilidad por unidad ────────────────────────────────────
// Precio − comisión de ML − envío gratis (si lo paga el vendedor) − impuestos − costo del producto.
// La comisión se recalcula para otro precio con el mismo porcentaje + cargo fijo.
export function rentabilidad(item, costo, config = {}) {
  const precio = item.price;
  if (!precio) return null;
  const pct = item.comision?.pct ?? null, fijo = item.comision?.fijo ?? 0;
  const impPct = Number(config.impuestosPct) || 0;
  const envio = item.envioGratis ? (item.costoEnvio ?? null) : 0;
  const comisionEn = p => pct != null ? p * pct / 100 + fijo : null;
  const base = {
    comisionPct: pct, comision: item.comision?.monto ?? comisionEn(precio), tipo: item.comision?.tipo || null,
    envio, envioGratis: !!item.envioGratis, impuestosPct: impPct, impuestos: precio * impPct / 100, costo: costo ?? null,
  };
  if (costo == null || base.comision == null || envio == null) return { ...base, completo: false };
  const margenEn = p => p - comisionEn(p) - envio - p * impPct / 100 - costo;
  const margen = margenEn(precio);
  const divisor = 1 - pct / 100 - impPct / 100;
  return {
    ...base, completo: true, margen, margenPct: margen / precio,
    acosEquilibrio: Math.max(0, margen / precio),                   // ACOS máximo antes de perder plata con publicidad
    precioEquilibrio: divisor > 0 ? (costo + envio + fijo) / divisor : null,
    margenEn,
  };
}

// ── Análisis de una publicación ────────────────────────────────
export const CLASES = {
  pausada:            { txt: 'Pausada',            tono: 'muted' },
  sin_stock:          { txt: 'Sin stock',          tono: 'bad' },
  perdiendo:          { txt: 'Perdiendo tracción', tono: 'bad' },
  visitas_sin_ventas: { txt: 'Visitas sin ventas', tono: 'warn' },
  en_alza:            { txt: 'En alza',            tono: 'ok' },
  estrella:           { txt: 'Estrella',           tono: 'accent' },
  dormida:            { txt: 'Dormida',            tono: 'muted' },
  estable:            { txt: 'Estable',            tono: 'neutral' },
};

export function analizarItem(item, serie, ctx) {
  const cur = totales(serie.slice(-VENTANA)), prev = totales(serie.slice(-2 * VENTANA, -VENTANA));
  const zV = zConteos(cur.visitas, prev.visitas), zU = zConteos(cur.unidades, prev.unidades);
  const zC = zProporciones(cur.unidades, cur.visitas, prev.unidades, prev.visitas);
  const dV = pct(cur.visitas, prev.visitas), dU = pct(cur.unidades, prev.unidades);
  const dC = cur.conversion != null && prev.conversion ? cur.conversion / prev.conversion - 1 : null;

  const visitasCaen  = zV <= -2.5 && dV <= -0.2;
  const visitasSuben = zV >= 2.5 && dV >= 0.2;
  const ventasCaen   = zU <= -2.5 && dU <= -0.3 && prev.unidades >= 5;
  const ventasSuben  = zU >= 2.5 && dU >= 0.3 && cur.unidades >= 5;
  const convCae      = zC <= -1.96;
  const convSube     = zC >= 1.96;

  // Stock
  const stock = item.available_quantity ?? null;
  const diasActiva = item.date_created ? Math.max(1, Math.floor((Date.parse(ctx.hoy) - Date.parse(item.date_created)) / 864e5)) : VENTANA;
  const ritmo = cur.unidades / Math.min(VENTANA, diasActiva);  // unidades por día
  const diasStock = stock == null ? null : ritmo > 0 ? stock / ritmo : stock > 0 ? Infinity : 0;

  // Precio: promedio de cada período y cambios
  const precioProm = t => { const ps = t.map(p => p.precio).filter(Boolean); return ps.length ? suma(ps) / ps.length : null; };
  const precioCur = precioProm(serie.slice(-VENTANA)), precioPrev = precioProm(serie.slice(-2 * VENTANA, -VENTANA));
  const dPrecio = precioCur && precioPrev ? precioCur / precioPrev - 1 : 0;
  const eventos = cambiosDePrecio(serie);

  const nueva = diasActiva < VENTANA;
  const convMed = ctx.conversionMediana;

  // Clasificación (la primera que aplica)
  let clase;
  if (item.status === 'paused' || item.status === 'closed') clase = 'pausada';
  else if (stock === 0) clase = 'sin_stock';
  else if (visitasCaen || ventasCaen || (convCae && cur.visitas >= 100)) clase = 'perdiendo';
  else if (cur.visitas >= 150 && (cur.unidades === 0 || (convMed && cur.conversion < convMed * 0.25))) clase = 'visitas_sin_ventas';
  else if (visitasSuben && (ventasSuben || cur.unidades >= prev.unidades) || ventasSuben) clase = 'en_alza';
  else if (nueva && cur.unidades > 0 && suma(serie.slice(-7).map(p => p.v)) > suma(serie.slice(-14, -7).map(p => p.v))) clase = 'en_alza';
  else if (ctx.topFacturacion.has(item.id) && convMed != null && cur.conversion >= convMed) clase = 'estrella';
  else if (cur.visitas < 30 && cur.unidades <= 1) clase = 'dormida';
  else clase = 'estable';

  // Diagnóstico: por qué
  const diagnostico = [];
  if (clase === 'perdiendo' || clase === 'visitas_sin_ventas') {
    const exposicion = visitasCaen, oferta = convCae || clase === 'visitas_sin_ventas';
    if (exposicion) {
      const causas = [];
      if (ctx.catalogo?.status === 'competing') causas.push('perdiste el primer lugar del catálogo');
      const diasSinStock = serie.slice(-VENTANA).filter(p => p.stock === 0).length;
      if (diasSinStock >= 3) causas.push(`estuvo ${diasSinStock} días sin stock`);
      diagnostico.push({
        tipo: 'exposicion',
        titulo: `Problema de exposición: las visitas cayeron ${Math.round(-dV * 100)}%`,
        texto: causas.length
          ? `Causa probable: ${causas.join(' y ')}.`
          : 'La gente la encuentra menos. Revisá si perdió posición frente a la competencia, si bajó la inversión en publicidad o si cambió algo en el título o la categoría.',
      });
    }
    if (oferta) {
      const causas = [];
      if (dPrecio >= 0.05) causas.push(`el precio promedio subió ${Math.round(dPrecio * 100)}%`);
      if (ctx.catalogo?.price_to_win && ctx.catalogo.price_to_win < (item.price || 0)) causas.push('hay competidores más baratos en el catálogo');
      diagnostico.push({
        tipo: 'oferta',
        titulo: clase === 'visitas_sin_ventas'
          ? `Problema de oferta: ${cur.visitas.toLocaleString('es-AR')} visitas y ${cur.unidades ? `solo ${cur.unidades} ventas` : 'ninguna venta'}`
          : `Problema de oferta: la conversión cayó ${Math.round(-(dC || 0) * 100)}% con visitas estables`,
        texto: causas.length
          ? `Causa probable: ${causas.join(' y ')}.`
          : 'La gente entra pero no compra. Compará precio, envío y cuotas contra los primeros resultados; revisá opiniones, fotos y si la descripción responde las dudas que aparecen en las preguntas.',
      });
    }
    if (!diagnostico.length && ventasCaen) diagnostico.push({
      tipo: 'ventas', titulo: `Las ventas cayeron ${Math.round(-dU * 100)}%`,
      texto: 'Las visitas y la conversión no se movieron lo suficiente para señalar una sola causa: mirá el gráfico para ver cuándo empezó.',
    });
  }
  if (clase === 'en_alza') diagnostico.push({
    tipo: 'alza', titulo: nueva ? 'Publicación nueva que viene creciendo' : `Viene creciendo: visitas ${fmtPct(dV)}, ventas ${fmtPct(dU)}`,
    texto: diasStock != null && diasStock < 30 ? 'Asegurá stock: al ritmo actual no llega al mes.' : 'Buen momento para darle más empuje (publicidad, cuotas, envío gratis) y para probar una suba de precio chica.',
  });
  if (clase === 'estrella') diagnostico.push({
    tipo: 'estrella', titulo: 'Es de las que más facturan y convierte arriba del promedio',
    texto: 'Cuidala: stock siempre disponible, responder rápido las preguntas y vigilar el precio de la competencia.',
  });
  if (clase === 'dormida') diagnostico.push({
    tipo: 'dormida', titulo: 'Casi nadie la ve',
    texto: 'Antes de tocar el precio, trabajá la exposición: título con las palabras que más se buscan, categoría correcta, atributos completos y, si el margen da, publicidad.',
  });

  // Recomendación de precio
  const precio = recomendarPrecio({ item, clase, cur, convMed, diasStock, eventos, convCae, dPrecio, catalogo: ctx.catalogo, rent: ctx.rent });

  // Alertas de stock
  let alertaStock = null;
  if (nueva || item.status === 'paused' || item.status === 'closed') { /* sin historia suficiente o sin ventas a propósito */ }
  else if (stock != null && stock > 0 && diasStock <= 7) alertaStock = { tipo: 'quiebre', dias: Math.floor(diasStock) };
  else if (stock != null && stock > 0 && diasStock <= 15) alertaStock = { tipo: 'reponer', dias: Math.floor(diasStock) };
  else if (stock > 0 && diasStock > 90 && Number.isFinite(diasStock)) alertaStock = { tipo: 'inmovilizado', dias: Math.round(diasStock) };
  else if (stock > 0 && ritmo === 0 && cur.visitas > 0) alertaStock = { tipo: 'sin_rotacion' };

  return {
    id: item.id, clase, nueva: !!nueva,
    actual: cur, anterior: prev,
    cambio: { visitas: dV, unidades: dU, conversion: dC, facturacion: pct(cur.facturacion, prev.facturacion), precio: dPrecio },
    significativo: { visitas: visitasCaen || visitasSuben, unidades: ventasCaen || ventasSuben, conversion: convCae || convSube },
    stock, ritmoDiario: ritmo, diasStock: Number.isFinite(diasStock) ? diasStock : null, alertaStock,
    diagnostico, precio, eventosPrecio: eventos,
  };
}

function fmtPct(x) { return x == null ? 'sin datos previos' : (x >= 0 ? '+' : '') + Math.round(x * 100) + '%'; }
const redondear = p => p >= 10000 ? Math.round(p / 100) * 100 : p >= 1000 ? Math.round(p / 10) * 10 : Math.round(p);

// ── Motor de precio ─────────────────────────────────────────────
export function recomendarPrecio(args) {
  const r = decidirPrecio(args), rent = args.rent;
  if (!rent?.completo || !r.sugerido) return r;
  const m = rent.margenEn(r.sugerido);
  r.margenSugerido = m;
  if (m < 0 && r.accion !== 'subir') {
    return { accion: 'revisar', motivos: [...r.motivos, `Ojo: a ${fmtPlata(r.sugerido)} perdés ${fmtPlata(-m)} por unidad con tus costos. No bajes; competí con envío, cuotas o fotos.`] };
  }
  r.motivos.push(`A ese precio te quedan ${fmtPlata(m)} por unidad (${Math.round(m / r.sugerido * 100)}% de margen).`);
  return r;
}
const fmtPlata = x => '$' + Math.round(x).toLocaleString('es-AR');

function decidirPrecio({ item, clase, cur, convMed, diasStock, eventos, convCae, dPrecio, catalogo, rent }) {
  const precio = item.price;
  if (!precio || clase === 'pausada') return { accion: 'mantener', motivos: ['Sin precio o publicación pausada.'] };

  // 0. Si hoy pierde plata en cada venta, eso va primero
  if (rent?.completo && rent.margen < 0 && rent.precioEquilibrio) {
    const sug = redondear(rent.precioEquilibrio * 1.1);
    return { accion: 'subir', sugerido: sug, cambio: sug / precio - 1,
      motivos: [`Con tus costos perdés ${fmtPlata(-rent.margen)} en cada venta: el precio mínimo para no perder es ${fmtPlata(rent.precioEquilibrio)}.`,
        'Sugerido: 10% arriba del precio de equilibrio. Si a ese precio no vende, revisá el costo o sacala.'] };
  }
  const motivos = [];
  const subas = eventos.filter(e => e.cambio > 0 && e.efecto !== 'sin_datos');
  const ultimaSuba = subas.at(-1);
  const convAlta = convMed != null && cur.conversion != null && cur.conversion >= convMed;

  // 1. Catálogo perdido: ML da el precio exacto para ganar
  if (catalogo?.status === 'competing' && catalogo.price_to_win && catalogo.price_to_win < precio) {
    const baja = 1 - catalogo.price_to_win / precio;
    return {
      accion: 'bajar', sugerido: catalogo.price_to_win, cambio: -baja,
      motivos: [`No estás ganando el catálogo: Mercado Libre indica que con $${catalogo.price_to_win.toLocaleString('es-AR')} (${Math.round(baja * 100)}% menos) pasás a ser el primero.`,
        baja > 0.1 ? 'La baja es grande: antes de aplicarla, revisá que el margen lo soporte o competí con envío, cuotas o reputación.' : 'Es una baja chica comparada con lo que cambia estar primero en el catálogo.'],
    };
  }

  // 2. Bajar
  if (clase === 'perdiendo' && convCae && dPrecio >= 0.05) {
    motivos.push(`La conversión cayó después de que el precio subiera ${Math.round(dPrecio * 100)}%.`);
    if (ultimaSuba?.efecto === 'bajo_conversion') motivos.push(`Cuando subiste ${Math.round(ultimaSuba.cambio * 100)}% el ${fechaCorta(ultimaSuba.dia)}, la conversión pasó de ${pctTxt(ultimaSuba.conversionAntes)} a ${pctTxt(ultimaSuba.conversionDespues)}.`);
    return { accion: 'bajar', sugerido: redondear(precio * 0.95), cambio: -0.05, motivos: [...motivos, 'Probá volver unos 5% abajo y medí dos semanas.'] };
  }
  if (clase === 'visitas_sin_ventas') {
    return { accion: 'revisar', motivos: ['Tiene visitas pero no convierte: antes de bajar el precio, compará precio, envío y cuotas contra los primeros resultados. Si están parejos, el problema está en fotos, descripción u opiniones.'] };
  }
  if (diasStock != null && diasStock > 90 && !convAlta && cur.unidades > 0) {
    return { accion: 'bajar', sugerido: redondear(precio * 0.93), cambio: -0.07,
      motivos: [`Tenés stock para ${Math.round(diasStock)} días al ritmo actual y la conversión está debajo del promedio de la cuenta.`, 'Una baja moderada acelera la rotación y libera capital inmovilizado.'] };
  }

  // 3. Subir
  if (clase === 'dormida') {
    return { accion: 'mantener', motivos: ['El problema es que casi nadie la ve, no el precio: primero trabajá la exposición.'] };
  }
  if (diasStock != null && diasStock > 90) {
    return { accion: 'mantener', motivos: [`Tenés stock para ${Math.round(diasStock)} días al ritmo actual: subir el precio frenaría todavía más la rotación.`] };
  }
  if (['estrella', 'en_alza', 'estable'].includes(clase) && convAlta && !convCae) {
    if (diasStock != null && diasStock < 21) motivos.push(`Se vende más rápido de lo que dura el stock (${Math.floor(diasStock)} días): subir el precio frena la salida y mejora el margen hasta reponer.`);
    if (ultimaSuba && ultimaSuba.efecto === 'sin_efecto') motivos.push(`La última suba (${fmtPct(ultimaSuba.cambio)} el ${fechaCorta(ultimaSuba.dia)}) no movió la conversión: ${pctTxt(ultimaSuba.conversionAntes)} → ${pctTxt(ultimaSuba.conversionDespues)}.`);
    if (catalogo?.status === 'winning' && catalogo.price_to_win && catalogo.price_to_win > precio * 1.02) motivos.push(`Ganás el catálogo y podrías cobrar hasta $${catalogo.price_to_win.toLocaleString('es-AR')} sin perder el primer lugar.`);
    if (motivos.length) {
      const sube = catalogo?.status === 'winning' && catalogo.price_to_win > precio ? Math.min(0.08, catalogo.price_to_win / precio - 1) : 0.05;
      return { accion: 'subir', sugerido: redondear(precio * (1 + sube)), cambio: sube, motivos: [`Convierte ${pctTxt(cur.conversion)}, arriba del promedio de la cuenta (${pctTxt(convMed)}).`, ...motivos] };
    }
    if (convMed && cur.conversion >= convMed * 1.5 && !subas.length && cur.unidades >= 10) {
      return { accion: 'probar_suba', sugerido: redondear(precio * 1.04), cambio: 0.04,
        motivos: [`Convierte ${pctTxt(cur.conversion)}, un ${Math.round((cur.conversion / convMed - 1) * 100)}% más que el promedio, y nunca se probó una suba.`, 'Subí 3-5% dos semanas y medí: si la conversión no cae, ganaste margen.'] };
    }
  }

  return { accion: 'mantener', motivos: ['No hay señales claras para mover el precio: la conversión y el stock están en línea con el resto de la cuenta.'] };
}

function pctTxt(x) { return x == null ? '—' : (x * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + '%'; }
function fechaCorta(dia) { const [, m, d] = dia.split('-'); return `${+d}/${+m}`; }

// ── Análisis de la cuenta completa ─────────────────────────────
// datos: { items, visitas: {id: {dia: n}}, ventas: {id: {dia: {u, r}}}, fotos: {id: {dia: {precio, stock}}}, catalogo: {id: ptw} }
export function analizarCuenta(datos, hoy = diaAR()) {
  const ayer = sumarDias(hoy, -1);
  const dias = rangoDias(ayer, HISTORIA);
  const series = new Map(datos.items.map(it => [it.id, serieDiaria(it, dias, datos.visitas[it.id], datos.ventas[it.id], datos.fotos?.[it.id])]));

  // Contexto de cuenta: conversión mediana y el 20% que más factura
  const cur = datos.items.map(it => ({ id: it.id, ...totales(series.get(it.id).slice(-VENTANA)) }));
  const conversionMediana = mediana(cur.filter(c => c.visitas >= 50).map(c => c.conversion));
  const orden = cur.filter(c => c.facturacion > 0).sort((a, b) => b.facturacion - a.facturacion);
  const topFacturacion = new Set(orden.slice(0, Math.max(1, Math.ceil(orden.length * 0.2))).map(c => c.id));

  const config = datos.config || {};
  const items = datos.items.map(it => {
    const rent = rentabilidad(it, datos.costos?.[it.id], config);
    const a = analizarItem(it, series.get(it.id), { hoy, conversionMediana, topFacturacion, catalogo: datos.catalogo?.[it.id], rent });
    const { margenEn, ...rentPublica } = rent || {};
    return {
      ...a, title: it.title, thumbnail: it.thumbnail, permalink: it.permalink, price: it.price, status: it.status,
      catalogo: datos.catalogo?.[it.id] || null, catalog_listing: !!it.catalog_listing, catalog_product_id: it.catalog_product_id || null,
      logistica: it.logistica || null, calidad: it.calidad || null,
      rentabilidad: rent ? { ...rentPublica, ganancia: rent.completo ? rent.margen * a.actual.unidades : null } : null,
    };
  });

  // Curva ABC: A = publicaciones que suman el 80% de la facturación, B = el 15% siguiente, C = el resto
  const totalFact = items.reduce((s, i) => s + i.actual.facturacion, 0);
  let acum = 0;
  for (const it of [...items].sort((a, b) => b.actual.facturacion - a.actual.facturacion)) {
    if (!it.actual.facturacion) { it.abc = 'C'; continue; }
    const antes = acum / (totalFact || 1);
    acum += it.actual.facturacion;
    it.abc = antes < 0.8 ? 'A' : antes < 0.95 ? 'B' : 'C';
    it.participacion = it.actual.facturacion / (totalFact || 1);
  }

  // Totales de la cuenta
  const sumaSerie = (desde, hasta) => {
    const t = { visitas: 0, unidades: 0, facturacion: 0 };
    for (const s of series.values()) for (const p of s.slice(desde, hasta)) { t.visitas += p.v; t.unidades += p.u; t.facturacion += p.r; }
    t.conversion = t.visitas ? t.unidades / t.visitas : null;
    return t;
  };
  const actual = sumaSerie(-VENTANA), anterior = sumaSerie(-2 * VENTANA, -VENTANA);

  // Serie de la cuenta (para el gráfico general)
  const serieCuenta = dias.map((d, i) => {
    let v = 0, u = 0, r = 0;
    for (const s of series.values()) { v += s[i].v; u += s[i].u; r += s[i].r; }
    return { d, v, u, r };
  });

  // Alertas priorizadas
  const alertas = [];
  for (const it of items) {
    if (it.catalogo?.status === 'competing') alertas.push({ id: it.id, nivel: 3, txt: `Perdiste el catálogo en «${it.title}»` });
    if (it.alertaStock?.tipo === 'quiebre') alertas.push({ id: it.id, nivel: 3, txt: `«${it.title}» se queda sin stock en ${it.alertaStock.dias} días` });
    if (it.clase === 'sin_stock') alertas.push({ id: it.id, nivel: 3, txt: `«${it.title}» está sin stock` });
    if (it.clase === 'perdiendo') alertas.push({ id: it.id, nivel: 2, txt: `«${it.title}» está perdiendo tracción: ${it.diagnostico[0]?.titulo.toLowerCase() || 'cayó contra el mes anterior'}` });
    if (it.clase === 'visitas_sin_ventas') alertas.push({ id: it.id, nivel: 2, txt: `«${it.title}» tiene visitas pero no vende` });
    if (it.alertaStock?.tipo === 'reponer') alertas.push({ id: it.id, nivel: 1, txt: `Reponé «${it.title}»: stock para ${it.alertaStock.dias} días` });
    if (it.precio.accion === 'subir') alertas.push({ id: it.id, nivel: 1, txt: `Oportunidad: subir el precio de «${it.title}»` });
    if (it.alertaStock?.tipo === 'inmovilizado') alertas.push({ id: it.id, nivel: 1, txt: `«${it.title}» tiene stock para ${it.alertaStock.dias} días: está inmovilizado` });
  }
  for (const it of items) {
    if (it.rentabilidad?.completo && it.rentabilidad.margen < 0 && it.status === 'active') alertas.push({ id: it.id, nivel: 3, txt: `«${it.title}» pierde ${fmtPlata(-it.rentabilidad.margen)} en cada venta` });
    if (it.calidad && it.calidad.score < 60 && it.abc === 'A') alertas.push({ id: it.id, nivel: 1, txt: `«${it.title}» vende mucho pero su calidad es ${String(it.calidad.nivel).toLowerCase()} (${it.calidad.score}/100)` });
  }
  const titulos = new Map(items.map(i => [i.id, i.title]));
  const preguntas = (datos.preguntas || []).map(q => ({ ...q, titulo: titulos.get(q.item) || q.item, horas: q.fecha ? Math.round((Date.now() - Date.parse(q.fecha)) / 36e5) : null }));
  const viejas = preguntas.filter(q => q.horas >= 24).length;
  if (viejas) alertas.push({ id: null, vista: 'preguntas', nivel: 2, txt: `${viejas} ${viejas === 1 ? 'pregunta lleva' : 'preguntas llevan'} más de 24 h sin respuesta` });
  alertas.sort((a, b) => b.nivel - a.nivel);

  const conCosto = items.filter(i => i.rentabilidad?.completo);
  const calidades = items.filter(i => i.calidad?.score != null).map(i => i.calidad.score);
  const rentResumen = {
    ganancia: conCosto.length ? conCosto.reduce((s, i) => s + i.rentabilidad.ganancia, 0) : null,
    conCosto: conCosto.length, sinCosto: items.filter(i => i.status === 'active' && !i.rentabilidad?.completo).length,
    perdiendo: conCosto.filter(i => i.rentabilidad.margen < 0).length,
  };

  const conteo = {};
  for (const it of items) conteo[it.clase] = (conteo[it.clase] || 0) + 1;

  return {
    hoy, desde: dias[0], hasta: ayer, ventana: VENTANA,
    resumen: { actual, anterior, conversionMediana, publicaciones: items.length, conteo,
      rentabilidad: rentResumen, calidadPromedio: calidades.length ? Math.round(calidades.reduce((a, b) => a + b, 0) / calidades.length) : null,
      abc: { A: items.filter(i => i.abc === 'A').length, B: items.filter(i => i.abc === 'B').length, C: items.filter(i => i.abc === 'C').length } },
    config, preguntas,
    serie: serieCuenta, alertas, items,
    series: Object.fromEntries(series),
  };
}
