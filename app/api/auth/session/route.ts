import { NextResponse } from "next/server";
import { requireUserFromCookie } from "../../../../src/lib/server/api";

export async function GET() {
  try {
    const { user } = await requireUserFromCookie();
    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, email: user.email },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
