// lib/herramientas.js — lógica de api/herramientas.js (infraestructura común de las herramientas públicas), con la base INYECTADA para poder probarla sin Mongo.
// GET  ?action=resultado&id=…   → un resultado guardado por el servidor (público: el link compartible)
// POST ?action=lead             → deja email/WhatsApp DESPUÉS de ver el resultado; queda en el admin y se manda por mail
// POST ?action=evento           → cuenta un uso anónimo (sin datos personales)
// POST ?action=calcular         → rentabilidad: recibe SOLO la entrada, recalcula con el motor en el servidor y guarda el resultado (link compartible)
// Ningún resultado se esconde detrás del lead: GET resultado es libre.
import { clientIp, rateLimit } from './http.js';
import { leerResultado, sumarMetrica, textoResultado, HERRAMIENTAS } from './resultados.js';
import { enviarCorreo } from './correo.js';
import { calcularYGuardar } from './rentabilidad.js';

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function origen(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (String(host).startsWith('localhost') ? 'http' : 'https');
  return process.env.PUBLIC_URL || (host ? `${proto}://${host}` : 'https://portafolio-v1-dun-ten.vercel.app');
}

// Toda la lógica de los endpoints, con la base inyectada (así se prueba sin Mongo).
export async function manejar(req, res, db) {
  const action = String(req.query?.action || '');
  const ip = clientIp(req);

  if (req.method === 'GET' && action === 'resultado') {
    if (!(await rateLimit(db, `res:${ip}`, 120, 3600))) return res.status(429).json({ error: 'Demasiadas consultas seguidas. Probá en un rato.' });
    const r = await leerResultado(db, req.query.id);
    if (!r) return res.status(404).json({ error: 'Ese resultado no existe o ya venció (los resultados duran 90 días).' });
    return res.status(200).json(r);
  }

  if (req.method === 'POST' && action === 'evento') {
    const b = req.body || {};
    if (!(await rateLimit(db, `evt:${ip}`, 200, 3600))) return res.status(429).json({ ok: false });
    if (HERRAMIENTAS.includes(b.herramienta) && b.evento === 'compartir') await sumarMetrica(db, b.herramienta, 'compartir');
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST' && action === 'lead') {
    const b = req.body || {};
    if (b.website) return res.status(200).json({ ok: true });   // honeypot
    const email = clean(b.email, 120).toLowerCase();
    const nombre = clean(b.nombre, 80);
    const whatsapp = clean(b.whatsapp, 30).replace(/[^\d+ ()-]/g, '');
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Ese email no parece válido. Revisalo (ej: nombre@empresa.com).', errors: { email: true } });
    if (whatsapp && whatsapp.replace(/\D/g, '').length < 8) return res.status(400).json({ error: 'Ese WhatsApp parece corto. Poné el número con código de área.', errors: { whatsapp: true } });
    if (!(await rateLimit(db, `lead:${ip}`, 5, 3600))) return res.status(429).json({ error: 'Recibí varios pedidos seguidos desde tu conexión. Probá más tarde o escribime por WhatsApp.' });

    const r = await leerResultado(db, b.resultadoId);
    if (!r) return res.status(404).json({ error: 'No encuentro ese resultado. Volvé a generarlo y probamos de nuevo.' });

    const col = db.collection('messages');
    const previo = await col.findOne({ resultadoId: r.id, email });
    if (previo) return res.status(200).json({ ok: true, repetido: true, enviado: !!previo.emailedLead });

    // Evita usar el formulario para llenarle el mail a un tercero
    if (!(await rateLimit(db, `leadmail:${email}`, 3, 86400))) return res.status(429).json({ error: 'A ese email ya le mandé varios resultados hoy. Revisá tu bandeja o probá mañana.' });

    const link = origen(req) +`/herramientas.html?r=${r.id}`;
    const cuerpo = textoResultado(r, link);
    const doc = {
      name: nombre || email.split('@')[0], email, company: '', reason: 'herramienta',
      message: `Pidió recibir el resultado de «${r.herramienta}»${whatsapp ? ` · WhatsApp: ${whatsapp}` : ''}\n\n${cuerpo}`,
      herramienta: r.herramienta, resultadoId: r.id, whatsapp, origen: 'herramienta',
      read: false, createdAt: new Date(), emailed: false, emailedLead: false,
    };
    const { insertedId } = await col.insertOne(doc);
    await sumarMetrica(db, r.herramienta, 'lead');

    const [alLead, aDario] = await Promise.all([
      enviarCorreo({ to: email, replyTo: process.env.CONTACT_TO, subject: `Tu resultado: ${r.resumen.titulo || r.herramienta}`,
        text: `Hola${nombre ? ' ' + nombre : ''},\n\nAcá está el resultado que pediste:\n\n${cuerpo}\n\nSi querés que lo veamos juntos o que lo lleve a toda tu cuenta, respondé este mail o escribime por WhatsApp.\n\nDarío Colángelo` }),
      enviarCorreo({ to: process.env.CONTACT_TO, replyTo: email, subject: `Nuevo lead (${r.herramienta}): ${email}`, text: doc.message }),
    ]);
    await col.updateOne({ _id: insertedId }, { $set: { emailed: aDario, emailedLead: alLead } });
    return res.status(201).json({ ok: true, enviado: alLead });
  }

  if (req.method === 'POST' && action === 'calcular') {
    if (!(await rateLimit(db, `calc:${ip}`, 30, 3600))) return res.status(429).json({ error: 'Calculaste muchas veces seguidas desde tu conexión. Probá de nuevo en un rato.' });
    const { status, body } = await calcularYGuardar(db, req.body?.entrada);   // lo ÚNICO que se toma del cliente es `entrada`
    return res.status(status).json(body);
  }

  return res.status(405).json({ error: 'Acción no válida' });
}
