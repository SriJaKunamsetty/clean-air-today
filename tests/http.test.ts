import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/csp";
import { clientIp, isJson, isSameOrigin, readJson } from "@/lib/http";
import { profileFromForm } from "@/lib/formData";

const h = (init: Record<string, string>) => new Headers(init);
const req = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://x.test/api", { method: "POST", body, headers });

describe("clientIp", () => {
  it("prefers the platform-set header over spoofable ones", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "1.1.1.1, 2.2.2.2", "x-forwarded-for": "9.9.9.9" }))).toBe("1.1.1.1");
    expect(clientIp(h({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(h({ "x-forwarded-for": "4.4.4.4, 5.5.5.5" }))).toBe("4.4.4.4");
    expect(clientIp(h({}))).toBe("unknown");
  });
});

describe("isSameOrigin / isJson", () => {
  it("accepts matching or absent Origin and rejects others", () => {
    expect(isSameOrigin(h({ origin: "https://a.com", host: "a.com" }))).toBe(true);
    expect(isSameOrigin(h({ host: "a.com" }))).toBe(true);
    expect(isSameOrigin(h({ origin: "https://evil.com", host: "a.com" }))).toBe(false);
    expect(isSameOrigin(h({ origin: "not a url", host: "a.com" }))).toBe(false);
  });
  it("detects JSON content types", () => {
    expect(isJson(h({ "content-type": "application/json; charset=utf-8" }))).toBe(true);
    expect(isJson(h({ "content-type": "text/plain" }))).toBe(false);
    expect(isJson(h({}))).toBe(false);
  });
});

describe("readJson", () => {
  it("parses valid JSON", async () => expect(await readJson(req('{"a":1}'))).toEqual({ ok: true, value: { a: 1 } }));
  it("rejects invalid JSON with 400", async () =>
    expect(await readJson(req("{"))).toMatchObject({ ok: false, status: 400 }));
  it("rejects oversized bodies by header and by actual bytes", async () => {
    expect(await readJson(req("{}", { "content-length": "99999" }))).toMatchObject({ ok: false, status: 413 });
    expect(await readJson(req(JSON.stringify({ a: "é".repeat(100) })), 150)).toMatchObject({ ok: false, status: 413 });
  });
});

describe("buildCsp", () => {
  it("is strict in production", () => {
    const csp = buildCsp("abc", false);
    expect(csp).toContain("'nonce-abc'");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
  });
  it("relaxes only what dev tooling needs", () => expect(buildCsp("abc", true)).toContain("'unsafe-eval'"));
});

describe("profileFromForm", () => {
  it("maps form fields to the API payload", () => {
    const f = new FormData();
    f.set("city", "Delhi");
    f.append("groups", "children");
    f.set("commute", "car");
    f.set("cooking", "gas");
    f.set("heating", "none");
    f.set("hasPurifier", "yes");
    expect(profileFromForm(f)).toEqual({
      city: "Delhi",
      groups: ["children"],
      commute: "car",
      cooking: "gas",
      heating: "none",
      hasPurifier: true,
    });
  });
});
