import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../src/lib/server/supabase";
import { jsonError, requireUserFromCookie } from "../../../src/lib/server/api";

const FAVORITES_TABLE = "favorites";

export async function GET() {
  try {
    const { user, accessToken } = await requireUserFromCookie();
    const client = createServerSupabaseClient(accessToken);
    const { data, error } = await client
      .from(FAVORITES_TABLE)
      .select("manga_id,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }
    return NextResponse.json({
      items: (data ?? []).map((item) => item.manga_id),
    });
  } catch {
    return jsonError("No autenticado", 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, accessToken } = await requireUserFromCookie();
    const body = (await request.json()) as { mangaId?: string };
    if (!body.mangaId) {
      return jsonError("mangaId requerido", 400);
    }
    const client = createServerSupabaseClient(accessToken);
    const { error } = await client.from(FAVORITES_TABLE).upsert(
      {
        user_id: user.id,
        manga_id: body.mangaId,
      },
      { onConflict: "user_id,manga_id", ignoreDuplicates: true },
    );
    if (error) {
      return jsonError(error.message, 500);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("No autenticado", 401);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, accessToken } = await requireUserFromCookie();
    const mangaId = request.nextUrl.searchParams.get("mangaId");
    if (!mangaId) {
      return jsonError("mangaId requerido", 400);
    }
    const client = createServerSupabaseClient(accessToken);
    const { error } = await client
      .from(FAVORITES_TABLE)
      .delete()
      .eq("user_id", user.id)
      .eq("manga_id", mangaId);
    if (error) {
      return jsonError(error.message, 500);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("No autenticado", 401);
  }
}
