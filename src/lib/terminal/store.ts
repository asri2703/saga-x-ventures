import { serviceClient } from "@/lib/supabase";
import type { Asset, AssetMove, Category, Verdict } from "./classify";
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

/** Stores verdicts; returns the new rows' ids by URL (rows already on file are skipped). */
export async function storeVerdicts(
  rows: { headline: Headline; verdict: Verdict; image?: StoryImage | null }[],
  model: string,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  if (rows.length === 0) return ids;
  const { data, error } = await serviceClient()
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
        image_source: image?.source ?? null,
        snippet: h.snippet ?? null,
        assets: v.assets,
        official: Boolean(h.official),
        last_update_at: h.publishedAt.toISOString(),
        model,
      })),
      // A second run racing this one must not fail the batch over a row
      // it also saw.
      { onConflict: "url", ignoreDuplicates: true },
    )
    .select("id, url");
  if (error) throw error;
  for (const r of data ?? []) ids.set(r.url as string, r.id as string);
  return ids;
}

/**
 * Takes a named lock for a while; false when another run holds it. One
 * conditional update, so two runs racing for it cannot both win.
 */
export async function takeLock(name: string, seconds: number): Promise<boolean> {
  const now = new Date();
  const { data, error } = await serviceClient()
    .from("terminal_locks")
    .update({ locked_until: new Date(now.getTime() + seconds * 1000).toISOString() })
    .eq("name", name)
    .lt("locked_until", now.toISOString())
    .select("name");
  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function releaseLock(name: string): Promise<void> {
  await serviceClient().from("terminal_locks").update({ locked_until: "epoch" }).eq("name", name);
}

/** High-impact stories on the wire since `since`, to keep one event to one push. */
export async function readRecentHigh(since: Date): Promise<{ id: string; headline: string }[]> {
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("id, headline, brief")
    .eq("relevant", true)
    .eq("impact", "high")
    .gte("published_at", since.toISOString())
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    headline: `${r.headline as string} ${((r.brief as Brief | null)?.title ?? "")}`.trim(),
  }));
}

