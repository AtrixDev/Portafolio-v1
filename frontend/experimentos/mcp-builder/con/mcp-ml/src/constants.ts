export const API_BASE_URL = "https://api.mercadolibre.com";
export const REQUEST_TIMEOUT_MS = 15_000;
export const CHARACTER_LIMIT = 25_000;
// Margen para renovar el token de aplicación antes de que venza.
export const TOKEN_REFRESH_MARGIN_MS = 5 * 60_000;

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}
