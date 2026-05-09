type LoadingSpinnerProps = {
  /** Ocupa ancho completo y separa verticalmente (listas, lectura). */
  block?: boolean;
  /** Variante pequeña (navbar, pills). */
  size?: "sm" | "md";
  className?: string;
};

export function LoadingSpinner({ block, size = "md", className }: LoadingSpinnerProps) {
  const wrapperClass = [
    "loading-spinner",
    size === "sm" ? "loading-spinner--sm" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <span className={wrapperClass} role="status" aria-live="polite" aria-label="Cargando">
      <span className="loading-spinner__ring" aria-hidden />
    </span>
  );

  if (block) {
    return <div className="loading-spinner-block">{inner}</div>;
  }
  return inner;
}
