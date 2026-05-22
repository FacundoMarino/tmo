"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../src/shared/components/AppShell";
import { LoadingSpinner } from "../../src/shared/components/LoadingSpinner";
import { fetchFavorites } from "../../src/features/favorites/services/webFavoritesApi";
import { fetchHistory } from "../../src/features/history/services/webHistoryApi";
import { fetchMangas } from "../../src/features/manga/services/webApi";
import { type Manga } from "../../src/features/manga/types";

type ViewMode = "grid" | "list";

type HistoryByManga = Record<
  string,
  {
    chapterNumber: number;
    chapterId: string | number;
    updatedAt: string | null;
  }
>;

type SortOption = "recent" | "title-asc" | "title-desc";

function formatStatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}

function computeStreakDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  const dayKeys = new Set(
    dates.map((iso) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!dayKeys.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function StatBookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function StatBookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 4h7a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2V4zm9 0h5v16h-5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function StatClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8v4l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatFlameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c2 4 5 5 5 9a5 5 0 1 1-10 0c0-3 2-4 5-9z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4z" />
    </svg>
  );
}

function MangasTabIcon() {
  return (
    <span className="page-tab-icon" aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <rect x="8" y="8" width="3" height="3" rx="0.5" fill="currentColor" />
        <rect x="13" y="8" width="3" height="3" rx="0.5" fill="currentColor" />
        <rect x="8" y="13" width="3" height="3" rx="0.5" fill="currentColor" />
        <rect x="13" y="13" width="3" height="3" rx="0.5" fill="currentColor" />
      </svg>
    </span>
  );
}

