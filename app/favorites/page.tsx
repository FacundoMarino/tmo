"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "../../src/shared/components/AppShell";
import { LoadingSpinner } from "../../src/shared/components/LoadingSpinner";
import { fetchFavorites } from "../../src/features/favorites/services/webFavoritesApi";
import { fetchMangas } from "../../src/features/manga/services/webApi";
import { Manga } from "../../src/features/manga/types";

export default function FavoritesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [favoriteIds, mangas] = await Promise.all([fetchFavorites(), fetchMangas()]);
        const favoriteSet = new Set(favoriteIds);
        setItems(mangas.filter((manga) => favoriteSet.has(manga.id)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando favoritos");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <AppShell>
      <h1>Favoritos</h1>
      {loading ? <LoadingSpinner block /> : null}
      {error ? <p className="error-text">Error: {error}</p> : null}
      <section className="manga-grid">
        {items.map((manga) => (
          <article
            className="manga-card"
            key={manga.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/manga/${manga.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/manga/${manga.id}`);
              }
            }}
          >
            <img src={manga.coverUrl} alt={manga.title} />
            <div>
              <h3>{manga.title}</h3>
              <Link
                className="button card-detail-button"
                href={`/manga/${manga.id}`}
                onClick={(event) => event.stopPropagation()}
              >
                Ver detalle
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
