"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../src/shared/components/AppShell";
import { LoadingSpinner } from "../../src/shared/components/LoadingSpinner";
import { fetchHistory } from "../../src/features/history/services/webHistoryApi";
import { fetchMangas } from "../../src/features/manga/services/webApi";
import { Manga } from "../../src/features/manga/types";

type HistoryItem = {
  mangaId: string;
  chapterId: string | number;
  chapterNumber: number;
  updatedAt: string | null;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mangaMap, setMangaMap] = useState<Record<string, Manga>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [historyItems, mangas] = await Promise.all([fetchHistory(), fetchMangas()]);
        setHistory(
          historyItems.map((item) => ({
            mangaId: item.manga_id,
            chapterId: item.chapter_id,
            chapterNumber: item.chapter_number,
            updatedAt: item.updated_at,
          })),
        );
        setMangaMap(
          mangas.reduce<Record<string, Manga>>((acc, manga) => {
            acc[manga.id] = manga;
            return acc;
          }, {}),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando historial");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const visibleHistory = useMemo(
    () => history.filter((item) => Boolean(mangaMap[item.mangaId])),
    [history, mangaMap],
  );

  return (
    <AppShell>
      <h1>Historial de lectura</h1>
      {loading ? <LoadingSpinner block /> : null}
      {error ? <p className="error-text">Error: {error}</p> : null}
      <section className="history-list">
        {visibleHistory.map((item) => (
          <article className="history-item" key={`${item.mangaId}-${item.chapterId}`}>
            <div>
              <h3>{mangaMap[item.mangaId].title}</h3>
              <p>Capitulo {item.chapterNumber}</p>
              <small>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ""}</small>
            </div>
            <Link
              className="button"
              href={`/reader/${item.mangaId}/${item.chapterId}?chapterNumber=${item.chapterNumber}`}
            >
              Continuar
            </Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
