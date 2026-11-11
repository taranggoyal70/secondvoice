import { guardAIRequest } from "@/lib/api-guard";
import { parseReplyInput, parseReplies, REPLY_INSTRUCTIONS } from "@/lib/replies";

export const runtime = "nodejs";
export async function POST(request: Request) {
  let input;
  try {
    if (Number(request.headers.get("content-length")) > 4096) throw new Error("Question is too long.");
    const raw = await request.text();
    if (raw.length > 4096) throw new Error("Question is too long.");
    input = parseReplyInput(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Enter a question up to 700 characters and choose a supported language." }, { status: 400 });
  }
  const blocked = await guardAIRequest(request);
  if (blocked) return blocked;
  try {
    const response = await fetch("https://llm-gateway.assemblyai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: process.env.ASSEMBLYAI_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "qwen3.5-4b-32k-fast", messages: [
        { role: "system", content: REPLY_INSTRUCTIONS },
        { role: "user", content: JSON.stringify(input) },
      ], max_tokens: 350, temperature: 0.3 }),
      cache: "no-store", signal: AbortSignal.any([request.signal, AbortSignal.timeout(20000)]),
    });
    if (!response.ok) throw new Error("Provider unavailable");
    const data = await response.json();
    return Response.json({ replies: parseReplies(data.choices?.[0]?.message?.content) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Suggestions couldn’t load. Try again, or write your own reply below." }, { status: 502 });
  }
}
