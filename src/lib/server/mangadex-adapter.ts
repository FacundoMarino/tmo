import { SERVER_ENV } from "../config";

import type { HomeMangaListasPayload, HomeMangaListaItem, MangaGenreApiRow } from "./manga-contracts";
import { wrapMangadexImageUrlForClient } from "./mangadex-image-proxy";

const MD_API = "https://api.mangadex.org";
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = 15000;

type MdEntity<T extends string = string> = {
  id: string;
  type: T;
  attributes: Record<string, unknown>;
  /** `includes[]=cover_art` suele poner `fileName` aqui, no solo en `included`. */
  relationships?: Array<{ id: string; type: string; attributes?: Record<string, unknown> }>;
};

type TagRow = { id: string; attributes: { name: Record<string, string>; group?: string } };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function mdLangParams(): URLSearchParams {
  const qs = new URLSearchParams();
  for (const l of SERVER_ENV.MANGA_DEX_LANGUAGES) {
    qs.append("translatedLanguage[]", l);
  }
  return qs;
}

function pickLocalized(record: Record<string, string> | undefined, keys: string[]): string | null {
  if (!record || typeof record !== "object") return null;
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  for (const v of Object.values(record)) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function foldKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function mdFetchJson<T>(resourcePathAndQuery: string, resourceLabel: string): Promise<T> {
  const ua =
    process.env.MANGA_DEX_USER_AGENT ??
    `Landing/${process.env.npm_package_version ?? "0.0"} (MangaDex client; ${SERVER_ENV.MANGA_DEX_LANGUAGES.join(", ")})`;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(`${MD_API}${resourcePathAndQuery}`, {
        cache: "force-cache",
        headers: {
          Accept: "application/json",
          "User-Agent": ua,
        },
        next: { revalidate: 120 },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (response.ok) {
        return (await response.json()) as T;
      }

      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : Number.NaN;
      if (!RETRYABLE.has(response.status) || attempt === 2) {
        throw new Error(`No se pudo cargar ${resourceLabel}: ${response.status}`);
      }
      if (response.status === 429 && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        await sleep(Math.min(retryAfterSeconds * 1000, 5000));
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error(`Timeout cargando ${resourceLabel}`);
      } else {
        lastError = error instanceof Error ? error : new Error("Error de red");
      }
      if (attempt === 2) {
        throw lastError;
      }
    }
    await sleep(450 * (attempt + 1));
  }
  throw lastError ?? new Error(`No se pudo cargar ${resourceLabel}`);
}

function mangaTitle(attrs: { title?: unknown; altTitles?: unknown }): string {
  const titleMap = attrs.title && typeof attrs.title === "object" ? (attrs.title as Record<string, string>) : undefined;
  const langKeys = [...SERVER_ENV.MANGA_DEX_LANGUAGES.map((x) => x.trim()), "en", "ja-ro", "ja", "pt-br"];
  const direct = pickLocalized(titleMap, langKeys);
  if (direct) return direct;

  if (Array.isArray(attrs.altTitles)) {
    for (const block of attrs.altTitles) {
      if (block && typeof block === "object") {
        const t = pickLocalized(block as Record<string, string>, langKeys);
        if (t) return t;
      }
    }
  }
  return "Sin titulo";
}

function mangaDescription(attrs: { description?: unknown }): string | null {
  if (!attrs.description || typeof attrs.description !== "object") return null;
  const descMap = attrs.description as Record<string, string>;
  const langKeys = [...SERVER_ENV.MANGA_DEX_LANGUAGES.map((x) => x.trim()), "en", "ja", "ja-ro"];
  return pickLocalized(descMap, langKeys);
}

function mapMdStatus(raw: unknown): string {
  const s = typeof raw === "string" ? raw : "";
  const labels: Record<string, string> = {
    completed: "Completado",
    ongoing: "En curso",
    cancelled: "Cancelado",
    hiatus: "En pausa",
  };
  return labels[s] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "Desconocido");
}

/**
 * CDN de portadas (docs MangaDex).
 * Miniaturas: `.../nombre.png.256.jpg` / `.../nombre.png.512.jpg` con el nombre de archivo completo.
 */
