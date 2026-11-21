import { NextResponse } from "next/server";
import { buildAdvice } from "@/lib/advice";
import { fetchReading, UpstreamError } from "@/lib/airQuality";
import { summarise } from "@/lib/gemini";
import { createLimiter } from "@/lib/rateLimit";
import { parseProfile } from "@/lib/validate";

const MAX_BODY_BYTES = 2048;
const allow = createLimiter(20, 60_000);
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allow(ip)) return json({ error: "Too many requests. Please wait a minute." }, 429);

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "Request too large." }, 413);

  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON." }, 400); }

  const parsed = parseProfile(body);
  if (!parsed.ok) return json({ error: "Invalid input.", details: parsed.errors }, 422);

  try {
    const reading = await fetchReading(parsed.value.city);
    if (!reading) return json({ error: "We could not find that city. Try a nearby larger city." }, 404);
    const advice = buildAdvice(reading.aqi, parsed.value);
    const summary = await summarise(advice, reading.place);
    return json({ reading, advice, summary });
  } catch (e) {
    const status = e instanceof UpstreamError ? 502 : 500;
    return json({ error: "Live air data is unavailable right now. Please try again shortly." }, status);
  }
}
