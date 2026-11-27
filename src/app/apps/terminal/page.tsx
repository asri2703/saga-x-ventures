import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import {
  ago,
  CategoryBadge,
  DirectionBadge,
  ImpactBadge,
  myt,
  StoryPhoto,
} from "@/components/hq/story-badges";
import { CATEGORIES, type Category } from "@/lib/terminal/classify";
import { readFeed, type FeedItem } from "@/lib/terminal/store";

/**
 * The news wire as stored: every relevant story from the last 72 hours,
 * newest first, filterable by section and by minimum impact.
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
      limit: 100,
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
  const data = await load(min, category);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">News wire</h1>
          <p className="text-sm text-muted-foreground">
            Headlines that can move XAUUSD, screened by Claude. Last 72 hours, newest first.
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
      ) : data.items.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Nothing here in the last 72 hours.
          </CardContent>
        </Card>
      ) : (
        <ol className="flex flex-col gap-3">
          {data.items.map((item) => (
            <li key={item.id}>
              <Card className="gap-0 py-5">
                <CardContent className="grid gap-4 px-5 sm:grid-cols-[220px_1fr]">
                  {item.image_url ? <StoryPhoto item={item} /> : null}
                  <div className={`flex flex-col gap-2 ${item.image_url ? "" : "sm:col-span-2"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={item.category} />
                      <ImpactBadge impact={item.impact} />
                      <DirectionBadge direction={item.direction} />
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold leading-snug hover:underline"
                    >
                      {item.headline}
                    </a>
                    {item.summary ? <p className="text-sm text-muted-foreground">{item.summary}</p> : null}
                    <p className="text-xs text-muted-foreground">
                      {item.outlet || "Unknown outlet"} · {myt(item.published_at)} MYT · {ago(item.published_at, data.now)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
