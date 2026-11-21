import { bandFor, Severity, type AqiBand } from "./aqi";
import { hasSensitiveMember, RULES, type Action } from "./rules";
import type { Profile } from "./validate";

export type { Action, Category } from "./rules";

export interface Advice {
  readonly aqi: number;
  readonly band: AqiBand;
  readonly headline: string;
  readonly actions: readonly Action[];
}

export function headlineFor(aqi: number, profile: Profile): string {
  const { label, severity } = bandFor(aqi);
  const prefix = `AQI ${aqi} in ${profile.city}: ${label.toLowerCase()}.`;
  if (severity <= Severity.MODERATE) {
    return `Air in ${profile.city} is ${label.toLowerCase()} (AQI ${aqi}). Normal routines are fine; small habits still help.`;
  }
  if (severity === Severity.SENSITIVE) {
    const care = hasSensitiveMember(profile)
      ? "Your household needs extra care today."
      : "Most healthy adults can carry on with care.";
    return `${prefix} ${care}`;
  }
  return `${prefix} Today calls for protective steps for everyone.`;
}

/** Pure and deterministic: the same inputs always produce the same advice. */
export function buildAdvice(aqi: number, profile: Profile): Advice {
  const band = bandFor(aqi);
  const ctx = { severity: band.severity, profile };
  const actions = RULES.filter((r) => r.when(ctx))
    .map((r) => r.action)
    .sort((a, b) => a.priority - b.priority);
  return { aqi, band, headline: headlineFor(aqi, profile), actions };
}
