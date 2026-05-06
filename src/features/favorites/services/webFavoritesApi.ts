async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? (data.error as string)
        : "Error en favoritos";
    throw new Error(message);
  }
  return data as T;
}

export async function fetchFavorites() {
  const res = await fetch("/api/favorites", { cache: "no-store" });
  if (res.status === 401) {
    return [];
  }
  const data = await parse<{ items: string[] }>(res);
  return data.items;
}

export async function addFavorite(mangaId: string) {
  const res = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mangaId }),
  });
  return parse<{ ok: boolean }>(res);
}

export async function removeFavorite(mangaId: string) {
  const res = await fetch(`/api/favorites?mangaId=${encodeURIComponent(mangaId)}`, {
    method: "DELETE",
  });
  return parse<{ ok: boolean }>(res);
}
