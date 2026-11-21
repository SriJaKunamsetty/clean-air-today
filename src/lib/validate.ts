export const GROUPS = ["children", "older-adults", "asthma-or-lung", "heart-condition", "pregnancy"] as const;
export const COMMUTES = ["walk", "cycle", "public-transport", "two-wheeler", "car", "work-from-home"] as const;
export const COOKING = ["gas", "induction-electric", "biomass-wood"] as const;
export const HEATING = ["none", "electric", "gas", "wood-coal"] as const;

export type Group = (typeof GROUPS)[number];
export type Commute = (typeof COMMUTES)[number];
export type Cooking = (typeof COOKING)[number];
export type Heating = (typeof HEATING)[number];

export interface Profile {
  city: string;
  groups: Group[];
  commute: Commute;
  cooking: Cooking;
  heating: Heating;
  hasPurifier: boolean;
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const CITY = /^[\p{L}\p{M}][\p{L}\p{M}\s.,'-]{1,79}$/u;
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

/** Validates untrusted JSON; never trusts types, never echoes raw input in errors. */
export function parseProfile(input: unknown): Result<Profile> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }
  const o = input as Record<string, unknown>;
  const errors: string[] = [];

  const city = typeof o.city === "string" ? o.city.trim() : "";
  if (!CITY.test(city)) errors.push("City must be 2-80 letters (spaces, commas, hyphens allowed).");

  if (o.groups !== undefined && !Array.isArray(o.groups)) errors.push("Groups must be a list.");
  const rawGroups = Array.isArray(o.groups) ? o.groups : [];
  if (!rawGroups.every((g) => oneOf(GROUPS, g))) errors.push("Groups contains an unknown value.");

  if (!oneOf(COMMUTES, o.commute)) errors.push("Choose a commute type.");
  if (!oneOf(COOKING, o.cooking)) errors.push("Choose a cooking fuel.");
  if (!oneOf(HEATING, o.heating)) errors.push("Choose a heating type.");
  if (typeof o.hasPurifier !== "boolean") errors.push("Purifier must be yes or no.");

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      city,
      groups: [...new Set(rawGroups as Group[])],
      commute: o.commute as Commute,
      cooking: o.cooking as Cooking,
      heating: o.heating as Heating,
      hasPurifier: o.hasPurifier as boolean,
    },
  };
}
