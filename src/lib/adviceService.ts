import { buildAdvice, type Advice } from "./advice";
import { fetchReading, type Reading } from "./airQuality";
import { summarise } from "./gemini";
import type { Profile } from "./validate";

export interface Plan {
  reading: Reading;
  advice: Advice;
  /** Optional Gemini narrative; null when unavailable. */
  summary: string | null;
}

export interface Dependencies {
  fetchReading: (city: string) => Promise<Reading | null>;
  summarise: (advice: Advice, place: string) => Promise<string | null>;
}

const defaults: Dependencies = { fetchReading, summarise };

/** Orchestrates live data, rules and optional GenAI. Returns null if the city is unknown. */
export async function createPlan(profile: Profile, deps: Dependencies = defaults): Promise<Plan | null> {
  const reading = await deps.fetchReading(profile.city);
  if (!reading) return null;
  const advice = buildAdvice(reading.aqi, profile);
  const summary = await deps.summarise(advice, reading.place);
  return { reading, advice, summary };
}
