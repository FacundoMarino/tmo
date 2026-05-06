import { NextResponse } from "next/server";
import { clearSessionCookies, readAccessTokenCookie } from "../../../../src/lib/server/cookies";
import { createServerSupabaseClient } from "../../../../src/lib/server/supabase";

export async function POST() {
  const accessToken = await readAccessTokenCookie();
  if (accessToken) {
    const client = createServerSupabaseClient(accessToken);
    await client.auth.signOut();
  }

  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
