import { NextRequest, NextResponse } from "next/server";
import { fetchBackendSearchCandidates } from "../../../src/lib/server/manga-source";
import { jsonError } from "../../../src/lib/server/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  /** Sin forzar minusculas: la API Mangadex trata `title` como el usuario escribe el titulo. */
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const includeAdult = request.nextUrl.searchParams.get("includeAdult") ?? "true";
  const showSinPortada = request.nextUrl.searchParams.get("showSinPortada") ?? "false";
  const takeParam = Number.parseInt(request.nextUrl.searchParams.get("take") ?? "120", 10);
  const take = Number.isFinite(takeParam) && takeParam > 0 ? Math.min(takeParam, 200) : 120;
  if (!query) {
    return NextResponse.json({ items: [] });
  }
  try {
    const items = await fetchBackendSearchCandidates(query, includeAdult, showSinPortada, take);
    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Error en búsqueda", 502);
  }
}
