"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "../../features/auth/hooks/useSession";
import { LoadingSpinner } from "./LoadingSpinner";

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20L16.5 16.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a5 5 0 0 1 5 5v3.5l2 2.5H5l2-2.5V8a5 5 0 0 1 5-5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function displayNameFromEmail(email?: string | null): string {
  if (!email) return "Usuario";
  const local = email.split("@")[0] ?? email;
  const first = local.split(/[._-]/)[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function NavSearchButton() {
  const pathname = usePathname();

  const focusHomeSearch = () => {
    const el = document.getElementById("home-catalog-search");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement) {
      el.focus();
    }
  };

  if (pathname === "/") {
    return (
      <button
        type="button"
        className="nav-tool-btn"
        aria-label="Buscar manga"
        onClick={focusHomeSearch}
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <Link
      href="/#catalog-search"
      className="nav-tool-btn"
      aria-label="Buscar manga"
    >
      <SearchIcon />
    </Link>
  );
}

function UserMenu({
  displayName,
  initial,
  onLogout,
}: {
  displayName: string;
  initial: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className="nav-user-menu" ref={rootRef}>
      <button
        type="button"
        className="nav-user-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-user-avatar" aria-hidden>
          {initial}
        </span>
        <span className="nav-user-name">{displayName}</span>
        <ChevronDownIcon />
      </button>
      {open ? (
        <div className="nav-user-dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, user, signOut, loading } = useSession();

  const displayName = displayNameFromEmail(user?.email);
  const initial = displayName.charAt(0).toUpperCase();

  const onLogout = async () => {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="webapp">
      <header className="webapp-header">
        <Link className="brand brand--logo" href="/">
          <Image
            src="/logo.png"
            alt="tmo MANGA"
            width={120}
            height={48}
            priority
            className="brand-logo-img"
          />
        </Link>

        <div className="webapp-nav-pill">
          <nav className="webapp-nav" aria-label="Principal">
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

          <div className="webapp-nav-tools">
            <NavSearchButton />
            <button
              type="button"
              className="nav-tool-btn nav-tool-btn--notify"
              aria-label="Notificaciones"
            >
              <BellIcon />
              <span className="nav-notify-dot" aria-hidden />
            </button>

            {loading ? (
              <LoadingSpinner size="sm" />
            ) : authenticated ? (
              <UserMenu
                displayName={displayName}
                initial={initial}
                onLogout={onLogout}
              />
            ) : (
              <Link className="nav-login-link" href="/auth/login">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="webapp-main">{children}</main>
    </div>
  );
}
