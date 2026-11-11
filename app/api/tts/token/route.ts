import { NextResponse } from "next/server";
import { checkRateLimit } from "@vercel/firewall";
import { isAllowedOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (
    !isAllowedOrigin(
      origin,
      request.url,
      process.env.NODE_ENV === "development",
    )
  )
    return NextResponse.json(
      { error: "Cross-origin token requests are not allowed." },
      { status: 403 },
    );
  if (process.env.VERCEL) {
    try {
      // A shared bucket limits public issuance across visitors. Vercel counts per region.
      const limit = await checkRateLimit("secondvoice-public-sessions", {
        request,
        rateLimitKey: "secondvoice-public",
        timeout: 3000,
      });
      if (limit.error) throw new Error("Voice allowance could not be checked.");
      if (limit.rateLimited)
        return NextResponse.json(
          {
            error:
              "The shared live demo allowance is used for this hour. Please try again later, or explore the recorded walkthrough.",
          },
          {
            status: 429,
            headers: { "Retry-After": "3600", "Cache-Control": "no-store" },
          },
        );
    } catch {
      return NextResponse.json(
        {
          error:
            "Live voice is temporarily unavailable. Please retry shortly. The recorded walkthrough is still available.",
        },
        { status: 503 },
      );
    }
  }
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "AssemblyAI is not configured yet.",
        action:
          "Live voice is temporarily unavailable. Your draft is safe in this tab. You can show it on screen or listen to the recorded example.",
      },
      { status: 503 },
    );
  }

  const url = new URL("https://token.us.assemblyai.com/v1/token");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        product: "tts",
        expires_in_seconds: 30,
        max_session_duration_seconds: 60,
        access: {
          streaming: { enabled: false },
          speech_to_speech: { enabled: false },
          sync: { enabled: false },
          dictation: { enabled: false },
          llm_gateway: { enabled: false },
          tts: { enabled: true },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    const payload = (await response.json()) as {
      token?: string;
      detail?: string;
    };

    if (!response.ok || !payload.token) {
      return NextResponse.json(
        {
          error:
            payload.detail ?? `Token request failed with ${response.status}.`,
        },
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