function buildMangadexCoverCdnUrl(mangaId: string, fileName: string): string {
  const thumb = process.env.MANGA_DEX_COVER_THUMB?.trim().toLowerCase();
  const safeManga = encodeURIComponent(mangaId);
  const safeFile = encodeURIComponent(fileName);
  const base = `https://uploads.mangadex.org/covers/${safeManga}/${safeFile}`;
  const out = thumb === "256" || thumb === "512" ? `${base}.${thumb}.jpg` : base;
  return wrapMangadexImageUrlForClient(out);
}

/** `fileName` en `relationships[].attributes` y/o objeto `included` para el mismo id. */
function pickCoverFileName(manga: MdEntity<"manga">, included: MdEntity[] | undefined): string | null {
  const rels = Array.isArray(manga.relationships) ? manga.relationships : [];
  const covers = rels.filter((r) => r.type === "cover_art");
  if (covers.length === 0) return null;

  const candidates: { fileName: string; prefer: number }[] = [];

  for (const r of covers) {
    let fileName: string | undefined;
    let vol: unknown;

    const inlineFn = r.attributes?.fileName;
    if (typeof inlineFn === "string" && inlineFn.trim()) {
      fileName = inlineFn.trim();
      vol = r.attributes?.volume;
    } else if (included) {
      const cov = included.find((e) => e.id === r.id && e.type === "cover_art");
      const incFn = cov?.attributes?.fileName;
      if (typeof incFn === "string" && incFn.trim()) {
        fileName = incFn.trim();
        vol = cov?.attributes?.volume;
      }
    }

    if (!fileName) continue;
    const prefer = vol == null || vol === "" ? 0 : 1;
    candidates.push({ fileName, prefer });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.prefer - b.prefer || a.fileName.localeCompare(b.fileName));
  return candidates[0]!.fileName;
}

function resolveCover(manga: MdEntity<"manga">, included: MdEntity[] | undefined): string | null {
  const fileName = pickCoverFileName(manga, included);
  if (!fileName || !manga.id) return null;
  return buildMangadexCoverCdnUrl(manga.id, fileName);
}

const LANG_FOR_PEOPLE = ["ja-ro", "ja", ...SERVER_ENV.MANGA_DEX_LANGUAGES, "en", "zh", "ko"] as const;

function personDisplayNameFromAttributes(attrs: Record<string, unknown> | undefined): string | null {
  if (!attrs) return null;
  const raw = attrs.name;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object") {
    return pickLocalized(raw as Record<string, string>, [...LANG_FOR_PEOPLE]);
  }
  return null;
}

/**
 * Creditos tipo Mangadex: usa `relationships[]` inline (`attributes.name`)
 * y si hace falta `included` (author | artist).
 * Si hay autores distintos de artistas → "Autor(es): … · Arte: …".
 */
function mangadexCreatorsLineFromManga(
  manga: MdEntity<"manga">,
  included: MdEntity[] | undefined,
): string | null {
  const rels = manga.relationships ?? [];

  function nameForRole(id: string, role: "author" | "artist"): string | null {
    const rel = rels.find((r) => r.id === id && r.type === role) ??
      rels.find((r) => r.id === id && (r.type === "author" || r.type === "artist"));
    const inline = rel?.attributes ? personDisplayNameFromAttributes(rel.attributes as Record<string, unknown>) : null;
    if (inline) return inline;
    const ent = included?.find((e) => e.id === id && (e.type === "author" || e.type === "artist"));
    return personDisplayNameFromAttributes(ent?.attributes as Record<string, unknown> | undefined);
  }

  const authorIds = [...new Set(rels.filter((r) => r.type === "author").map((r) => r.id))];
  const artistIds = [...new Set(rels.filter((r) => r.type === "artist").map((r) => r.id))];

  const authorNames = authorIds.map((id) => nameForRole(id, "author")).filter((x): x is string => Boolean(x));
  const artistOnlyIds = artistIds.filter((id) => !authorIds.includes(id));
  const artistNames = artistOnlyIds.map((id) => nameForRole(id, "artist")).filter((x): x is string => Boolean(x));

  if (!authorNames.length && !artistNames.length) return null;

  if (authorNames.length && artistNames.length) {
    const a = [...new Set(authorNames)].join(", ");
    const b = [...new Set(artistNames)].join(", ");
    return `Autores: ${a} · Arte: ${b}`;
  }
  return [...new Set([...authorNames, ...artistNames])].join(", ");
}

