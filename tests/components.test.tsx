// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileForm } from "@/components/ProfileForm";
import { ResultPanel } from "@/components/ResultPanel";
import { buildAdvice } from "@/lib/advice";
import type { Plan } from "@/lib/adviceService";

afterEach(cleanup);

const profile = {
  city: "Delhi",
  groups: ["children"],
  commute: "car",
  cooking: "gas",
  heating: "none",
  hasPurifier: false,
} as const;
const plan: Plan = {
  reading: { place: "Delhi, India", aqi: 210, pm25: 120.5, observedAt: "" },
  advice: buildAdvice(210, { ...profile, groups: ["children"] }),
  summary: "Stay indoors today.",
};

/** WCAG 2.x A/AA rules; colour-contrast is skipped because jsdom has no layout engine. */
async function violations(container: HTMLElement) {
  const result = await axe.run(container, {
    runOnly: ["wcag2a", "wcag2aa", "wcag21aa"],
    rules: { "color-contrast": { enabled: false } },
  });
  return result.violations.map((v) => v.id);
}

describe("ProfileForm", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<ProfileForm busy={false} error={null} onSubmit={vi.fn()} />);
    expect(await violations(container)).toEqual([]);
  });
  it("submits the profile payload", () => {
    const onSubmit = vi.fn();
    const { container } = render(<ProfileForm busy={false} error={null} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Delhi" } });
    fireEvent.submit(container.querySelector("form")!);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ city: "Delhi", hasPurifier: false }));
  });
  it("announces errors via role=alert and disables the button while busy", () => {
    render(<ProfileForm busy error="City not found" onSubmit={vi.fn()} />);
    expect(screen.getByRole("alert").textContent).toBe("City not found");
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });
});

describe("ResultPanel", () => {
  it("renders headline, grouped actions and has no accessibility violations", async () => {
    const { container } = render(<ResultPanel plan={plan} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain("AQI 210");
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("AQI 210");
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThan(0);
    expect(container.textContent).toContain("Why it matters");
    expect(await violations(container)).toEqual([]);
  });
  it("moves focus to the result heading", () => {
    render(<ResultPanel plan={plan} />);
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2 }));
  });
});
