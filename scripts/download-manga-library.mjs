#!/usr/bin/env node
/**
 * Descarga capítulos (páginas) de los mangas que aparecen en /listas.
 * Usa delays entre llamadas API y entre cada imagen para no sobrecargar origen/CDN.
 *
 * Variables de entorno:
 *   API_BASE_URL  (ej. https://shademanga.com/api) — obligatoria si no hay --base-url
 *
 * Opcional (misma idea que manga-source.ts):
 *   MANGA_SOURCE_REFERER, MANGA_SOURCE_ORIGIN, MANGA_SOURCE_USER_AGENT, MANGA_SOURCE_COOKIE
 *   MANGA_DOWNLOAD_ROOT  (directorio salida; default ./downloads/manga-library)
 */

import fs from "node:fs/promises";
import path from "node:path";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const out = {
    baseUrl: process.env.API_BASE_URL?.replace(/\/$/, ""),
    apiDelayMs: Number(process.env.MANGA_DOWNLOAD_API_DELAY_MS ?? 600),
    imageDelayMs: Number(process.env.MANGA_DOWNLOAD_IMAGE_DELAY_MS ?? 400),
    outRoot: process.env.MANGA_DOWNLOAD_ROOT ?? path.join(process.cwd(), "downloads", "manga-library"),
    dryRun: false,
    limit: 0,
    source: /** @type {"listas" | "directory"} */ ("listas"),
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--source" && argv[i + 1]) out.source = argv[++i];
    else if (a === "--base-url" && argv[i + 1]) out.baseUrl = argv[++i].replace(/\/$/, "");
    else if (a === "--api-delay-ms" && argv[i + 1]) out.apiDelayMs = Math.max(0, Number(argv[++i]) || 0);
    else if (a === "--image-delay-ms" && argv[i + 1]) out.imageDelayMs = Math.max(0, Number(argv[++i]) || 0);
    else if (a === "--out" && argv[i + 1]) out.outRoot = path.resolve(argv[++i]);
    else if (a === "--limit" && argv[i + 1]) out.limit = Math.max(0, Number(argv[++i]) || 0);
    else if (a === "--help" || a === "-h") {
      console.log(`Uso:
  node --env-file=.env scripts/download-manga-library.mjs [opciones]

Opciones:
  --base-url <url>       API_BASE_URL si no viene del entorno
  --source listas        (default) ids desde GET /listas
  --source directory     todas las ids paginando GET /series-locales?page=&pageSize=
  --api-delay-ms <n>    pausa después de cada respuesta JSON (default 600)
  --image-delay-ms <n>  pausa tras cada archivo de imagen (default 400)
  --out <dir>           raíz de descarga (default ./downloads/manga-library)
  --limit <n>           sólo procesar los primeros n mangas (0 = todos)
  --dry-run             no escribe archivos ni baja binarios
`);
      process.exit(0);
    }
  }
  if (!out.baseUrl) {
    console.error("Falta API_BASE_URL (entorno o --base-url).");
    process.exit(1);
  }
  if (!["listas", "directory"].includes(out.source)) {
    console.error('--source debe ser "listas" o "directory".');
    process.exit(1);
  }
  return out;
}

/** @param {string} apiBaseWithoutSlash */
/** @returns {Record<string,string>} */
function shadowHeaders(apiBaseWithoutSlash) {
  let origin;
  try {
    origin = new URL(apiBaseWithoutSlash).origin;
  } catch {
    origin = "https://shademanga.com";
  }
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": process.env.MANGA_SOURCE_ACCEPT_LANGUAGE ?? "es-ES,es;q=0.9,it;q=0.8,pt;q=0.7",
    Referer: process.env.MANGA_SOURCE_REFERER ?? `${origin}/`,
    Origin: process.env.MANGA_SOURCE_ORIGIN ?? origin,
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
  const cookie = process.env.MANGA_SOURCE_COOKIE?.trim();
  if (cookie) headers.Cookie = cookie;
  return headers;
}

/** @param {string} url */
function extFromImageUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split("/").pop() ?? "img";
    const m = base.match(/\.(webp|png|jpe?g|gif|avif)$/i);
    return m ? m[1].toLowerCase() : "img";
  } catch {
    return "img";
  }
}

/** @param {string} s */
function safeSegment(s) {
  return String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/\s+/g, " ").trim().slice(0, 150);
}

/**
 * @param {string} base
 * @param {string} pathPart
 */
function apiUrl(base, pathPart) {
  const p = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  return `${base}${p}`;
}

/**
 * @param {string} url
 * @param {Record<string,string>} headers
 */
async function fetchJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return /** @type {Promise<unknown>} */ (res.json());
}

