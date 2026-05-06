import { NextResponse } from "next/server";
import { buildSourceUrl, fetchJsonWithRetry } from "../../../../src/lib/server/manga-source";
import { jsonError } from "../../../../src/lib/server/api";

export const runtime = "edge";

export async function GET() {
  try {
    const data = await fetchJsonWithRetry(
      buildSourceUrl("/series-locales/generos"),
      "generos de manga",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Error cargando géneros",
      502,
    );
  }
}
