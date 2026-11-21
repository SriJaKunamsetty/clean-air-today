import { describe, expect, it } from "vitest";
import { bandFor, Severity } from "@/lib/aqi";

describe("bandFor", () => {
  it.each([
    [0, "good"],
    [50, "good"],
    [51, "moderate"],
    [100, "moderate"],
    [101, "sensitive"],
    [150, "sensitive"],
    [151, "unhealthy"],
    [200, "unhealthy"],
    [201, "very-unhealthy"],
    [300, "very-unhealthy"],
    [301, "hazardous"],
    [999, "hazardous"],
  ])("AQI %i is %s", (aqi, id) => expect(bandFor(aqi).id).toBe(id));

  it("exposes increasing severity", () => {
    expect(bandFor(0).severity).toBe(Severity.GOOD);
    expect(bandFor(500).severity).toBe(Severity.HAZARDOUS);
  });
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects %s", (v) =>
    expect(() => bandFor(v)).toThrow(RangeError),
  );
});
