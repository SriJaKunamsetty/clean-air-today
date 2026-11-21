import { describe, expect, it, vi } from "vitest";
import { createPlan } from "@/lib/adviceService";

const profile = {
  city: "Delhi",
  groups: [],
  commute: "car",
  cooking: "gas",
  heating: "none",
  hasPurifier: false,
} as const;

describe("createPlan", () => {
  it("combines reading, rules and summary", async () => {
    const plan = await createPlan(
      { ...profile, groups: [] },
      {
        fetchReading: async () => ({ place: "Delhi, India", aqi: 180, pm25: 90, observedAt: "" }),
        summarise: async () => "Stay in.",
      },
    );
    expect(plan?.advice.actions.length).toBeGreaterThan(0);
    expect(plan?.summary).toBe("Stay in.");
  });
  it("skips Gemini when the city is unknown", async () => {
    const summarise = vi.fn();
    expect(await createPlan({ ...profile, groups: [] }, { fetchReading: async () => null, summarise })).toBeNull();
    expect(summarise).not.toHaveBeenCalled();
  });
});
