import type { Plan } from "./adviceService";

/** Calls the advice API and returns the plan, or throws an Error with a user-readable message. */
export async function requestPlan(payload: unknown, signal?: AbortSignal): Promise<Plan> {
  const res = await fetch("/api/advice", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const body = (data ?? {}) as { error?: string; details?: string[] };
    throw new Error(body.details?.join(" ") ?? body.error ?? "Something went wrong. Please try again.");
  }
  return data as Plan;
}
