import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { LeadStory, StoryCard } from "@/components/hq/story-card";
import { hqBase } from "@/lib/hq";
import { CATEGORIES, type Category } from "@/lib/terminal/classify";
import { readFeed, type FeedItem } from "@/lib/terminal/store";

/**
 * The news wire: one card per story, newest first, the latest high-impact
 * story leading. Filterable by section and by minimum impact.
 *
 * Served at apps.sagaxventures.com/terminal (see the host rewrite in
 * next.config.ts) and /apps/terminal on the main domain.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News wire" };

const MIN_OPTIONS = ["low", "medium", "high"] as const;
type Min = (typeof MIN_OPTIONS)[number];
const MIN_LABEL: Record<Min, string> = { low: "All", medium: "Medium +", high: "High only" };

type Loaded = { ok: true; items: FeedItem[]; now: number } | { ok: false; reason: string };

async function load(min: Min, category: Category | null): Promise<Loaded> {
  const now = Date.now();
  try {
    const items = await readFeed({
      since: new Date(now - 72 * 60 * 60 * 1000),
      minImpact: min,
      limit: 60,
      category,
    });
    return { ok: true, items, now };
  } catch (error) {
    console.error("hq wire: could not read", error);
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

/** A filter link that keeps the other filter as it is. */
function href(min: Min, category: Category | null): string {
  const params = new URLSearchParams();
  if (min !== "low") params.set("min", min);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `?${query}` : "?";
}

function pill(active: boolean): string {
  return `rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  }`;
}

export default async function NewsWire(props: PageProps<"/apps/terminal">) {
  const params = await props.searchParams;
  const requestedMin = typeof params.min === "string" ? params.min : "";
  const min: Min = (MIN_OPTIONS as readonly string[]).includes(requestedMin) ? (requestedMin as Min) : "low";
  const requestedCategory = typeof params.category === "string" ? params.category : "";
  const category = requestedCategory in CATEGORIES ? (requestedCategory as Category) : null;
  const [data, base] = await Promise.all([load(min, category), hqBase()]);

  // Stories the screen kept but could not place in a section are background;
  // the wire is built from the ones it could.
  const items = data.ok ? data.items.filter((i) => i.category) : [];
  const leadIndex = Math.max(0, items.findIndex((i) => i.impact === "high"));
  const lead = items[leadIndex];
  const rest = items.filter((_, i) => i !== leadIndex);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">News wire</h1>
          <p className="text-sm text-muted-foreground">
            Stories that can move XAUUSD, written up by Claude. Last 72 hours.
          </p>
        </div>
        <nav aria-label="Minimum impact" className="flex gap-1 rounded-lg bg-muted p-1">
          {MIN_OPTIONS.map((option) => (
            <a key={option} href={href(option, category)} aria-current={option === min ? "page" : undefined} className={pill(option === min)}>
              {MIN_LABEL[option]}
            </a>
          ))}
        </nav>
      </div>

      <nav aria-label="Section" className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        <a href={href(min, null)} aria-current={!category ? "page" : undefined} className={pill(!category)}>
          All sections
        </a>
        {(Object.keys(CATEGORIES) as Category[]).map((slug) => (
          <a key={slug} href={href(min, slug)} aria-current={slug === category ? "page" : undefined} className={pill(slug === category)}>
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
