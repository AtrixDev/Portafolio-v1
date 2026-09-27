// api/ml-callback.js — ML redirige acá después de autorizar (debe coincidir con ML_REDIRECT_URI)
import { getDB } from './db.js';
import { ADMIN_SECRET } from '../lib/http.js';
import { checkState, linkAccount } from '../lib/ml.js';

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  const st = checkState(state, ADMIN_SECRET);
  const cliente = st?.tipo === 'cliente';
  if (error) return res.redirect(302, cliente ? '/vinculado.html?estado=cancelado' : '/admin.html?ml=cancelado');
  if (!code || !st) {
    return res.status(400).send('Solicitud inválida o vencida. Volvé a intentar desde el link que te pasaron.');
  }
  try {
    const db = await getDB();
    const nick = await linkAccount(db, code, state, st.tipo);
    return res.redirect(302, cliente
      ? `/vinculado.html?estado=ok&nick=${encodeURIComponent(nick)}`
      : `/admin.html?ml=ok&nick=${encodeURIComponent(nick)}`);
  } catch (err) {
    console.error('[ml-callback]', err.message);
    return res.redirect(302, cliente ? '/vinculado.html?estado=error' : '/admin.html?ml=error');
  }
}
