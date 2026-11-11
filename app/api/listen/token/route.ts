import { guardAIRequest } from "@/lib/api-guard";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const blocked = await guardAIRequest(request);
  if (blocked) return blocked;
  try {
    const response = await fetch("https://token.us.assemblyai.com/v1/token", {
      method: "POST",
      headers: { Authorization: process.env.ASSEMBLYAI_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({ product: "streaming", expires_in_seconds: 30, max_session_duration_seconds: 60,
        access: { streaming: { enabled: true }, tts: { enabled: false }, speech_to_speech: { enabled: false }, sync: { enabled: false }, dictation: { enabled: false }, llm_gateway: { enabled: false } },
      }),
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    const payload = await response.json();
    if (!response.ok || typeof payload.token !== "string") throw new Error("Token unavailable");
    return Response.json({ token: payload.token }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Listening couldn’t connect. Please try again or type the question." }, { status: 502 });
  }
}