function ListaTabIcon() {
  return (
    <span className="page-tab-icon" aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="M8 9h8M8 12h8M8 15h5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Manga[]>([]);
  const [historyByManga, setHistoryByManga] = useState<HistoryByManga>({});
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [favoriteIds, mangas, historyItems] = await Promise.all([
          fetchFavorites(),
          fetchMangas(),
          fetchHistory(),
        ]);
        const favoriteSet = new Set(favoriteIds);
        setItems(mangas.filter((manga) => favoriteSet.has(manga.id)));

        const byManga: HistoryByManga = {};
        const dates: string[] = [];
        for (const entry of historyItems) {
          if (entry.updated_at) dates.push(entry.updated_at);
          if (!favoriteSet.has(entry.manga_id)) continue;
          const existing = byManga[entry.manga_id];
          const entryTime = entry.updated_at
            ? new Date(entry.updated_at).getTime()
            : 0;
          const existingTime = existing?.updatedAt
            ? new Date(existing.updatedAt).getTime()
            : 0;
          if (
            !existing ||
            entry.chapter_number >= existing.chapterNumber ||
            entryTime >= existingTime
          ) {
            byManga[entry.manga_id] = {
              chapterNumber: entry.chapter_number,
              chapterId: entry.chapter_id,
              updatedAt: entry.updated_at,
            };
          }
        }
        setHistoryByManga(byManga);
        setHistoryDates(dates);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error cargando favoritos",
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const stats = useMemo(() => {
    const chaptersRead = Object.values(historyByManga).reduce(
      (sum, h) => sum + h.chapterNumber,
      0,
    );
    const readingHours = Math.max(1, Math.round(chaptersRead * 0.35));
    const streak = computeStreakDays(historyDates);
    return {
      favorites: items.length,
      chapters: chaptersRead || historyDates.length,
      hours: readingHours,
      streak: streak > 0 ? streak : historyDates.length > 0 ? 1 : 0,
    };
  }, [historyByManga, historyDates, items.length]);

  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortBy === "title-asc") {
      return list.sort((a, b) => a.title.localeCompare(b.title, "es"));
    }
    if (sortBy === "title-desc") {
      return list.sort((a, b) => b.title.localeCompare(a.title, "es"));
    }
    return list.sort((a, b) => {
      const aTime = historyByManga[a.id]?.updatedAt
        ? new Date(historyByManga[a.id].updatedAt!).getTime()
        : 0;
      const bTime = historyByManga[b.id]?.updatedAt
        ? new Date(historyByManga[b.id].updatedAt!).getTime()
        : 0;
      return bTime - aTime;
    });
  }, [historyByManga, items, sortBy]);

  const chapterLabel = (mangaId: string) => {
    const progress = historyByManga[mangaId];
    if (progress) return `Capítulo ${progress.chapterNumber}`;
    return "Sin empezar";
  };

  const openManga = (manga: Manga) => {
    const progress = historyByManga[manga.id];
    if (progress) {
      router.push(
        `/reader/${manga.id}/${progress.chapterId}?chapterNumber=${progress.chapterNumber}`,
      );
      return;
    }
    router.push(`/manga/${manga.id}`);
  };

  const renderGridCard = (manga: Manga) => (
    <article
      className="manga-card manga-card--home manga-card--favorite"
      key={manga.id}
      role="button"
      tabIndex={0}
      onClick={() => openManga(manga)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openManga(manga);
        }
      }}
    >
      <div className="manga-card-cover">
        <span className="manga-card-bookmark" aria-hidden>
          <BookmarkIcon />
        </span>
        <img src={manga.coverUrl} alt={manga.title} loading="lazy" draggable={false} />
      </div>
      <div className="manga-card-meta">
        <div className="manga-card-meta-text">
          <h3>{manga.title}</h3>
          <p>{chapterLabel(manga.id)}</p>
        </div>
        <button
          type="button"
          className="manga-card-menu"
          aria-label={`Opciones de ${manga.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          ⋮
        </button>
      </div>
    </article>
  );

  const renderListRow = (manga: Manga) => (
    <article
      className="library-list-item"
      key={manga.id}
      role="button"
      tabIndex={0}
      onClick={() => openManga(manga)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openManga(manga);
        }
      }}
    >
      <img src={manga.coverUrl} alt="" className="library-list-cover" />
      <div className="library-list-body">
        <h3>{manga.title}</h3>
        <p>{chapterLabel(manga.id)}</p>
      </div>
      <span className="manga-card-bookmark library-list-bookmark" aria-hidden>
        <BookmarkIcon />
      </span>
      <button
        type="button"
        className="manga-card-menu"
        aria-label={`Opciones de ${manga.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        ⋮
      </button>
    </article>
  );

  return (
    <AppShell>
      <div className="library-page">
        <header className="page-hero-header">
          <h1 className="page-hero-title">Mi biblioteca</h1>
          <p className="page-hero-desc">
            Tus favoritos te esperan justo donde los dejaste.
          </p>
          <p className="page-hero-desc">La historia sigue esperándote.</p>
          <div
            className="page-tabs"
            role="tablist"
            aria-label="Vista de biblioteca"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "grid"}
              className={viewMode === "grid" ? "is-active" : ""}
              onClick={() => setViewMode("grid")}
            >
              <MangasTabIcon />
              Mangas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "list"}
              className={viewMode === "list" ? "is-active" : ""}
              onClick={() => setViewMode("list")}
            >
              <ListaTabIcon />
              Lista
            </button>
          </div>
        </header>

        <section className="library-toolbar" aria-label="Resumen y orden">
          <div className="library-toolbar-stats">
            <div className="library-stat">
              <StatBookmarkIcon />
              <div>
                <span className="library-stat-value">
                  {formatStatCount(stats.favorites)}
                </span>
                <span className="library-stat-label">Mangas favoritos</span>
              </div>
            </div>
            <div className="library-stat">
              <StatBookIcon />
              <div>
                <span className="library-stat-value">
                  {formatStatCount(stats.chapters)}
                </span>
                <span className="library-stat-label">Capítulos guardados</span>
              </div>
            </div>
            <div className="library-stat">
              <StatClockIcon />
              <div>
                <span className="library-stat-value">{stats.hours}</span>
                <span className="library-stat-label">Horas de lectura</span>
              </div>
            </div>
            <div className="library-stat library-stat--streak">
              <StatFlameIcon />
              <div>
                <span className="library-stat-value">{stats.streak}</span>
                <span className="library-stat-label">
                  Días de racha
                  {stats.streak > 0 ? (
                    <em className="library-stat-hint">¡Seguí así!</em>
                  ) : null}
                </span>
              </div>
            </div>
          </div>
          <div className="library-toolbar-sort">
            <span className="library-sort-label" id="library-sort-label">
              Ordenar por
            </span>
            <div className="library-sort-select-wrap">
              <select
                className="library-sort-select"
                value={sortBy}
                aria-labelledby="library-sort-label"
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="recent">Más reciente</option>
                <option value="title-asc">A — Z</option>
                <option value="title-desc">Z — A</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? <LoadingSpinner block /> : null}
        {error ? <p className="error-text">Error: {error}</p> : null}

        {!loading && !error && items.length === 0 ? (
          <p className="library-empty">
            Todavía no tenés favoritos. Explorá el catálogo y guardá los que te
            gusten.
          </p>
        ) : null}

        {viewMode === "grid" ? (
          <section className="library-grid" aria-label="Mangas favoritos">
            {sortedItems.map(renderGridCard)}
          </section>
        ) : (
          <section className="library-list" aria-label="Lista de favoritos">
            {sortedItems.map(renderListRow)}
          </section>
        )}
      </div>
    </AppShell>
  );
}
