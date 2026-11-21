"use client";
import { useEffect, useRef } from "react";
import type { Category } from "@/lib/advice";
import type { Plan } from "@/lib/adviceService";
import { AqiGauge } from "./AqiGauge";

const SECTIONS: readonly { id: Category; title: string }[] = [
  { id: "routine", title: "Daily routine" },
  { id: "indoor", title: "Indoor air" },
  { id: "alternative", title: "Cleaner alternatives" },
];

export function ResultPanel({ plan }: { plan: Plan }) {
  const { reading, advice, summary } = plan;
  const heading = useRef<HTMLHeadingElement>(null);

  // Move focus to the result so screen-reader and keyboard users land on the new content.
  useEffect(() => heading.current?.focus(), [plan]);

  return (
    <article aria-labelledby="result-heading">
      <h2 id="result-heading" tabIndex={-1} ref={heading}>
        {advice.headline}
      </h2>
      <p className="meta">
        Reading for {reading.place}
        {reading.pm25 !== null && `, PM2.5 ${reading.pm25} µg/m³`}. Category: <strong>{advice.band.label}</strong>.
      </p>
      <AqiGauge aqi={advice.aqi} label={advice.band.label} />
      {summary && <p className="summary">{summary}</p>}
      {SECTIONS.map(({ id, title }) => {
        const items = advice.actions.filter((a) => a.category === id);
        if (items.length === 0) return null;
        return (
          <section key={id} aria-labelledby={`section-${id}`}>
            <h3 id={`section-${id}`}>{title}</h3>
            <ul>
              {items.map((a) => (
                <li key={a.id}>
                  <strong>{a.title}</strong>
                  <span>Why it matters: {a.impact}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="meta">General guidance, not medical advice. If anyone has trouble breathing, contact a doctor.</p>
    </article>
  );
}
