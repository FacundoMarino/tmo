"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register } from "../../../src/features/auth/services/webAuthApi";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const result = await register(email, password);
      if (result.needsEmailConfirmation) {
        setMessage(
          "Te enviamos un email de confirmación. Cuando confirmes, vuelve aquí e inicia sesión.",
        );
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Crear cuenta</h1>
        {error ? <p className="error-text">{error}</p> : null}
        {message ? <p>{message}</p> : null}
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
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
        <p>
          ¿Ya tienes cuenta? <Link href="/auth/login">Iniciar sesión</Link>
        </p>
      </form>
    </main>
  );
}
