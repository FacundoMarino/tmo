import { SERVER_ENV } from "../config";

/**
 * Hosts de imagenes Mangadex: no usar hotlink desde el navegador (sirven respuesta incorrecta).
 * Deben pasar por /api/mangadex-image.
 */
export function isProxyableMangadexAssetUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    const suffixes = [".mangadex.org", ".mangadex.network", ".mangadex.dev"];
    return suffixes.some((s) => h.endsWith(s));
  } catch {
    return false;
  }
}

/**
 * Convierte URL CDN Mangadex en ruta relativa al proxy de esta app (mismo origen en Vercel).
 */
export function wrapMangadexImageUrlForClient(originalUrl: string): string {
  if (SERVER_ENV.MANGA_BACKEND !== "mangadex") return originalUrl;
  const noProxy = process.env.MANGA_DEX_PROXY_IMAGES?.trim();
  if (noProxy === "0" || noProxy?.toLowerCase() === "false") return originalUrl;
  if (!isProxyableMangadexAssetUrl(originalUrl)) return originalUrl;
  return `/api/mangadex-image?u=${encodeURIComponent(originalUrl)}`;
}
