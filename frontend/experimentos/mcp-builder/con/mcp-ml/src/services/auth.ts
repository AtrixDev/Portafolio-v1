import { API_BASE_URL, REQUEST_TIMEOUT_MS, TOKEN_REFRESH_MARGIN_MS } from "../constants.js";

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;
let pending: Promise<string> | null = null;

function clientCredentials(): { id: string; secret: string } | null {
  const id = process.env.ML_CLIENT_ID?.trim();
  const secret = process.env.ML_CLIENT_SECRET?.trim();
  return id && secret ? { id, secret } : null;
}

export function canRefreshToken(): boolean {
  return clientCredentials() !== null;
}

export function assertAuthConfigured(): void {
  if (!clientCredentials() && !process.env.ML_ACCESS_TOKEN?.trim()) {
    throw new Error(
      "Faltan credenciales: definí ML_CLIENT_ID y ML_CLIENT_SECRET (recomendado) o ML_ACCESS_TOKEN."
    );
  }
}

async function requestAppToken(id: string, secret: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    message?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(
      `No se pudo obtener el token de Mercado Libre (HTTP ${response.status}: ${body.message ?? "sin detalle"}). ` +
        "Revisá ML_CLIENT_ID y ML_CLIENT_SECRET."
    );
  }

  const ttlMs = (body.expires_in ?? 21_600) * 1000;
  cached = { value: body.access_token, expiresAt: Date.now() + ttlMs - TOKEN_REFRESH_MARGIN_MS };
  return cached.value;
}

/**
 * Devuelve un access token válido. Con ML_CLIENT_ID/ML_CLIENT_SECRET obtiene y renueva
 * automáticamente un token de aplicación; si no, usa ML_ACCESS_TOKEN tal cual.
 */
export async function getAccessToken(forceRefresh = false): Promise<string> {
  const creds = clientCredentials();
  if (!creds) {
    const token = process.env.ML_ACCESS_TOKEN?.trim();
    if (!token) assertAuthConfigured();
    return token as string;
  }

  if (!forceRefresh && cached && Date.now() < cached.expiresAt) return cached.value;

  // Evita pedir varios tokens en paralelo si llegan requests simultáneos.
  pending ??= requestAppToken(creds.id, creds.secret).finally(() => {
    pending = null;
  });
  return pending;
}
