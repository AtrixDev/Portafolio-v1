// api/academia.js — Academia IA: progreso de aprendizaje de skills de Mercado Libre
// GET  /api/academia                → progreso completo (requiere sesión del panel)
// GET  /api/academia?action=publico → solo las skills marcadas "mostrar en la web" (público, lo usa ia.html)
// POST /api/academia  { tareas, skills } → guarda el progreso (requiere sesión)
//
// Forma del documento (colección academia, _id 'progreso'):
//   tareas: { 'p1-2': '2026-09-27T…' }                       ← tareas del plan hechas y cuándo
//   skills: { pricing: { estado, campos: { antes, despues }, notas, publico } }
//   perfil: { posicionamiento, areas[], roles[], servicios[], notas }   ← privado; si no existe se usa lib/privado/perfil.js
//   negocio: [ { id, tipo, nombre, etapa, valor, originalidad, precios, siguiente, validacion } ] ← privado; default lib/privado/negocio.js
import { getDB } from './db.js';
import { cors, isAdmin } from '../lib/http.js';
// Datos privados (autoevaluación y precios): viven en lib/privado/, que no se sube a GitHub pero sí se publica en Vercel.
// En una copia sin esa carpeta, el panel arranca vacío y se completa desde el admin.
const PERFIL_DEFAULT = await import('../lib/privado/perfil.js').then(m => m.PERFIL_DEFAULT).catch(() => ({ posicionamiento: '', areas: [], roles: [], servicios: [], notas: '' }));
const NEGOCIO_DEFAULT = await import('../lib/privado/negocio.js').then(m => m.NEGOCIO_DEFAULT).catch(() => []);

const ESTADOS = new Set(['pendiente', 'aprendiendo', 'aplicada', 'dominada']);
const TIPOS = new Set(['herramienta', 'servicio', 'contenido', 'saas']);
const ETAPAS = new Set(['idea', 'aprendiendo', 'construyendo', 'validando', 'activo']);
const ID = /^[a-z0-9-]{1,40}$/;
const texto = (v, max) => String(v ?? '').trim().slice(0, max);

function limpiar(body) {
  const tareas = {}, skills = {};
  for (const [id, v] of Object.entries(body?.tareas || {}).slice(0, 200)) {
    if (ID.test(id) && v) tareas[id] = texto(v, 40);
  }
  for (const [id, s] of Object.entries(body?.skills || {}).slice(0, 60)) {
    if (!ID.test(id) || !s || typeof s !== 'object') continue;
    const campos = {};
    for (const [k, v] of Object.entries(s.campos || {}).slice(0, 8)) if (/^[a-z]{1,20}$/.test(k) && v !== '') campos[k] = texto(v, 80);
    skills[id] = { estado: ESTADOS.has(s.estado) ? s.estado : 'pendiente', campos, notas: texto(s.notas, 2000), publico: !!s.publico };
  }
  const datos = { tareas, skills };
  if (body?.perfil && typeof body.perfil === 'object') datos.perfil = limpiarPerfil(body.perfil);
  if (Array.isArray(body?.negocio)) datos.negocio = limpiarNegocio(body.negocio);
  return datos;
}

function limpiarNegocio(lista) {
  const punto = v => Math.min(10, Math.max(0, Math.round(Number(v)) || 0));
  return lista.slice(0, 100).map(n => ({
    id: ID.test(n?.id) ? n.id : 'item-' + Math.random().toString(36).slice(2, 8),
    tipo: TIPOS.has(n?.tipo) ? n.tipo : 'herramienta', etapa: ETAPAS.has(n?.etapa) ? n.etapa : 'idea',
    nombre: texto(n?.nombre, 120), valor: punto(n?.valor), originalidad: punto(n?.originalidad),
    mercado: texto(n?.mercado, 300), fuente: /^https?:\/\//.test(n?.fuente || '') ? texto(n.fuente, 400) : '',
    hoy: texto(n?.hoy, 80), conCasos: texto(n?.conCasos, 80),
    siguiente: texto(n?.siguiente, 500), validacion: texto(n?.validacion, 300), notas: texto(n?.notas, 2000),
    usa: (Array.isArray(n?.usa) ? n.usa : []).filter(x => ID.test(x)).slice(0, 10),
  }));
}

function limpiarPerfil(p) {
  const lista = (a, max) => (Array.isArray(a) ? a : []).slice(0, max);
  return {
    posicionamiento: texto(p.posicionamiento, 300),
    areas: lista(p.areas, 60).map(a => ({
      id: ID.test(a?.id) ? a.id : 'area-' + Math.random().toString(36).slice(2, 8),
      grupo: texto(a?.grupo, 40), nombre: texto(a?.nombre, 120),
      nivel: Math.min(5, Math.max(0, Math.round(Number(a?.nivel) * 2) / 2 || 0)),
      evidencia: texto(a?.evidencia, 600), falta: texto(a?.falta, 600),
      skills: lista(a?.skills, 10).filter(x => ID.test(x)), vendible: !!a?.vendible,
    })),
    roles: lista(p.roles, 20).map(r => ({ puesto: texto(r?.puesto, 150), rango: texto(r?.rango, 80), nota: texto(r?.nota, 300) })),
    servicios: lista(p.servicios, 30).map(r => ({ servicio: texto(r?.servicio, 150), rango: texto(r?.rango, 80), entregable: texto(r?.entregable, 300), nota: texto(r?.nota, 300) })),
    notas: texto(p.notas, 4000),
  };
}

export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS', req);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let db;
  try { db = await getDB(); } catch { return res.status(503).json({ error: 'Sin conexión con la base de datos' }); }
  const col = db.collection('academia');

  if (req.method === 'GET' && req.query.action === 'publico') {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    const doc = await col.findOne({ _id: 'progreso' }).catch(() => null);
    const skills = {};
    for (const [id, s] of Object.entries(doc?.skills || {})) {
      if (s.publico && s.estado !== 'pendiente') skills[id] = { estado: s.estado, campos: s.campos || {} };
    }
    return res.status(200).json({ skills });
  }

  if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'GET') {
    const doc = await col.findOne({ _id: 'progreso' });
    const { _id, ...resto } = doc || {};
    return res.status(200).json({ tareas: {}, skills: {}, ...resto, perfil: resto.perfil || PERFIL_DEFAULT, negocio: resto.negocio || NEGOCIO_DEFAULT });
  }

  if (req.method === 'POST') {
    const datos = limpiar(req.body);
    await col.updateOne({ _id: 'progreso' }, { $set: { ...datos, actualizado: new Date() } }, { upsert: true });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
