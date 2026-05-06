import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../src/lib/server/supabase";
import { writeSessionCookies } from "../../../../src/lib/server/cookies";
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
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/confirm`,
      },
    });

    if (error) {
      return jsonError(error.message, 400);
    }

    if (data.session?.access_token) {
      await writeSessionCookies({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      });
    }

    return NextResponse.json({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
          }
        : null,
      needsEmailConfirmation: !data.session,
    });
  } catch {
    return jsonError("Error interno al registrar usuario.", 500);
  }
}
