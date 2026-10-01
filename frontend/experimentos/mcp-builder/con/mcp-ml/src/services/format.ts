import { CHARACTER_LIMIT } from "../constants.js";

const CATALOG_ID = /^ML[A-Z]\d+$/;
const CATALOG_URL = /\/p\/(ML[A-Z]\d+)/i;

/**
 * Acepta un ID de catálogo ("MLA19615208", en cualquier capitalización) o una URL de
 * catálogo de Mercado Libre (que contiene "/p/MLA..."). Devuelve el ID normalizado o null.
 */
export function normalizeProductId(input: string): string | null {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(CATALOG_URL);
  if (fromUrl) return fromUrl[1].toUpperCase();
  const upper = trimmed.toUpperCase();
  return CATALOG_ID.test(upper) ? upper : null;
}

export function invalidProductIdMessage(input: string): string {
  return (
    `Error: '${input}' no es un ID de producto de catálogo. Usá un ID como 'MLA19615208' ` +
    "o una URL de catálogo que contenga '/p/MLA...'."
  );
}

export function formatPrice(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return "sin precio";
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: currency ?? "ARS" }).format(amount);
  } catch {
    return `${currency ?? ""} ${amount}`.trim();
  }
}

/** Link a la publicación. Los ítems de MLA se abren en articulo.mercadolibre.com.ar/MLA-<número>. */
export function itemPermalink(itemId: string): string | null {
  const match = itemId.match(/^(MLA)(\d+)$/);
  return match ? `https://articulo.mercadolibre.com.ar/${match[1]}-${match[2]}` : null;
}

export function truncateText(text: string, hint: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return `${text.slice(0, CHARACTER_LIMIT)}\n\n[Respuesta truncada a ${CHARACTER_LIMIT} caracteres. ${hint}]`;
}
