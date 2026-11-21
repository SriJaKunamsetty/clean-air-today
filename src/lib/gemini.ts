import type { Advice } from "./advice";

const TIMEOUT_MS = 8000;

/** Builds the prompt from vetted, structured facts only; user text never becomes instructions. */
export function buildPrompt(advice: Advice, place: string): string {
  const steps = advice.actions.slice(0, 6).map((a, i) => `${i + 1}. ${a.title} (${a.impact})`).join("\n");
  return [
    "You write short, warm air-quality guidance for families. Use ONLY the facts below.",
    "Do not invent numbers, diagnoses or products. Do not give medical advice. 90 words max, plain language.",
    "Explain why today's top steps matter in one connected paragraph.",
    `Place: ${place}`,
    `AQI: ${advice.aqi} (${advice.band.label})`,
    `Steps:\n${steps}`,
  ].join("\n");
}

/** Returns a friendly summary, or null on any failure so callers fall back to rule-based text. */
export async function summarise(advice: Advice, place: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(advice, place) }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    return text ? text.slice(0, 1200) : null;
  } catch {
    return null;
  }
}