/** Solo etiquetas `group: "genre"` como en Mangadex (no themes/format). */
function genreNamesFromIncluded(mangaAttrs: Record<string, unknown>, includedTags: MdEntity<"tag">[]): string | null {
  const tagsRaw = mangaAttrs.tags;
  if (!Array.isArray(tagsRaw)) return null;
  const langPrefs = [...SERVER_ENV.MANGA_DEX_LANGUAGES, "en", "ja-ro", "ja", "zh", "ko"];
  const names: string[] = [];
  const seen = new Set<string>();

  for (const t of tagsRaw) {
    if (!t || typeof t !== "object") continue;
    const stub = t as {
      id?: string;
      attributes?: { group?: string; name?: Record<string, string> };
    };
    let group = stub.attributes?.group;
    let nameMap = stub.attributes?.name;

    if (!group || !nameMap) {
      const rid = typeof stub.id === "string" ? stub.id : null;
      if (rid) {
        const resolved = includedTags.find((tag) => tag.id === rid);
        if (!group && typeof resolved?.attributes?.group === "string") {
          group = resolved.attributes.group;
        }
        if (!nameMap && resolved?.attributes?.name && typeof resolved.attributes.name === "object") {
          nameMap = resolved.attributes.name as Record<string, string>;
        }
      }
    }

    if (group !== "genre" || !nameMap) continue;
    const label = pickLocalized(nameMap, langPrefs);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    names.push(label);
  }

  return names.length ? names.join(", ") : null;
}

function contentRatingsQs(): string {
  const raw = (
    process.env.MANGA_DEX_CONTENT_RATINGS ?? "safe,suggestive,erotica,pornographic"
  )
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (raw.length === 0) return "contentRating[]=safe&contentRating[]=suggestive";
  return raw.map((x) => `contentRating[]=${encodeURIComponent(x)}`).join("&");
}

function parseCommaEnv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Orden de listados `GET /manga` (p. ej. latestUploadedChapter, rating, followedCount). */
function mangadexOrderQs(): string {
  const key = process.env.MANGA_DEX_ORDER_FIELD?.trim() || "latestUploadedChapter";
  const dirRaw = process.env.MANGA_DEX_ORDER_DIRECTION?.trim().toLowerCase();
  const dir = dirRaw === "asc" ? "asc" : "desc";
  return `order[${key}]=${dir}`;
}

function appendAvailableTranslatedLanguages(qsParts: string[]): void {
  for (const l of SERVER_ENV.MANGA_DEX_LANGUAGES) {
    qsParts.push(`availableTranslatedLanguage[]=${encodeURIComponent(l)}`);
  }
}

/**
 * Filtros de coleccion tipo documentacion: `excludedTags[]` por nombre.en en /manga/tag,
 * `publicationDemographic[]`, `status[]`.
 */
async function mangadexAppendReferenceFilters(qsParts: string[]): Promise<void> {
  const excludedNames = parseCommaEnv(process.env.MANGA_DEX_EXCLUDED_TAGS);
  if (excludedNames.length > 0) {
    const allTags = await mangadexAllTagsCached();
    const want = new Set(excludedNames.map((n) => n.toLowerCase()));
    for (const t of allTags) {
      const en = typeof t.attributes.name?.en === "string" ? t.attributes.name.en : "";
      if (en && want.has(en.toLowerCase())) {
        qsParts.push(`excludedTags[]=${encodeURIComponent(t.id)}`);
      }
    }
  }
  for (const d of parseCommaEnv(process.env.MANGA_DEX_PUBLICATION_DEMOGRAPHIC)) {
    qsParts.push(`publicationDemographic[]=${encodeURIComponent(d)}`);
  }
  for (const st of parseCommaEnv(process.env.MANGA_DEX_STATUS)) {
    qsParts.push(`status[]=${encodeURIComponent(st)}`);
  }
}

let mangaDexAllTagsCache: { rows: TagRow[]; fetchedAt: number } | null = null;
const MANGA_DEX_TAGS_CACHE_MS = 10 * 60 * 1000;

