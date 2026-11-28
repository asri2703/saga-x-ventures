import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { BreakingBanner, StoryCard } from "@/components/hq/story-card";
import { IssueThread, LatestList, QuietList } from "@/components/hq/wire-blocks";
import { hqBase } from "@/lib/hq";
import { ASSETS, CATEGORIES, type Asset, type Category } from "@/lib/terminal/classify";
import { groupBySlug, SECTION_GROUPS, type GroupSlug } from "@/lib/terminal/sections";
import { readFeed, type FeedItem } from "@/lib/terminal/store";
import { buildWire } from "@/lib/terminal/wire";

/**
 * The news wire, newest first and important close behind:
 *
 *   breaking  a high-impact story under half an hour old, when there is one
 *   latest    the eight newest stories and updates, one line each
 *   issues    high-impact stories still developing, each as a thread
 *   more      the rest of the medium and high stories, then background
 *
 * Filterable by instrument and section. Served at
 * apps.sagaxventures.com/terminal and /apps/terminal on the main domain.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News wire" };

type Filters = { group: GroupSlug | null; category: Category | null; asset: Asset | null };
type Loaded = { ok: true; items: FeedItem[]; now: number } | { ok: false; reason: string };

/** Supabase throws plain objects, not Errors; read their message either way. */
function reasonOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" ? message : String(error);
}

async function load(f: Filters): Promise<Loaded> {
  const now = Date.now();
  try {
    const items = await readFeed({
      since: new Date(now - 72 * 60 * 60 * 1000),
      minImpact: "low",
      limit: 150,
      category: f.category ?? (f.group ? groupBySlug(f.group)?.categories : null) ?? null,
      asset: f.asset,
    });
    // Stories the screen kept but could not place in a section are background
    // it never finished; the wire is built from the ones it could.
    return { ok: true, items: items.filter((i) => i.category), now };
  } catch (error) {
    console.error("hq wire: could not read", error);
    return { ok: false, reason: reasonOf(error) };
  }
}

/** A filter link that changes one filter and keeps the others. */
function href(f: Filters, change: Partial<Filters>): string {
  const next = { ...f, ...change };
  const params = new URLSearchParams();
  if (next.group) params.set("section", next.group);
  if (next.category) params.set("category", next.category);
  if (next.asset) params.set("asset", next.asset);
  const query = params.toString();
  return query ? `?${query}` : "?";
}

function chip(active: boolean): string {
  return `shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap ${
    active ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-foreground/80 hover:border-foreground/30"
  }`;
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function SectionHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export default async function NewsWire(props: PageProps<"/apps/terminal">) {
  const params = await props.searchParams;
  const f: Filters = {
    group: pick(params.section, SECTION_GROUPS.map((g) => g.slug)),
    category: pick(params.category, Object.keys(CATEGORIES) as Category[]),
    asset: pick(params.asset, ASSETS),
  };
  const [data, base] = await Promise.all([load(f), hqBase()]);
  const wire = data.ok ? buildWire(data.items, data.now) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">News wire</h1>
        <p className="text-sm text-muted-foreground">
          What can move gold and the major pairs, newest first. Times are Malaysia time.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <nav aria-label="Instrument" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <a href={href(f, { asset: null })} aria-current={!f.asset ? "page" : undefined} className={chip(!f.asset)}>
            All markets
          </a>
          {ASSETS.map((symbol) => (
            <a key={symbol} href={href(f, { asset: symbol })} aria-current={symbol === f.asset ? "page" : undefined} className={`${chip(symbol === f.asset)} font-mono`}>
              {symbol}
            </a>
          ))}
        </nav>
        <nav aria-label="Section" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <a href={href(f, { group: null, category: null })} aria-current={!f.group && !f.category ? "page" : undefined} className={chip(!f.group && !f.category)}>
            All sections
          </a>
          {SECTION_GROUPS.map((g) => (
            <a key={g.slug} href={href(f, { group: g.slug, category: null })} aria-current={g.slug === f.group ? "page" : undefined} className={chip(g.slug === f.group)}>
              {g.label}
            </a>
          ))}
        </nav>
      </div>

      {!data.ok || !wire ? (
        <Card className="border-destructive/40">
          <CardContent className="text-sm">
            <p className="font-medium">Could not read the wire.</p>
            <p className="mt-1 text-muted-foreground">{data.ok ? "" : data.reason}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <BreakingBanner items={wire.breaking ? [wire.breaking] : []} base={base} now={data.now} />

          <section className="flex flex-col gap-3">
            <SectionHeading title="Latest" note="New stories and updates, newest first" />
            <LatestList entries={wire.latest} base={base} now={data.now} />
          </section>

          {wire.issues.length ? (
            <section className="flex flex-col gap-3">
              <SectionHeading title="Developing" note="High impact, still being reported" />
              <div className="grid gap-4 lg:grid-cols-2">
                {wire.issues.map((item) => (
                  <IssueThread key={item.id} item={item} base={base} now={data.now} />
                ))}
              </div>
            </section>
          ) : null}

          {wire.rest.medium.length ? (
            <section className="flex flex-col gap-3">
              <SectionHeading title="More stories" note="Earlier medium and high impact" />
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wire.rest.medium.map((item) => (
                  <li key={item.id}>
                    <StoryCard item={item} base={base} now={data.now} />
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <QuietList items={wire.rest.low} base={base} now={data.now} />
        </>
      )}
    </div>
  );
}
