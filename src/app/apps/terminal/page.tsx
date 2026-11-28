import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { BreakingBanner } from "@/components/hq/story-card";
import { FilterMenu } from "@/components/hq/filter-menu";
import { PageHead, SectionHead } from "@/components/hq/page-head";
import { IssueThread, LatestList, MoreStories, QuietList } from "@/components/hq/wire-blocks";
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
export const metadata: Metadata = { title: "Feeds" };

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

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
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
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6">
      <PageHead
        title="Feeds"
        dek="What can move gold and the major pairs, newest first. Times are Malaysia time."
        actions={
          <>
            <FilterMenu
              label="Market"
              options={[
                { label: "All markets", href: href(f, { asset: null }), active: !f.asset },
                ...ASSETS.map((symbol) => ({
                  label: symbol,
                  href: href(f, { asset: symbol }),
                  active: symbol === f.asset,
                  mono: true,
                })),
              ]}
            />
            <FilterMenu
              label="Section"
              options={[
                { label: "All sections", href: href(f, { group: null, category: null }), active: !f.group && !f.category },
                ...SECTION_GROUPS.map((g) => ({
                  label: g.label,
                  href: href(f, { group: g.slug, category: null }),
                  active: g.slug === f.group,
                })),
              ]}
            />
          </>
        }
      />

      {data.ok && data.items.length === 0 && (f.asset || f.group || f.category) ? (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          No stories for this filter in the last 72 hours.{" "}
          <a href="?" className="font-medium underline underline-offset-4">
            Clear filters
          </a>
        </p>
      ) : null}

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
            <SectionHead title="Latest" note="New stories and updates, newest first" />
            <LatestList entries={wire.latest} base={base} now={data.now} developing={wire.issues.map((i) => i.id)} />
          </section>

          {wire.issues.length ? (
            <section className="flex flex-col gap-3">
              <SectionHead title="Developing" note="High impact, still being reported by several outlets" />
              <div className="grid gap-4 lg:grid-cols-2">
                {wire.issues.map((item) => (
                  <IssueThread key={item.id} item={item} base={base} now={data.now} />
                ))}
              </div>
            </section>
          ) : null}

          {wire.rest.medium.length ? (
            <section className="flex flex-col gap-3">
              <SectionHead title="More stories" note="Earlier medium and high impact" />
              <MoreStories items={wire.rest.medium} base={base} now={data.now} />
            </section>
          ) : null}

          <QuietList items={wire.rest.low} base={base} now={data.now} />
        </>
      )}
    </div>
  );
}
