import { SERVER_ENV } from "../config";
import type { HomeMangaListasPayload, MangaGenreApiRow } from "./manga-contracts";
import {
  mangadexChapterPages,
  mangadexFetchHomeGenresPayload,
  mangadexFetchHomeMangaListasPayload,
  mangadexMangaDetailSerialized,
  mangadexMangaRowsByGenre,
  mangadexSearchCandidates,
} from "./mangadex-adapter";

export type { HomeMangaListaItem, HomeMangaListasPayload, MangaGenreApiRow } from "./manga-contracts";

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_REVALIDATE_SECONDS = 60;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getSourceHeaders() {
  const sourceBaseUrl = SERVER_ENV.API_BASE_URL;
  const sourceOrigin = new URL(sourceBaseUrl).origin;

  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language":
      process.env.MANGA_SOURCE_ACCEPT_LANGUAGE ?? "es-ES,es;q=0.9,it;q=0.8,pt;q=0.7",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Referer: process.env.MANGA_SOURCE_REFERER ?? `${sourceOrigin}/`,
    Origin: process.env.MANGA_SOURCE_ORIGIN ?? sourceOrigin,
    "User-Agent":
      process.env.MANGA_SOURCE_USER_AGENT ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-CH-UA":
      process.env.MANGA_SOURCE_SEC_CH_UA ??
      '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Windows"',
  };
}

type SeriesLocaleRow = {
  id: number;
  titulo: string;
  portadaUrl: string | null;
  descripcion?: string | null;
};

function rowsToHomeListasPayload(rows: SeriesLocaleRow[]): HomeMangaListasPayload {
  return [
    {
      title: "Catálogo",
      items: rows.map((row) => ({
        serie: {
          id: String(row.id),
          titulo: row.titulo,
          portadaUrl: row.portadaUrl,
          descripcion: row.descripcion ?? null,
        },
      })),
    },
  ];
}

/**
 * Homepage lists: prefers `/listas`. If unavailable (blocked path, geo/WAF),
 * fills from paginated `/series-locales` so the catalog still loads.
 */
export async function fetchHomeMangaListasPayload(): Promise<HomeMangaListasPayload> {
  if (SERVER_ENV.MANGA_BACKEND === "mangadex") {
    return mangadexFetchHomeMangaListasPayload();
  }

  try {
    return await fetchJsonWithRetry<HomeMangaListasPayload>(
      buildSourceUrl("/listas"),
      "listas de mangas",
    );
  } catch {
    const rows = await fetchJsonWithRetry<SeriesLocaleRow[]>(
      buildSourceUrl("/series-locales?page=1&pageSize=72"),
      "directorio de mangas (respaldo)",
    );
    if (!Array.isArray(rows)) {
      throw new Error("Respuesta invalida del directorio de mangas");
    }
    return rowsToHomeListasPayload(rows);
  }
}

export async function fetchJsonWithRetry<T>(url: string, resourceName: string): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(url, {
        cache: "force-cache",
        headers: getSourceHeaders(),
        next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
        redirect: "follow",
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      if (response.ok) {
        return (await response.json()) as T;
      }
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : Number.NaN;
      if (!RETRYABLE.has(response.status) || attempt === 2) {
        throw new Error(`No se pudo cargar ${resourceName}: ${response.status}`);
      }
      if (response.status === 429 && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        await sleep(Math.min(retryAfterSeconds * 1000, 5000));
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

type SeriesLocaleRowWithGenres = SeriesLocaleRow & {
  generos?: string | null;
};

function approximateGenresFromSeriesLocales(rows: SeriesLocaleRowWithGenres[]): MangaGenreApiRow[] {
  const acc = new Map<string, { total: number; portadaUrl: string | null }>();
  for (const row of rows) {
    const parts = (row.generos ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    for (const nombre of parts) {
      const cur = acc.get(nombre) ?? { total: 0, portadaUrl: null };
      cur.total += 1;
      if (!cur.portadaUrl && row.portadaUrl) {
        cur.portadaUrl = row.portadaUrl;
      }
      acc.set(nombre, cur);
    }
  }
  return Array.from(acc.entries()).map(([nombre, { total, portadaUrl }]) => ({
    nombre,
    total,
    portadaUrl,
  }));
}

/**
 * Prefer `/series-locales/generos`. Si esa ruta está cortada (403/404) desde algunos IPs,
 * inferir géneros desde el listado paginado (totales solo sobre la muestra cargada).
 */
export async function fetchHomeMangaGenresPayload(): Promise<MangaGenreApiRow[]> {
  if (SERVER_ENV.MANGA_BACKEND === "mangadex") {
    return mangadexFetchHomeGenresPayload();
  }

  try {
    return await fetchJsonWithRetry<MangaGenreApiRow[]>(
      buildSourceUrl("/series-locales/generos"),
      "generos de manga",
    );
  } catch {
    const rows = await fetchJsonWithRetry<SeriesLocaleRowWithGenres[]>(
      buildSourceUrl("/series-locales?page=1&pageSize=96"),
      "catalogo para generos (respaldo)",
    );
    if (!Array.isArray(rows)) {
      throw new Error("Respuesta invalida para generos de respaldo");
    }
    return approximateGenresFromSeriesLocales(rows);
  }
}

export async function fetchBackendMangaDetail(mangaId: string): Promise<unknown> {
  if (SERVER_ENV.MANGA_BACKEND === "mangadex") {
    return mangadexMangaDetailSerialized(mangaId);
  }
  return fetchJsonWithRetry(
    buildSourceUrl(`/series-locales/${encodeURIComponent(mangaId)}`),
    "detalle del manga",
  );
}

export async function fetchBackendChapterPages(mangaId: string, chapterId: string): Promise<unknown> {
  if (SERVER_ENV.MANGA_BACKEND === "mangadex") {
    const paginas = await mangadexChapterPages(chapterId);
    return { paginas };
  }
  return fetchJsonWithRetry(
    buildSourceUrl(
      `/series-locales/${encodeURIComponent(mangaId)}/capitulos/${encodeURIComponent(chapterId)}/paginas`,
    ),
    "paginas del capitulo",
  );
}

type SearchCandidate = {
  id: string | number;
  titulo: string;
  portadaUrl: string | null;
  descripcion: string | null;
  generos?: string | null;
};

export async function fetchBackendSearchCandidates(
  query: string,
  includeAdult: string,
  showSinPortada: string,
  take: number,
): Promise<SearchCandidate[]> {
  if (SERVER_ENV.MANGA_BACKEND === "mangadex") {
    return mangadexSearchCandidates(query, take);
  }

  const data = await fetchJsonWithRetry<SearchCandidate[]>(
    buildSourceUrl(
      `/series-locales/search-candidates?q=${encodeURIComponent(query)}&includeAdult=${encodeURIComponent(includeAdult)}&showSinPortada=${encodeURIComponent(showSinPortada)}&take=${encodeURIComponent(String(Math.max(take, 1)))}`,
    ),
    "resultados de busqueda",
  );

  return Array.isArray(data) ? data.slice(0, Math.max(take, 0)) : [];
}

export async function fetchBackendMangaRowsByGenre(
  genre: string,
  page: number,
  pageSize: number,
): Promise<unknown[]> {
  if (SERVER_ENV.MANGA_BACKEND === "mangadex") {
    return mangadexMangaRowsByGenre(genre, page, pageSize);
  }
  const encoded = encodeURIComponent(genre);
  return fetchJsonWithRetry<unknown[]>(
    buildSourceUrl(`/series-locales?genero=${encoded}&page=${page}&pageSize=${pageSize}`),
    `mangas del género ${genre}`,
  );
}
