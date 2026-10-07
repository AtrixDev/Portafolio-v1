// js/architect/diagram.js — Diagramas declarativos: una especificación (nodos en capas + conexiones) → SVG.
// Puro (sin DOM). Lo usan las fichas de concepto y, después, los blueprints. Cada diagrama dice qué muestra (purpose) y trae una
// descripción textual equivalente, para que no dependa de poder ver la imagen.
//
// spec = { purpose, title, nodes: [{ id, label, kind, layer, note? }], edges: [{ from, to, label?, async? }] }
//   layer: entero ≥ 0, de izquierda a derecha. El orden de los nodos dentro de una capa es el orden de aparición.
//   link (opcional): href al que lleva el nodo (por ejemplo, la ficha del concepto).
//   async: línea punteada (mensajes diferidos, eventos) frente a línea continua (llamada directa).

export const DIAGRAM_PURPOSES = Object.freeze({
  concept:         'Cómo funciona el concepto',
  system_context:  'Contexto del sistema',
  application:     'Arquitectura de la aplicación',
  data_flow:       'Flujo de datos',
  sequence:        'Secuencia',
  authentication:  'Autenticación',
  deployment:      'Despliegue',
  ai_workflow:     'Flujo de IA',
});
export const NODE_KINDS = Object.freeze(['actor', 'frontend', 'backend', 'data', 'queue', 'external', 'ai', 'security', 'infra', 'neutral']);
export const KIND_LABEL = Object.freeze({ actor: 'Persona o cliente', frontend: 'Frontend', backend: 'Backend', data: 'Datos', queue: 'Mensajería', external: 'Servicio externo', ai: 'IA', security: 'Seguridad', infra: 'Infraestructura', neutral: 'Componente' });

const MAX_LABEL = 44, MAX_NODES = 14;

