import { cookies } from "next/headers";

const ACCESS_COOKIE = "tm_access_token";
const REFRESH_COOKIE = "tm_refresh_token";

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function readAccessTokenCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function writeSessionCookies(payload: {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number;
}): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, payload.accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: payload.expiresIn ?? 60 * 60 * 24 * 7,
  });
  if (payload.refreshToken) {
    store.set(REFRESH_COOKIE, payload.refreshToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
