import { NextRequest, NextResponse } from "next/server";
import { fetchBackendMangaDetail } from "../../../../src/lib/server/manga-source";
import { jsonError } from "../../../../src/lib/server/api";

export const runtime = "nodejs";

type Context = { params: Promise<{ mangaId: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { mangaId } = await context.params;
  if (!mangaId) {
    return jsonError("mangaId requerido", 400);
  }
  try {
    const data = await fetchBackendMangaDetail(mangaId);
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Error cargando detalle del manga",
      502,
    );
  }
}