export function validateDiagram(d, where = '') {
  const err = [], bad = m => err.push(`${where}diagrama: ${m}`);
  if (!d || typeof d !== 'object') return [`${where}diagrama: no es un objeto`];
  if (!DIAGRAM_PURPOSES[d.purpose]) bad(`purpose inválido: ${d.purpose}`);
  if (typeof d.title !== 'string' || !d.title.trim()) bad('falta title');
  if (!Array.isArray(d.nodes) || d.nodes.length < 2) { bad('necesita al menos 2 nodos'); return err; }
  if (d.nodes.length > MAX_NODES) bad(`demasiados nodos (${d.nodes.length} > ${MAX_NODES}): separalo por propósito`);
  const ids = new Set();
  for (const n of d.nodes) {
    if (!n || typeof n.id !== 'string' || !/^[a-z0-9_-]+$/.test(n.id)) { bad(`nodo con id inválido: ${n && n.id}`); continue; }
    if (ids.has(n.id)) bad(`nodo duplicado: ${n.id}`); ids.add(n.id);
    if (n.link !== undefined && !/^#\/c\/[a-z0-9-]+$/.test(n.link)) bad(`nodo «${n.id}»: link debe ser #/c/<id>`);
    if (typeof n.label !== 'string' || !n.label.trim() || n.label.length > MAX_LABEL) bad(`nodo «${n.id}»: label vacío o de más de ${MAX_LABEL} caracteres`);
    if (!NODE_KINDS.includes(n.kind)) bad(`nodo «${n.id}»: kind inválido (${n.kind})`);
    if (!Number.isInteger(n.layer) || n.layer < 0) bad(`nodo «${n.id}»: layer debe ser un entero ≥ 0`);
  }
  if (!Array.isArray(d.edges)) bad('edges debe ser una lista');
  else for (const e of d.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) bad(`conexión a un nodo inexistente: ${e.from} → ${e.to}`);
    else if (e.from === e.to) bad(`conexión de un nodo consigo mismo: ${e.from}`);
    if (e.label !== undefined && (typeof e.label !== 'string' || e.label.length > 28)) bad(`etiqueta de conexión inválida o de más de 28 caracteres: ${e.from} → ${e.to}`);
  }
  // un nodo sin ninguna conexión es ruido en un diagrama
  if (Array.isArray(d.edges)) for (const n of d.nodes) if (!d.edges.some(e => e.from === n.id || e.to === n.id)) bad(`nodo «${n.id}» sin conexiones`);
  return err;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Corta el texto en líneas de hasta `max` caracteres, sin partir palabras.
export function wrap(text, max = 20) {
  const out = []; let cur = '';
  for (const w of String(text).split(/\s+/)) {
    if (!cur) cur = w; else if ((cur + ' ' + w).length <= max) cur += ' ' + w; else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out;
}

const NW = 176, LH = 17, PADY = 14, GX = 84, GY = 26, M = 16;

/** Calcula posiciones. Devuelve { width, height, nodes[{…, x, y, w, h, lines}], edges[{…, d, lx, ly}] }. */
export function layoutDiagram(spec) {
  const layers = [...new Set(spec.nodes.map(n => n.layer))].sort((a, b) => a - b);
  const col = new Map(layers.map((l, i) => [l, i]));
  const nodes = spec.nodes.map(n => { const lines = wrap(n.label, 22); return { ...n, lines, w: NW, h: PADY * 2 + lines.length * LH }; });
  const colH = layers.map(l => { const ns = nodes.filter(n => n.layer === l); return ns.reduce((s, n) => s + n.h, 0) + GY * (ns.length - 1); });
  const H = Math.max(...colH) + M * 2;
  // el espacio entre dos capas se ajusta a la etiqueta más larga de las conexiones que lo cruzan (así el texto no se pisa con los nodos)
  const byLayer = new Map(spec.nodes.map(n => [n.id, col.get(n.layer)]));
  const gaps = layers.slice(1).map((_, i) => {
    let longest = 0;
    for (const e of spec.edges) { const a = byLayer.get(e.from), b = byLayer.get(e.to); if (e.label && Math.min(a, b) === i && Math.max(a, b) === i + 1) longest = Math.max(longest, e.label.length); }
    return Math.max(GX, Math.min(240, Math.round(longest * 6.3 + 30)));
  });
  const xs = layers.map((_, i) => M + i * NW + gaps.slice(0, i).reduce((s, g) => s + g, 0));
  layers.forEach((l, i) => {
    let y = M + (H - M * 2 - colH[i]) / 2;
    for (const n of nodes.filter(n => n.layer === l)) { n.x = xs[i]; n.y = y; y += n.h + GY; }
  });
  const W = M * 2 + layers.length * NW + gaps.reduce((s, g) => s + g, 0);
  const byId = new Map(nodes.map(n => [n.id, n]));
  const pair = (a, b) => [a, b].sort().join('|');
  const seen = new Map();
  const edges = spec.edges.map(e => {
    const a = byId.get(e.from), b = byId.get(e.to);
    const k = pair(e.from, e.to), idx = seen.get(k) || 0; seen.set(k, idx + 1);
    const off = idx ? (idx % 2 ? 1 : -1) * Math.ceil(idx / 2) * 12 : 0;     // varias conexiones entre el mismo par no se pisan
    let d, lx, ly;
    if (col.get(a.layer) !== col.get(b.layer)) {
      const right = col.get(a.layer) < col.get(b.layer);
      const x1 = right ? a.x + a.w : a.x, x2 = right ? b.x : b.x + b.w;
      const y1 = a.y + a.h / 2 + off, y2 = b.y + b.h / 2 + off, xm = (x1 + x2) / 2;
      d = `M ${x1} ${y1} C ${xm} ${y1}, ${xm} ${y2}, ${x2} ${y2}`; lx = xm; ly = (y1 + y2) / 2;
    } else {                                                                      // misma capa: línea vertical entre bordes
      const below = a.y < b.y, x = a.x + a.w / 2 + off;
      const y1 = below ? a.y + a.h : a.y, y2 = below ? b.y : b.y + b.h;
      d = `M ${x} ${y1} L ${x} ${y2}`; lx = x; ly = (y1 + y2) / 2;
    }
    return { ...e, d, lx, ly };
  });
  return { width: W, height: H, nodes, edges };
}

/** Descripción textual equivalente (para lectores de pantalla y para quien no ve bien el dibujo). */
export function describeDiagram(spec) {
  const lbl = id => spec.nodes.find(n => n.id === id).label;
  const comp = spec.nodes.map(n => n.label).join(', ');
  const con = spec.edges.map(e => `${lbl(e.from)} → ${lbl(e.to)}${e.label ? ` (${e.label})` : ''}${e.async ? ', asíncrono' : ''}`);
  return { components: comp, connections: con };
}

let seq = 0;
/** SVG listo para insertar. Los colores salen de variables CSS del sitio (claro/oscuro). */
export function renderDiagramSVG(spec, { id = `dg${++seq}` } = {}) {
  const L = layoutDiagram(spec), desc = describeDiagram(spec);
  const mk = `${id}-arrow`;
  const nodes = L.nodes.map(n => {
    const inner = `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10"/>${n.lines.map((t, i) => `<text x="${n.x + n.w / 2}" y="${n.y + PADY + LH * (i + .75)}" text-anchor="middle">${esc(t)}</text>`).join('')}`;
    const g = `<g class="dg-node dg-${n.kind}${n.link ? ' has-link' : ''}" data-node="${esc(n.id)}">${inner}</g>`;
    return n.link ? `<a href="${esc(n.link)}" aria-label="${esc(n.label)}: ver el concepto">${g}</a>` : g;
  }).join('');
  const edges = L.edges.map(e => `<g class="dg-edge${e.async ? ' is-async' : ''}"><path d="${e.d}" marker-end="url(#${mk})"/>${
    e.label ? `<text class="dg-lbl-bg" x="${e.lx}" y="${e.ly + 4}" text-anchor="middle">${esc(e.label)}</text><text class="dg-lbl" x="${e.lx}" y="${e.ly + 4}" text-anchor="middle">${esc(e.label)}</text>` : ''}</g>`).join('');
  return `<svg class="dg" viewBox="0 0 ${L.width} ${L.height}" width="${L.width}" height="${L.height}" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg">
<title id="${id}-t">${esc(spec.title)}</title><desc id="${id}-d">Componentes: ${esc(desc.components)}. Conexiones: ${esc(desc.connections.join('; '))}.</desc>
<defs><marker id="${mk}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="dg-head"/></marker></defs>
${edges}${nodes}</svg>`;
}
