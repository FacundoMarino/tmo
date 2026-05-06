import { NextRequest, NextResponse } from "next/server";
import { buildSourceUrl, fetchJsonWithRetry } from "../../../../src/lib/server/manga-source";
import { jsonError } from "../../../../src/lib/server/api";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const genre = request.nextUrl.searchParams.get("genre");
  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const pageSizeParam = Number(request.nextUrl.searchParams.get("pageSize") ?? "24");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(Math.floor(pageSizeParam), 48)
      : 24;
  if (!genre) {
    return jsonError("Parámetro genre requerido.", 400);
  }
  try {
    const encoded = encodeURIComponent(genre);
    const data = await fetchJsonWithRetry(
      buildSourceUrl(`/series-locales?genero=${encoded}&page=${page}&pageSize=${pageSize}`),
      `mangas del género ${genre}`,
    );
    return NextResponse.json({ items: data, page, pageSize });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Error cargando mangas por género",
      502,
    );
  }
}
