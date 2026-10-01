// Cliente mínimo para la API de Mercado Libre, con manejo de token OAuth.
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const API_BASE = "https://api.mercadolibre.com";
const TIMEOUT_MS = 15_000;
const TOKEN_FILE = process.env.ML_TOKEN_FILE || join(homedir(), ".mcp-ml-token.json");

export class MLError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let cached = null; // { access_token, refresh_token, expires_at }

async function loadTokenFile() {
  try {
    return JSON.parse(await readFile(TOKEN_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function saveTokenFile(data) {
  try {
    await writeFile(TOKEN_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  } catch (err) {
    console.error(`[mcp-ml] No se pudo guardar el token en ${TOKEN_FILE}: ${err.message}`);
  }
}

function hasAppCredentials() {
  return Boolean(process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET);
}

// Pide un token nuevo. Usa refresh_token si hay uno (el de ML rota en cada uso,
// por eso se guarda el último en TOKEN_FILE); si no, client_credentials.
async function requestNewToken() {
  const stored = await loadTokenFile();
  const refreshToken = cached?.refresh_token || stored?.refresh_token || process.env.ML_REFRESH_TOKEN;

  const body = new URLSearchParams({
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
  });
  if (refreshToken) {
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refreshToken);
  } else {
    body.set("grant_type", "client_credentials");
  }

  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new MLError(
      `No se pudo obtener un token de Mercado Libre (${res.status}): ${data.message || data.error || "respuesta inválida"}. ` +
        "Revisá ML_CLIENT_ID, ML_CLIENT_SECRET y ML_REFRESH_TOKEN.",
      res.status,
    );
  }

  cached = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken || null,
    expires_at: Date.now() + (data.expires_in ?? 21600) * 1000,
  };
  if (cached.refresh_token) await saveTokenFile(cached);
  return cached.access_token;
}

async function getToken({ forceRefresh = false } = {}) {
  if (!hasAppCredentials()) return process.env.ML_ACCESS_TOKEN || null;

  if (!forceRefresh) {
    if (!cached) {
      const stored = await loadTokenFile();
      if (stored?.access_token) cached = stored;
      else if (process.env.ML_ACCESS_TOKEN) cached = { access_token: process.env.ML_ACCESS_TOKEN, expires_at: Infinity };
    }
    // Margen de 1 minuto antes del vencimiento.
    if (cached?.access_token && cached.expires_at - 60_000 > Date.now()) return cached.access_token;
  }
  return requestNewToken();
}

export async function mlGet(path, params = {}) {
  const url = new URL(path, API_BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const doFetch = async (token) =>
    fetch(url, {
      headers: { Accept: "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

  let res;
  try {
    res = await doFetch(await getToken());
    // Token vencido o revocado: si tenemos credenciales, renovamos y reintentamos una vez.
    if (res.status === 401 && hasAppCredentials()) {
      res = await doFetch(await getToken({ forceRefresh: true }));
    }
  } catch (err) {
    if (err instanceof MLError) throw err;
    const reason = err.name === "TimeoutError" ? "la API tardó demasiado en responder" : err.message;
    throw new MLError(`Error de red consultando Mercado Libre: ${reason}`);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.message || data?.error || res.statusText;
    if (res.status === 401 || res.status === 403) {
      throw new MLError(
        `Mercado Libre rechazó la consulta (${res.status}: ${detail}). La API exige un token de acceso: ` +
          "configurá ML_ACCESS_TOKEN, o ML_CLIENT_ID + ML_CLIENT_SECRET (+ ML_REFRESH_TOKEN). Ver README.",
        res.status,
      );
    }
    if (res.status === 404) throw new MLError(`No existe el recurso ${url.pathname} en Mercado Libre.`, 404);
    if (res.status === 429) throw new MLError("Mercado Libre limitó la cantidad de consultas (429). Probá de nuevo en unos segundos.", 429);
    throw new MLError(`Error ${res.status} de Mercado Libre: ${detail}`, res.status);
  }
  return data;
}
