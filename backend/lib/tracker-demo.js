// lib/tracker-demo.js — Cuenta demo de ML Tracker (datos simulados, siempre iguales)
// Cada publicación representa un caso típico para ver cómo responde el motor de análisis.
import { HISTORIA, rangoDias, sumarDias, diaAR } from './tracker.js';

function prng(semilla) {           // mulberry32: mismo resultado en cada carga
  let a = semilla >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function poisson(lambda, rnd) {
  if (lambda <= 0) return 0;
  if (lambda > 40) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * gauss(rnd)));
  let L = Math.exp(-lambda), k = 0, p = 1;
  do { k++; p *= rnd(); } while (p > L);
  return k - 1;
}
function gauss(rnd) { return Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd()); }

// t: índice del día (0 = hace 150 días, 149 = ayer). Cada caso define visitas/día, conversión y precio.
const CASOS = [
  { id: 'MLA2000000001', title: 'Mandolina Rebanadora Profesional Acero Inoxidable 5 Cuchillas', precio: () => 45900, visitas: () => 130, conv: () => 0.052, stock: 240, reponer: true,
    calidad: { score: 55, nivel: 'Estándar', faltan: [{ grupo: 'Datos del producto', titulo: 'Corregí las características para recibir menos preguntas y devoluciones', detalle: ['Completá los datos marcados como “requeridos”.'] }] } },
  { id: 'MLA2000000002', title: 'Lámpara Infrarroja Calor Reptiles Tortugas 75w Con Portalámpara', precio: () => 18900, visitas: t => t < 105 ? 28 : 28 + (t - 105) * 2.1, conv: () => 0.034, stock: 160, reponer: true },
  { id: 'MLA2000000003', title: 'Set Cuchillos Cocina Acero 6 Piezas Con Taco De Madera', precio: () => 38500, visitas: t => t < 122 ? 150 : 72, conv: () => 0.027, stock: 90, reponer: true,
    catalogo: { status: 'competing', price_to_win: 36900, current_price: 38500 } },
  { id: 'MLA2000000004', title: 'Freidora De Aire 4 Litros Digital 1500w Antiadherente', precio: t => t < 124 ? 89900 : 106000, visitas: () => 95, conv: t => t < 124 ? 0.036 : 0.015, stock: 60, reponer: true },
  { id: 'MLA2000000005', title: 'Mochila Urbana Impermeable Porta Notebook 15.6 Usb', precio: () => 32900, visitas: () => 62, conv: () => 0.0008, stock: 80,
    calidad: { score: 38, nivel: 'Básica', faltan: [{ grupo: 'Datos del producto', titulo: 'Mejorá las fotos para tener más visitas', detalle: ['Agregá más fotos para mostrar tu producto desde diferentes ángulos, subí 3 como mínimo.'] }, { grupo: 'Condiciones de venta', titulo: 'Agregá cuotas al mismo precio que publicaste para que tu publicación sea más competitiva', detalle: [] }] } },
  { id: 'MLA2000000006', title: 'Soporte Monitor Escritorio Articulado Brazo Gas', precio: () => 27400, visitas: () => 1.1, conv: () => 0.03, stock: 25 },
  { id: 'MLA2000000007', title: 'Termo Acero Inoxidable 1 Litro Pico Cebador Mate', precio: t => t < 90 ? 21900 : 24100, visitas: () => 105, conv: () => 0.061, stock: 500, reponer: true },
  { id: 'MLA2000000008', title: 'Balanza Digital Cocina 10kg Precisión 1g Con Tara', precio: () => 12400, visitas: () => 70, conv: () => 0.035, stock: 9 },
  { id: 'MLA2000000009', title: 'Organizador Cajones Plástico Set 8 Piezas Apilables', precio: () => 15800, visitas: () => 20, conv: () => 0.009, stock: 420 },
  { id: 'MLA2000000010', title: 'Botella Deportiva Térmica 750ml Doble Pared', precio: () => 14900, visitas: () => 55, conv: () => 0.028, stock: 140, reponer: true, costo: 0.86 },
  { id: 'MLA2000000011', title: 'Ventilador De Pie 20 Pulgadas 3 Velocidades 90w', precio: () => 64900, visitas: () => 40, conv: () => 0.02, stock: 30, pausada: true },
  { id: 'MLA2000000012', title: 'Rallador Multiuso 4 Caras Acero Con Recipiente', precio: () => 9900, visitas: t => t < 135 ? 0 : (t - 135) * 5, conv: () => 0.045, stock: 120, nueva: 15 },
  { id: 'MLA2000000013', title: 'Tabla De Picar Bambú Grande Con Canaleta 40x30', precio: () => 11900, visitas: () => 48, conv: () => 0.03, stock: 70, reponer: true,
    catalogo: { status: 'winning', price_to_win: 12900, current_price: 11900 } },
];

