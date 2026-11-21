/** Open-Meteo geocoding + air quality APIs (free, no key). */
const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const AIR = "https://air-quality-api.open-meteo.com/v1/air-quality";
const TIMEOUT_MS = 5000;

export interface Reading {
  place: string;
  aqi: number;
  pm25: number | null;
  observedAt: string;
}

export class UpstreamError extends Error {}

async function getJson(url: URL): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 600 } });
  if (!res.ok) throw new UpstreamError(`Upstream returned ${res.status}`);
  return res.json();
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function fetchReading(city: string): Promise<Reading | null> {
  const geoUrl = new URL(GEO);
  geoUrl.search = new URLSearchParams({ name: city, count: "1", format: "json" }).toString();
  const geo = (await getJson(geoUrl)) as { results?: { name: string; country?: string; latitude: number; longitude: number }[] };
  const hit = geo.results?.[0];
  if (!hit) return null;

  const airUrl = new URL(AIR);
  airUrl.search = new URLSearchParams({
    latitude: String(hit.latitude), longitude: String(hit.longitude), current: "us_aqi,pm2_5",
  }).toString();
  const air = (await getJson(airUrl)) as { current?: { time?: string; us_aqi?: unknown; pm2_5?: unknown } };
  const aqi = num(air.current?.us_aqi);
  if (aqi === null) throw new UpstreamError("No AQI reading available");
  return {
    place: [hit.name, hit.country].filter(Boolean).join(", "),
    aqi: Math.round(aqi),
    pm25: num(air.current?.pm2_5),
    observedAt: air.current?.time ?? "",
  };
}
