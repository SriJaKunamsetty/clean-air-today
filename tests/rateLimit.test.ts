import { describe, expect, it } from "vitest";
import { createLimiter } from "@/lib/rateLimit";

describe("createLimiter", () => {
  it("blocks after the limit and resets after the window", () => {
    let t = 0;
    const allow = createLimiter(2, 1000, () => t);
    expect([allow("a"), allow("a"), allow("a"), allow("b")]).toEqual([true, true, false, true]);
    t = 1001;
    expect(allow("a")).toBe(true);
  });

  it("evicts expired entries when the table grows large", () => {
    let t = 0;
    const allow = createLimiter(1, 10, () => t);
    for (let i = 0; i < 5001; i++) allow(`ip-${i}`);
    t = 100;
    expect(allow("fresh")).toBe(true);
    expect(allow("ip-0")).toBe(true);
  });
});
