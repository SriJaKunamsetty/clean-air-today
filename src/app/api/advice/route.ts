import { NextResponse } from "next/server";
import { createPlan } from "@/lib/adviceService";
import { UpstreamError } from "@/lib/airQuality";
import { clientIp, isJson, isSameOrigin, readJson } from "@/lib/http";
import { createLimiter } from "@/lib/rateLimit";
import { parseProfile } from "@/lib/validate";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const allow = createLimiter(RATE_LIMIT, RATE_WINDOW_MS);

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return reply({ error: "Cross-origin requests are not allowed." }, 403);
  if (!isJson(req.headers)) return reply({ error: "Content-Type must be application/json." }, 415);
  if (!allow(clientIp(req.headers))) return reply({ error: "Too many requests. Please wait a minute." }, 429);

  const body = await readJson(req);
  if (!body.ok) return reply({ error: body.errors[0] }, body.status ?? 400);

  const parsed = parseProfile(body.value);
  if (!parsed.ok) return reply({ error: "Invalid input.", details: parsed.errors }, 422);

  try {
    const plan = await createPlan(parsed.value);
    if (!plan) return reply({ error: "We could not find that city. Try a nearby larger city." }, 404);
    return reply(plan);
  } catch (error) {
    console.error(`advice_failed type=${error instanceof Error ? error.name : "unknown"}`);
    return reply(
      { error: "Live air data is unavailable right now. Please try again shortly." },
      error instanceof UpstreamError ? 502 : 500,
    );
  }
}
