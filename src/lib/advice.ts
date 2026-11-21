import { bandFor, severity, type AqiBand } from "./aqi";
import type { Profile } from "./validate";

export type Category = "routine" | "indoor" | "alternative";

export interface Action {
  id: string;
  category: Category;
  title: string;
  /** Plain-language explanation of the direct effect of this choice. */
  impact: string;
  priority: 1 | 2 | 3;
}

export interface Advice {
  aqi: number;
  band: AqiBand;
  headline: string;
  actions: Action[];
}

interface Rule {
  when: (aqi: number, p: Profile) => boolean;
  action: Action;
}

const isSensitive = (p: Profile) => p.groups.length > 0;
/** AT(n): true when the AQI band is at least n (1 = moderate, 2 = above 100, 3 = above 150). */
const AT = (n: number) => (aqi: number) => severity(aqi) >= n;

/** Declarative rules: easy to read, review and unit-test one at a time. */
const RULES: readonly Rule[] = [
  {
    when: (a, p) => AT(2)(a) && isSensitive(p),
    action: { id: "limit-outdoor-sensitive", category: "routine", priority: 1,
      title: "Keep outdoor time short; move play and exercise indoors",
      impact: "Fine particles (PM2.5) pass deep into lungs. Children, older adults and people with lung or heart conditions are affected at lower levels than healthy adults." },
  },
  {
    when: (a, p) => AT(3)(a) && !isSensitive(p),
    action: { id: "limit-outdoor-all", category: "routine", priority: 1,
      title: "Cut hard outdoor exercise; take easy walks only if needed",
      impact: "Harder breathing pulls in more polluted air, so a run can multiply your intake of particles." },
  },
  {
    when: (a) => AT(2)(a),
    action: { id: "wear-n95", category: "routine", priority: 2,
      title: "Wear a well-fitted N95/FFP2 mask when you must go out",
      impact: "A snug N95 filters at least 95% of fine particles. Cloth and loose surgical masks filter far less of PM2.5." },
  },
  {
    when: (a) => AT(2)(a),
    action: { id: "time-window", category: "routine", priority: 3,
      title: "Run errands in the afternoon, not early morning or late evening",
      impact: "In winter, cold air traps pollution near the ground overnight; it usually disperses a little by afternoon." },
  },
  {
    when: (a, p) => p.commute === "two-wheeler" && AT(2)(a),
    action: { id: "commute-two-wheeler", category: "routine", priority: 2,
      title: "Choose a metro, bus or shared cab instead of an open two-wheeler today",
      impact: "Riding in traffic exposes you directly to exhaust at its densest; enclosed transport and fewer vehicles lower both your exposure and the city's load." },
  },
  {
    when: (a, p) => (p.commute === "walk" || p.commute === "cycle") && AT(2)(a),
    action: { id: "commute-active", category: "routine", priority: 2,
      title: "Take side streets or parks away from main roads on your walk or ride",
      impact: "Pollution is highest right beside busy roads and drops noticeably a block or two away." },
  },
  {
    when: (a, p) => p.commute === "car" && AT(1)(a),
    action: { id: "commute-car", category: "alternative", priority: 3,
      title: "Share the ride or use public transport 1-2 days a week",
      impact: "Each car left at home cuts tailpipe PM2.5 and NOx at the source, which is the only lasting fix for city smog." },
  },
  {
    when: (a, p) => p.commute === "work-from-home" && AT(2)(a),
    action: { id: "wfh", category: "alternative", priority: 3,
      title: "Keep working from home on the worst days",
      impact: "Staying in avoids exposure and takes a trip off the road." },
  },
  {
    when: (a) => AT(2)(a),
    action: { id: "seal-home", category: "indoor", priority: 1,
      title: "Keep windows closed; air the house only briefly at the cleanest hour",
      impact: "Outdoor smog leaks in through open windows. A short, planned airing flushes CO2 without letting much pollution in." },
  },
  {
    when: (a, p) => AT(2)(a) && p.hasPurifier,
    action: { id: "run-purifier", category: "indoor", priority: 1,
      title: "Run your purifier on high in the room where you spend most time",
      impact: "A HEPA filter removes fine particles from recirculated air; closing the door keeps the clean zone small and effective." },
  },
  {
    when: (a, p) => AT(2)(a) && !p.hasPurifier,
    action: { id: "diy-purifier", category: "indoor", priority: 2,
      title: "Build a Corsi-Rosenthal box: a box fan with 4 MERV 13 filters",
      impact: "It cleans a room's air for a fraction of a purifier's price; university lab tests show it removes a large share of fine particles." },
  },
  {
    when: (_a, p) => p.cooking === "gas",
    action: { id: "gas-cooking", category: "indoor", priority: 2,
      title: "Use the exhaust fan or crack a window while cooking on gas",
      impact: "Gas burners release NO2 and fine particles indoors. Venting during cooking lowers the peak you breathe in." },
  },
  {
    when: (_a, p) => p.cooking === "biomass-wood",
    action: { id: "switch-cooking", category: "alternative", priority: 2,
      title: "Move to LPG, induction or a clean-burning stove where you can",
      impact: "Wood and biomass fires are among the largest sources of indoor PM2.5; switching cuts it sharply in the home." },
  },
  {
    when: (_a, p) => p.heating === "wood-coal",
    action: { id: "switch-heating", category: "alternative", priority: 1,
      title: "Replace burning wood or coal with an electric heater or layered clothing",
      impact: "Winter burning adds to neighbourhood smog and to the air inside your own home." },
  },
  {
    when: (a) => AT(1)(a),
    action: { id: "no-burning", category: "alternative", priority: 3,
      title: "Never burn waste or leaves; join or start a neighbourhood no-burn pledge",
      impact: "Open burning releases dense smoke at ground level. A shared pledge shrinks the local pollution that all households breathe." },
  },
  {
    when: (a) => AT(1)(a),
    action: { id: "wet-clean", category: "indoor", priority: 3,
      title: "Damp-mop and wipe surfaces instead of dry sweeping",
      impact: "Dry sweeping lifts settled dust back into the air; damp cleaning traps it." },
  },
];

export function headlineFor(aqi: number, p: Profile): string {
  const label = bandFor(aqi).label.toLowerCase();
  const s = severity(aqi);
  if (s <= 1) return `Air in ${p.city} is ${label} (AQI ${aqi}). Normal routines are fine; small habits still help.`;
  if (s === 2) return `AQI ${aqi} in ${p.city}: ${label}. ${isSensitive(p) ? "Your household needs extra care today." : "Most healthy adults can carry on with care."}`;
  return `AQI ${aqi} in ${p.city}: ${label}. Today calls for protective steps for everyone.`;
}

/** Pure function: same input always yields the same advice. */
export function buildAdvice(aqi: number, profile: Profile): Advice {
  const actions = RULES.filter((r) => r.when(aqi, profile))
    .map((r) => r.action)
    .sort((a, b) => a.priority - b.priority);
  return { aqi, band: bandFor(aqi), headline: headlineFor(aqi, profile), actions };
}
