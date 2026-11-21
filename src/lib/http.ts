/** Small, dependency-free helpers for hardening the API route. */
import type { Result } from "./validate";

export const MAX_BODY_BYTES = 2_048;

/**
 * Best-effort client IP. Vercel sets x-vercel-forwarded-for itself, so it cannot be spoofed
 * by callers there; other headers are used only as fallbacks.
 */
export function clientIp(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Browsers always send Origin on cross-origin POSTs; reject any that does not match our host. */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (origin === null) return true; // non-browser clients (curl, server-to-server)
  try {
    return new URL(origin).host === headers.get("host");
  } catch {
    return false;
  }
}

export const isJson = (headers: Headers): boolean =>
  (headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");

/** Reads a JSON body while enforcing a hard byte limit. */
export async function readJson(
  req: Request,
  maxBytes = MAX_BODY_BYTES,
): Promise<Result<unknown> & { status?: number }> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return { ok: false, errors: ["Request too large."], status: 413 };
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > maxBytes)
    return { ok: false, errors: ["Request too large."], status: 413 };
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, errors: ["Invalid JSON."], status: 400 };
  }
}
