import Image from "next/image";
import Link from "next/link";

const downloadUrl =
  process.env.NEXT_PUBLIC_DOWNLOAD_URL ?? "https://example.com/descargar-app";
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
  downloadUrl,
)}`;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tmomanga.xyz";

const IMG = {
  hero: "/Imagen_lading_header.png",
  card1: "/Imagen_card 1.png",
  card2: "/Imagen_card 2.png",
  card3: "/Imagen_card 3.png",
  preview: "/Imagen_card_vista previa.png",
  download: "/card_comunidad.png",
  mock1: "/Mockup_app 1.png",
  mock2: "/Mockup_app 2.png",
  mock3: "/Mockuo_app 3.png",
} as const;

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v12m0 0l4-4m-4 4L8 11M5 19h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLinkIcon() {
  return (
    <span className="landing-feature-link-icon" aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10 12h5m0 0l-2.5-2.5M15 12l-2.5 2.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M3 7l9 6 9-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 3v6c0 5-3.5 9-8 9s-8-4-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LandingPage() {
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

      <header className="landing-nav">
        <Link href="/landing" className="landing-nav-logo">
          <Image
            src="/logo.png"
            alt="tmo MANGA"
            width={110}
            height={44}
            priority
          />
        </Link>
        <nav className="landing-nav-links" aria-label="Landing">
          <a href="#inicio" data-active="true">
            Inicio
          </a>
          <Link href="/">Explorar</Link>
          <a href="#capturas">Vista previa</a>
          <a href="#contacto">Comunidad</a>
        </nav>
        <a className="landing-btn landing-btn--sm" href={downloadUrl}>
          <DownloadIcon />
          Descargar la app
        </a>
      </header>

      <section id="inicio" className="landing-hero">
        <Image
          className="landing-hero-bg"
          src={IMG.hero}
          alt=""
          fill
          priority
          sizes="(max-width: 1289px) 100vw, 1289px"
        />
        <div className="landing-hero-overlay" aria-hidden />
        <div className="landing-hero-content">
          <span className="landing-pill">Tu próximo manga empieza acá</span>
          <h1 className="landing-hero-title">
            Leé. Guardá. Maratoneá. <em>Repetí.</em>
          </h1>
          <p className="landing-hero-text">
            La <em>app</em>{" "}
            definitiva para leer manga, guardar tus favoritos y continuar cada
            capítulo donde lo dejaste.
          </p>
          <Link className="landing-btn" href="/">
            <DownloadIcon />
            Entrar a TMO
          </Link>
        </div>
      </section>

      <section className="landing-features" aria-label="Beneficios">
        <article className="landing-feature-card">
          <Image
            className="landing-feature-bg"
            src={IMG.card1}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 33vw"
          />
          <div className="landing-feature-overlay" aria-hidden />
          <div className="landing-feature-content">
            <h2>
              Lee <em>manga</em> online con estilo anime
            </h2>
            <p>
              Disfruta una lectura fluida en TMO Manga, pensada para fans de
              anime y manga en español.
            </p>
            <Link className="landing-feature-link" href="/">
              Continuar leyendo
              <ArrowLinkIcon />
            </Link>
          </div>
        </article>

        <article className="landing-feature-card">
          <Image
            className="landing-feature-bg"
            src={IMG.card2}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 33vw"
          />
          <div className="landing-feature-overlay" aria-hidden />
          <div className="landing-feature-content">
            <h2>
              Explora <em>One Piece, Frieren</em> y más
            </h2>
            <p>
              Descubre mangas y animes populares como One Piece y Frieren, junto
              a nuevas series para maratonear.
            </p>
            <Link className="landing-feature-link" href="/">
              Explorar ahora
              <ArrowLinkIcon />
            </Link>
          </div>
        </article>

        <article className="landing-feature-card">
          <Image
            className="landing-feature-bg"
            src={IMG.card3}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 33vw"
          />
          <div className="landing-feature-overlay" aria-hidden />
          <div className="landing-feature-content">
            <h2>
              Tu biblioteca <em>TMO</em> en un solo lugar
            </h2>
            <p>
              Guarda favoritos y retoma tu manga donde lo quedaste, todo dentro
              de una sola App.
            </p>
            <Link className="landing-feature-link" href="/favorites">
              Ir a mi biblioteca
              <ArrowLinkIcon />
            </Link>
          </div>
        </article>
      </section>

      <section
        id="capturas"
        className="landing-preview"
        aria-label="Vista previa de la app"
      >
        <Image
          className="landing-preview-bg"
          src={IMG.preview}
          alt=""
          fill
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
        <div className="landing-preview-overlay" aria-hidden />
        <div className="landing-preview-inner">
          <div className="landing-mockups" aria-hidden>
            <div className="landing-mockup-slot landing-mockup-slot--left">
              <Image
                className="landing-mockup-img"
                src={IMG.mock1}
                alt=""
                fill
                sizes="(max-width: 900px) 40vw, 220px"
              />
            </div>
            <div className="landing-mockup-slot landing-mockup-slot--right">
              <Image
                className="landing-mockup-img"
                src={IMG.mock3}
                alt=""
                fill
                sizes="(max-width: 900px) 40vw, 220px"
              />
            </div>
            <div className="landing-mockup-slot landing-mockup-slot--center">
              <Image
                className="landing-mockup-img"
                src={IMG.mock2}
                alt=""
                fill
                priority
                sizes="(max-width: 900px) 48vw, 260px"
              />
            </div>
          </div>
          <div className="landing-preview-copy">
            <h2>
              Un adelanto de <em>TMO Manga</em>
            </h2>
            <p>
              Mirá cómo se ve la app antes de descargarla. Diseño limpio,
              lectura cómoda y acceso rápido a tus mangas favoritos.
            </p>
            <ul className="landing-checklist">
              <li>
                <CheckIcon />
                Biblioteca organizada para continuar donde lo quedaste.
              </li>
              <li>
                <CheckIcon />
                Lectura fluida en vertical con buena legibilidad.
              </li>
              <li>
                <CheckIcon />
                Exploración rápida para descubrir nuevas historias en segundos.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="descarga" className="landing-download">
        <Image
          className="landing-download-bg"
          src={IMG.download}
          alt=""
          fill
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
        <div className="landing-download-overlay" aria-hidden />
        <div className="landing-download-inner">
          <div className="landing-download-copy">
            <span className="landing-pill">
              Llevá TMO a todas partes con vos
            </span>
            <h2>
              Descarga <em>TMO Manga</em> ahora
            </h2>
            <p>
              Escaneá el QR para descargar la app de manga y anime. Empezá a
              leer One Piece, Frieren y tus títulos favoritos hoy mismo.
            </p>
            <a
              className="landing-btn"
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
            >
              <DownloadIcon />
              Entrar a TMO
            </a>
            <div className="landing-download-perks">
              <span>
                <BoltIcon />
                Rápida y ligera
              </span>
              <span>
                <ShieldIcon />
                Segura y confiable
              </span>
              <span>
                <GearIcon />
                Actualizaciones constantes
              </span>
            </div>
          </div>
          <div className="landing-qr-wrap">
            <div className="landing-qr-frame">
              <img
                src={qrUrl}
                alt="QR para descargar la app"
                width={220}
                height={220}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="landing-contact">
        <div className="landing-contact-copy">
          <h2>
            Contacto <em>TMO Manga</em>
          </h2>
          <p>
            Para soporte, colaboraciones o consultas sobre TMO, Manga y Anime,
            escribinos cuando quieras.
          </p>
        </div>
        <a
          className="landing-contact-email"
          href="mailto:tmomangasupport@gmail.com"
        >
          <MailIcon />
          tmomangasupport@gmail.com
        </a>
      </section>
    </main>
  );
}
