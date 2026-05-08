import { NextResponse } from "next/server";
import { fetchHomeMangaGenresPayload } from "../../../../src/lib/server/manga-source";
import { jsonError } from "../../../../src/lib/server/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await fetchHomeMangaGenresPayload();
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Error cargando géneros",
      502,
    );
  }
}
