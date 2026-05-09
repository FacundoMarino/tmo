"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "../../features/auth/hooks/useSession";
import { LoadingSpinner } from "./LoadingSpinner";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, user, signOut, loading } = useSession();

  const onLogout = async () => {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="webapp">
      <header className="webapp-header">
        <Link className="brand" href="/">
          TMO Manga
        </Link>
        <nav className="webapp-nav">
          <Link data-active={pathname === "/"} href="/">
            Inicio
          </Link>
          <Link
            data-active={pathname.startsWith("/favorites")}
            href="/favorites"
          >
            Favoritos
          </Link>
          <Link data-active={pathname.startsWith("/history")} href="/history">
            Historial
          </Link>
          <Link data-active={pathname.startsWith("/landing")} href="/landing">
            App
          </Link>
        </nav>
        <div className="session-pill">
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : authenticated ? (
            <>
              <span>{user?.email ?? "Usuario"}</span>
              <button onClick={onLogout}>Salir</button>
            </>
          ) : (
            <Link href="/auth/login">Log in</Link>
          )}
        </div>
      </header>
      <main className="webapp-main">{children}</main>
    </div>
  );
}
