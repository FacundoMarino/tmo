import { SERVER_ENV } from "../config";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJsonWithRetry<T>(url: string, resourceName: string): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        return (await response.json()) as T;
      }
      if (!RETRYABLE.has(response.status) || attempt === 2) {
        throw new Error(`No se pudo cargar ${resourceName}: ${response.status}`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Error de red");
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
