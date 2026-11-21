// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAdvice } from "@/hooks/useAdvice";
import { requestPlan } from "@/lib/client";

afterEach(() => vi.unstubAllGlobals());
const stubFetch = (body: unknown, status = 200) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));

describe("requestPlan", () => {
  it("returns the plan on success", async () => {
    stubFetch({ summary: null });
    expect(await requestPlan({})).toEqual({ summary: null });
  });
  it("prefers validation details, then the error message, then a generic one", async () => {
    stubFetch({ error: "Invalid input.", details: ["Choose a commute type."] }, 422);
    await expect(requestPlan({})).rejects.toThrow("Choose a commute type.");
    stubFetch({ error: "Not found" }, 404);
    await expect(requestPlan({})).rejects.toThrow("Not found");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 500 })));
    await expect(requestPlan({})).rejects.toThrow("Something went wrong");
  });
});

describe("useAdvice", () => {
  it("moves idle -> loading -> success", async () => {
    stubFetch({ reading: {}, advice: {}, summary: null });
    const { result } = renderHook(() => useAdvice());
    expect(result.current.state.status).toBe("idle");
    await act(async () => {
      void result.current.submit({});
    });
    await waitFor(() => expect(result.current.state.status).toBe("success"));
  });
  it("surfaces errors", async () => {
    stubFetch({ error: "Nope" }, 502);
    const { result } = renderHook(() => useAdvice());
    await act(async () => {
      await result.current.submit({});
    });
    expect(result.current.state).toEqual({ status: "error", message: "Nope" });
  });
  it("ignores results from a superseded request", async () => {
    let first!: (r: Response) => void;
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(new Promise<Response>((r) => (first = r)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ summary: "second" })));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useAdvice());
    await act(async () => {
      void result.current.submit({});
      await result.current.submit({});
    });
    first(new Response(JSON.stringify({ summary: "first" })));
    await waitFor(() => expect(result.current.state).toMatchObject({ status: "success", plan: { summary: "second" } }));
  });
});
