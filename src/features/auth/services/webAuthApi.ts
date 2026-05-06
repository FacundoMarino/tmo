type AuthUser = { id: string; email?: string | null };

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? (data.error as string)
        : "Error de autenticacion";
    throw new Error(message);
  }
  return data as T;
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parse<{ user: AuthUser }>(res);
}

export async function register(email: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parse<{ user: AuthUser | null; needsEmailConfirmation: boolean }>(res);
}

export async function logout() {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  return parse<{ ok: true }>(res);
}

export async function getSession() {
  const res = await fetch("/api/auth/session", { cache: "no-store" });
  if (res.status === 401) {
    return { authenticated: false as const, user: null };
  }
  return parse<{ authenticated: true; user: AuthUser }>(res);
}
