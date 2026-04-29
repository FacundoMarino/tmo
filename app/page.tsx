import type { CSSProperties } from "react";

const downloadUrl =
  process.env.NEXT_PUBLIC_DOWNLOAD_URL ?? "https://example.com/descargar-app";
const bannerImageUrl =
  process.env.NEXT_PUBLIC_BANNER_IMAGE_URL ??
  "https://dw9to29mmj727.cloudfront.net/promo/2016/5265-SeriesHeaders_OP_2000x800_wm.jpg";

const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
  downloadUrl,
)}`;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tmomanga.app";

export default function Home() {
  const bannerStyle = {
    "--banner-image": `url("${bannerImageUrl}")`,
  } as CSSProperties;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TMO Manga",
    url: siteUrl,
    description:
      "TMO Manga es una app para leer manga online y seguir anime como One Piece y Frieren.",
    inLanguage: "es",
    keywords: "TMO, Manga, Anime, One Piece, Frieren",
  };

  return (
    <main className="landing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="navbar">
        <a href="#inicio" className="brand">
          TMO Manga
        </a>
        <nav>
          <a href="#inicio">Inicio</a>
          <a href="#descarga">Descarga</a>
          <a href="#contacto">Contacto</a>
        </nav>
      </header>

      <section id="inicio" className="banner" style={bannerStyle}>
        <div className="banner-overlay">
          <h1 className="anime-title">
            TMO Manga y Anime: lee One Piece, Frieren y mas
          </h1>
          <p>
            TMO es la app para fans de manga y anime. Descubre nuevas historias,
            sigue tus titulos favoritos y lee manga online de forma comoda.
          </p>
        </div>
      </section>

      <section
        className="features"
        aria-label="Beneficios de TMO Manga y Anime"
      >
        <article>
          <h2>Lee manga online con estilo anime</h2>
          <p>
            Disfruta una lectura fluida en TMO Manga, pensada para fans de anime
            y manga en espanol.
          </p>
        </article>
        <article>
          <h2>Explora One Piece, Frieren y mas</h2>
          <p>
            Descubre mangas y animes populares como One Piece y Frieren, junto a
            nuevas series para maratonear.
          </p>
        </article>
        <article>
          <h2>Tu biblioteca TMO en un solo lugar</h2>
          <p>
            Guarda favoritos y retoma tu manga donde te quedaste, todo dentro de
            una sola app.
          </p>
        </article>
      </section>

      <section id="descarga" className="download">
        <div className="download-copy">
          <h2>Descarga TMO Manga ahora</h2>
          <p>
            Escanea el QR para descargar la app de manga y anime. Empieza a leer
            One Piece, Frieren y tus titulos favoritos hoy mismo.
          </p>
          <a
            className="button"
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
          >
            Descargar ahora
          </a>
        </div>
        <div className="qr-card">
          <img
            src={qrUrl}
            alt="QR para descargar la app"
            width={220}
            height={220}
          />
        </div>
      </section>

      <section id="contacto" className="contact">
        <h2>Contacto TMO Manga</h2>
        <p>
          Para soporte, colaboraciones o consultas sobre TMO, Manga y Anime,
          escribenos a{" "}
          <a href="mailto:tmomangasupport@gmail.com">
            tmomangasupport@gmail.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
