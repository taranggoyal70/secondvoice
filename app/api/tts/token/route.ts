import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "AssemblyAI is not configured yet.",
        action: "Set ASSEMBLYAI_API_KEY in .env.local with a newly rotated key.",
      },
      { status: 503 },
    );
  }

  const url = new URL("https://token.us.assemblyai.com/v1/token");
  url.search = new URLSearchParams({
    product: "tts",
    expires_in_seconds: "60",
    max_session_duration_seconds: "600",
  }).toString();

  try {
    const response = await fetch(url, {
      headers: { Authorization: apiKey },
      cache: "no-store",
    });

    const payload = (await response.json()) as { token?: string; detail?: string };

    if (!response.ok || !payload.token) {
      return NextResponse.json(
        { error: payload.detail ?? `Token request failed with ${response.status}.` },
        { status: response.status || 502 },
      );
    }

    return NextResponse.json(
      { token: payload.token, expiresInSeconds: 60 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach AssemblyAI's token service." },
      { status: 502 },
    );
  }
}