async function mangadexAllTagsCached(): Promise<TagRow[]> {
  if (
    mangaDexAllTagsCache &&
    Date.now() - mangaDexAllTagsCache.fetchedAt < MANGA_DEX_TAGS_CACHE_MS
  ) {
    return mangaDexAllTagsCache.rows;
  }
  const out: TagRow[] = [];
  let offset = 0;
  for (;;) {
    type TagsColl = {
      result: string;
      data?: Array<{ id: string; type: string; attributes: TagRow["attributes"] }>;
      limit: number;
      total: number;
    };
    const page = await mdFetchJson<TagsColl>(
      `/manga/tag?limit=100&offset=${offset}`,
      "catalogo etiquetas Mangadex",
    );
    const rows = page.data ?? [];
    for (const row of rows) {
      out.push({ id: row.id, attributes: row.attributes });
    }
    offset += rows.length;
    if (offset >= page.total || rows.length === 0) break;
  }
  mangaDexAllTagsCache = { rows: out, fetchedAt: Date.now() };
  return out;
}

export async function mangadexFetchHomeMangaListasPayload(): Promise<HomeMangaListasPayload> {
  const parts = [`limit=72`, contentRatingsQs(), mangadexOrderQs()];
  appendAvailableTranslatedLanguages(parts);
  await mangadexAppendReferenceFilters(parts);
  const qs = parts.join("&");
  const embedded = "&includes[]=cover_art&includes[]=artist&includes[]=author";
  type Coll = { result: string; data?: MdEntity<"manga">[]; included?: MdEntity[] };
  const res = await mdFetchJson<Coll>(`/manga?${qs}${embedded}`, "catalogo Mangadex");
  const mangas = res.data ?? [];
  const included = res.included ?? [];
  const items: HomeMangaListaItem[] = mangas.map((m) => {
    const attrs = m.attributes ?? {};
    const titulo = mangaTitle(attrs as Parameters<typeof mangaTitle>[0]);
    const descripcion = mangaDescription(attrs as Parameters<typeof mangaDescription>[0]);
    const url = resolveCover(m, included) ?? SERVER_ENV.MANGA_FALLBACK_COVER_URL;
    return {
      serie: {
        id: m.id,
        titulo,
        portadaUrl: url,
        descripcion,
      },
    };
  });

  return [{ items }];
}

async function mangadexAllGenreTags(): Promise<TagRow[]> {
  const all = await mangadexAllTagsCached();
  return all.filter((t) => t.attributes.group === "genre");
}

export async function mangadexFetchHomeGenresPayload(): Promise<MangaGenreApiRow[]> {
  const tags = await mangadexAllGenreTags();
  return tags.map((t) => {
    const nombre =
      pickLocalized(t.attributes.name as Record<string, string>, [...SERVER_ENV.MANGA_DEX_LANGUAGES, "en"]) ?? "genre";
    return {
      nombre,
      total: 1,
      portadaUrl: null,
    };
  });
}

/**
 * Resuelve el genero del selector a un UUID (`includedTags[]`) como en la documentacion:
 * prioridad `attributes.name.en`, luego cualquier locale, alias ES→en, y por ultimo coincidencia fold.
 */
async function mangadexResolveGenreTagIds(genreName: string): Promise<string[]> {
  const raw = genreName.trim();
  if (!raw) return [];

  const alias: Record<string, string> = {
    accion: "Action",
    aventura: "Adventure",
    comedia: "Comedy",
    drama: "Drama",
    fantasia: "Fantasy",
    horror: "Horror",
    misterio: "Mystery",
    romance: "Romance",
    "ciencia ficcion": "Science Fiction",
    "artes marciales": "Martial Arts",
    psicologico: "Psychological",
    "recuentos de la vida": "Slice of Life",
    escolar: "School Life",
    sobrenatural: "Supernatural",
    thriller: "Thriller",
    seinen: "Seinen",
    shounen: "Shounen",
    shoujo: "Shoujo",
    josei: "Josei",
    mecha: "Mecha",
    musical: "Music",
    deportes: "Sports",
    historico: "Historical",
  };

  const tags = await mangadexAllGenreTags();
  const lower = raw.toLowerCase();

  const byEn = tags.find((t) => (t.attributes.name?.en ?? "").toLowerCase() === lower);
  if (byEn) return [byEn.id];

  const byLocale = tags.find((t) =>
    Object.values(t.attributes.name ?? {}).some(
      (v) => typeof v === "string" && v.trim().toLowerCase() === lower,
    ),
  );
  if (byLocale) return [byLocale.id];

  const folded = foldKey(raw);
  const canonEn = alias[folded];
  if (canonEn) {
    const enKey = canonEn.toLowerCase();
    const byCanon = tags.find((t) => (t.attributes.name?.en ?? "").toLowerCase() === enKey);
    if (byCanon) return [byCanon.id];
  }

  const wantedFold = foldKey(canonEn ?? raw);
  const loose = tags.filter((t) => {
    const names = Object.values(t.attributes.name ?? {});
    return names.some((v) => typeof v === "string" && foldKey(v) === wantedFold);
  });
  if (loose.length === 1) return [loose[0]!.id];
  if (loose.length > 1) {
    const preferEn = loose.find((t) => foldKey(t.attributes.name?.en ?? "") === wantedFold);
    return [preferEn?.id ?? loose[0]!.id];
  }

  return [];
}

