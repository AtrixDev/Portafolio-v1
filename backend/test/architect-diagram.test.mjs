// Pruebas de diagram.js: validación de la especificación, layout sin solapamientos y SVG accesible.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDiagram, layoutDiagram, renderDiagramSVG, describeDiagram, wrap, NODE_KINDS } from '../../frontend/js/architect/diagram.js';
import { loadKnowledge } from '../../frontend/js/architect/content.js';

const FRONT = join(dirname(fileURLToPath(import.meta.url)), '../../frontend/');
const raw = await loadKnowledge(async p => JSON.parse(readFileSync(FRONT + p, 'utf8')));
const conDiagrama = raw.entities.filter(e => e.diagram);
const base = () => ({ purpose: 'concept', title: 'T', nodes: [{ id: 'a', label: 'A', kind: 'actor', layer: 0 }, { id: 'b', label: 'B', kind: 'backend', layer: 1 }], edges: [{ from: 'a', to: 'b', label: 'x' }] });

test('hay diagramas reales y todos son válidos', () => {
  assert.ok(conDiagrama.length >= 12, `diagramas: ${conDiagrama.length}`);
  for (const e of conDiagrama) assert.deepEqual(validateDiagram(e.diagram), [], e.id);
});

test('rechaza especificaciones defectuosas', () => {
  const rompe = fn => { const d = base(); fn(d); return validateDiagram(d).join(' | '); };
  assert.match(rompe(d => { d.purpose = 'otro'; }), /purpose inválido/);
  assert.match(rompe(d => { d.title = ''; }), /falta title/);
  assert.match(rompe(d => { d.nodes.pop(); d.edges = []; }), /al menos 2 nodos/);
  assert.match(rompe(d => { d.nodes[1].id = 'a'; }), /nodo duplicado/);
  assert.match(rompe(d => { d.nodes[0].kind = 'cosa'; }), /kind inválido/);
  assert.match(rompe(d => { d.nodes[0].layer = -1; }), /layer/);
  assert.match(rompe(d => { d.nodes[0].label = 'x'.repeat(60); }), /label vacío o de más de/);
  assert.match(rompe(d => { d.edges.push({ from: 'a', to: 'zz' }); }), /nodo inexistente/);
  assert.match(rompe(d => { d.edges.push({ from: 'a', to: 'a' }); }), /consigo mismo/);
  assert.match(rompe(d => { d.edges = []; }), /sin conexiones/);
  assert.match(rompe(d => { d.edges[0].label = 'y'.repeat(40); }), /etiqueta de conexión/);
  assert.match(rompe(d => { d.nodes = Array.from({ length: 15 }, (_, i) => ({ id: 'n' + i, label: 'N', kind: 'neutral', layer: i % 3 })); d.edges = d.nodes.slice(1).map(n => ({ from: 'n0', to: n.id })); }), /demasiados nodos/);
});

test('layout: ningún nodo se sale del lienzo ni se pisa con otro, y las capas van de izquierda a derecha', () => {
  for (const e of conDiagrama) {
    const L = layoutDiagram(e.diagram);
    for (const n of L.nodes) { assert.ok(n.x >= 0 && n.y >= 0 && n.x + n.w <= L.width && n.y + n.h <= L.height, `${e.id}/${n.id} fuera del lienzo`); }
    for (let i = 0; i < L.nodes.length; i++) for (let j = i + 1; j < L.nodes.length; j++) {
      const a = L.nodes[i], b = L.nodes[j];
      const pisa = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      assert.ok(!pisa, `${e.id}: ${a.id} y ${b.id} se solapan`);
    }
    const porCapa = new Map(); for (const n of L.nodes) porCapa.set(n.layer, n.x);
    const caps = [...porCapa.keys()].sort((x, y) => x - y); for (let i = 1; i < caps.length; i++) assert.ok(porCapa.get(caps[i]) > porCapa.get(caps[i - 1]));
  }
});

test('SVG: incluye todos los componentes, escapa el texto y trae título y descripción para lectores de pantalla', () => {
  for (const e of conDiagrama) {
    const svg = renderDiagramSVG(e.diagram, { id: 't' });
    assert.match(svg, /^<svg[^>]+role="img"/);
    assert.match(svg, /<title id="t-t">/); assert.match(svg, /<desc id="t-d">/);
    for (const n of e.diagram.nodes) assert.ok(svg.includes(`data-node="${n.id}"`), `${e.id}: falta ${n.id}`);
    assert.equal((svg.match(/class="dg-edge/g) || []).length, e.diagram.edges.length, e.id);
  }
  const d = base(); d.nodes[0].label = 'A <b>&"x"'; d.title = 'T <script>';
  const svg = renderDiagramSVG(d);
  assert.ok(!svg.includes('<script>') && !svg.includes('<b>'));
  assert.ok(svg.includes('&lt;b&gt;&amp;&quot;x&quot;'));
});

test('descripción textual: lista componentes y conexiones con su dirección y si son asíncronas', () => {
  const d = describeDiagram(raw.entities.find(e => e.id === 'web-queue-worker').diagram);
  assert.match(d.components, /Frontend web/);
  assert.ok(d.connections.includes('Frontend web (API) → Cola de mensajes (encola el trabajo), asíncrono'));
});

test('wrap corta por palabras sin partirlas y respeta el máximo', () => {
  assert.deepEqual(wrap('Una sola aplicación: todos los módulos', 22), ['Una sola aplicación:', 'todos los módulos']);
  assert.deepEqual(wrap('Corto', 22), ['Corto']);
  for (const e of conDiagrama) for (const n of e.diagram.nodes) assert.ok(wrap(n.label, 22).length <= 3, `${e.id}/${n.id} necesita más de 3 líneas`);
  assert.deepEqual(NODE_KINDS.slice(0, 2), ['actor', 'frontend']);
});
