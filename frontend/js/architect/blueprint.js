// js/architect/blueprint.js — Del resultado del Decision Engine a diagramas separados POR PROPÓSITO (no un único diagrama confuso).
// Cada blueprint es una especificación de diagram.js + notas + las entidades que conviene aprender para entenderlo.
// Puro: recibe el resultado de decide(), el conocimiento y las señales; devuelve especificaciones.
import { validateDiagram } from './diagram.js';

const L = (id) => `#/c/${id}`;
const has = (res, dim, id) => (res.decided[dim] || []).includes(id);
const pickName = (res, dim, fallback) => res.decisions.find(d => d.id === dim)?.picks[0]?.name || fallback;

/** Construye todos los blueprints que apliquen. `ctx` = { productName, users } con textos ya resueltos. */
export function buildBlueprints(res, K, ctx = {}) {
  const S = res.signals, out = [];
  const product = ctx.productName || 'El producto';
  const noBackend = has(res, 'architecture', 'no-backend');
  const arch = res.decided.architecture?.[0], render = res.decided.rendering?.[0];
  const db = res.decided.data_store?.[0], hasDb = db && db !== 'none';
  const queue = has(res, 'communication', 'message-queue'), ws = has(res, 'communication', 'websocket'), pubsub = has(res, 'communication', 'pub-sub');
  const cache = has(res, 'data_layers', 'cache'), storage = has(res, 'data_layers', 'object-storage'), search = has(res, 'data_layers', 'search-engine');
  const auth = has(res, 'identity_security', 'authentication-and-authorization');
  const aiProduct = res.decided.ai_product?.[0];
  const entity = id => (K.get(id) ? L(id) : undefined);

  // ── 1. Contexto del sistema: quién lo usa y con qué sistemas externos habla ──
  {
    const nodes = [{ id: 'users', label: ctx.users ? `Usuarios: ${ctx.users}`.slice(0, 44) : 'Usuarios', kind: 'actor', layer: 0 }];
    const edges = [];
    if (S.auth === 'roles' || S.auth === 'multi_tenant') { nodes.push({ id: 'admin', label: S.auth === 'multi_tenant' ? 'Administradores de cada organización' : 'Administradores', kind: 'actor', layer: 0 }); }
    nodes.push({ id: 'system', label: product, kind: 'backend', layer: 1 });
    edges.push({ from: 'users', to: 'system', label: 'usa' });
    if (nodes.some(n => n.id === 'admin')) edges.push({ from: 'admin', to: 'system', label: 'gestiona' });
    const ext = [];
    if (S.payments !== 'none' && S.payments !== 'unknown') ext.push(['pay', S.payments === 'split' ? 'Proveedor de pagos (pagos divididos)' : 'Proveedor de pagos', 'cobros']);
    if (auth && ['users', 'roles', 'multi_tenant'].includes(S.auth)) ext.push(['idp', 'Proveedor de identidad (opcional)', 'identidad']);
    if (queue || S.background === 'some' || S.background === 'heavy') ext.push(['mail', 'Correo y notificaciones', 'avisos']);
    if (S.integrations === 'many') ext.push(['erp', 'Otros sistemas (ERP, APIs)', 'datos']);
    if (S.capture === 'contact' && noBackend) ext.push(['form', 'Servicio de formularios', 'mensajes']);
    if (aiProduct) ext.push(['llm', 'Proveedor de modelos de IA', 'consultas']);
    for (const [id, label, edge] of ext.slice(0, 6)) { nodes.push({ id, label, kind: 'external', layer: 2 }); edges.push({ from: 'system', to: id, label: edge }); }
    if (nodes.length >= 2 && edges.length >= 1) out.push({ id: 'system-context', purpose: 'system_context', title: `Contexto del sistema: ${product}`, nodes, edges, learn: [], notes: ['Muestra quién usa el sistema y con qué servicios externos se comunica. Todavía no muestra cómo está construido por dentro.'] });
  }

  // ── 2. Arquitectura de la aplicación ──
  {
    const nodes = [{ id: 'client', label: 'Navegador del usuario', kind: 'actor', layer: 0 }];
    const edges = [];
    const frontLabel = { 'static-site': 'Archivos estáticos (hosting o CDN)', ssg: 'Páginas generadas en la construcción (CDN)', ssr: 'App web con renderizado en el servidor', csr: 'Aplicación en el navegador (JavaScript)', 'hybrid-rendering': 'Frontend con renderizado híbrido' }[render] || 'Frontend';
    nodes.push({ id: 'front', label: frontLabel, kind: 'frontend', layer: 1, link: entity(render) });
    edges.push({ from: 'client', to: 'front', label: 'HTTP' });
    if (!noBackend) {
      const apiLabel = arch === 'microservices' ? 'Puerta de entrada (gateway) y servicios' : arch === 'modular-monolith' ? 'Backend: monolito modular' : arch === 'web-queue-worker' ? 'Backend web (API)' : arch === 'event-driven' ? 'Servicios productores de eventos' : 'Backend: monolito';
      nodes.push({ id: 'api', label: apiLabel, kind: 'backend', layer: 2, link: entity(arch) });
      edges.push({ from: 'front', to: 'api', label: render === 'csr' ? 'API (JSON)' : 'datos' });
      if (auth) { nodes.push({ id: 'auth', label: 'Autenticación y permisos', kind: 'security', layer: 3, link: entity('authentication-and-authorization') }); edges.push({ from: 'api', to: 'auth', label: 'valida en cada petición' }); }
      if (hasDb) { nodes.push({ id: 'db', label: db === 'nosql-database' ? 'Base de datos NoSQL' : 'Base de datos relacional', kind: 'data', layer: 3, link: entity(db) }); edges.push({ from: 'api', to: 'db', label: 'lee y escribe' }); }
      if (cache) { nodes.push({ id: 'cache', label: 'Caché', kind: 'data', layer: 3, link: entity('cache') }); edges.push({ from: 'api', to: 'cache', label: 'lecturas repetidas' }); }
      if (storage) { nodes.push({ id: 'files', label: 'Almacenamiento de archivos', kind: 'data', layer: 3, link: entity('object-storage') }); edges.push({ from: 'api', to: 'files', label: 'archivos' }); }
      if (search) { nodes.push({ id: 'search', label: 'Motor de búsqueda', kind: 'data', layer: 3, link: entity('search-engine') }); edges.push({ from: 'api', to: 'search', label: 'consultas' }); }
      if (queue || pubsub) {
        nodes.push({ id: 'queue', label: pubsub ? 'Broker de eventos' : 'Cola de mensajes', kind: 'queue', layer: 3, link: entity(pubsub ? 'pub-sub' : 'message-queue') });
        edges.push({ from: 'api', to: 'queue', label: pubsub ? 'publica eventos' : 'encola trabajo', async: true });
        nodes.push({ id: 'worker', label: pubsub ? 'Consumidores' : 'Trabajador', kind: 'backend', layer: 4 });
        edges.push({ from: 'queue', to: 'worker', label: 'entrega', async: true });
        if (hasDb) edges.push({ from: 'worker', to: 'db', label: 'guarda el resultado' });
      }
      if (ws) { edges.push({ from: 'api', to: 'client', label: 'actualizaciones en vivo', async: true }); }
      if (aiProduct) { nodes.push({ id: 'ai', label: aiProduct === 'ai-agent' ? 'Agente de IA con herramientas acotadas' : aiProduct === 'ai-workflow' ? 'Workflow con pasos de modelo' : 'Asistente de IA', kind: 'ai', layer: 4, link: entity(aiProduct) }); edges.push({ from: 'api', to: 'ai', label: 'consulta' }); }
      if (nodes.length > 13) nodes.length = 13;
    }
    const e2 = edges.filter(e => nodes.some(n => n.id === e.from) && nodes.some(n => n.id === e.to));
    out.push({ id: 'application', purpose: 'application', title: 'Arquitectura de la aplicación', nodes, edges: e2, learn: [render, arch, db].filter(x => x && K.get(x)), notes: noBackend ? ['No hay un backend propio: lo dinámico (formularios, analítica) lo resuelven servicios externos.'] : ['Línea punteada: comunicación asíncrona. Las piezas con enlace llevan a su ficha para aprender qué son y por qué están.'] });
  }

  // ── 3. Flujo de datos: el camino de una acción que modifica datos ──
  if (!noBackend && hasDb) {
    const nodes = [{ id: 'user', label: 'Persona', kind: 'actor', layer: 0 }, { id: 'ui', label: 'Interfaz', kind: 'frontend', layer: 1 }, { id: 'api', label: 'Backend: valida y aplica reglas', kind: 'backend', layer: 2 }, { id: 'db', label: 'Base de datos (transacción)', kind: 'data', layer: 3 }];
    const edges = [{ from: 'user', to: 'ui', label: 'acción' }, { from: 'ui', to: 'api', label: 'petición' }, { from: 'api', to: 'db', label: 'guarda' }, { from: 'api', to: 'ui', label: 'respuesta' }];
    if (S.payments !== 'none' && S.payments !== 'unknown') { nodes.push({ id: 'pay', label: 'Proveedor de pagos', kind: 'external', layer: 3 }); edges.push({ from: 'api', to: 'pay', label: 'cobra' }); }
    if (queue) { nodes.push({ id: 'q', label: 'Cola', kind: 'queue', layer: 4 }, { id: 'w', label: 'Trabajador: correos y tareas', kind: 'backend', layer: 5 }); edges.push({ from: 'api', to: 'q', label: 'encola', async: true }, { from: 'q', to: 'w', label: 'procesa', async: true }); }
    out.push({ id: 'data-flow', purpose: 'data_flow', title: 'Flujo de datos de una acción que modifica información', nodes, edges, learn: ['relational-database'].filter(x => K.get(x)), notes: ['La respuesta a la persona no espera a lo que corre en segundo plano.', 'Antes de guardar, el backend valida la entrada y los permisos: no se confía en lo que envía la interfaz.'] });
  }

  // ── 4. Autenticación ──
  if (auth) {
    out.push({ id: 'authentication', purpose: 'authentication', title: 'Autenticación y autorización', nodes: [
      { id: 'u', label: 'Persona', kind: 'actor', layer: 0 }, { id: 'ui', label: 'Interfaz', kind: 'frontend', layer: 1 }, { id: 'idp', label: 'Proveedor de identidad o módulo de acceso', kind: 'security', layer: 2 }, { id: 'api', label: 'Backend: verifica sesión y permisos', kind: 'backend', layer: 3 }, { id: 'data', label: 'Datos de la persona u organización', kind: 'data', layer: 4 }],
      edges: [{ from: 'u', to: 'ui', label: 'ingresa' }, { from: 'ui', to: 'idp', label: 'credenciales' }, { from: 'idp', to: 'ui', label: 'sesión o token' }, { from: 'ui', to: 'api', label: 'petición + sesión' }, { from: 'api', to: 'data', label: S.auth === 'multi_tenant' ? 'filtra por organización' : 'solo lo suyo' }],
      learn: ['authentication-and-authorization'], notes: ['Autenticar (quién es) y autorizar (qué puede hacer) son pasos distintos; la autorización se verifica en el servidor en cada petición.'] });
  }

  // ── 5. Despliegue ──
  {
    const nodes = [{ id: 'dev', label: 'Repositorio y construcción automática', kind: 'infra', layer: 0 }];
    const edges = [];
    if (noBackend || render === 'static-site' || render === 'ssg') { nodes.push({ id: 'cdn', label: 'Hosting estático con CDN', kind: 'infra', layer: 1 }); edges.push({ from: 'dev', to: 'cdn', label: 'publica archivos' }); }
    else { nodes.push({ id: 'app', label: arch === 'web-queue-worker' ? 'Servicio web (autoescalable)' : 'Aplicación en un servicio administrado', kind: 'infra', layer: 1 }); edges.push({ from: 'dev', to: 'app', label: 'despliega' }); }
    if (hasDb) { nodes.push({ id: 'dbs', label: 'Base de datos administrada con copias', kind: 'data', layer: 2 }); edges.push({ from: nodes[1].id, to: 'dbs', label: 'conexión segura' }); }
    if (queue) { nodes.push({ id: 'wk', label: 'Proceso trabajador (escala aparte)', kind: 'infra', layer: 2 }); edges.push({ from: nodes[1].id, to: 'wk', label: 'cola', async: true }); }
    nodes.push({ id: 'obs', label: 'Registros, métricas y alertas', kind: 'infra', layer: 3 }); edges.push({ from: nodes[1].id, to: 'obs', label: 'emite señales' });
    out.push({ id: 'deployment', purpose: 'deployment', title: 'Despliegue', nodes, edges, learn: ['logs-metrics-traces'].filter(x => K.get(x)), notes: ['Es un esquema de referencia: no nombra proveedores. La elección concreta depende de costo, equipo y ecosistema.'] });
  }

  // ── 6. Flujo de IA (solo si el producto usa IA) ──
  if (aiProduct) {
    const base = [{ id: 'in', label: 'Entrada de la persona', kind: 'actor', layer: 0 }, { id: 'sys', label: 'Backend: arma el contexto', kind: 'backend', layer: 1 }];
    let nodes, edges;
    if (aiProduct === 'ai-agent' || aiProduct === 'multi-agent') {
      nodes = [...base, { id: 'llm', label: 'Agente: decide el próximo paso', kind: 'ai', layer: 2 }, { id: 'tools', label: 'Herramientas con permisos mínimos', kind: 'external', layer: 3 }, { id: 'lim', label: 'Límites: pasos, costo y tiempo', kind: 'security', layer: 3 }, { id: 'human', label: 'Persona aprueba lo irreversible', kind: 'actor', layer: 4 }];
      edges = [{ from: 'in', to: 'sys' }, { from: 'sys', to: 'llm', label: 'objetivo' }, { from: 'llm', to: 'tools', label: 'acción' }, { from: 'tools', to: 'llm', label: 'resultado' }, { from: 'llm', to: 'lim', label: 'se controla' }, { from: 'lim', to: 'human', label: 'pide aprobación' }];
    } else if (aiProduct === 'ai-workflow') {
      nodes = [...base, { id: 's1', label: 'Paso con modelo: interpretar', kind: 'ai', layer: 2 }, { id: 'code', label: 'Código: valida y elige el camino', kind: 'backend', layer: 3 }, { id: 's2', label: 'Paso con modelo: producir', kind: 'ai', layer: 4 }, { id: 'ver', label: 'Código: valida la salida', kind: 'security', layer: 5 }];
      edges = [{ from: 'in', to: 'sys' }, { from: 'sys', to: 's1' }, { from: 's1', to: 'code' }, { from: 'code', to: 's2' }, { from: 's2', to: 'ver' }];
    } else {
      nodes = [...base, { id: 'llm', label: 'Asistente de IA', kind: 'ai', layer: 2 }, { id: 'ui', label: 'Respuesta que la persona revisa', kind: 'actor', layer: 3 }];
      edges = [{ from: 'in', to: 'sys' }, { from: 'sys', to: 'llm', label: 'consulta' }, { from: 'llm', to: 'ui', label: 'respuesta' }];
    }
    out.push({ id: 'ai-workflow', purpose: 'ai_workflow', title: 'Flujo de IA del producto', nodes, edges, learn: [aiProduct], notes: ['La salida del modelo se trata como una sugerencia: se valida antes de actuar.'] });
  }

  for (const b of out) { const e = validateDiagram(b); if (e.length) throw new Error(`Blueprint «${b.id}» inválido: ${e.join('; ')}`); }
  return out;
}

/** Texto Mermaid equivalente (para pegar en documentación: GitHub, Notion, etc.). */
export function toMermaid(b) {
  const q = s => String(s).replace(/"/g, "'");
  const lines = ['flowchart LR'];
  for (const n of b.nodes) lines.push(`  ${n.id.replace(/-/g, '_')}["${q(n.label)}"]`);
  for (const e of b.edges) lines.push(`  ${e.from.replace(/-/g, '_')} ${e.async ? '-.->' : '-->'}${e.label ? `|"${q(e.label)}"|` : ''} ${e.to.replace(/-/g, '_')}`);
  return lines.join('\n');
}
