// lib/correo.js — envío por Resend. Best-effort: si falta configuración o falla, devuelve false
// y el flujo sigue (el lead siempre queda guardado en el admin).
// RESEND_URL existe solo para poder probar con un servidor simulado.
export const correoConfigurado = () => !!(process.env.RESEND_API_KEY && process.env.CONTACT_FROM);

export async function enviarCorreo({ to, subject, text, replyTo }) {
  const key = process.env.RESEND_API_KEY, from = process.env.CONTACT_FROM;
  if (!key || !from || !to) return false;
  try {
    const r = await fetch(process.env.RESEND_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout(6000),
    });
    return r.ok;
  } catch { return false; }
}
