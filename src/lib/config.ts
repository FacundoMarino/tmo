export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function resolveMangaBackend(): "tmo" | "mangadex" {
  const v = (process.env.MANGA_BACKEND ?? "tmo").toLowerCase().trim();
  if (v === "mangadex" || v === "md") return "mangadex";
  return "tmo";
}

export const SERVER_ENV = {
  get SUPABASE_URL() {
    return getRequiredEnv("SUPABASE_URL");
  },
  get SUPABASE_ANON_KEY() {
    return getRequiredEnv("SUPABASE_ANON_KEY");
  },
  get MANGA_BACKEND(): "tmo" | "mangadex" {
    return resolveMangaBackend();
  },
  get API_BASE_URL() {
    const raw = (process.env.API_BASE_URL ?? "").replace(/\/$/, "").trim();
    if (resolveMangaBackend() === "mangadex") return raw;
    return getRequiredEnv("API_BASE_URL").replace(/\/$/, "").trim();
  },
  HISTORY_TABLE: process.env.HISTORY_TABLE ?? "history",
  MANGA_FALLBACK_COVER_URL:
    process.env.MANGA_FALLBACK_COVER_URL ??
    "https://via.placeholder.com/300x450?text=TMO+Manga",
  /** Idiomas MangaDex (es, es-la, ...). Solo lectura servidor. */
  get MANGA_DEX_LANGUAGES(): string[] {
    const raw = (
      process.env.MANGA_DEX_LANGUAGES ?? "es,es-la"
    )
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
    return raw.length > 0 ? raw : ["es", "es-la"];
  },
};
