import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/hq/line-chart";
import { ComingUp, eventTime } from "@/components/hq/macro-blocks";
import { PageHead, SectionHead } from "@/components/hq/page-head";
import { hqBase } from "@/lib/hq";
import { nextEventFor, upcoming } from "@/lib/macro/calendar";
import { estimateFor, unpublishedYoy } from "@/lib/macro/expect";
import { formatDate, formatValue } from "@/lib/macro/format";
import { SERIES, type SeriesDef } from "@/lib/macro/series";
import { readSeries, stats, type Obs } from "@/lib/macro/store";
import { cn } from "@/lib/utils";

/**
 * Macro data: the US numbers gold and the dollar trade on, each from its
 * publisher (New York Fed, BLS, US Treasury), refreshed twice a day. Set as
 * a newspaper's data page: what is coming up, then one table per theme
 * with the last reading, the one before, our estimate for the next and
 * when it lands.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Macro data" };

const GROUPS: { title: string; note: string; slugs: string[] }[] = [
  { title: "Inflation", note: "Consumer prices, BLS", slugs: ["cpi-mom", "core-cpi-mom", "cpi-yoy", "core-cpi-yoy"] },
  { title: "Jobs", note: "Employment Situation, BLS", slugs: ["nfp", "unemployment", "earnings-yoy"] },
  {
    title: "Fed and bond yields",
    note: "New York Fed and US Treasury, daily",
    slugs: ["fed-funds", "effr", "us2y", "us10y", "us10y-real"],
  },
];

async function load() {
  const now = Date.now();
  // The CPI index levels are not shown, but the year-on-year estimates use them.
  const wanted = [
    ...SERIES.map((def) => ({ slug: def.slug, daily: def.frequency === "Daily" })),
    { slug: "cpi-index", daily: false },
    { slug: "core-cpi-index", daily: false },
  ];
  const results = await Promise.all(
    wanted.map(async ({ slug, daily }) => {
      const since = new Date(now - (daily ? 365 : 3 * 365) * 86_400_000).toISOString().slice(0, 10);
      try {
        return [slug, await readSeries(slug, since)] as const;
      } catch (error) {
        console.error(`hq macro: could not read ${slug}`, error);
        return [slug, [] as Obs[]] as const;
      }
    }),
  );
  return { data: Object.fromEntries(results) as Record<string, Obs[]>, now };
}

type Row = {
  def: SeriesDef;
  points: Obs[];
  latest: string;
  latestDate: string;
  previous: string;
  change: number;
  estimate: string;
  next: string;
};

function rowsFor(slugs: string[], data: Record<string, Obs[]>, now: number): Row[] {
  return slugs.flatMap((slug) => {
    const def = SERIES.find((s) => s.slug === slug);
    if (!def) return [];
    const points = data[slug] ?? [];
    const s = stats(points);
    const est = estimateFor(slug, data);
    const next = nextEventFor(slug, new Date(now));
    const index = slug === "cpi-yoy" ? data["cpi-index"] : slug === "core-cpi-yoy" ? data["core-cpi-index"] : undefined;
    const gap = index ? unpublishedYoy(points, index) : null;
    const dated = s ? formatDate(s.actual.date, def.frequency) : "Fills in on the next refresh";
    return [
      {
        def,
        points: def.frequency === "Daily" ? points.slice(-90) : points.slice(-24),
        latest: s ? formatValue(s.actual.value, def) : "-",
        latestDate: gap ? `${dated}. ${formatDate(gap, "Monthly")} not published (2025 shutdown)` : dated,
        previous: s?.previous ? formatValue(s.previous.value, def) : "-",
        change: s?.previous ? s.actual.value - s.previous.value : 0,
        estimate: est ? formatValue(est.value, def) : "-",
        next: next ? eventTime(next.at) : def.frequency === "Daily" ? "Daily" : "-",
      },
    ];
  });
}

function Change({ value }: { value: number }) {
  const Arrow = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : ArrowRight;
  return <Arrow className="size-3.5 shrink-0 text-muted-foreground" aria-label={value > 0 ? "up" : value < 0 ? "down" : "unchanged"} />;
}

function DataTable({ rows, base }: { rows: Row[]; base: string }) {
  return (
    <>
      {/* Phones: one block per indicator. */}
      <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
        {rows.map((r) => (
          <li key={r.def.slug}>
            <Link href={`${base}/macro/${r.def.slug}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-muted/40">
              <span className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium leading-snug">{r.def.name}</span>
                <Sparkline points={r.points} className="h-8 w-20 shrink-0 text-primary" />
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">{r.latest}</span>
                <Change value={r.change} />
                <span className="text-xs text-muted-foreground">{r.latestDate}</span>
              </span>
              <span className="grid grid-cols-3 gap-2 text-xs">
                <span className="flex flex-col">
                  <span className="text-muted-foreground">Previous</span>
                  <span className="tabular-nums">{r.previous}</span>
                </span>
                <span className="flex flex-col">
                  <span className="text-muted-foreground">Estimate</span>
                  <span className="font-medium tabular-nums">{r.estimate}</span>
                </span>
                <span className="flex flex-col">
                  <span className="text-muted-foreground">Next</span>
                  <span className="tabular-nums">{r.next}</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Tablet and up: a proper table. */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Indicator</th>
              <th scope="col" className="w-28 px-4 py-2.5 text-right font-medium">Latest</th>
              <th scope="col" className="w-28 px-4 py-2.5 text-right font-medium">Previous</th>
              <th scope="col" className="w-36 bg-[#f0dcae]/35 px-4 py-2.5 text-right font-medium">Saga estimate</th>
              <th scope="col" className="w-44 px-4 py-2.5 font-medium">Next release (MYT)</th>
              <th scope="col" className="w-32 px-4 py-2.5 font-medium">
                <span className="sr-only">Trend</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.def.slug} className="hover:bg-muted/40">
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  <Link href={`${base}/macro/${r.def.slug}`} className="hover:underline">
                    {r.def.name}
                  </Link>
                  <span className="block text-xs font-normal text-muted-foreground">{r.latestDate}</span>
                </th>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-base font-semibold tabular-nums">
                    {r.latest}
                    <Change value={r.change} />
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.previous}</td>
                <td className={cn("bg-[#f0dcae]/35 px-4 py-3 text-right font-medium tabular-nums")}>{r.estimate}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.next}</td>
                <td className="w-32 px-4 py-3">
                  <Sparkline points={r.points} className="h-8 w-24 text-primary" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default async function MacroIndex() {
  const [{ data, now }, base] = await Promise.all([load(), hqBase()]);
  const soon = upcoming(new Date(now), 14).slice(0, 3);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-8">
      <PageHead
        title="Macro data"
        dek="The US numbers gold and the dollar trade on, straight from the New York Fed, the Bureau of Labor Statistics and the US Treasury."
      />

      <section className="flex flex-col gap-3">
        <SectionHead title="Coming up" note="Next two weeks, Malaysia time" />
        <ComingUp events={soon} base={base} />
      </section>

      {GROUPS.map((g) => (
        <section key={g.title} className="flex flex-col gap-3">
          <SectionHead title={g.title} note={g.note} />
          <DataTable rows={rowsFor(g.slugs, data, now)} base={base} />
        </section>
      ))}

      <p className="text-xs text-muted-foreground">
        Saga estimate: our own arithmetic on each series&apos; official history (three-month trend, or base
        effect for year-on-year CPI). It is not the economists&apos; consensus, which is sold under licence.
        Open an indicator to see how each one is worked out.
      </p>
    </div>
  );
}
