import { serviceClient } from "@/lib/supabase";
import type { Verdict } from "./classify";
import { headlineKey, type Headline } from "./sources";

/**
 * Which of these headlines are already on file, by URL or by headline.
 *
 * Reads what was fetched over the last day rather than sending every URL in
 * an `in (...)` filter: seventy-five article URLs make a query string long
 * enough for the API gateway to refuse it.
 */
export async function alreadyStored(headlines: Headline[]): Promise<Set<string>> {
  const seen = new Set<string>();
  if (headlines.length === 0) return seen;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("url, headline_key")
    .gte("fetched_at", since)
    .limit(5000);
  if (error) throw error;

  const storedUrls = new Set((data ?? []).map((r) => r.url as string));
  const storedKeys = new Set((data ?? []).map((r) => r.headline_key as string));
  for (const h of headlines) {
    if (storedUrls.has(h.url) || storedKeys.has(headlineKey(h.headline))) seen.add(h.url);
  }
  return seen;
}

export async function storeVerdicts(
  rows: { headline: Headline; verdict: Verdict }[],
  model: string,
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error, count } = await serviceClient()
    .from("terminal_news")
    .upsert(
      rows.map(({ headline: h, verdict: v }) => ({
        url: h.url,
        headline_key: headlineKey(h.headline),
        headline: h.headline.slice(0, 500),
        source: h.source,
        outlet: h.outlet.slice(0, 120),
        published_at: h.publishedAt.toISOString(),
        relevant: v.relevant,
        impact: v.impact,
        direction: v.direction,
        summary: v.summary,
        model,
      })),
      // A second run racing this one must not fail the batch over a row
      // it also saw.
      { onConflict: "url", ignoreDuplicates: true, count: "exact" },
    );
  if (error) throw error;
  return count ?? rows.length;
}

export type FeedItem = {
  id: string;
  headline: string;
  url: string;
  outlet: string;
  published_at: string;
  impact: "high" | "medium" | "low";
  direction: "bullish" | "bearish" | "neutral";
  summary: string | null;
};

const IMPACT_RANK = { low: 0, medium: 1, high: 2 } as const;

export async function readFeed(opts: {
  since: Date;
  minImpact: keyof typeof IMPACT_RANK;
  limit: number;
}): Promise<FeedItem[]> {
  const allowed = (Object.keys(IMPACT_RANK) as (keyof typeof IMPACT_RANK)[]).filter(
    (k) => IMPACT_RANK[k] >= IMPACT_RANK[opts.minImpact],
  );
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("id, headline, url, outlet, published_at, impact, direction, summary")
    .eq("relevant", true)
    .gte("published_at", opts.since.toISOString())
    .in("impact", allowed)
    .order("published_at", { ascending: false })
    .limit(opts.limit);
  if (error) throw error;
  return (data ?? []) as FeedItem[];
}

/** How much the wire saw, for the preview page's header. */
export async function readStats(since: Date): Promise<{
  seen: number;
  relevant: number;
  lastFetched: string | null;
}> {
  const db = serviceClient();
  const [seen, relevant, last] = await Promise.all([
    db.from("terminal_news").select("id", { count: "exact", head: true }).gte("fetched_at", since.toISOString()),
    db
      .from("terminal_news")
      .select("id", { count: "exact", head: true })
      .eq("relevant", true)
      .gte("fetched_at", since.toISOString()),
    db.from("terminal_news").select("fetched_at").order("fetched_at", { ascending: false }).limit(1),
  ]);
  if (seen.error) throw seen.error;
  if (relevant.error) throw relevant.error;
  if (last.error) throw last.error;
  return {
    seen: seen.count ?? 0,
    relevant: relevant.count ?? 0,
    lastFetched: (last.data?.[0]?.fetched_at as string | undefined) ?? null,
  };
}

/** Relevant stories in a window, counted by impact and by direction. */
export async function readBreakdown(since: Date): Promise<{
  impact: Record<FeedItem["impact"], number>;
  direction: Record<FeedItem["direction"], number>;
}> {
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("impact, direction")
    .eq("relevant", true)
    .gte("published_at", since.toISOString())
    .limit(5000);
  if (error) throw error;

  const impact = { high: 0, medium: 0, low: 0 };
  const direction = { bullish: 0, bearish: 0, neutral: 0 };
  for (const row of data ?? []) {
    if (row.impact in impact) impact[row.impact as keyof typeof impact] += 1;
    if (row.direction in direction) direction[row.direction as keyof typeof direction] += 1;
  }
  return { impact, direction };
}
