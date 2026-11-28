/**
 * Which wire stories belong beside each economic series. Pure.
 *
 * A story's section is too broad for this ("Economic data" holds CPI,
 * payrolls and retail sales alike), so each series names its own words,
 * matched against the headline, the brief's title and the summary. A story
 * about payrolls in the Fed section (a Fed speaker on the jobs report)
 * still shows on the NFP page.
 */

export type Related = { topic: string; match: RegExp };

const FED: Related = {
  topic: "the Fed",
  match: /\b(fed|fomc|federal reserve|powell|warsh|rate (cut|cuts|hike|hikes|decision)|interest rates?|dot plot)\b/i,
};

const CPI: Related = {
  topic: "inflation",
  match: /\b(cpi|inflation|consumer prices?|price (index|pressures?)|core prices?|disinflation)\b/i,
};

const YIELDS: Related = {
  topic: "Treasury yields",
  match: /\b(treasur(y|ies)|bond (market|yields?)|yields?|t-?bills?|auction)\b/i,
};

export const RELATED: Record<string, Related> = {
  "fed-funds": FED,
  effr: FED,
  "cpi-yoy": CPI,
  "core-cpi-yoy": CPI,
  "cpi-mom": CPI,
  "core-cpi-mom": CPI,
  nfp: {
    topic: "NFP",
    match:
      /\b(nfp|non-?farm|payrolls?|jobs (report|data|numbers?|growth)|employment (report|situation)|hiring|job (gains|growth|creation|openings|cuts|losses)|jolts|adp)\b/i,
  },
  unemployment: {
    topic: "unemployment",
    match: /\b(unemployment|jobless|labou?r market|layoffs?|job (cuts|losses)|initial claims)\b/i,
  },
  "earnings-yoy": {
    topic: "wages",
    match: /\b(wages?|hourly earnings|pay (growth|rises?)|earnings growth|labou?r costs?)\b/i,
  },
  gdp: {
    topic: "GDP",
    match: /\b(gdp|gross domestic product|economic growth|economy (grew|shrank|contracted|expanded|slowed)|recession)\b/i,
  },
  "pce-mom": { topic: "PCE", match: /\b(pce|personal consumption|personal income|consumer spending)\b/i },
  "pce-yoy": { topic: "PCE", match: /\b(pce|personal consumption|personal income|consumer spending)\b/i },
  "core-pce-mom": { topic: "PCE", match: /\b(pce|personal consumption|personal income|consumer spending)\b/i },
  "core-pce-yoy": { topic: "PCE", match: /\b(pce|personal consumption|personal income|consumer spending)\b/i },
  "ppi-mom": { topic: "PPI", match: /\b(ppi|producer prices?|wholesale (prices?|inflation)|factory-gate)\b/i },
  "ppi-yoy": { topic: "PPI", match: /\b(ppi|producer prices?|wholesale (prices?|inflation)|factory-gate)\b/i },
  "core-ppi-mom": { topic: "PPI", match: /\b(ppi|producer prices?|wholesale (prices?|inflation)|factory-gate)\b/i },
  "core-ppi-yoy": { topic: "PPI", match: /\b(ppi|producer prices?|wholesale (prices?|inflation)|factory-gate)\b/i },
  us2y: YIELDS,
  us10y: YIELDS,
  "us10y-real": { topic: "real yields", match: /\b(real yields?|tips|treasur(y|ies)|yields?|bond market)\b/i },
};

type StoryText = { headline: string; summary: string | null; brief: { title?: string | null } | null };

export function storyMatches(story: StoryText, match: RegExp): boolean {
  return match.test(`${story.headline} ${story.brief?.title ?? ""} ${story.summary ?? ""}`);
}

/** The stories about this series, in the order given (newest first), up to `limit`. */
export function relatedStories<T extends StoryText>(slug: string, stories: T[], limit: number): T[] {
  const r = RELATED[slug];
  if (!r) return [];
  return stories.filter((s) => storyMatches(s, r.match)).slice(0, limit);
}
