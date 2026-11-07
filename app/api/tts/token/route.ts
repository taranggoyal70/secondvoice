import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Cross-origin token requests are not allowed." }, { status: 403 });
  const code = process.env.DEMO_ACCESS_CODE;
  if (process.env.VERCEL && !code) return NextResponse.json({ error: "Live demo access is not configured. Recorded audio remains available." }, { status: 503 });
  if (code) {
    const supplied = Buffer.from(request.headers.get("x-demo-access") ?? "");
    const expected = Buffer.from(code);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ error: "Enter the judge access code to use live voice." }, { status: 401 });
  }
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "AssemblyAI is not configured yet.",
        action: "Live voice is not configured on this server. Set ASSEMBLYAI_API_KEY in .env.local and restart. The walkthrough is available without a key.",
      },
      { status: 503 },
    );
  }

  const url = new URL("https://token.us.assemblyai.com/v1/token");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ product: "tts", expires_in_seconds: 30, max_session_duration_seconds: 60, access: { streaming: { enabled: false }, speech_to_speech: { enabled: false }, sync: { enabled: false }, dictation: { enabled: false }, llm_gateway: { enabled: false }, tts: { enabled: true } } }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    const payload = (await response.json()) as { token?: string; detail?: string };

    if (!response.ok || !payload.token) {
      return NextResponse.json(
        { error: payload.detail ?? `Token request failed with ${response.status}.` },
        { status: response.status || 502 },
      );
    }

    return NextResponse.json(
      { token: payload.token, expiresInSeconds: 30 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach AssemblyAI's token service." },
      { status: 502 },
    );
  }
}
