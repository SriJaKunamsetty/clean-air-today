import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/adviceService", () => ({ createPlan: vi.fn() }));
import { createPlan } from "@/lib/adviceService";
import { UpstreamError } from "@/lib/airQuality";

const valid = { city: "Delhi", groups: [], commute: "car", cooking: "gas", heating: "none", hasPurifier: false };
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://x.test/api/advice", {
    method: "POST",
    headers: { "content-type": "application/json", host: "x.test", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

async function load() {
  return (await import("@/app/api/advice/route")).POST;
}

describe("POST /api/advice", () => {
  beforeEach(() => {
    vi.mocked(createPlan).mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns a plan with no-store caching", async () => {
    vi.mocked(createPlan).mockResolvedValue({
      reading: { place: "Delhi", aqi: 150, pm25: 1, observedAt: "" },
      advice: {} as never,
      summary: null,
    });
    const res = await (await load())(post(valid));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
  it("rejects cross-origin, wrong content type, bad JSON, oversize and invalid input", async () => {
    const POST = await load();
    expect((await POST(post(valid, { origin: "https://evil.com" }))).status).toBe(403);
    expect((await POST(post(valid, { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(post("{"))).status).toBe(400);
    expect((await POST(post({ ...valid, city: "x".repeat(3000) }))).status).toBe(413);
    expect((await POST(post({ ...valid, city: "<b>" }))).status).toBe(422);
    expect(createPlan).not.toHaveBeenCalled();
  });
  it("maps unknown city to 404 and upstream failures to 502/500", async () => {
    const POST = await load();
    vi.mocked(createPlan).mockResolvedValueOnce(null);
    expect((await POST(post(valid))).status).toBe(404);
    vi.mocked(createPlan).mockRejectedValueOnce(new UpstreamError("x"));
    expect((await POST(post(valid))).status).toBe(502);
    vi.mocked(createPlan).mockRejectedValueOnce(new Error("x"));
    expect((await POST(post(valid))).status).toBe(500);
  });
  it("rate limits repeated callers", async () => {
    const POST = await load();
    vi.mocked(createPlan).mockResolvedValue(null);
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++)
      statuses.push((await POST(post(valid, { "x-vercel-forwarded-for": "7.7.7.7" }))).status);
    expect(statuses.at(-1)).toBe(429);
  });
});
