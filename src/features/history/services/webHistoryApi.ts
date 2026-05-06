export type HistoryItem = {
  manga_id: string;
  chapter_id: number;
  chapter_number: number;
  updated_at: string | null;
};

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | { error?: string } | null;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? (data.error as string)
        : "Error en historial";
    throw new Error(message);
  }
  return data as T;
}

export async function fetchHistory() {
  const res = await fetch("/api/history", { cache: "no-store" });
  if (res.status === 401) {
    return [] as HistoryItem[];
  }
  const data = await parse<{ items: HistoryItem[] }>(res);
  return data.items;
}

export async function upsertHistory(payload: {
  mangaId: string;
  chapterId: number;
  chapterNumber: number;
}) {
  const res = await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parse<{ ok: boolean }>(res);
}
