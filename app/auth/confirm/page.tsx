"use client";

import { useEffect, useMemo, useState } from "react";

const appDeepLink =
  process.env.NEXT_PUBLIC_APP_DEEPLINK ?? "tmomanga://auth/callback";

function buildTargetDeepLink() {
  if (typeof window === "undefined") {
    return appDeepLink;
  }

  const query = window.location.search;
  const hash = window.location.hash;
  return `${appDeepLink}${query}${hash}`;
}

export default function ConfirmRedirectPage() {
  const [hasRedirected, setHasRedirected] = useState(false);
  const targetUrl = useMemo(() => buildTargetDeepLink(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasRedirected(true);
      window.location.replace(targetUrl);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [targetUrl]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at top, #172554 0%, #0f172a 40%, #020617 100%)",
        color: "#f8fafc",
        fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 560,
          width: "100%",
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 12 }}>
          Email confirmado en TMO Manga
        </h1>
        <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
          {hasRedirected
            ? "Abriendo la app..."
            : "Estamos validando tu confirmacion y redirigiendo a la app."}
        </p>
        <a
          href={targetUrl}
          style={{
            display: "inline-block",
            marginTop: 8,
            textDecoration: "none",
            color: "#022c43",
            fontWeight: 700,
            background: "linear-gradient(180deg, #67e8f9, #38bdf8)",
            borderRadius: 12,
            padding: "12px 16px",
          }}
        >
          Abrir app manualmente
        </a>
      </section>
    </main>
  );
}
