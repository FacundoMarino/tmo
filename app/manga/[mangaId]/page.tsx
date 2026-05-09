"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../src/shared/components/AppShell";
import { LoadingSpinner } from "../../../src/shared/components/LoadingSpinner";
import { addFavorite, fetchFavorites, removeFavorite } from "../../../src/features/favorites/services/webFavoritesApi";
import { fetchMangaDetail } from "../../../src/features/manga/services/webApi";
import { MangaDetail } from "../../../src/features/manga/types";

export default function MangaDetailPage() {
  const router = useRouter();
  const params = useParams<{ mangaId: string }>();
  const mangaId = params.mangaId;
  const [detail, setDetail] = useState<MangaDetail | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mangaId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [detailData, favoriteIds] = await Promise.all([
          fetchMangaDetail(mangaId),
          fetchFavorites(),
        ]);
        setDetail(detailData);
        setFavorites(favoriteIds);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando manga");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [mangaId]);

  const isFavorite = useMemo(
    () => (detail ? favorites.includes(detail.id) : false),
    [detail, favorites],
  );

  const onToggleFavorite = async () => {
    if (!detail) return;
    try {
      if (isFavorite) {
        await removeFavorite(detail.id);
        setFavorites((prev) => prev.filter((id) => id !== detail.id));
      } else {
        await addFavorite(detail.id);
        setFavorites((prev) => [...prev, detail.id]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar favorito";
      if (message.toLowerCase().includes("no autenticado")) {
        router.push(`/auth/login?next=${encodeURIComponent(`/manga/${detail.id}`)}`);
        return;
      }
      setError(message);
    }
  };

  return (
    <AppShell>
      {loading ? <LoadingSpinner block /> : null}
      {error ? <p className="error-text">Error: {error}</p> : null}
      {!detail ? null : (
        <section className="detail-layout">
          <img src={detail.coverUrl} alt={detail.title} />
          <div>
            <h1>{detail.title}</h1>
            <p>{detail.description}</p>
            <p>
              <strong>Autor:</strong> {detail.author}
            </p>
            <p>
              <strong>Estado:</strong> {detail.status}
            </p>
            <p>
              <strong>Generos:</strong> {detail.genres.join(", ") || "Sin genero"}
            </p>
            <button className="button ghost-button" onClick={onToggleFavorite}>
              {isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            </button>
          </div>

          <div className="chapter-list">
            <h2>Capitulos</h2>
            {detail.chapters.map((chapter) => (
              <Link
                key={chapter.id}
                className="chapter-item"
                href={`/reader/${detail.id}/${chapter.id}?chapterNumber=${chapter.chapterNumber}`}
              >
                Capitulo {chapter.chapterNumber}
                {chapter.title ? ` - ${chapter.title}` : ""}
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
