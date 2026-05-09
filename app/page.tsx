"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "../src/shared/components/AppShell";
import { LoadingSpinner } from "../src/shared/components/LoadingSpinner";
import {
  fetchGenres,
  fetchMangas,
  fetchMangasByGenre,
  fetchSearchMangas,
} from "../src/features/manga/services/webApi";
import { Manga, MangaGenre } from "../src/features/manga/types";

export default function Home() {
  const router = useRouter();
  const PAGE_SIZE = 24;
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [genres, setGenres] = useState<MangaGenre[]>([]);
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [genrePage, setGenrePage] = useState(1);
  const [hasNextGenrePage, setHasNextGenrePage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setQuery(q);
    }
  }, []);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreData = await fetchGenres();
        setGenres(genreData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error cargando categorias",
        );
      }
    };
    void loadGenres();
  }, []);

  useEffect(() => {
    const loadMangaData = async () => {
      try {
        setLoading(true);
        setError(null);
        const normalizedQuery = query.trim();
        if (normalizedQuery) {
          const result = await fetchSearchMangas(normalizedQuery);
          setMangas(result);
          setHasNextGenrePage(false);
          return;
        }
        if (selectedGenre) {
          const result = await fetchMangasByGenre(
            selectedGenre,
            genrePage,
            PAGE_SIZE,
          );
          setMangas(result.items);
          setHasNextGenrePage(result.items.length >= result.pageSize);
          return;
        }
        const result = await fetchMangas();
        setMangas(result);
        setHasNextGenrePage(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error cargando catalogo",
        );
      } finally {
        setLoading(false);
      }
    };
    void loadMangaData();
  }, [selectedGenre, genrePage, query]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const normalizedQuery = query.trim();
    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    } else {
      params.delete("q");
    }
    const nextUrl = params.toString() ? `/?${params.toString()}` : "/";
    window.history.replaceState(null, "", nextUrl);
  }, [query]);

  return (
    <AppShell>
      <section className="catalog-header">
        <h1>Explorar Manga</h1>
      </section>

      <section className="catalog-toolbar">
        <input
          className="catalog-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setGenrePage(1);
          }}
          placeholder="Buscar por titulo o genero"
        />
        <select
          className="catalog-select"
          value={selectedGenre}
          onChange={(e) => {
            setSelectedGenre(e.target.value);
            setGenrePage(1);
          }}
        >
          <option value="">Todas las categorias</option>
          {genres.map((genre) => (
            <option key={genre.name} value={genre.name}>
              {genre.name} ({genre.total})
            </option>
          ))}
        </select>
      </section>

      {loading ? <LoadingSpinner block /> : null}
      {error ? <p className="error-text">Error: {error}</p> : null}

      {selectedGenre && !query.trim() ? (
        <section className="pagination-row">
          <button
            className="button ghost-button"
            disabled={genrePage <= 1 || loading}
            onClick={() => setGenrePage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </button>
          <span>Pagina {genrePage}</span>
          <button
            className="button ghost-button"
            disabled={!hasNextGenrePage || loading}
            onClick={() => setGenrePage((prev) => prev + 1)}
          >
            Siguiente
          </button>
        </section>
      ) : null}

      <section className="manga-grid">
        {mangas.map((manga) => (
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
            <img src={manga.coverUrl} alt={manga.title} loading="lazy" />
            <div>
              <h3>{manga.title}</h3>
              <p className="manga-description">{manga.description}</p>
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