export async function mangadexSearchCandidates(
  query: string,
): Promise<
  Array<{
    id: string | number;
    titulo: string;
    portadaUrl: string | null;
    descripcion: string | null;
    generos?: string | null;
  }>
> {
  const titleRaw = query.trim();
  const qsParts = [`title=${encodeURIComponent(titleRaw)}`, "limit=50", contentRatingsQs(), mangadexOrderQs()];
  appendAvailableTranslatedLanguages(qsParts);
  await mangadexAppendReferenceFilters(qsParts);
  const embedded = "&includes[]=cover_art&includes[]=artist&includes[]=author&includes[]=tag";
  type Coll = { data?: MdEntity<"manga">[]; included?: MdEntity[] };
  const res = await mdFetchJson<Coll>(
    `/manga?${qsParts.join("&")}${embedded}`,
    `busqueda Mangadex ${titleRaw}`,
  );
  const mangas = res.data ?? [];
  const included = res.included ?? [];
  const includedTags = included.filter((x): x is MdEntity<"tag"> => x.type === "tag");

  return mangas.map((m) => {
    const attrs = m.attributes ?? {};
    return {
      id: m.id,
      titulo: mangaTitle(attrs as Parameters<typeof mangaTitle>[0]),
      portadaUrl: resolveCover(m, included),
      descripcion: mangaDescription(attrs as Parameters<typeof mangaDescription>[0]),
      generos: genreNamesFromIncluded(attrs as Record<string, unknown>, includedTags),
    };
  });
}

export async function mangadexMangaRowsByGenre(
  genreName: string,
  page: number,
  pageSize: number,
): Promise<
  Array<{
    id: string | number;
    titulo: string;
    portadaUrl: string | null;
    descripcion: string | null;
    generos: string | null;
  }>
> {
  const tagIds = await mangadexResolveGenreTagIds(genreName);
  if (tagIds.length === 0) return [];

  const offset = Math.max(page - 1, 0) * pageSize;
  const qsParts = [
    `limit=${pageSize}`,
    `offset=${offset}`,
    contentRatingsQs(),
    mangadexOrderQs(),
  ];
  appendAvailableTranslatedLanguages(qsParts);
  await mangadexAppendReferenceFilters(qsParts);
  for (const id of tagIds) {
    qsParts.push(`includedTags[]=${encodeURIComponent(id)}`);
  }
  const includedMode = process.env.MANGA_DEX_INCLUDED_TAGS_MODE?.trim().toUpperCase();
  if (includedMode === "OR" && tagIds.length > 1) {
    qsParts.push("includedTagsMode=OR");
  }
  const embedded = "&includes[]=cover_art&includes[]=artist&includes[]=author&includes[]=tag";
  type Coll = { data?: MdEntity<"manga">[]; included?: MdEntity[] };
  const res = await mdFetchJson<Coll>(
    `/manga?${qsParts.join("&")}${embedded}`,
    `manga por genero (${genreName})`,
  );

  const mangas = res.data ?? [];
  const included = res.included ?? [];
  const includedTags = included.filter((x): x is MdEntity<"tag"> => x.type === "tag");

  return mangas.map((m) => {
    const attrs = m.attributes ?? {};
    return {
      id: m.id,
      titulo: mangaTitle(attrs as Parameters<typeof mangaTitle>[0]),
      portadaUrl: resolveCover(m, included),
      descripcion: mangaDescription(attrs as Parameters<typeof mangaDescription>[0]),
      generos: genreNamesFromIncluded(attrs as Record<string, unknown>, includedTags),
    };
  });
}

