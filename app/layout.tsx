import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tmomanga.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/Logo_tmo.png",
    shortcut: "/Logo_tmo.png",
    apple: "/Logo_tmo.png",
  },
  title: {
    default: "TMO Manga y Anime | Lee One Piece, Frieren y mas",
    template: "%s | TMO Manga",
  },
  description:
    "TMO Manga es tu app para leer manga y seguir anime: descubre One Piece, Frieren y muchos titulos populares en una experiencia rapida y comoda.",
  keywords: [
    "TMO",
    "TMO Manga",
    "Manga",
    "Anime",
    "One Piece",
    "Frieren",
    "leer manga online",
    "app manga",
    "manga en espanol",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TMO Manga y Anime | One Piece, Frieren y mas",
    description:
      "Descarga TMO Manga para leer manga online y descubrir anime como One Piece y Frieren.",
    url: "/",
    siteName: "TMO Manga",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TMO Manga y Anime",
    description:
      "Lee manga online con TMO Manga. Sigue One Piece, Frieren y tus series favoritas.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