/** @param {string} imgUrl */
/** @param {string} apiOrigin */
async function fetchImage(imgUrl, apiOrigin) {
  const res = await fetch(imgUrl, {
    headers: {
      Referer: `${apiOrigin}/`,
      "User-Agent":
        process.env.MANGA_SOURCE_USER_AGENT ??
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} imagen`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

/**
 * @param {Buffer} buf
 * @param {string} destPath
 */
async function writeFileAtomic(buf, destPath) {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const tmp = `${destPath}.${process.pid}.tmp`;
  await fs.writeFile(tmp, buf);
  await fs.rename(tmp, destPath);
}

/** @param {unknown} listasPayload */
function uniqIdsFromListPayload(listasPayload) {
  const ids = new Set();
  if (!Array.isArray(listasPayload)) return ids;
  for (const list of listasPayload) {
    const items = list?.items;
    if (!Array.isArray(items)) continue;
    for (const row of items) {
      const id = row?.serie?.id;
      if (id != null && String(id).length) ids.add(String(id));
    }
  }
  return ids;
}

/**
 * @param {string} base
 * @param {Record<string,string>} headers
 * @param {number} apiDelayMs
 */
async function collectIdsFromDirectory(base, headers, apiDelayMs) {
  const ids = new Set();
  let page = 1;
  const pageSize = 100;
  while (true) {
    const url = apiUrl(base, `/series-locales?page=${page}&pageSize=${pageSize}`);
    /** @type {unknown} */
    const rows = await fetchJson(url, headers);
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const r of rows) {
      if (r && typeof r === "object" && "id" in r && r.id != null) ids.add(String(r.id));
    }
    if (rows.length < pageSize) break;
    page += 1;
    await sleep(apiDelayMs);
  }
  return ids;
}

async function main() {
  const opts = parseArgs(process.argv);
  const headers = shadowHeaders(opts.baseUrl);
  let apiOrigin;
  try {
    apiOrigin = new URL(opts.baseUrl).origin;
  } catch {
    apiOrigin = "https://shademanga.com";
  }

  console.log("[info] Fuente:", opts.source, "| API:", opts.baseUrl, "| salida:", opts.outRoot);
  if (opts.dryRun) console.log("[info] dry-run: sin escritura.");

  /** @type {Set<string>} */
  let ids;

  if (opts.source === "listas") {
    const url = apiUrl(opts.baseUrl, "/listas");
    let lists;
    try {
      lists = await fetchJson(url, headers);
    } catch (e) {
      console.warn("[warn] /listas falló:", e instanceof Error ? e.message : e);
      console.warn("[warn] Probando fallback /series-locales paginado…");
      ids = await collectIdsFromDirectory(opts.baseUrl, headers, opts.apiDelayMs);
      console.log("[info] ids (directorio fallback):", ids.size);
      await runForIds(ids, opts, headers, apiOrigin);
      return;
    }
    ids = uniqIdsFromListPayload(lists);
    console.log("[info] ids únicos desde listas:", ids.size);
  } else {
    ids = await collectIdsFromDirectory(opts.baseUrl, headers, opts.apiDelayMs);
    console.log("[info] ids únicos desde directorio:", ids.size);
  }

  await runForIds(ids, opts, headers, apiOrigin);
}

/**
 * @param {Set<string>} ids
 * @param {ReturnType<typeof parseArgs>} opts
 * @param {Record<string,string>} headers
 * @param {string} apiOrigin
 */
async function runForIds(ids, opts, headers, apiOrigin) {
  const list = [...ids];
  const toProcess = opts.limit > 0 ? list.slice(0, opts.limit) : list;
  let mangaIndex = 0;
  for (const mangaId of toProcess) {
    mangaIndex += 1;
    const detailUrl = apiUrl(opts.baseUrl, `/series-locales/${encodeURIComponent(mangaId)}`);
    await sleep(opts.apiDelayMs);
    /** @type {unknown} */
    let detail;
    try {
      detail = await fetchJson(detailUrl, headers);
    } catch (e) {
      console.warn(`[skip] manga ${mangaId} no disponible (${e instanceof Error ? e.message : e})`);
      continue;
    }
    if (!detail || typeof detail !== "object") {
      console.warn(`[skip] manga ${mangaId} respuesta inválida`);
      continue;
    }
    const titulo = "titulo" in detail && detail.titulo != null ? String(detail.titulo) : mangaId;
    const chapters = Array.isArray(detail.capitulos) ? detail.capitulos : [];
    if (chapters.length === 0) {
      console.log(`[ok] (${mangaIndex}/${toProcess.length}) ${titulo} — sin capítulos`);
      continue;
    }
    const dirName = `${safeSegment(String(mangaId))}__${safeSegment(titulo)}`;
    console.log(`[run] (${mangaIndex}/${toProcess.length}) ${titulo} — ${chapters.length} capítulos`);

    for (const ch of chapters) {
      if (!ch || typeof ch !== "object" || typeof ch.id !== "number") continue;
      const chapterId = ch.id;
      const num = typeof ch.numeroCapitulo === "number" ? ch.numeroCapitulo : chapterId;
      const pagesUrl = apiUrl(
        opts.baseUrl,
        `/series-locales/${encodeURIComponent(mangaId)}/capitulos/${chapterId}/paginas`,
      );
      await sleep(opts.apiDelayMs);
      /** @type {unknown} */
      let pagePayload;
      try {
        pagePayload = await fetchJson(pagesUrl, headers);
      } catch (e) {
        console.warn(`  [warn] cap ${num} páginas: ${e instanceof Error ? e.message : e}`);
        continue;
      }
      const paginas =
        pagePayload &&
        typeof pagePayload === "object" &&
        "paginas" in pagePayload &&
        Array.isArray(pagePayload.paginas)
          ? pagePayload.paginas
          : [];
      if (paginas.length === 0) continue;

      const chDir = path.join(opts.outRoot, dirName, `cap-${safeSegment(String(num))}-id-${chapterId}`);
      let pic = 0;
      for (const imgUrlRaw of paginas) {
        if (typeof imgUrlRaw !== "string" || !imgUrlRaw.startsWith("http")) continue;
        pic += 1;
        const ext = extFromImageUrl(imgUrlRaw);
        const dest = path.join(chDir, `${String(pic).padStart(4, "0")}.${ext}`);
        try {
          if (opts.dryRun) continue;
          const exists = await fs
            .access(dest)
            .then(() => true)
            .catch(() => false);
          if (exists) continue;
          const buf = await fetchImage(imgUrlRaw, apiOrigin);
          await writeFileAtomic(buf, dest);
        } catch (e) {
          console.warn(`  [warn] ${dest}: ${e instanceof Error ? e.message : e}`);
        }
        await sleep(opts.imageDelayMs);
      }
    }
  }
  console.log("[done]");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