/** Single-outlet high-impact stories from the last 90 minutes: worth a corroboration search. */
export async function readUnconfirmed(limit: number): Promise<{ id: string; headline: string }[]> {
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("id, headline")
    .eq("relevant", true)
    .eq("impact", "high")
    .is("parent_id", null)
    .eq("source_count", 1)
    .eq("official", false)
    .gte("published_at", new Date(Date.now() - 90 * 60 * 1000).toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as { id: string; headline: string }[];
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
  /** Which library the photo came from: unsplash, pexels or wikimedia. */
  image_source: string | null;
  assets: AssetMove[];
  brief: Brief | null;
  /** When the story last changed: first seen, or another outlet filed under it. */
  last_update_at: string;
  /** Outlets carrying the story, this one included. */
  source_count: number;
  /** From, or confirmed by, an official publisher. */
  official: boolean;
  /** Every outlet that carried the story: this row first, then the rest. */
  sources: StorySource[];
};

export type StorySource = { outlet: string; url: string; headline: string; published_at: string };

const FEED_COLUMNS =
  "id, headline, url, outlet, published_at, impact, direction, summary, category, image_url, image_credit, image_link, image_source, assets, brief, last_update_at, source_count, official";

type FeedRow = Omit<FeedItem, "sources">;

/** Attaches each story's other outlets, filed under it as duplicates. */
async function withSources(rows: FeedRow[]): Promise<FeedItem[]> {
  if (rows.length === 0) return [];
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("parent_id, outlet, url, headline, published_at")
    .in("parent_id", rows.map((r) => r.id))
    .order("published_at", { ascending: true });
  if (error) throw error;
  const byParent = new Map<string, StorySource[]>();
  for (const child of data ?? []) {
    const list = byParent.get(child.parent_id as string) ?? [];
    list.push({
      outlet: child.outlet as string,
      url: child.url as string,
      headline: child.headline as string,
      published_at: child.published_at as string,
    });
    byParent.set(child.parent_id as string, list);
  }
  return rows.map((r) => ({
    ...r,
    sources: [
      { outlet: r.outlet, url: r.url, headline: r.headline, published_at: r.published_at },
      ...(byParent.get(r.id) ?? []),
    ],
  }));
}

const IMPACT_RANK = { low: 0, medium: 1, high: 2 } as const;

export async function readFeed(opts: {
  since: Date;
  minImpact: keyof typeof IMPACT_RANK;
  limit: number;
  /** One section, or any of several (a member-facing group). */
  category?: Category | readonly Category[] | null;
  /** Only stories tagged with this instrument. */
  asset?: Asset | null;
}): Promise<FeedItem[]> {
  const allowed = (Object.keys(IMPACT_RANK) as (keyof typeof IMPACT_RANK)[]).filter(
    (k) => IMPACT_RANK[k] >= IMPACT_RANK[opts.minImpact],
  );
  let query = serviceClient()
    .from("terminal_news")
    .select(FEED_COLUMNS)
    .eq("relevant", true)
    .is("parent_id", null)
    // Latest activity, so a story another outlet just confirmed rises again.
    .gte("last_update_at", opts.since.toISOString())
    .in("impact", allowed);
  if (typeof opts.category === "string") query = query.eq("category", opts.category);
  else if (opts.category?.length) query = query.in("category", [...opts.category]);
  if (opts.asset) query = query.contains("assets", JSON.stringify([{ symbol: opts.asset }]));
  const { data, error } = await query
    .order("last_update_at", { ascending: false })
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
  {
    id: string;
    headline: string;
    outlet: string;
    published_at: string;
    snippet: string | null;
    impact: string;
    direction: string;
    assets: AssetMove[] | null;
  }[]
> {
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("id, headline, outlet, published_at, snippet, impact, direction, assets")
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

/**
 * Files a story under the one it repeats, and lifts that story: newest
 * activity now, a fresh count of distinct outlets, and official if either
 * was. Returns the parent's new state, for a "confirmed" decision.
 */
export async function fileUnder(
  id: string,
  parentId: string,
): Promise<{ sourceCount: number; official: boolean; becameOfficial: boolean } | null> {
  const db = serviceClient();
  const { error } = await db.from("terminal_news").update({ parent_id: parentId }).eq("id", id);
  if (error) throw error;

  const [parent, children] = await Promise.all([
    db.from("terminal_news").select("outlet, official").eq("id", parentId).maybeSingle(),
    db.from("terminal_news").select("outlet, official").eq("parent_id", parentId),
  ]);
  if (parent.error) throw parent.error;
  if (children.error) throw children.error;
  if (!parent.data) return null;
  const all = [parent.data, ...(children.data ?? [])];
  const sourceCount = new Set(all.map((r) => String(r.outlet ?? "").toLowerCase())).size;
  const official = all.some((r) => r.official);
  const { error: bump } = await db
    .from("terminal_news")
    .update({ last_update_at: new Date().toISOString(), source_count: sourceCount, official })
    .eq("id", parentId);
  if (bump) throw bump;
  return { sourceCount, official, becameOfficial: official && !parent.data.official };
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

/** Relevant stories on the wire with no instrument tags, as headlines to ask about again. */
export async function readUntagged(
  since: Date,
  limit: number,
): Promise<{ id: string; category: Category | null; headline: Headline }[]> {
  const { data, error } = await serviceClient()
    .from("terminal_news")
    .select("id, url, headline, source, outlet, published_at, category")
    .eq("relevant", true)
    .is("parent_id", null)
    .eq("assets", "[]")
    .gte("published_at", since.toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    category: (r.category as Category | null) ?? null,
    headline: {
      url: r.url as string,
      headline: r.headline as string,
      source: r.source as Headline["source"],
      outlet: (r.outlet as string) ?? "",
      publishedAt: new Date(r.published_at as string),
    },
  }));
}

/** Instrument tags, and a section when the story had none. Nothing else changes. */
export async function updateTags(id: string, verdict: Verdict, hadCategory: boolean): Promise<void> {
  const { error } = await serviceClient()
    .from("terminal_news")
    .update({ assets: verdict.assets, ...(hadCategory ? {} : { category: verdict.category }) })
    .eq("id", id);
  if (error) throw error;
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
      image_source: image?.source ?? null,
      assets: verdict.assets,
    })
    .eq("id", id);
  if (error) throw error;
}
