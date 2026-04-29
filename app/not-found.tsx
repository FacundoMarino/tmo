export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily: "Inter, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Pagina no encontrada</h1>
        <p style={{ color: "#94a3b8" }}>
          Vuelve al inicio para seguir explorando manga online.
        </p>
        <a href="/" style={{ color: "#38bdf8", fontWeight: 700 }}>
          Ir al inicio
        </a>
      </div>
    </main>
  );
}
