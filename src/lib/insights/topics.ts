import type { EventKind } from "@/lib/macro/calendar";

/**
 * What an insight can be about. Each topic names the HQ series it reads, the
 * release it builds up to, and which series' words find its stories on the
 * wire (related.ts). "gold" is the weekly view with no single release.
 */

export type Topic = {
  slug: string;
  name: string;
  series: string[];
  event: EventKind | null;
  /** The series whose related.ts entry finds this topic's stories; null for all high-impact news. */
  newsFrom: string | null;
};

export const TOPICS: Topic[] = [
  { slug: "nfp", name: "Jobs report (NFP)", series: ["nfp", "unemployment", "earnings-yoy"], event: "jobs", newsFrom: "nfp" },
  {
    slug: "cpi",
    name: "CPI inflation",
    series: ["cpi-yoy", "core-cpi-yoy", "cpi-mom", "core-cpi-mom"],
    event: "cpi",
    newsFrom: "cpi-yoy",
  },
  {
    slug: "fomc",
    name: "Fed rate decision (FOMC)",
    series: ["fed-funds", "effr", "us2y", "us10y", "us10y-real"],
    event: "fomc",
    newsFrom: "fed-funds",
  },
  {
    slug: "pce",
    name: "PCE inflation",
    series: ["pce-yoy", "core-pce-yoy", "pce-mom", "core-pce-mom"],
    event: "pce",
    newsFrom: "pce-yoy",
  },
  {
    slug: "ppi",
    name: "PPI producer prices",
    series: ["ppi-yoy", "core-ppi-yoy", "ppi-mom", "core-ppi-mom"],
    event: "ppi",
    newsFrom: "ppi-yoy",
  },
  { slug: "gdp", name: "GDP growth", series: ["gdp"], event: "gdp", newsFrom: "gdp" },
  { slug: "gold", name: "Gold weekly view", series: ["us10y-real", "us2y"], event: null, newsFrom: null },
];

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export const DIRECTIONS = ["up", "down", "flat"] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const LANGUAGES = { en: "English", ms: "Bahasa Melayu" } as const;
export type Language = keyof typeof LANGUAGES;

export type InsightBody = { summary: string; sections: { heading: string; text: string }[] };

export type Insight = {
  id: string;
  topic: string;
  direction: Direction;
  language: Language;
  notes: string | null;
  title: string;
  body: InsightBody;
  model: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
