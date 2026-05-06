import { NextResponse } from "next/server";
import { buildSourceUrl, fetchJsonWithRetry } from "../../../../src/lib/server/manga-source";
import { jsonError } from "../../../../src/lib/server/api";

export async function GET() {
  try {
    const data = await fetchJsonWithRetry(buildSourceUrl("/listas"), "listas de mangas");
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Error cargando listas de manga",
      502,
    );
  }
}