export async function mangadexMangaDetailSerialized(mangaId: string): Promise<{
  id: string | number;
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
}> {
  const embedded =
    "?includes[]=cover_art&includes[]=author&includes[]=artist&includes[]=tag";
  type One = {
    result: string;
    data?: MdEntity<"manga">;
    included?: MdEntity[];
  };

  const res = await mdFetchJson<One>(`/manga/${encodeURIComponent(mangaId)}${embedded}`, `manga Mangadex ${mangaId}`);
  const m = res.data;
  if (!m) throw new Error("Manga no encontrado");

  const included = res.included ?? [];
  const includedTags = included.filter((x): x is MdEntity<"tag"> => x.type === "tag");
  const attrs = m.attributes ?? {};
  const title = mangaTitle(attrs as Parameters<typeof mangaTitle>[0]);
  const desc = mangaDescription(attrs as Parameters<typeof mangaDescription>[0]);

  const coverUrl = resolveCover(m, included) ?? SERVER_ENV.MANGA_FALLBACK_COVER_URL;

  const chapterRows: Array<{
    id: string | number;
    numeroCapitulo: number;
    titulo: string | null;
    totalPaginas: number;
  }> = [];

  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const qp = mdLangParams();
    qp.append("limit", "500");
    qp.set("offset", String(offset));
    qp.append("order[volume]", "asc");
    qp.append("order[chapter]", "desc");

    type Feed = {
      total: number;
      data?: MdEntity<"chapter">[];
    };
    const feed = await mdFetchJson<Feed>(
      `/manga/${encodeURIComponent(mangaId)}/feed?${qp.toString()}`,
      `capitulos Mangadex ${mangaId}`,
    );
    total = feed.total ?? 0;
    const slice = feed.data ?? [];
    for (const ch of slice) {
      const a = ch.attributes as {
        chapter?: string | number | null;
        title?: string | null;
        pages?: number;
      };
      const numRaw = a.chapter;
      let numeroCapitulo = typeof numRaw === "number" ? numRaw : Number.parseFloat(String(numRaw ?? "0"));
      if (!Number.isFinite(numeroCapitulo)) numeroCapitulo = 0;
      chapterRows.push({
        id: ch.id,
        numeroCapitulo,
        titulo: typeof a.title === "string" ? a.title : null,
        totalPaginas: typeof a.pages === "number" ? a.pages : 0,
      });
    }
    offset += slice.length;
    if (slice.length === 0) break;
  }

  return {
    id: m.id,
    titulo: title,
    descripcion: desc,
    autor: mangadexCreatorsLineFromManga(m, included),
    portadaUrl: coverUrl,
    generos: genreNamesFromIncluded(attrs as Record<string, unknown>, includedTags),
    estado: mapMdStatus((attrs as { status?: string }).status),
    puntuacion: null,
    capitulos: chapterRows,
  };
}

export async function mangadexChapterPages(chapterId: string): Promise<string[]> {
  type AtHome = {
    baseUrl: string;
    chapter: { hash: string; data: string[]; dataSaver?: string[] };
  };
  const res = await mdFetchJson<AtHome>(
    `/at-home/server/${encodeURIComponent(chapterId)}`,
    `paginas Mangadex ${chapterId}`,
  );

  const base = (res.baseUrl ?? "").replace(/\/$/, "");
  const hash = res.chapter.hash;
  const pages = Array.isArray(res.chapter.data) ? res.chapter.data : [];
  const dataSaverEnv = process.env.MANGA_DEX_DATA_SAVER === "1" || process.env.MANGA_DEX_DATA_SAVER === "true";
  const saver = Array.isArray(res.chapter.dataSaver) ? res.chapter.dataSaver : [];

  const fileList = dataSaverEnv && saver.length > 0 ? saver : pages;
  const pathSeg = dataSaverEnv && saver.length > 0 ? "data-saver" : "data";

  return fileList.map((name) =>
    wrapMangadexImageUrlForClient(`${base}/${pathSeg}/${hash}/${encodeURIComponent(name)}`),
  );
}
