// js/num-ar.js — leer y escribir números en formato argentino (miles con «.», decimales con «,»). Solo texto ↔ número: nada de economía.
// Mismas reglas que importar.js y perdida.js (que tienen su propia copia: se unifica cuando esas páginas se migren).

/** '' → null · «1.450,5», «4,20», «4.20», «1.450», «15%», «$ 3.000» → número · cualquier otra cosa → NaN */
export function parsearNumero(texto) {
  let s = String(texto ?? '').trim().replace(/\s|\$|%/g, '');
  if (!s) return null;
  if (!/^[-+]?[\d.,]+$/.test(s)) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^[-+]?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');       // «1.450» son miles; «1.5» es un decimal
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Número → texto es-AR sin ceros de relleno (para volver a poner un valor en un campo). Sin Intl: igual en todos los entornos. */
export function escribirNumero(n, decimales = 4) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  const r = Number(n.toFixed(decimales));
  let [entero, dec = ''] = Math.abs(r).toFixed(decimales).split('.');
  entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  dec = dec.replace(/0+$/, '');
  return (r < 0 ? '-' : '') + entero + (dec ? ',' + dec : '');
}
