// lib/ia.js — IA opcional para clasificar o redactar.
// Regla de oro: la IA nunca es necesaria. Los datos y las reglas son la fuente de verdad;
// cada llamada EXIGE un `fallback` determinista, y si no hay clave, hay cuota agotada,
// error de red o la respuesta no valida, se devuelve el fallback (fuente: 'reglas').
import { rateLimit } from './http.js';

const MODELO = 'llama-3.1-8b-instant';
const URL_IA = 'https://api.groq.com/openai/v1/chat/completions';

export const iaDisponible = () => !!process.env.GROQ_API_KEY;

/**
 * @param {object}   o
 * @param {string}   o.prompt     Instrucción para el modelo (debe pedir JSON).
 * @param {Function} o.validar    json => boolean. Si da false, se usa el fallback.
 * @param {Function} o.fallback   () => datos. Obligatorio: cálculo determinista sin IA.
 * @param {object}  [o.db]        Mongo, para la cuota diaria global.
 * @param {number}  [o.cuotaDiaria=500]
 * @param {number}  [o.maxTokens=400]
 * @param {Function}[o.fetchImpl] Solo para tests.
 * @returns {Promise<{datos:any, fuente:'ia'|'reglas', motivo?:string}>}
 */
export async function clasificarJSON({ prompt, validar, fallback, db = null, cuotaDiaria = 500, maxTokens = 400, fetchImpl = fetch }) {
  if (typeof fallback !== 'function') throw new TypeError('clasificarJSON exige un fallback determinista');
  if (typeof validar !== 'function') throw new TypeError('clasificarJSON exige una función validar');
  const reglas = motivo => ({ datos: fallback(), fuente: 'reglas', motivo });

  const key = process.env.GROQ_API_KEY;
  if (!key) return reglas('sin_clave');
  try {
    if (db && !(await rateLimit(db, 'ia:global', cuotaDiaria, 86400))) return reglas('cuota');
    const r = await fetchImpl(URL_IA, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODELO, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, temperature: 0.2 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return reglas('http_' + r.status);
    const texto = (await r.json()).choices?.[0]?.message?.content || '';
    const json = JSON.parse(texto.match(/\{[\s\S]*\}/)?.[0] || 'null');
    if (!json || !validar(json)) return reglas('invalido');
    return { datos: json, fuente: 'ia' };
  } catch {
    return reglas('error');
  }
}
