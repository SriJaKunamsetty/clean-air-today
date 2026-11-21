"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Advice, Category } from "@/lib/advice";
import type { Reading } from "@/lib/airQuality";
import { COMMUTES, COOKING, GROUPS, HEATING } from "@/lib/validate";

interface ApiResult { reading: Reading; advice: Advice; summary: string | null }

const label = (v: string) => v.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
const SECTIONS: { id: Category; title: string }[] = [
  { id: "routine", title: "Daily routine" },
  { id: "indoor", title: "Indoor air" },
  { id: "alternative", title: "Cleaner alternatives" },
];

export default function Home() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (result) headingRef.current?.focus(); }, [result]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          city: f.get("city"),
          groups: f.getAll("groups"),
          commute: f.get("commute"),
          cooking: f.get("cooking"),
          heating: f.get("heating"),
          hasPurifier: f.get("hasPurifier") === "yes",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details?.join(" ") ?? data.error ?? "Something went wrong.");
      setResult(data as ApiResult);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  const select = (name: string, text: string, options: readonly string[]) => (
    <div className="field">
      <label htmlFor={name}>{text}</label>
      <select id={name} name={name} required defaultValue="">
        <option value="" disabled>Choose one</option>
        {options.map((o) => <option key={o} value={o}>{label(o)}</option>)}
      </select>
    </div>
  );

  return (
    <main id="main">
      <header>
        <h1>Clean Air Today</h1>
        <p>Tell us about your home and your day. We check the live air in your city and give you steps that fit your family, with the reason behind each one.</p>
      </header>

      <form onSubmit={onSubmit} aria-describedby={error ? "form-error" : undefined}>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" required minLength={2} maxLength={80} autoComplete="address-level2" placeholder="For example, Delhi" />
        </div>
        <fieldset>
          <legend>Who lives with you? (optional)</legend>
          {GROUPS.map((g) => (
            <label key={g} className="check"><input type="checkbox" name="groups" value={g} /> {label(g)}</label>
          ))}
        </fieldset>
        {select("commute", "How do you get around?", COMMUTES)}
        {select("cooking", "What do you cook on?", COOKING)}
        {select("heating", "How do you heat your home?", HEATING)}
        <fieldset>
          <legend>Do you have an air purifier?</legend>
          <label className="check"><input type="radio" name="hasPurifier" value="yes" /> Yes</label>
          <label className="check"><input type="radio" name="hasPurifier" value="no" defaultChecked /> No</label>
        </fieldset>
        <button type="submit" disabled={busy}>{busy ? "Checking the air…" : "Get today's plan"}</button>
        {error && <p id="form-error" role="alert" className="error">{error}</p>}
      </form>

      <section aria-live="polite" aria-busy={busy}>
        {result && (
          <article>
            <h2 tabIndex={-1} ref={headingRef}>{result.advice.headline}</h2>
            <p className="meta">Reading for {result.reading.place}{result.reading.pm25 !== null && <>, PM2.5 {result.reading.pm25} µg/m³</>}. Category: <strong>{result.advice.band.label}</strong>.</p>
            <div className={`ribbon ${result.advice.band.id}`} role="img" aria-label={`AQI ${result.advice.aqi}, ${result.advice.band.label}`}>
              <span style={{ left: `${Math.min(result.advice.aqi, 300) / 3}%` }} />
            </div>
            {result.summary && <p className="summary">{result.summary}</p>}
            {SECTIONS.map(({ id, title }) => {
              const items = result.advice.actions.filter((a) => a.category === id);
              if (!items.length) return null;
              return (
                <section key={id} aria-labelledby={`h-${id}`}>
                  <h3 id={`h-${id}`}>{title}</h3>
                  <ul>{items.map((a) => (
                    <li key={a.id}><strong>{a.title}</strong><span>Why it matters: {a.impact}</span></li>
                  ))}</ul>
                </section>
              );
            })}
            <p className="meta">General guidance, not medical advice. If anyone has trouble breathing, contact a doctor.</p>
          </article>
        )}
      </section>
    </main>
  );
}
