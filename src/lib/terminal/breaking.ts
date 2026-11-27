import { headlineKey } from "./sources";

/**
 * Breaking news and how sure we are of a story. Pure, so tested on its own.
 *
 * A story is breaking while it is high impact and under half an hour old.
 * Its standing comes from who carries it: an official publisher (a central
 * bank, the White House) beats several outlets, which beat one.
 */

export const BREAKING_MINUTES = 30;

export function isBreaking(item: { impact: string; published_at: string }, now: number): boolean {
  if (item.impact !== "high") return false;
  const age = now - Date.parse(item.published_at);
  return age >= -5 * 60_000 && age < BREAKING_MINUTES * 60_000;
}

/** The last activity is news in itself when it came well after first sight. */
export function wasUpdated(item: { published_at: string; last_update_at: string }): boolean {
  return Date.parse(item.last_update_at) - Date.parse(item.published_at) > 10 * 60_000;
}

export type Standing = { kind: "official" | "confirmed" | "single"; label: string };

export function standing(item: { official: boolean; source_count: number; outlet: string }): Standing {
  if (item.official) return { kind: "official", label: "Official source" };
  if (item.source_count >= 2) return { kind: "confirmed", label: `Confirmed · ${item.source_count} sources` };
  return { kind: "single", label: `Reported by ${item.outlet || "one outlet"}` };
}

const COMMON = new Set(
  "a an the and or but of in on at to for from by with as is are was were be been has have had will would says said say after over into amid about than that this its it his her their new us".split(
    " ",
  ),
);

function words(text: string): Set<string> {
  return new Set(
    headlineKey(text)
      .split(" ")
      .filter((w) => w.length > 2 && !COMMON.has(w)),
  );
}

/**
 * Whether two headlines are likely the same event: they share at least three
 * telling words and a third of all of them. Cheap, and only used to keep one
 * event to one breaking push; the brief step does the careful merge later.
 */
export function sameEvent(a: string, b: string): boolean {
  const x = words(a);
  const y = words(b);
  let shared = 0;
  for (const w of x) if (y.has(w)) shared += 1;
  const union = x.size + y.size - shared;
  return shared >= 3 && union > 0 && shared / union >= 0.3;
}
