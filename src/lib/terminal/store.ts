import { serviceClient } from "@/lib/supabase";
import type { Category, Verdict } from "./classify";
import type { StoryImage } from "./images";
import type { Brief } from "./brief";
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
  rows: { headline: Headline; verdict: Verdict; image?: StoryImage | null }[],
  model: string,
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error, count } = await serviceClient()
    .from("terminal_news")
    .upsert(
      rows.map(({ headline: h, verdict: v, image }) => ({
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
        category: v.category,
        image_query: v.imageQuery,
        image_url: image?.url ?? null,
        image_credit: image?.credit ?? null,
        image_link: image?.link ?? null,
        snippet: h.snippet ?? null,
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
  category: Category | null;
  image_url: string | null;
  image_credit: string | null;
  image_link: string | null;
  brief: Brief | null;
  /** Every outlet that carried the story: this row first, then the rest. */
  sources: StorySource[];
};

export type StorySource = { outlet: string; url: string; headline: string };

const FEED_COLUMNS =
  "id, headline, url, outlet, published_at, impact, direction, summary, category, image_url, image_credit, image_link, brief";

type FeedRow = Omit<FeedItem, "sources">;

/** Attaches each story's other outlets, filed under it as duplicates. */
async function withSources(rows: FeedRow[]): Promise<FeedItem[]> {
  if (rows.length === 0) return [];
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("parent_id, outlet, url, headline")
    .in("parent_id", rows.map((r) => r.id))
    .order("published_at", { ascending: true });
  if (error) throw error;
  const byParent = new Map<string, StorySource[]>();
  for (const child of data ?? []) {
    const list = byParent.get(child.parent_id as string) ?? [];
    list.push({ outlet: child.outlet as string, url: child.url as string, headline: child.headline as string });
    byParent.set(child.parent_id as string, list);
  }
  return rows.map((r) => ({
    ...r,
    sources: [{ outlet: r.outlet, url: r.url, headline: r.headline }, ...(byParent.get(r.id) ?? [])],
  }));
}

const IMPACT_RANK = { low: 0, medium: 1, high: 2 } as const;

export async function readFeed(opts: {
  since: Date;
  minImpact: keyof typeof IMPACT_RANK;
  limit: number;
  category?: Category | null;
}): Promise<FeedItem[]> {
  const allowed = (Object.keys(IMPACT_RANK) as (keyof typeof IMPACT_RANK)[]).filter(
    (k) => IMPACT_RANK[k] >= IMPACT_RANK[opts.minImpact],
  );
  let query = serviceClient()
    .from("terminal_news")
    .select(FEED_COLUMNS)
    .eq("relevant", true)
    .is("parent_id", null)
    .gte("published_at", opts.since.toISOString())
    .in("impact", allowed);
  if (opts.category) query = query.eq("category", opts.category);
  const { data, error } = await query
    .order("published_at", { ascending: false })
    .limit(opts.limit);
  if (error) throw error;
  return withSources((data ?? []) as FeedRow[]);
}

/** One story with all its sources, for its own page. Null when not found. */
export async function readStory(id: string): Promise<FeedItem | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select(FEED_COLUMNS)
    .eq("id", id)
    .eq("relevant", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [story] = await withSources([data as FeedRow]);
  return story;
}

/** Medium and high stories still waiting for a brief, newest first. */
export async function readPendingBriefs(limit: number): Promise<
  { id: string; headline: string; outlet: string; published_at: string; snippet: string | null; impact: string; direction: string }[]
> {
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("id, headline, outlet, published_at, snippet, impact, direction")
    .eq("relevant", true)
    .is("parent_id", null)
    .is("brief", null)
    .in("impact", ["high", "medium"])
    .gte("published_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Awaited<ReturnType<typeof readPendingBriefs>>;
}

/** Stories already briefed in the last 36 hours, to check a new one against. */
export async function readBriefedStories(): Promise<{ id: string; headline: string }[]> {
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("id, headline, brief")
    .eq("relevant", true)
    .is("parent_id", null)
    .not("brief", "is", null)
    .gte("published_at", new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString())
    .order("published_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    headline: ((r.brief as Brief | null)?.title ?? (r.headline as string)),
  }));
}

export async function saveBrief(id: string, brief: Brief, model: string): Promise<void> {
  const { error } = await serviceClient()
    .from("terminal_news")
    .update({ brief, brief_model: model })
    .eq("id", id);
  if (error) throw error;
}

export async function fileUnder(id: string, parentId: string): Promise<void> {
  const { error } = await serviceClient()
    .from("terminal_news")
    .update({ parent_id: parentId })
    .eq("id", id);
  if (error) throw error;
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

/**
 * Relevant stories stored before sections and photos existed (no category),
 * as headlines the classifier can be asked about again.
 */
export async function readUncategorised(
  since: Date,
  limit: number,
): Promise<{ id: string; headline: Headline }[]> {
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("id, url, headline, source, outlet, published_at")
    .eq("relevant", true)
    .is("category", null)
    .gte("published_at", since.toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    headline: {
      url: r.url as string,
      headline: r.headline as string,
      source: r.source as Headline["source"],
      outlet: (r.outlet as string) ?? "",
      publishedAt: new Date(r.published_at as string),
    },
  }));
}

/**
 * Fills in section and photo on a stored story. Impact, direction and the
 * summary members may already have read are left as they were.
 */
export async function updateSectionAndPhoto(
  id: string,
  verdict: Verdict,
  image: StoryImage | null,
): Promise<void> {
  const { error } = await serviceClient()
    .from("terminal_news")
    .update({
      category: verdict.category,
      image_query: verdict.imageQuery,
      image_url: image?.url ?? null,
      image_credit: image?.credit ?? null,
      image_link: image?.link ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}
