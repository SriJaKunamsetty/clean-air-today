/** Open-Meteo geocoding and air-quality clients (free, no API key). */
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const TIMEOUT_MS = 5_000;
const CACHE_SECONDS = 600;

export interface Reading {
  readonly place: string;
  readonly aqi: number;
  readonly pm25: number | null;
  readonly observedAt: string;
}

/** Raised when the upstream service fails or returns data we cannot trust. */
export class UpstreamError extends Error {
  override readonly name = "UpstreamError";
}

type Fetcher = typeof fetch;
type Json = Record<string, unknown>;

const isRecord = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const finiteOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

async function getJson(url: URL, fetcher: Fetcher): Promise<unknown> {
  const init: RequestInit & { next: { revalidate: number } } = {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: CACHE_SECONDS },
  };
  const res = await fetcher(url, init);
  if (!res.ok) throw new UpstreamError(`Upstream responded with HTTP ${res.status}`);
  return res.json();
}

interface Place {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

/** Returns the best geocoding match, or null when the city is unknown. */
function parsePlace(json: unknown): Place | null {
  if (!isRecord(json) || !Array.isArray(json.results) || json.results.length === 0) return null;
  const hit: unknown = json.results[0];
  if (!isRecord(hit) || typeof hit.name !== "string") throw new UpstreamError("Malformed geocoding response");
  const latitude = finiteOrNull(hit.latitude);
  const longitude = finiteOrNull(hit.longitude);
  if (latitude === null || longitude === null) throw new UpstreamError("Malformed geocoding response");
  return { name: hit.name, country: typeof hit.country === "string" ? hit.country : undefined, latitude, longitude };
}

function parseCurrent(json: unknown): { aqi: number; pm25: number | null; time: string } {
  const current = isRecord(json) ? json.current : undefined;
  const aqi = isRecord(current) ? finiteOrNull(current.us_aqi) : null;
  if (!isRecord(current) || aqi === null) throw new UpstreamError("No AQI reading available");
  return {
    aqi: Math.max(0, Math.round(aqi)),
    pm25: finiteOrNull(current.pm2_5),
    time: typeof current.time === "string" ? current.time : "",
  };
}

/** Looks up a city and returns its current air quality, or null if the city is unknown. */
export async function fetchReading(city: string, fetcher: Fetcher = fetch): Promise<Reading | null> {
  const geoUrl = new URL(GEOCODING_URL);
  geoUrl.search = new URLSearchParams({ name: city, count: "1", format: "json" }).toString();
  const place = parsePlace(await getJson(geoUrl, fetcher));
  if (!place) return null;

  const airUrl = new URL(AIR_QUALITY_URL);
  airUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "us_aqi,pm2_5",
  }).toString();
  const current = parseCurrent(await getJson(airUrl, fetcher));

  return {
    place: [place.name, place.country].filter(Boolean).join(", "),
    aqi: current.aqi,
    pm25: current.pm25,
    observedAt: current.time,
  };
}
