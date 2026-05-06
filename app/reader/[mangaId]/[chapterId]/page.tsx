"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../src/shared/components/AppShell";
import { upsertHistory } from "../../../../src/features/history/services/webHistoryApi";
import { fetchChapterPages, fetchMangaDetail } from "../../../../src/features/manga/services/webApi";
import { MangaDetail } from "../../../../src/features/manga/types";

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
        {pages.map((url, index) => (
          <img key={`${url}-${index}`} src={url} alt={`Pagina ${index + 1}`} />
        ))}
      </section>

      <section className="reader-actions">
        <button className="button ghost-button" onClick={() => router.back()}>
          Volver
        </button>
        <button
          className="button"
          onClick={() => {
            if (!nextChapter || !detail) return;
            router.replace(
              `/reader/${detail.id}/${nextChapter.id}?chapterNumber=${nextChapter.chapterNumber}`,
            );
          }}
          disabled={!nextChapter}
        >
          {nextChapter ? "Siguiente capitulo" : "Fin del manga"}
        </button>
      </section>
    </AppShell>
  );
}
