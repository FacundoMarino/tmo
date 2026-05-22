"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../src/shared/components/AppShell";
import { MangaRail } from "../src/shared/components/MangaRail";
import { LoadingSpinner } from "../src/shared/components/LoadingSpinner";
import {
  type MangaCatalogSection,
  fetchGenres,
  fetchHomeCatalogSections,
  fetchMangasByGenre,
  fetchSearchMangas,
} from "../src/features/manga/services/webApi";
import { type Manga, type MangaGenre } from "../src/features/manga/types";

export default function Home() {
  const router = useRouter();
  const PAGE_SIZE = 24;
  const [sections, setSections] = useState<MangaCatalogSection[]>([]);
  const [genres, setGenres] = useState<MangaGenre[]>([]);
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [genrePage, setGenrePage] = useState(1);
  const [hasNextGenrePage, setHasNextGenrePage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const railRefs = useRef<(HTMLDivElement | null)[]>([]);

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
          setSections([
            {
              title: `Búsqueda: ${normalizedQuery}`,
              mangas: result,
            },
          ]);
          setHasNextGenrePage(false);
          return;
        }
        if (selectedGenre) {
          const result = await fetchMangasByGenre(
            selectedGenre,
            genrePage,
            PAGE_SIZE,
          );
          setSections([{ title: selectedGenre, mangas: result.items }]);
          setHasNextGenrePage(result.items.length >= result.pageSize);
          return;
        }
        const result = await fetchHomeCatalogSections();
        setSections(result);
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

  const useHorizontalRails = query.trim().length === 0 && !selectedGenre;
  const showHero = useHorizontalRails;

  const scrollRail = (index: number, direction: "left" | "right") => {
    const el = railRefs.current[index];
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const renderHomeCard = (manga: Manga) => {
    const subtitle =
      manga.genres.length > 0 ? manga.genres[0] : "Explorar serie";

    return (
      <article
        className="manga-card manga-card--home manga-card--rail"
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
        <div className="manga-card-cover">
          <img
            src={manga.coverUrl}
            alt={manga.title}
            loading="lazy"
            draggable={false}
          />
        </div>
        <div className="manga-card-meta">
          <div className="manga-card-meta-text">
            <h3>{manga.title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
      </article>
    );
  };

  const renderPosterCard = (manga: Manga) => (
    <article
      className={`manga-card manga-card--poster ${useHorizontalRails ? "manga-card--rail" : "manga-card--grid-slot"}`}
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
      <div className="manga-card-media">
        <img
          src={manga.coverUrl}
          alt={manga.title}
          loading="lazy"
          draggable={false}
        />
        <div className="manga-card-overlay" aria-hidden />
        <div className="manga-card-hover-content">
          <h3 className="manga-card-hover-title">{manga.title}</h3>
          <p className="manga-description manga-card-hover-desc">
            {manga.description}
          </p>
        </div>
      </div>
    </article>
  );

  return (
    <AppShell>
      {showHero ? (
        <section className="home-hero" aria-label="Destacado">
          <Image
            className="home-hero-bg"
            src="/Imagen_lading_header.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="home-hero-overlay" aria-hidden />
          <div className="home-hero-content">
            <span className="home-hero-badge">Tu mundo, tus historias</span>
            <h1 className="home-hero-title">
              Explora el mundo del <em>manga</em>
            </h1>
            <p className="home-hero-subtitle">
              Miles de historias, géneros y aventuras en un solo lugar.
            </p>
            <div className="home-hero-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  document
                    .getElementById("catalog-sections")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Explorar mangas
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => scrollRail(0, "right")}
              >
                Ver más populares
              </button>
            </div>
            <div className="home-hero-stats">
              <span className="home-hero-stat">
                <strong>+10k</strong> Mangas
              </span>
              <span className="home-hero-stat">
                <strong>+2M</strong> Capítulos
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <section
        id="catalog-search"
        className="home-catalog-toolbar"
        aria-label="Buscar y filtrar"
      >
        <label className="home-catalog-search">
          <span className="home-catalog-search-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="M20 20L16.5 16.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            id="home-catalog-search"
            className="catalog-input catalog-input--home"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setGenrePage(1);
            }}
            placeholder="Descubrí tu próxima lectura..."
            type="search"
          />
        </label>
        <div className="catalog-filter-wrap">
          <span className="catalog-filter-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6h16M7 12h10M10 18h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="catalog-filter-label">Filtrar por categoría</span>
          </span>
          <select
            aria-label="Filtrar por categoría"
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              setGenrePage(1);
            }}
          >
            <option value="">Todas las categorías</option>
            {genres.map((genre) => (
              <option key={genre.name} value={genre.name}>
                {genre.name} ({genre.total})
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading ? <LoadingSpinner block /> : null}
      {error ? <p className="error-text">Error: {error}</p> : null}

      {selectedGenre && !query.trim() ? (
        <section className="pagination-row">
          <button
            className="button ghost-button"
            disabled={genrePage <= 1 || loading}
            onClick={() => setGenrePage((prev) => Math.max(1, prev - 1))}
            type="button"
          >
            Anterior
          </button>
          <span>Pagina {genrePage}</span>
          <button
            className="button ghost-button"
            disabled={!hasNextGenrePage || loading}
            onClick={() => setGenrePage((prev) => prev + 1)}
            type="button"
          >
            Siguiente
          </button>
        </section>
      ) : null}

      <div id="catalog-sections">
        {sections.map((sec, secIdx) => {
          const headingId = `catalog-heading-${secIdx}`;
          return (
            <section
              className="catalog-section-block"
              key={`${sec.title}-${secIdx}`}
            >
              <div className="catalog-section-header">
                <h2 id={headingId} className="catalog-section-heading">
                  {sec.title}
                </h2>
                {useHorizontalRails ? (
                  <div className="catalog-section-actions">
                    <a
                      className="catalog-section-link"
                      href="#catalog-sections"
                    >
                      Ver todos
                    </a>
                    <div className="catalog-rail-nav">
                      <button
                        type="button"
                        aria-label={`Anterior en ${sec.title}`}
                        onClick={() => scrollRail(secIdx, "left")}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        aria-label={`Siguiente en ${sec.title}`}
                        onClick={() => scrollRail(secIdx, "right")}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              {useHorizontalRails ? (
                <MangaRail
                  ref={(el) => {
                    railRefs.current[secIdx] = el;
                  }}
                  labelledBy={headingId}
                >
                  {sec.mangas.map(renderHomeCard)}
                </MangaRail>
              ) : (
                <div className="manga-grid manga-grid--catalog">
                  {sec.mangas.map(renderPosterCard)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
