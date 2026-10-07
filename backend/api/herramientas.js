// api/herramientas.js — infraestructura común de las herramientas públicas
// GET  ?action=resultado&id=…   → un resultado guardado por el servidor (público: el link compartible)
// POST ?action=lead             → deja email/WhatsApp DESPUÉS de ver el resultado; queda en el admin y se manda por mail
// POST ?action=evento           → cuenta un uso anónimo (sin datos personales)
// POST ?action=calcular         → rentabilidad: recibe SOLO la entrada, recalcula con el motor en el servidor y guarda el resultado (link compartible)
// Ningún resultado se esconde detrás del lead: GET resultado es libre.
import { getDB } from './db.js';
import { cors } from '../lib/http.js';
import { manejar } from '../lib/herramientas.js';

// Envoltorio fino: CORS + conexión a la base. Toda la lógica vive en lib/herramientas.js.
export default async function handler(req, res) {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  let db;
  try { db = await getDB(); } catch { return res.status(503).json({ error: 'Servicio no disponible', code: 'no_db' }); }
  return manejar(req, res, db);
}
