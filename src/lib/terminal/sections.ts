import type { Category } from "./classify";

/**
 * The sections members see: nine, mapped from the classifier's eleven.
 *
 * The classifier keeps its finer split (the Fed apart from other central
 * banks, US data apart from the rest of the world) because the brief and the
 * macro pages use it; members browse by the broader group. A single section
 * can still be filtered with ?category=fed on the wire and the feed API.
 */

export const SECTION_GROUPS = [
  { slug: "war", label: "War and geopolitics", categories: ["geopolitics"] },
  { slug: "politics", label: "Politics", categories: ["politics"] },
  { slug: "central-banks", label: "Central banks", categories: ["fed", "central-banks"] },
  { slug: "data", label: "Economic data", categories: ["us-data", "global-data"] },
  { slug: "trade", label: "Trade and tariffs", categories: ["trade"] },
  { slug: "energy", label: "Oil and energy", categories: ["energy"] },
  { slug: "dollar", label: "Dollar and bonds", categories: ["dollar"] },
  { slug: "gold", label: "Gold", categories: ["gold-demand"] },
  { slug: "stress", label: "Market stress", categories: ["market-stress"] },
] as const satisfies readonly { slug: string; label: string; categories: readonly Category[] }[];

export type SectionGroup = (typeof SECTION_GROUPS)[number];
export type GroupSlug = SectionGroup["slug"];

export function groupBySlug(slug: string): SectionGroup | undefined {
  return SECTION_GROUPS.find((g) => g.slug === slug);
}

export function groupOf(category: Category | null): SectionGroup | undefined {
  if (!category) return undefined;
  return SECTION_GROUPS.find((g) => (g.categories as readonly Category[]).includes(category));
}
