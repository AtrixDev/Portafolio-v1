import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "../constants.js";
import { canRefreshToken, getAccessToken } from "./auth.js";

export class MercadoLibreApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "MercadoLibreApiError";
  }
}

async function doRequest(path: string, token: string): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export async function mlGet<T>(path: string, query?: Record<string, string | number>): Promise<T> {
  const qs = query
    ? "?" + new URLSearchParams(Object.entries(query).map(([k, v]): [string, string] => [k, String(v)])).toString()
    : "";
  const url = path + qs;

  let response = await doRequest(url, await getAccessToken());
  if (response.status === 401 && canRefreshToken()) {
    response = await doRequest(url, await getAccessToken(true));
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new MercadoLibreApiError(response.status, body.message ?? response.statusText);
  }
  return (await response.json()) as T;
}

export function handleApiError(error: unknown, productId?: string): string {
  if (error instanceof MercadoLibreApiError) {
    switch (error.status) {
      case 400:
        return `Error: la API rechazó el pedido (${error.message}). Revisá que '${productId ?? ""}' sea un ID de producto de catálogo válido.`;
      case 401:
        return canRefreshToken()
          ? "Error: Mercado Libre rechazó las credenciales. Revisá ML_CLIENT_ID y ML_CLIENT_SECRET."
          : "Error: el access token es inválido o venció (duran 6 horas). Generá uno nuevo o configurá ML_CLIENT_ID y ML_CLIENT_SECRET para renovarlo automáticamente.";
      case 403:
        return `Error: la aplicación no tiene permiso para este recurso (${error.message}). Verificá que la app de Mercado Libre esté habilitada y que el token corresponda a Argentina.`;
      case 404:
        return `Error: no existe el producto de catálogo '${productId ?? ""}'. Ojo: los IDs de catálogo aparecen en URLs con '/p/' (ej. MLA19615208); los IDs de publicaciones (MLA-123456789) no sirven acá.`;
      case 429:
        return "Error: se superó el límite de pedidos a la API de Mercado Libre. Esperá unos segundos y reintentá.";
      default:
        return `Error: la API de Mercado Libre respondió HTTP ${error.status}: ${error.message}`;
    }
  }
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return "Error: Mercado Libre tardó demasiado en responder. Reintentá en un momento.";
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}
