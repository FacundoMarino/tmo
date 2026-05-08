"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../src/shared/components/AppShell";
import { upsertHistory } from "../../../../src/features/history/services/webHistoryApi";
import { fetchChapterPages, fetchMangaDetail } from "../../../../src/features/manga/services/webApi";
import { MangaDetail } from "../../../../src/features/manga/types";

type ReaderItem =
  | { type: "image"; id: string; url: string; pageNumber: number }
  | { type: "banner"; id: string; slot: "start" | "middle" | "end"; html: string }
  | { type: "external"; id: string; url: string; label: string };

const CONTINUE_SOCIAL_BAR_CHAPTER_FREQUENCY = 3;
const AD_FREQUENCY = 4;
const WEBVIEW_FREQUENCY = 5;
const INTERSTITIAL_SOCIAL_BAR_SCRIPT_URL =
  "https://pl29286717.profitablecpmratenetwork.com/74/ff/62/74ff622fb43376b7c05ee086692ba03b.js";
const AD_LINKS = [
  "https://omg10.com/4/10937833",
  "https://omg10.com/4/10937831",
  "https://omg10.com/4/10937830",
  "https://omg10.com/4/10937829",
  "https://omg10.com/4/10937827",
  "https://omg10.com/4/10937826",
  "https://omg10.com/4/10937824",
  "https://omg10.com/4/10937824",
  "https://omg10.com/4/10937822",
];
const WEBVIEW_LINKS = [
  "https://omg10.com/4/10937860",
  "https://omg10.com/4/10937859",
  "https://omg10.com/4/10937858",
  "https://omg10.com/4/10937861",
  "https://omg10.com/4/10937862",
];
const INTERSTITIAL_LINKS = [
  "https://www.profitablecpmratenetwork.com/i1mmatkbj?key=758a45bc7558d351dee2df8a3e202812",
  "https://www.profitablecpmratenetwork.com/i1mmatkbj?key=758a45bc7558d351dee2df8a3e202812",
  "https://www.highperformanceformat.com/c7c52f6702f49cccad505ffefe583ec0/invoke.js",
  "https://www.highperformanceformat.com/a93094a23fe4d16dad1e736a45e4d67a/invoke.js",
];

function pickRotatingLink(links: string[], seed: number): string {
  if (links.length === 0) return "";
  const index = ((seed % links.length) + links.length) % links.length;
  return links[index];
}

function getChapterBannerHtml(
  slot: "start" | "middle" | "end",
  ctaLink: string,
  interstitialLink: string,
): string {
  if (slot === "start") {
    return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:8px;display:flex;align-items:center;justify-content:center;background:#020617;color:#e2e8f0;font-family:Arial,Helvetica,sans-serif;">
    <div style="text-align:center; width:100%;">
      <script>
        atOptions = {
          'key' : '02d4c6d809856627b2cd8db3822f8baa',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      </script>
      <script src="https://www.highperformanceformat.com/02d4c6d809856627b2cd8db3822f8baa/invoke.js"></script>
      <script async="async" data-cfasync="false" src="https://pl29286716.profitablecpmratenetwork.com/55225c353f21c318922fda7e00904444/invoke.js"></script>
      <div id="container-55225c353f21c318922fda7e00904444"></div>
      <div style="margin-top:8px;">
        <a href="${ctaLink}" target="_blank" rel="noreferrer noopener" style="color:#67e8f9;font-size:12px;text-decoration:none;">
          Ver oferta destacada
        </a>
      </div>
      <script async src="${interstitialLink}"></script>
    </div>
  </body>
</html>
`;
  }

  if (slot === "middle") {
    return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;background:#020617;">
    <div style="text-align:center;">
      <script>
        atOptions = {
          'key' : 'cac998db21e4bb7457212738b8bf700d',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      </script>
      <script src="https://www.highperformanceformat.com/cac998db21e4bb7457212738b8bf700d/invoke.js"></script>
    </div>
  </body>
</html>
`;
  }

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#020617;color:#e2e8f0;font-family:Arial,Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;">
    <div style="text-align:center;">
      <script async="async" data-cfasync="false" src="https://pl29286716.profitablecpmratenetwork.com/55225c353f21c318922fda7e00904444/invoke.js"></script>
      <div id="container-55225c353f21c318922fda7e00904444"></div>
      <p style="margin-top:10px;font-size:13px;">
        <a href="${ctaLink}" target="_blank" rel="noreferrer noopener" style="color:#67e8f9;">
          Ver oferta
        </a>
      </p>
      <script async src="${interstitialLink}"></script>
    </div>
  </body>
</html>
`;
}

function buildReaderItems(pages: string[], chapterNumber: number): ReaderItem[] {
  const items: ReaderItem[] = [];
  const bannerLink = pickRotatingLink(AD_LINKS, chapterNumber - 1);
  const interstitialLink = pickRotatingLink(INTERSTITIAL_LINKS, chapterNumber - 1);

  if (pages.length > 0) {
    items.push({
      type: "banner",
      id: "chapter-banner-start",
      slot: "start",
      html: getChapterBannerHtml("start", bannerLink, interstitialLink),
    });
  }
  const middleIndex = Math.floor((pages.length - 1) / 2);

  pages.forEach((url, index) => {
    const pageNumber = index + 1;
    items.push({
      type: "image",
      id: `image-${index}`,
      url,
      pageNumber,
    });

    if (pageNumber % AD_FREQUENCY === 0 && AD_LINKS.length > 0) {
      const adSlotIndex = Math.floor(pageNumber / AD_FREQUENCY) - 1;
      items.push({
        type: "external",
        id: `external-ad-${pageNumber}`,
        url: pickRotatingLink(AD_LINKS, adSlotIndex),
        label: "Oferta patrocinada",
      });
    }

    if (pageNumber % WEBVIEW_FREQUENCY === 0 && WEBVIEW_LINKS.length > 0) {
      const webSlotIndex = Math.floor(pageNumber / WEBVIEW_FREQUENCY) - 1;
      items.push({
        type: "external",
        id: `external-web-${pageNumber}`,
        url: pickRotatingLink(WEBVIEW_LINKS, webSlotIndex),
        label: "Contenido recomendado",
      });
    }

    if (index === middleIndex) {
      items.push({
        type: "banner",
        id: "chapter-banner-middle",
        slot: "middle",
        html: getChapterBannerHtml("middle", bannerLink, interstitialLink),
      });
    }
  });

  if (pages.length > 0) {
    items.push({
      type: "banner",
      id: "chapter-banner-end",
      slot: "end",
      html: getChapterBannerHtml("end", bannerLink, interstitialLink),
    });
  }

  return items;
}

function openInterstitialSocialBar(): void {
  const popup = window.open("about:blank", "_blank");
  if (!popup) {
    return;
  }

  // Prevent reverse-tabnabbing while keeping access to document.write.
  popup.opener = null;
  popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Contenido patrocinado</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #020617;
        color: #e2e8f0;
        font-family: Arial, Helvetica, sans-serif;
      }
    </style>
  </head>
  <body>
    <script async src="${INTERSTITIAL_SOCIAL_BAR_SCRIPT_URL}"></script>
  </body>
</html>`);
  popup.document.close();
}

