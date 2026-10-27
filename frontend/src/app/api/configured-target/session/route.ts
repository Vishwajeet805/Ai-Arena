import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ detail: "Invalid request origin." }, { status: 403 });
  }

  const expectedPassword = process.env.ARENA_UI_ACCESS_PASSWORD ?? "";
  const sessionToken = process.env.ARENA_UI_SESSION_TOKEN ?? "";
  if (expectedPassword.length < 16 || sessionToken.length < 32) {
    return NextResponse.json(
      { detail: "Configured-model UI access is not configured on the web server." },
      { status: 503 },
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ detail: "Invalid request body." }, { status: 400 });
  }

  if (!sameSecret(password, expectedPassword)) {
    return NextResponse.json({ detail: "Configured-model access password is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("arena_configured_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/configured-target",
    maxAge: 60 * 60,
  });
  return response;
}