export function cuentaDemo(hoy = diaAR()) {
  const rnd = prng(20260925);
  const dias = rangoDias(sumarDias(hoy, -1), HISTORIA);
  const datos = { items: [], visitas: {}, ventas: {}, fotos: {}, catalogo: {}, costos: {}, config: { impuestosPct: 3 }, preguntas: [] };

  for (const c of CASOS) {
    const vis = {}, ven = {}, fot = {};
    let stock = c.stock + (c.reponer ? 0 : 0);
    dias.forEach((d, t) => {
      if (c.pausada && t >= HISTORIA - 20) return;
      const semana = 1 + 0.12 * Math.sin((t / 7) * 2 * Math.PI);          // ciclo semanal
      const v = poisson(c.visitas(t) * semana, rnd);
      const u = Math.min(v, poisson(v * c.conv(t), rnd));
      const precio = c.precio(t);
      if (v) vis[d] = v;
      if (u) ven[d] = { u, r: u * precio };
      fot[d] = { precio, stock: null };
    });
    datos.visitas[c.id] = vis; datos.ventas[c.id] = ven; datos.fotos[c.id] = fot;
    if (c.catalogo) datos.catalogo[c.id] = c.catalogo;
    const precioHoy = c.precio(HISTORIA - 1);
    const premium = c.id.endsWith('1') || c.id.endsWith('7');
    datos.costos[c.id] = Math.round(precioHoy * (c.costo ?? 0.42));
    datos.items.push({
      comision: { pct: premium ? 28.5 : 14.35, fijo: 0, monto: precioHoy * (premium ? 0.285 : 0.1435), tipo: premium ? 'Premium' : 'Clásica' },
      envioGratis: precioHoy >= 33000, costoEnvio: precioHoy >= 33000 ? 7890 : null,
      calidad: c.calidad || { score: 82, nivel: 'Profesional', faltan: [] },
      category_id: 'MLA1234', listing_type_id: premium ? 'gold_pro' : 'gold_special',
      id: c.id, title: c.title, price: c.precio(HISTORIA - 1), available_quantity: stock,
      status: c.pausada ? 'paused' : 'active', thumbnail: null,
      permalink: null, catalog_listing: !!c.catalogo,
      date_created: c.nueva ? sumarDias(hoy, -c.nueva) + 'T12:00:00.000Z' : sumarDias(hoy, -400) + 'T12:00:00.000Z',
    });
  }
  const hace = h => new Date(Date.now() - h * 36e5).toISOString();
  datos.preguntas = [
    { id: 1, item: 'MLA2000000004', texto: '¿Sirve para hacer papas congeladas? ¿Cuánto tarda?', fecha: hace(31) },
    { id: 2, item: 'MLA2000000008', texto: 'Hola, ¿tenés stock para 3 unidades? ¿Hacés factura A?', fecha: hace(26) },
    { id: 3, item: 'MLA2000000001', texto: '¿Las cuchillas son reemplazables?', fecha: hace(5) },
  ];
  return datos;
}
