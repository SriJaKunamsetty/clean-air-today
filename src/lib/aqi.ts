/**
 * US EPA Air Quality Index bands.
 * @see https://www.airnow.gov/aqi/aqi-basics/
 */
export const Severity = {
  GOOD: 0,
  MODERATE: 1,
  SENSITIVE: 2,
  UNHEALTHY: 3,
  VERY_UNHEALTHY: 4,
  HAZARDOUS: 5,
} as const;

export type SeverityLevel = (typeof Severity)[keyof typeof Severity];
export type BandId = "good" | "moderate" | "sensitive" | "unhealthy" | "very-unhealthy" | "hazardous";

export interface AqiBand {
  readonly id: BandId;
  readonly label: string;
  /** Highest AQI value (inclusive) that belongs to this band. */
  readonly max: number;
  readonly severity: SeverityLevel;
}

/** Ordered from cleanest to worst; the last band is open-ended. */
export const BANDS: readonly AqiBand[] = [
  { id: "good", label: "Good", max: 50, severity: Severity.GOOD },
  { id: "moderate", label: "Moderate", max: 100, severity: Severity.MODERATE },
  { id: "sensitive", label: "Unhealthy for sensitive groups", max: 150, severity: Severity.SENSITIVE },
  { id: "unhealthy", label: "Unhealthy", max: 200, severity: Severity.UNHEALTHY },
  { id: "very-unhealthy", label: "Very unhealthy", max: 300, severity: Severity.VERY_UNHEALTHY },
  { id: "hazardous", label: "Hazardous", max: Number.POSITIVE_INFINITY, severity: Severity.HAZARDOUS },
];

/** Maps an AQI value to its band. @throws {RangeError} for negative or non-finite input. */
export function bandFor(aqi: number): AqiBand {
  if (!Number.isFinite(aqi) || aqi < 0) {
    throw new RangeError("AQI must be a non-negative finite number");
  }
  return BANDS.find((band) => aqi <= band.max) ?? BANDS[BANDS.length - 1]!;
}
