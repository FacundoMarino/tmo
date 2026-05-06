export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const SERVER_ENV = {
  get SUPABASE_URL() {
    return getRequiredEnv("SUPABASE_URL");
  },
  get SUPABASE_ANON_KEY() {
    return getRequiredEnv("SUPABASE_ANON_KEY");
  },
  get API_BASE_URL() {
    return getRequiredEnv("API_BASE_URL");
  },
  HISTORY_TABLE: process.env.HISTORY_TABLE ?? "history",
  MANGA_FALLBACK_COVER_URL:
    process.env.MANGA_FALLBACK_COVER_URL ??
    "https://via.placeholder.com/300x450?text=TMO+Manga",
};
