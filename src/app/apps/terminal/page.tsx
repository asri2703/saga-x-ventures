import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { LeadStory, StoryCard } from "@/components/hq/story-card";
import { hqBase } from "@/lib/hq";
import { ASSETS, CATEGORIES, type Asset, type Category } from "@/lib/terminal/classify";
import { readFeed, type FeedItem } from "@/lib/terminal/store";

/**
 * The news wire: one card per story, newest first, the latest high-impact
 * story leading. Filterable by instrument, section and minimum impact.
 *
 * Served at apps.sagaxventures.com/terminal (see the host rewrite in
 * next.config.ts) and /apps/terminal on the main domain.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News wire" };

const MIN_OPTIONS = ["low", "medium", "high"] as const;
type Min = (typeof MIN_OPTIONS)[number];
const MIN_LABEL: Record<Min, string> = { low: "All", medium: "Medium +", high: "High only" };

type Filters = { min: Min; category: Category | null; asset: Asset | null };
type Loaded = { ok: true; items: FeedItem[]; now: number } | { ok: false; reason: string };

async function load(f: Filters): Promise<Loaded> {
  const now = Date.now();
  try {
    const items = await readFeed({
      since: new Date(now - 72 * 60 * 60 * 1000),
      minImpact: f.min,
      limit: 60,
      category: f.category,
      asset: f.asset,
    });
    return { ok: true, items, now };
  } catch (error) {
    console.error("hq wire: could not read", error);
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

/** A filter link that changes one filter and keeps the others. */
function href(f: Filters, change: Partial<Filters>): string {
  const next = { ...f, ...change };
  const params = new URLSearchParams();
  if (next.min !== "low") params.set("min", next.min);
  if (next.category) params.set("category", next.category);
  if (next.asset) params.set("asset", next.asset);
  const query = params.toString();
  return query ? `?${query}` : "?";
}

function pill(active: boolean): string {
  return `rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  }`;
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export default async function NewsWire(props: PageProps<"/apps/terminal">) {
  const params = await props.searchParams;
  const f: Filters = {
    min: pick(params.min, MIN_OPTIONS) ?? "low",
    category: pick(params.category, Object.keys(CATEGORIES) as Category[]),
    asset: pick(params.asset, ASSETS),
  };
  const [data, base] = await Promise.all([load(f), hqBase()]);

  // Stories the screen kept but could not place in a section are background;
  // the wire is built from the ones it could.
  const items = data.ok ? data.items.filter((i) => i.category) : [];
  const leadIndex = Math.max(0, items.findIndex((i) => i.impact === "high"));
  const lead = items[leadIndex];
  const rest = items.filter((_, i) => i !== leadIndex);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">News wire</h1>
          <p className="text-sm text-muted-foreground">
            Stories that can move gold and the major pairs, written up by Claude. Last 72 hours.
          </p>
        </div>
        <nav aria-label="Minimum impact" className="flex gap-1 rounded-lg bg-muted p-1">
          {MIN_OPTIONS.map((option) => (
            <a key={option} href={href(f, { min: option })} aria-current={option === f.min ? "page" : undefined} className={pill(option === f.min)}>
              {MIN_LABEL[option]}
            </a>
          ))}
        </nav>
      </div>

      <nav aria-label="Instrument" className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        <a href={href(f, { asset: null })} aria-current={!f.asset ? "page" : undefined} className={pill(!f.asset)}>
          All markets
        </a>
        {ASSETS.map((symbol) => (
          <a key={symbol} href={href(f, { asset: symbol })} aria-current={symbol === f.asset ? "page" : undefined} className={`${pill(symbol === f.asset)} font-mono`}>
            {symbol}
          </a>
        ))}
      </nav>

      <nav aria-label="Section" className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        <a href={href(f, { category: null })} aria-current={!f.category ? "page" : undefined} className={pill(!f.category)}>
          All sections
        </a>
        {(Object.keys(CATEGORIES) as Category[]).map((slug) => (
          <a key={slug} href={href(f, { category: slug })} aria-current={slug === f.category ? "page" : undefined} className={pill(slug === f.category)}>
            {CATEGORIES[slug]}
          </a>
        ))}
      </nav>

      {!data.ok ? (
        <Card className="border-destructive/40">
          <CardContent className="text-sm">
            <p className="font-medium">Could not read the wire.</p>
            <p className="mt-1 text-muted-foreground">{data.reason}</p>
          </CardContent>
        </Card>
      ) : !lead ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">Nothing here in the last 72 hours.</CardContent>
        </Card>
      ) : (
        <>
          <LeadStory item={lead} base={base} now={data.now} />
          {rest.length > 0 ? (
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((item) => (
                <li key={item.id}>
                  <StoryCard item={item} base={base} now={data.now} />
                </li>
              ))}
            </ol>
          ) : null}
        </>
      )}
    </div>
  );
}
