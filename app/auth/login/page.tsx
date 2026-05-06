"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { login } from "../../../src/features/auth/services/webAuthApi";

export default function LoginPage() {
  const router = useRouter();
  const [urlError, setUrlError] = useState<string | null>(null);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    setUrlError(code);
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Iniciar sesión</h1>
        {urlError ? (
          <p className="error-text">
            No se pudo validar el enlace de confirmación.
          </p>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          type="password"
          required
        />
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Log in"}
        </button>
        <p>
          ¿No tienes cuenta? <Link href="/auth/register">Crear cuenta</Link>
        </p>
      </form>
    </main>
  );
}
