// api/ml-callback.js — ML redirige acá después de autorizar (debe coincidir con ML_REDIRECT_URI)
// Tres orígenes: el admin (cuenta principal), un cliente con link de invitación y un seller que pidió
// la auditoría gratis desde sistema.html (tipo 'lead': vuelve a la web a ver su resultado).
import { getDB } from './db.js';
import { ADMIN_SECRET } from '../lib/http.js';
import { checkState, linkAccount } from '../lib/ml.js';

const destino = {
  admin: { ok: n => `/admin.html?ml=ok&nick=${encodeURIComponent(n)}`, error: '/admin.html?ml=error', cancelado: '/admin.html?ml=cancelado' },
  cliente: { ok: n => `/vinculado.html?estado=ok&nick=${encodeURIComponent(n)}`, error: '/vinculado.html?estado=error', cancelado: '/vinculado.html?estado=cancelado' },
};
const lead = lid => ({ ok: () => `/sistema.html?auditoria=${lid}#auditar`, error: '/sistema.html?auditoria=error#auditar', cancelado: '/sistema.html?auditoria=cancelada#auditar' });

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  const st = checkState(state, ADMIN_SECRET);
  const esLead = st?.tipo === 'lead' && /^[a-f0-9]{32}$/.test(st.lid || '');
  const ir = esLead ? lead(st.lid) : destino[st?.tipo === 'cliente' ? 'cliente' : 'admin'];
  if (error) return res.redirect(302, ir.cancelado);
  if (!code || !st) {
    return res.status(400).send('Solicitud inválida o vencida. Volvé a intentar desde el link que te pasaron.');
  }
  try {
    const db = await getDB();
    const nick = await linkAccount(db, code, state, st.tipo, esLead ? { leadId: st.lid } : {});
    if (esLead) {
      const cuenta = await db.collection('ml_accounts').findOne({ leadId: st.lid }, { projection: { _id: 1 } });
      // Sincronización desde cero; la página la avanza por tandas mientras el seller espera
      await db.collection('ml_accounts').updateOne({ _id: cuenta._id }, { $set: { 'sync.fase': 'ids' } });
      const p = await db.collection('auditorias').findOneAndUpdate(
        { _id: st.lid }, { $set: { cuenta: cuenta._id, nickname: nick, estado: 'sincronizando', conectadoAt: new Date() } }, { returnDocument: 'after' });
      if (p) await db.collection('messages').insertOne({
        name: p.nombre, email: p.email, company: nick, reason: 'auditoria', read: false, createdAt: new Date(),
        message: `Conectó su cuenta de Mercado Libre (${nick}) para la auditoría gratis.${p.whatsapp ? `\nWhatsApp: ${p.whatsapp}` : ''}\nYa ve su resumen en la web. Su cuenta está en ML Tracker: generale el informe completo desde la pestaña Auditoría y mandáselo.`,
      });
    }
    return res.redirect(302, ir.ok(nick));
  } catch (err) {
    console.error('[ml-callback]', err.message);
    return res.redirect(302, ir.error);
  }
}
