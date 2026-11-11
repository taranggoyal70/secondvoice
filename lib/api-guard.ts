import { checkRateLimit } from "@vercel/firewall";
import { isAllowedOrigin } from "@/lib/request-origin";

export async function guardAIRequest(request: Request) {
  if (!isAllowedOrigin(request.headers.get("origin"), request.url, process.env.NODE_ENV === "development"))
    return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  if (!process.env.ASSEMBLYAI_API_KEY)
    return Response.json({ error: "The conversation service is not configured." }, { status: 503 });
  if (process.env.VERCEL) {
    try {
      const limit = await checkRateLimit("secondvoice-public-sessions", {
        request, rateLimitKey: "secondvoice-public", timeout: 3000,
      });
      if (limit.error) throw new Error("Allowance unavailable");
      if (limit.rateLimited) return Response.json({ error: "The shared demo allowance is used for this hour. You can still type or show your message." }, { status: 429, headers: { "Retry-After": "3600" } });
    } catch {
      return Response.json({ error: "The conversation service is temporarily unavailable. Please try again." }, { status: 503 });
    }
  }
  return null;
}
