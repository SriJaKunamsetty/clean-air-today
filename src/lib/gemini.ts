import type { Advice } from "./advice";

const TIMEOUT_MS = 8_000;
const MAX_OUTPUT_TOKENS = 300;
const MAX_SUMMARY_CHARS = 1_200;
const MAX_PROMPT_STEPS = 6;
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Builds the prompt from vetted, structured facts only.
 * User-supplied free text never reaches the model, which removes prompt-injection paths.
 */
export function buildPrompt(advice: Advice, place: string): string {
  const steps = advice.actions
    .slice(0, MAX_PROMPT_STEPS)
    .map((a, i) => `${i + 1}. ${a.title} (${a.impact})`)
    .join("\n");
  return [
    "You write short, warm air-quality guidance for families. Use ONLY the facts below.",
    "Do not invent numbers, diagnoses or products. Do not give medical advice. 90 words max, plain language.",
    "Explain why today's top steps matter in one connected paragraph.",
    `Place: ${place}`,
    `AQI: ${advice.aqi} (${advice.band.label})`,
    `Steps:\n${steps}`,
  ].join("\n");
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export function extractText(data: GeminiResponse): string | null {
  const parts = data.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
        .map((p) => (typeof p.text === "string" ? p.text : ""))
        .join("")
        .trim()
    : "";
  return text ? text.slice(0, MAX_SUMMARY_CHARS) : null;
}

/**
 * Returns a friendly summary, or null on any failure so callers can fall back to rule-based text.
 * Failures are logged by reason only; the API key and prompt are never logged.
 */
export async function summarise(advice: Advice, place: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(advice, place) }] }],
        generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`gemini_unavailable status=${res.status}`);
      return null;
    }
    return extractText((await res.json()) as GeminiResponse);
  } catch (error) {
    console.warn(`gemini_unavailable reason=${error instanceof Error ? error.name : "unknown"}`);
    return null;
  }
}
