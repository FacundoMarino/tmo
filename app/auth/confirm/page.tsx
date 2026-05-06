"use client";

import { useEffect } from "react";
import { useState } from "react";

export default function ConfirmRedirectPage() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    setCode(new URLSearchParams(window.location.search).get("code"));
  }, []);

  useEffect(() => {
    if (!code) {
      return;
    }
    window.location.replace(`/api/auth/confirm?code=${encodeURIComponent(code)}`);
  }, [code]);

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
          {code
            ? "Validando confirmación y creando sesión segura..."
            : "No encontramos un código válido en la URL de confirmación."}
        </p>
      </section>
    </main>
  );
}
