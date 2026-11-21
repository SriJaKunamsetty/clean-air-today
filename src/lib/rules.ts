import { Severity, type SeverityLevel } from "./aqi";
import type { Profile } from "./validate";

export type Category = "routine" | "indoor" | "alternative";
export type Priority = 1 | 2 | 3;

export interface Action {
  readonly id: string;
  readonly category: Category;
  readonly priority: Priority;
  readonly title: string;
  /** Plain-language explanation of the direct effect of this choice. */
  readonly impact: string;
}

/** Everything a rule may look at; severity is computed once per request. */
export interface RuleContext {
  readonly severity: SeverityLevel;
  readonly profile: Profile;
}

export interface Rule {
  readonly when: (ctx: RuleContext) => boolean;
  readonly action: Action;
}

export const hasSensitiveMember = ({ groups }: Profile): boolean => groups.length > 0;

const rule = (
  id: string,
  category: Category,
  priority: Priority,
  title: string,
  impact: string,
  when: Rule["when"],
): Rule => ({ when, action: { id, category, priority, title, impact } });

/**
 * Declarative decision table. Each entry is independent, so it can be read,
 * reviewed and unit-tested in isolation.
 */
export const RULES: readonly Rule[] = [
  rule(
    "limit-outdoor-sensitive",
    "routine",
    1,
    "Keep outdoor time short; move play and exercise indoors",
    "Fine particles (PM2.5) pass deep into lungs. Children, older adults and people with lung or heart conditions are affected at lower levels than healthy adults.",
    ({ severity, profile }) => severity >= Severity.SENSITIVE && hasSensitiveMember(profile),
  ),
  rule(
    "limit-outdoor-all",
    "routine",
    1,
    "Cut hard outdoor exercise; take easy walks only if needed",
    "Harder breathing pulls in more polluted air, so a run can multiply your intake of particles.",
    ({ severity, profile }) => severity >= Severity.UNHEALTHY && !hasSensitiveMember(profile),
  ),
  rule(
    "wear-n95",
    "routine",
    2,
    "Wear a well-fitted N95/FFP2 mask when you must go out",
    "A snug N95 filters at least 95% of fine particles. Cloth and loose surgical masks filter far less of PM2.5.",
    ({ severity }) => severity >= Severity.SENSITIVE,
  ),
  rule(
    "time-window",
    "routine",
    3,
    "Run errands in the afternoon, not early morning or late evening",
    "In winter, cold air traps pollution near the ground overnight; it usually disperses a little by afternoon.",
    ({ severity }) => severity >= Severity.SENSITIVE,
  ),
  rule(
    "commute-two-wheeler",
    "routine",
    2,
    "Choose a metro, bus or shared cab instead of an open two-wheeler today",
    "Riding in traffic exposes you directly to exhaust at its densest; enclosed transport and fewer vehicles lower both your exposure and the city's load.",
    ({ severity, profile }) => profile.commute === "two-wheeler" && severity >= Severity.SENSITIVE,
  ),
  rule(
    "commute-active",
    "routine",
    2,
    "Take side streets or parks away from main roads on your walk or ride",
    "Pollution is highest right beside busy roads and drops noticeably a block or two away.",
    ({ severity, profile }) =>
      (profile.commute === "walk" || profile.commute === "cycle") && severity >= Severity.SENSITIVE,
  ),
  rule(
    "commute-car",
    "alternative",
    3,
    "Share the ride or use public transport 1-2 days a week",
    "Each car left at home cuts tailpipe PM2.5 and NOx at the source, which is the only lasting fix for city smog.",
    ({ severity, profile }) => profile.commute === "car" && severity >= Severity.MODERATE,
  ),
  rule(
    "wfh",
    "alternative",
    3,
    "Keep working from home on the worst days",
    "Staying in avoids exposure and takes a trip off the road.",
    ({ severity, profile }) => profile.commute === "work-from-home" && severity >= Severity.SENSITIVE,
  ),
  rule(
    "seal-home",
    "indoor",
    1,
    "Keep windows closed; air the house only briefly at the cleanest hour",
    "Outdoor smog leaks in through open windows. A short, planned airing flushes CO2 without letting much pollution in.",
    ({ severity }) => severity >= Severity.SENSITIVE,
  ),
  rule(
    "run-purifier",
    "indoor",
    1,
    "Run your purifier on high in the room where you spend most time",
    "A HEPA filter removes fine particles from recirculated air; closing the door keeps the clean zone small and effective.",
    ({ severity, profile }) => severity >= Severity.SENSITIVE && profile.hasPurifier,
  ),
  rule(
    "diy-purifier",
    "indoor",
    2,
    "Build a Corsi-Rosenthal box: a box fan with 4 MERV 13 filters",
    "It cleans a room's air for a fraction of a purifier's price; university lab tests show it removes a large share of fine particles.",
    ({ severity, profile }) => severity >= Severity.SENSITIVE && !profile.hasPurifier,
  ),
  rule(
    "gas-cooking",
    "indoor",
    2,
    "Use the exhaust fan or crack a window while cooking on gas",
    "Gas burners release NO2 and fine particles indoors. Venting during cooking lowers the peak you breathe in.",
    ({ profile }) => profile.cooking === "gas",
  ),
  rule(
    "switch-cooking",
    "alternative",
    2,
    "Move to LPG, induction or a clean-burning stove where you can",
    "Wood and biomass fires are among the largest sources of indoor PM2.5; switching cuts it sharply in the home.",
    ({ profile }) => profile.cooking === "biomass-wood",
  ),
  rule(
    "switch-heating",
    "alternative",
    1,
    "Replace burning wood or coal with an electric heater or layered clothing",
    "Winter burning adds to neighbourhood smog and to the air inside your own home.",
    ({ profile }) => profile.heating === "wood-coal",
  ),
  rule(
    "no-burning",
    "alternative",
    3,
    "Never burn waste or leaves; join or start a neighbourhood no-burn pledge",
    "Open burning releases dense smoke at ground level. A shared pledge shrinks the local pollution that all households breathe.",
    ({ severity }) => severity >= Severity.MODERATE,
  ),
  rule(
    "wet-clean",
    "indoor",
    3,
    "Damp-mop and wipe surfaces instead of dry sweeping",
    "Dry sweeping lifts settled dust back into the air; damp cleaning traps it.",
    ({ severity }) => severity >= Severity.MODERATE,
  ),
];
