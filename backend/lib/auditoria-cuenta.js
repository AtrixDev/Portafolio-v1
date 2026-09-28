// lib/auditoria-cuenta.js — Resumen de auditoría de una cuenta, para mostrarle al seller en la web
// Misma lógica que la pestaña Auditoría del ML Tracker (frontend/js/tracker-app.js): salud por área
// y problemas del catálogo de diagnóstico (frontend/data/ia-meli.json). El informe completo, con el
// plan de 10 acciones, lo entrega Darío desde el admin.

const DETECTA = {
  catalogo: i => i.catalogo?.status === 'competing',
  quiebre: i => i.clase === 'sin_stock' || ['quiebre', 'reponer'].includes(i.alertaStock?.tipo),
  perdida: i => i.status === 'active' && i.rentabilidad?.completo && i.rentabilidad.margen < 0,
  exposicion: i => i.clase === 'perdiendo' && i.diagnostico.some(x => x.tipo === 'exposicion'),
  oferta: i => i.clase === 'perdiendo' && i.diagnostico.some(x => x.tipo === 'oferta'),
  'visitas-sin-ventas': i => i.clase === 'visitas_sin_ventas',
  calidad: i => i.abc === 'A' && i.calidad?.score != null && i.calidad.score < 60,
  inmovilizado: i => i.alertaStock?.tipo === 'inmovilizado',
  dormida: i => i.clase === 'dormida',
  suba: i => ['subir', 'probar_suba'].includes(i.precio?.accion),
};
const TITULO = {
  catalogo: 'Perdiste el primer lugar del catálogo', quiebre: 'Se quedan sin stock', perdida: 'Venden a pérdida',
  exposicion: 'Pierden exposición', oferta: 'La conversión se cae con visitas estables', 'visitas-sin-ventas': 'Tienen visitas pero no venden',
  calidad: 'Venden mucho pero su calidad es baja', inmovilizado: 'Stock inmovilizado', dormida: 'Casi nadie las ve', suba: 'Podrían subir el precio',
};
const PRIORIDAD = { perdida: 3, quiebre: 3, catalogo: 3, exposicion: 2, oferta: 2, 'visitas-sin-ventas': 2, calidad: 1, inmovilizado: 1, dormida: 1, suba: 1 };

function enJuego(id, items) {
  if (id === 'perdida') return { monto: items.reduce((t, i) => t + -i.rentabilidad.margen * i.actual.unidades, 0), txt: 'perdidos en el período' };
  if (id === 'inmovilizado') return { monto: items.reduce((t, i) => t + (i.stock || 0) * (i.rentabilidad?.costo ?? i.price ?? 0), 0), txt: 'en stock parado' };
  if (id === 'suba') return { monto: items.reduce((t, i) => t + Math.max(0, (i.precio.sugerido || i.price) - i.price) * i.actual.unidades, 0), txt: 'de margen extra posible' };
  if (id === 'dormida') return null;
  return { monto: items.reduce((t, i) => t + i.actual.facturacion, 0), txt: 'de facturación en juego' };
}

export function resumenAuditoria(a) {
  const act = a.items.filter(i => i.status === 'active'), n = act.length || 1;
  const share = f => Math.round(100 * (1 - act.filter(f).length / n));
  const conCosto = act.filter(i => i.rentabilidad?.completo);
  const viejas = (a.preguntas || []).filter(q => q.horas >= 24).length;
  const areas = [
    ['Visibilidad', share(i => DETECTA.exposicion(i) || DETECTA.catalogo(i) || DETECTA.dormida(i))],
    ['Conversión', share(i => DETECTA.oferta(i) || DETECTA['visitas-sin-ventas'](i))],
    ['Rentabilidad', conCosto.length ? Math.round(100 * conCosto.filter(i => i.rentabilidad.margen >= 0).length / conCosto.length) : null],
    ['Stock', share(i => DETECTA.quiebre(i) || DETECTA.inmovilizado(i))],
    ['Calidad de fichas', a.resumen.calidadPromedio ?? null],
    ['Atención', Math.max(0, 100 - viejas * 15)],
  ].map(([area, valor]) => ({ area, valor }));
  const con = areas.filter(x => x.valor != null);
  const hallazgos = Object.keys(DETECTA).map(id => {
    const items = a.items.filter(DETECTA[id]);
    if (!items.length) return null;
    const j = enJuego(id, items);
    return { id, titulo: TITULO[id], prioridad: PRIORIDAD[id], publicaciones: items.length, monto: j && j.monto > 0 ? Math.round(j.monto) : null, montoTxt: j?.txt || null };
  }).filter(Boolean).sort((x, y) => y.prioridad - x.prioridad || (y.monto || 0) - (x.monto || 0));
  return {
    salud: con.length ? Math.round(con.reduce((t, x) => t + x.valor, 0) / con.length) : null,
    areas, publicaciones: a.items.length, activas: act.length,
    facturacion: Math.round(a.resumen.actual.facturacion), conversion: a.resumen.actual.conversion,
    hallazgos: hallazgos.slice(0, 3), totalHallazgos: hallazgos.length,
    sinCostos: !conCosto.length,
  };
}
