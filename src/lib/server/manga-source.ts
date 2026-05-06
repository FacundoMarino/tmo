import { SERVER_ENV } from "../config";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = 15000;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getSourceHeaders() {
  const sourceBaseUrl = SERVER_ENV.API_BASE_URL;
  const sourceOrigin = new URL(sourceBaseUrl).origin;

  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Referer: process.env.MANGA_SOURCE_REFERER ?? `${sourceOrigin}/`,
    Origin: process.env.MANGA_SOURCE_ORIGIN ?? sourceOrigin,
    "User-Agent":
      process.env.MANGA_SOURCE_USER_AGENT ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  };
}

export async function fetchJsonWithRetry<T>(url: string, resourceName: string): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(url, {
        cache: "no-store",
        headers: getSourceHeaders(),
        redirect: "follow",
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      if (response.ok) {
        return (await response.json()) as T;
      }
      if (!RETRYABLE.has(response.status) || attempt === 2) {
        throw new Error(`No se pudo cargar ${resourceName}: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error(`Timeout cargando ${resourceName}`);
      } else {
        lastError = error instanceof Error ? error : new Error("Error de red");
      }
      if (attempt === 2) {
        throw lastError;
      }
    }
    await sleep(450 * (attempt + 1));
  }
  throw lastError ?? new Error(`No se pudo cargar ${resourceName}`);
}

export function buildSourceUrl(path: string) {
  return `${SERVER_ENV.API_BASE_URL}${path}`;
}
