import { describe, expect, it } from "vitest";
import { buildAdvice } from "@/lib/advice";
import type { Profile } from "@/lib/validate";

const base: Profile = { city: "Delhi", groups: [], commute: "car", cooking: "induction-electric", heating: "none", hasPurifier: false };
const ids = (aqi: number, p: Partial<Profile> = {}) => buildAdvice(aqi, { ...base, ...p }).actions.map((a) => a.id);

describe("buildAdvice", () => {
  it("is deterministic", () => expect(buildAdvice(180, base)).toEqual(buildAdvice(180, base)));
  it("gives minimal advice when air is good", () => {
    expect(ids(30)).toEqual([]);
    expect(buildAdvice(30, base).headline).toContain("good");
  });
  it("protects sensitive households from AQI 101 up", () => {
    expect(ids(100, { groups: ["children"] })).not.toContain("limit-outdoor-sensitive");
    expect(ids(101, { groups: ["children"] })).toContain("limit-outdoor-sensitive");
  });
  it("advises everyone to cut hard exercise only when AQI > 150", () => {
    expect(ids(150)).not.toContain("limit-outdoor-all");
    expect(ids(151)).toContain("limit-outdoor-all");
  });
  it("tailors indoor advice to purifier ownership", () => {
    expect(ids(180, { hasPurifier: true })).toContain("run-purifier");
    expect(ids(180, { hasPurifier: true })).not.toContain("diy-purifier");
    expect(ids(180)).toContain("diy-purifier");
  });
  it("tailors to commute, cooking and heating", () => {
    expect(ids(180, { commute: "two-wheeler" })).toContain("commute-two-wheeler");
    expect(ids(20, { cooking: "gas" })).toContain("gas-cooking");
    expect(ids(20, { cooking: "biomass-wood" })).toContain("switch-cooking");
    expect(ids(20, { heating: "wood-coal" })).toContain("switch-heating");
  });
  it("orders by priority and explains every action", () => {
    const { actions } = buildAdvice(250, { ...base, groups: ["asthma-or-lung"], hasPurifier: true });
    expect(actions.map((a) => a.priority)).toEqual([...actions.map((a) => a.priority)].sort());
    expect(actions.every((a) => a.impact.length > 20)).toBe(true);
  });
});
