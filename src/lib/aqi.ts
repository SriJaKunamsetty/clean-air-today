/** US EPA AQI bands: https://www.airnow.gov/aqi/aqi-basics/ */
export type BandId = "good" | "moderate" | "sensitive" | "unhealthy" | "very-unhealthy" | "hazardous";

export interface AqiBand {
  readonly id: BandId;
  readonly label: string;
  readonly max: number;
}

const BANDS: readonly AqiBand[] = [
  { id: "good", label: "Good", max: 50 },
  { id: "moderate", label: "Moderate", max: 100 },
  { id: "sensitive", label: "Unhealthy for sensitive groups", max: 150 },
  { id: "unhealthy", label: "Unhealthy", max: 200 },
  { id: "very-unhealthy", label: "Very unhealthy", max: 300 },
  { id: "hazardous", label: "Hazardous", max: Infinity },
];

export function bandFor(aqi: number): AqiBand {
  if (!Number.isFinite(aqi) || aqi < 0) throw new RangeError("AQI must be a non-negative finite number");
  return BANDS.find((b) => aqi <= b.max) ?? BANDS[BANDS.length - 1]!;
}

/** Index of the band (0-5); used for severity comparisons. */
export const severity = (aqi: number): number => BANDS.findIndex((b) => b.id === bandFor(aqi).id);
