import { NextRequest, NextResponse } from "next/server";
import { SERVER_ENV } from "../../../src/lib/config";
import { createServerSupabaseClient } from "../../../src/lib/server/supabase";
import { jsonError, requireUserFromCookie } from "../../../src/lib/server/api";

export async function GET() {
  try {
    const { user, accessToken } = await requireUserFromCookie();
    const client = createServerSupabaseClient(accessToken);
    const { data, error } = await client
      .from(SERVER_ENV.HISTORY_TABLE)
      .select("manga_id,chapter_id,chapter_number,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      return jsonError(error.message, 500);
    }
    return NextResponse.json({ items: data ?? [] });
  } catch {
    return jsonError("No autenticado", 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, accessToken } = await requireUserFromCookie();
    const body = (await request.json()) as {
      mangaId?: string;
      chapterId?: string | number;
      chapterNumber?: number;
    };
    if (!body.mangaId || !body.chapterId || !body.chapterNumber) {
      return jsonError("mangaId, chapterId y chapterNumber son requeridos", 400);
    }
    const client = createServerSupabaseClient(accessToken);
    const { error } = await client.from(SERVER_ENV.HISTORY_TABLE).upsert(
      {
        user_id: user.id,
        manga_id: body.mangaId,
        chapter_id: body.chapterId,
        chapter_number: body.chapterNumber,
      },
      { onConflict: "user_id,manga_id", ignoreDuplicates: false },
    );
    if (error) {
      return jsonError(error.message, 500);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("No autenticado", 401);
  }
}
