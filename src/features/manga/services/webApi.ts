import { Manga, MangaDetail, MangaGenre } from "../types";

const FALLBACK_COVER =
  process.env.NEXT_PUBLIC_MANGA_FALLBACK_COVER_URL ??
  "https://via.placeholder.com/300x450?text=TMO+Manga";

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? (data.error as string)
        : "Error de red";
    throw new Error(message);
  }
  return data as T;
}

function normalizeArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const candidate = raw as { items?: unknown; data?: unknown; results?: unknown };
    if (Array.isArray(candidate.items)) return candidate.items as T[];
    if (Array.isArray(candidate.data)) return candidate.data as T[];
    if (Array.isArray(candidate.results)) return candidate.results as T[];
  }
  return [];
}

function mapManga(raw: {
  id: string;
  titulo: string;
  portadaUrl: string | null;
  descripcion: string | null;
  generos?: string | null;
}): Manga {
  return {
    id: String(raw.id),
    title: raw.titulo,
    coverUrl: raw.portadaUrl ?? FALLBACK_COVER,
    description: raw.descripcion ?? "Sin descripcion disponible.",
    genres: (raw.generos ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  };
}

export async function fetchMangas(): Promise<Manga[]> {
  const response = await fetch("/api/manga/lists", { cache: "no-store" });
  const lists = await readJson<
    Array<{
      items: Array<{
        serie?: {
          id: string;
          titulo: string;
          portadaUrl: string | null;
          descripcion: string | null;
        } | null;
      }>;
    }>
  >(response);
  const byId = new Map<string, Manga>();
  for (const list of lists) {
    for (const item of list.items) {
      if (!item.serie || byId.has(item.serie.id)) continue;
      byId.set(item.serie.id, mapManga({ ...item.serie, id: item.serie.id }));
    }
  }
  return Array.from(byId.values());
}

export async function fetchGenres(): Promise<MangaGenre[]> {
  const response = await fetch("/api/manga/genres", { cache: "no-store" });
  const raw = await readJson<unknown>(response);
  const normalized = normalizeArray<{ nombre: string; total: number; portadaUrl: string | null }>(raw);
  return normalized
    .map((g) => ({ name: g.nombre, total: g.total, coverUrl: g.portadaUrl }))
    .sort((a, b) => b.total - a.total);
}

export async function fetchMangasByGenre(
  genre: string,
  page = 1,
  pageSize = 24,
): Promise<{ items: Manga[]; page: number; pageSize: number }> {
  const response = await fetch(
    `/api/manga/by-genre?genre=${encodeURIComponent(genre)}&page=${page}&pageSize=${pageSize}`,
    {
      cache: "no-store",
    },
  );
  const raw = await readJson<unknown>(response);
  const payload = (raw && typeof raw === "object" ? raw : {}) as {
    items?: unknown;
    page?: number;
    pageSize?: number;
  };
  const normalized = normalizeArray<{
    id: string;
    titulo: string;
    portadaUrl: string | null;
    descripcion: string | null;
    generos: string | null;
  }>(payload.items);
  return {
    items: normalized.map(mapManga),
    page: payload.page ?? page,
    pageSize: payload.pageSize ?? pageSize,
  };
}

export async function fetchSearchMangas(query: string): Promise<Manga[]> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });
  const raw = await readJson<unknown>(response);
  const payload = (raw && typeof raw === "object" ? raw : {}) as { items?: unknown };
  const normalized = normalizeArray<{
    id: string;
    titulo: string;
    portadaUrl: string | null;
    descripcion: string | null;
    generos?: string | null;
  }>(payload.items);
  return normalized.map(mapManga);
}

export async function fetchMangaDetail(id: string): Promise<MangaDetail> {
  const response = await fetch(`/api/manga/${encodeURIComponent(id)}`, { cache: "no-store" });
  const raw = await readJson<{
    id: number | string;
    titulo: string;
    descripcion: string | null;
    autor: string | null;
    portadaUrl: string | null;
    generos: string | null;
    estado: string | null;
    puntuacion: number | null;
    capitulos: Array<{
      id: number | string;
      numeroCapitulo: number;
      titulo: string | null;
      totalPaginas: number;
    }>;
  }>(response);
  return {
    id: String(raw.id),
    title: raw.titulo,
    description: raw.descripcion ?? "Sin descripcion disponible.",
    author: raw.autor ?? "Autor desconocido",
    coverUrl: raw.portadaUrl ?? FALLBACK_COVER,
    genres: (raw.generos ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    status: raw.estado ?? "Desconocido",
    score: raw.puntuacion,
    chapters: (raw.capitulos ?? [])
      .map((ch) => ({
        id: String(ch.id),
        chapterNumber: ch.numeroCapitulo,
        title: ch.titulo,
        totalPages: ch.totalPaginas,
      }))
      .sort((a, b) => b.chapterNumber - a.chapterNumber),
  };
}

export async function fetchChapterPages(mangaId: string, chapterId: string): Promise<string[]> {
  const response = await fetch(
    `/api/manga/${encodeURIComponent(mangaId)}/chapters/${chapterId}/pages`,
    { cache: "no-store" },
  );
  const raw = await readJson<{ paginas?: string[] }>(response);
  return raw.paginas ?? [];
}
