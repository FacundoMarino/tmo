import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../src/lib/server/supabase";
import { writeSessionCookies } from "../../../../src/lib/server/cookies";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_code", request.url));
  }

  const client = createServerSupabaseClient();
  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid_code", request.url));
  }

  await writeSessionCookies({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
  });

  return NextResponse.redirect(new URL("/", request.url));
}
