import { describe, expect, it } from "vitest";
import { bandFor } from "@/lib/aqi";

describe("bandFor", () => {
  it.each([[0, "good"], [50, "good"], [51, "moderate"], [100, "moderate"], [101, "sensitive"], [150, "sensitive"],
    [151, "unhealthy"], [200, "unhealthy"], [201, "very-unhealthy"], [300, "very-unhealthy"], [301, "hazardous"], [999, "hazardous"]])(
    "AQI %i is %s", (aqi, id) => expect(bandFor(aqi).id).toBe(id));
  it.each([-1, NaN, Infinity])("rejects %s", (v) => expect(() => bandFor(v)).toThrow(RangeError));
});