export default function ReaderPage() {
  const params = useParams<{ mangaId: string; chapterId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const mangaId = params.mangaId;
  const chapterId = Number(params.chapterId);
  const chapterNumber = Number(searchParams.get("chapterNumber") ?? chapterId);
  const [detail, setDetail] = useState<MangaDetail | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [horizontal, setHorizontal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mangaId || !chapterId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [detailData, chapterPages] = await Promise.all([
          fetchMangaDetail(mangaId),
          fetchChapterPages(mangaId, chapterId),
        ]);
        setDetail(detailData);
        setPages(chapterPages);
        await upsertHistory({ mangaId, chapterId, chapterNumber });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error en lector");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [mangaId, chapterId, chapterNumber]);

  const nextChapter = useMemo(() => {
    if (!detail) return null;
    const ordered = [...detail.chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
    return (
      ordered.find(
        (chapter) =>
          chapter.chapterNumber > chapterNumber ||
          (chapter.chapterNumber === chapterNumber && chapter.id > chapterId),
      ) ?? null
    );
  }, [detail, chapterId, chapterNumber]);
  const readerItems = useMemo(
    () => buildReaderItems(pages, chapterNumber),
    [pages, chapterNumber],
  );
  const shouldShowInterstitial = useMemo(() => {
    return chapterNumber % CONTINUE_SOCIAL_BAR_CHAPTER_FREQUENCY === 0;
  }, [chapterNumber]);

  return (
    <AppShell>
      <section className="reader-topbar">
        <h1>
          {detail?.title ?? "Lectura"} - Capitulo {chapterNumber}
        </h1>
        <button className="button ghost-button" onClick={() => setHorizontal((v) => !v)}>
          Modo: {horizontal ? "Horizontal" : "Vertical"}
        </button>
      </section>

      {loading ? <p>Cargando paginas...</p> : null}
      {error ? <p className="error-text">Error: {error}</p> : null}

      <section className={horizontal ? "reader-strip horizontal" : "reader-strip"}>
        {readerItems.map((item) => {
          if (item.type === "banner") {
            return (
              <article
                key={item.id}
                className={`reader-banner-card reader-banner-${item.slot}`}
              >
                <iframe
                  title={`banner-${item.slot}`}
                  srcDoc={item.html}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  referrerPolicy="no-referrer"
                />
              </article>
            );
          }

          if (item.type === "external") {
            return (
              <article key={item.id} className="reader-external-card">
                <p>{item.label}</p>
                <a href={item.url} target="_blank" rel="noreferrer noopener">
                  Abrir enlace
                </a>
              </article>
            );
          }

          return (
            <img
              key={item.id}
              src={item.url}
              alt={`Pagina ${item.pageNumber}`}
              loading="lazy"
            />
          );
        })}
      </section>

      <section className="reader-actions">
        <button className="button ghost-button" onClick={() => router.back()}>
          Volver
        </button>
        <button
          className="button"
          onClick={() => {
            if (!nextChapter || !detail) return;
            if (shouldShowInterstitial) {
              openInterstitialSocialBar();
            }
            router.replace(
              `/reader/${detail.id}/${nextChapter.id}?chapterNumber=${nextChapter.chapterNumber}`,
            );
          }}
          disabled={!nextChapter}
        >
          {nextChapter ? "Seguir leyendo" : "Fin del manga"}
        </button>
      </section>
    </AppShell>
  );
}
