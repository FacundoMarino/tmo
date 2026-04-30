import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* SEO principal */}
        <title>Leer Manga Online Gratis en Español | TMO Manga</title>
        <meta
          name="description"
          content="Lee manga online gratis en español. One Piece, Frieren, Berserk y miles de títulos más en TMO Manga. Descarga la app y lee sin límites."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://tmomanga.xyz/" />

        {/* Open Graph (WhatsApp, redes sociales) */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tmomanga.xyz/" />
        <meta
          property="og:title"
          content="Leer Manga Online Gratis en Español | TMO Manga"
        />
        <meta
          property="og:description"
          content="Lee One Piece, Frieren y miles de mangas gratis en español. Descarga TMO Manga ahora."
        />
        <meta property="og:image" content="https://tmomanga.xyz/og-image.jpg" />
        <meta property="og:locale" content="es_ES" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Leer Manga Online Gratis | TMO Manga"
        />
        <meta
          name="twitter:description"
          content="Lee One Piece, Frieren y miles de mangas gratis en español."
        />
        <meta
          name="twitter:image"
          content="https://tmomanga.xyz/og-image.jpg"
        />

        {/* Schema.org (datos estructurados para Google) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TMO Manga",
  "url": "https://tmomanga.xyz/",
  "description": "Lee manga online gratis en español. One Piece, Frieren y más.",
  "inLanguage": "es",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://tmomanga.xyz/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}`,
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
