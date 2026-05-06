import { NextRequest, NextResponse } from "next/server";
import { buildSourceUrl, fetchJsonWithRetry } from "../../../../src/lib/server/manga-source";
import { jsonError } from "../../../../src/lib/server/api";

type Context = { params: Promise<{ mangaId: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { mangaId } = await context.params;
  if (!mangaId) {
    return jsonError("mangaId requerido", 400);
  }
  try {
    const data = await fetchJsonWithRetry(
      buildSourceUrl(`/series-locales/${encodeURIComponent(mangaId)}`),
      "detalle del manga",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Error cargando detalle del manga",
      502,
    );
  }
}
