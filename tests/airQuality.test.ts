import { describe, expect, it, vi } from "vitest";
import { fetchReading, UpstreamError } from "@/lib/airQuality";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const geo = { results: [{ name: "Delhi", country: "India", latitude: 28.6, longitude: 77.2 }] };
const air = { current: { time: "2026-11-21T10:00", us_aqi: 212.4, pm2_5: 98.1 } };
const sequence = (...responses: Response[]) => {
  const fn = vi.fn();
  responses.forEach((r) => fn.mockResolvedValueOnce(r));
  return fn as unknown as typeof fetch;
};

describe("fetchReading", () => {
  it("returns a normalised reading", async () => {
    expect(await fetchReading("Delhi", sequence(json(geo), json(air)))).toEqual({
      place: "Delhi, India",
      aqi: 212,
      pm25: 98.1,
      observedAt: "2026-11-21T10:00",
    });
  });
  it("returns null for an unknown city", async () => {
    expect(await fetchReading("Nowhereville", sequence(json({})))).toBeNull();
    expect(await fetchReading("Nowhereville", sequence(json({ results: [] })))).toBeNull();
  });
  it("tolerates missing optional fields", async () => {
    const r = await fetchReading(
      "X",
      sequence(json({ results: [{ name: "X", latitude: 1, longitude: 2 }] }), json({ current: { us_aqi: 10 } })),
    );
    expect(r).toMatchObject({ place: "X", pm25: null, observedAt: "" });
  });
  it.each([
    ["HTTP failure", () => sequence(json({}, 503))],
    ["malformed place", () => sequence(json({ results: [{ name: 5 }] }))],
    ["missing coordinates", () => sequence(json({ results: [{ name: "X" }] }))],
    ["missing AQI", () => sequence(json(geo), json({ current: {} }))],
    ["non-object payload", () => sequence(json(geo), json("nope"))],
  ])("throws UpstreamError on %s", async (_name, make) => {
    await expect(fetchReading("Delhi", make())).rejects.toBeInstanceOf(UpstreamError);
  });
});
