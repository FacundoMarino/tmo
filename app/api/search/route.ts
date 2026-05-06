import { NextRequest, NextResponse } from "next/server";
import { buildSourceUrl, fetchJsonWithRetry } from "../../../src/lib/server/manga-source";
import { jsonError } from "../../../src/lib/server/api";

type SearchCandidate = {
  id: string | number;
  titulo: string;
  portadaUrl: string | null;
  descripcion: string | null;
  generos?: string | null;
};

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const includeAdult = request.nextUrl.searchParams.get("includeAdult") ?? "true";
  const showSinPortada = request.nextUrl.searchParams.get("showSinPortada") ?? "false";
  const take = request.nextUrl.searchParams.get("take") ?? "120";
  if (!query) {
    return NextResponse.json({ items: [] });
  }
  try {
    const data = await fetchJsonWithRetry<SearchCandidate[]>(
      buildSourceUrl(
        `/series-locales/search-candidates?q=${encodeURIComponent(query)}&includeAdult=${encodeURIComponent(includeAdult)}&showSinPortada=${encodeURIComponent(showSinPortada)}&take=${encodeURIComponent(take)}`,
      ),
      "resultados de busqueda",
    );
    const items = Array.isArray(data) ? data : [];
    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Error en búsqueda", 502);
  }
}
