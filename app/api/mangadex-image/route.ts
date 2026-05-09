import { NextRequest, NextResponse } from "next/server";
import { isProxyableMangadexAssetUrl } from "../../../src/lib/server/mangadex-image-proxy";

export const runtime = "nodejs";

/**
 * Proxy de imagenes Mangadex (portadas y paginas). El navegador no debe pedir directo a *.mangadex.*.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("u");
  if (!raw) {
    return NextResponse.json({ error: "Parametro u requerido" }, { status: 400 });
  }

  let target: string;
  try {
    target = decodeURIComponent(raw);
  } catch {
    return NextResponse.json({ error: "URL invalida" }, { status: 400 });
  }

  if (!isProxyableMangadexAssetUrl(target)) {
    return NextResponse.json({ error: "Host no permitido" }, { status: 400 });
  }

  const ua =
    process.env.MANGA_DEX_USER_AGENT ??
    `Landing/${process.env.npm_package_version ?? "1.0.0"} (Vercel image proxy; MangaDex)`;

  try {
    const upstream = await fetch(target, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": ua,
      },
      redirect: "follow",
      next: { revalidate: 86_400 },
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
    }

    const body = await upstream.arrayBuffer();
    const headers = new Headers();
    const ct = upstream.headers.get("content-type") ?? "application/octet-stream";
    headers.set("Content-Type", ct);
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");
    const out = new NextResponse(body, { status: 200, headers });
    return out;
  } catch {
    return NextResponse.json({ error: "Error obteniendo imagen" }, { status: 502 });
  }
}
