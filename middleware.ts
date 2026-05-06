import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/favorites", "/history"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((segment) => path.startsWith(segment));
  if (!isProtected) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("tm_access_token")?.value;
  if (!accessToken) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/favorites/:path*", "/history/:path*"],
};
