import { NextRequest, NextResponse } from "next/server";
import { buildSourceUrl, fetchJsonWithRetry } from "../../../../../../../src/lib/server/manga-source";
import { jsonError } from "../../../../../../../src/lib/server/api";

type Context = { params: Promise<{ mangaId: string; chapterId: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { mangaId, chapterId } = await context.params;
  if (!mangaId || !chapterId) {
    return jsonError("mangaId y chapterId son requeridos.", 400);
  }
  try {
    const data = await fetchJsonWithRetry(
      buildSourceUrl(
        `/series-locales/${encodeURIComponent(mangaId)}/capitulos/${encodeURIComponent(chapterId)}/paginas`,
      ),
      "paginas del capitulo",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Error cargando páginas del capítulo",
      502,
    );
  }
}
