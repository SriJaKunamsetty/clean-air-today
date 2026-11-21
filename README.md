# Clean Air Today: Urban Air Quality Assistant

🚀 **Live Deployment:** [https://clean-air-today.vercel.app/](https://clean-air-today.vercel.app/)  
🎥 **Demo Video:** [Watch MP4 Demo](./recordings/clean_air_today_demo.mp4)

![Clean Air Today Demo Preview](./recordings/clean_air_today_demo.gif)

**Vertical:** Challenge 6, Urban Air Quality Assistant. Persona: a family or community in a smoggy city in winter.

## Approach and logic
1. The user gives a city and a few lifestyle facts: household members, commute, cooking fuel, heating, purifier.
2. The server fetches the live US AQI and PM2.5 (Open-Meteo, no key needed).
3. A **deterministic rules engine** (`src/lib/advice.ts`) turns AQI and profile into prioritised actions in three groups: daily routine, indoor air and cleaner alternatives. Every action carries a plain-language *why it matters*.
4. Optionally, **Gemini** (`GEMINI_API_KEY`) writes a short summary from those vetted facts only. Without a key, or on any failure, the app still gives full advice.

Safety-critical decisions never depend on an LLM, so the advice is testable, reproducible and cannot be hallucinated.

## How it maps to the evaluation criteria
| Criterion | What is in the repo |
|---|---|
| Code quality | Strict TypeScript; small single-purpose modules in `src/lib`; declarative rules table |
| Security | Server-side input allow-listing, body-size cap, rate limit, secrets only in env, no raw user text in LLM prompts, CSP and other security headers (`next.config.mjs`), `no-store` API responses |
| Efficiency | No client dependencies beyond React; upstream calls cached 10 min and time-limited; LLM call capped at 300 tokens and 8 s |
| Testing | `npm test`: 41 unit tests for bands, validation, rules, limiter and prompt safety |
| Accessibility | Labelled controls, fieldsets, live region, focus moves to results, skip link, 44px targets, text plus colour for AQI, reduced-motion and forced-colours support |
| Problem alignment | Location-aware, lifestyle-tailored routines, indoor hacks, sustainable alternatives, explicit impact explanations |

## Run and deploy
```bash
npm install
cp .env.example .env.local   # optional: add GEMINI_API_KEY
npm run typecheck && npm test && npm run dev
```
Vercel: import the repo, add `GEMINI_API_KEY` (optional), deploy.

## Assumptions and limits
- AQI uses the US EPA scale; city is matched to the first geocoding result.
- Guidance is general, not medical advice.
- The rate limiter is per serverless instance; use a shared store (e.g. Upstash) at scale.
- CSP allows inline scripts because Next.js needs them; a nonce-based CSP is the next hardening step.
