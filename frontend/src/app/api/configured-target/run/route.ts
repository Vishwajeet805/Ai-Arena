import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ detail: "Invalid request origin." }, { status: 403 });
  }

  const sessionToken = process.env.ARENA_UI_SESSION_TOKEN ?? "";
  const backendToken = process.env.ARENA_CONFIGURED_TARGETS_TOKEN ?? "";
  const apiBase = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  if (sessionToken.length < 32 || backendToken.length < 32 || !apiBase.startsWith("https://")) {
    return NextResponse.json({ detail: "Configured-model server settings are incomplete." }, { status: 503 });
  }

  const cookieToken = request.cookies.get("arena_configured_session")?.value ?? "";
  if (cookieToken.length !== sessionToken.length || !cookieToken || !sessionToken) {
    return NextResponse.json({ detail: "Configured-model session expired. Run again and enter the access password." }, { status: 401 });
  }
  const { timingSafeEqual } = await import("node:crypto");
  if (!timingSafeEqual(Buffer.from(cookieToken), Buffer.from(sessionToken))) {
    return NextResponse.json({ detail: "Configured-model session expired. Run again and enter the access password." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || (body as { target_id?: unknown }).target_id !== "openai_compatible") {
    return NextResponse.json({ detail: "Only configured-model runs are accepted by this endpoint." }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${apiBase}/api/v1/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${backendToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });
    const contentType = upstream.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await upstream.json()
      : { detail: upstream.ok ? "Unexpected API response." : "Configured target request failed." };
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json({ detail: "Could not reach the configured AI Arena API." }, { status: 502 });
  }
}
