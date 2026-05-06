import { NextResponse } from "next/server";
import { readAccessTokenCookie } from "./cookies";
import { getAuthenticatedUser } from "./supabase";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUserFromCookie() {
  const accessToken = await readAccessTokenCookie();
  if (!accessToken) {
    throw new Error("No autenticado");
  }
  const user = await getAuthenticatedUser(accessToken);
  return { user, accessToken };
}
