import { NextRequest, NextResponse } from "next/server";
import { writeSessionCookies } from "../../../../src/lib/server/cookies";
import { createServerSupabaseClient } from "../../../../src/lib/server/supabase";
import { jsonError } from "../../../../src/lib/server/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (!email || !password) {
      return jsonError("Email y contraseña son obligatorios.", 400);
    }

    const client = createServerSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return jsonError(error?.message ?? "No se pudo iniciar sesión.", 401);
    }

    await writeSessionCookies({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    });

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch {
    return jsonError("Error interno al iniciar sesión.", 500);
  }
}
