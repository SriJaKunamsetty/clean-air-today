import { describe, expect, it } from "vitest";
import { parseProfile } from "@/lib/validate";

const ok = {
  city: " New Delhi ",
  groups: ["children", "children"],
  commute: "car",
  cooking: "gas",
  heating: "none",
  hasPurifier: false,
};

describe("parseProfile", () => {
  it("accepts and normalises valid input", () => {
    const r = parseProfile(ok);
    expect(r.ok && r.value.city).toBe("New Delhi");
    expect(r.ok && r.value.groups).toEqual(["children"]);
  });
  it("accepts non-Latin city names", () => expect(parseProfile({ ...ok, city: "दिल्ली" }).ok).toBe(true));
  it.each([null, [], "x", 5])("rejects non-object %j", (v) => expect(parseProfile(v).ok).toBe(false));
  it.each([
    { city: "" },
    { city: "a" },
    { city: "<script>alert(1)</script>" },
    { city: "x".repeat(81) },
    { commute: "teleport" },
    { cooking: 1 },
    { heating: undefined },
    { hasPurifier: "yes" },
    { groups: ["bad"] },
    { groups: "children" },
  ])("rejects %j", (patch) => expect(parseProfile({ ...ok, ...patch }).ok).toBe(false));
  it("ignores unknown extra fields", () => expect(parseProfile({ ...ok, isAdmin: true }).ok).toBe(true));
});
