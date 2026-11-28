import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LineChart } from "@/components/hq/line-chart";
import { StoryCard } from "@/components/hq/story-card";
import { hqBase } from "@/lib/hq";
import { seriesBySlug } from "@/lib/macro/series";
import { readSeries, stats, type Obs } from "@/lib/macro/store";
import { nextEventFor } from "@/lib/macro/calendar";
import { estimateFor, rateLean, shiftMonth, toneOf, unpublishedYoy } from "@/lib/macro/expect";
import { ExpectPanel, FedLeanPanel } from "@/components/hq/macro-blocks";
import { SectionHead } from "@/components/hq/page-head";
import type { Category } from "@/lib/terminal/classify";
import { readFeed } from "@/lib/terminal/store";
import { formatDate, formatValue } from "@/lib/macro/format";

/**
 * One economic series: its history as a chart, the stats a trader looks for
 * first (actual, previous, highest, lowest), where it comes from, and the
 * wire's latest stories in the matching section.
 */

export const dynamic = "force-dynamic";

const RANGES = { "1y": 365, "5y": 5 * 365, "10y": 10 * 365, max: 0 } as const;
type Range = keyof typeof RANGES;

/** Other series an estimate or the Fed panel needs, by the page's series. */
const NEEDS: Record<string, string[]> = {
  "cpi-yoy": ["cpi-mom", "cpi-index"],
  "core-cpi-yoy": ["core-cpi-mom", "core-cpi-index"],
  "fed-funds": ["us2y"],
  effr: ["fed-funds", "us2y"],
};

const FED_TONE_DAYS = 14;

/** The series, what its estimate needs, and the wire's recent stories in its section. */
async function load(slug: string, section: Category) {
  const now = Date.now();
  const since = new Date(now - 3 * 365 * 86_400_000).toISOString().slice(0, 10);
  const fed = slug === "fed-funds" || slug === "effr";
  const [all, extra, stories, fedStories] = await Promise.all([
    readSeries(slug),
    Promise.all((NEEDS[slug] ?? []).map(async (s) => [s, await readSeries(s, since).catch(() => [])] as const)),
    readFeed({ since: new Date(now - 7 * 86_400_000), minImpact: "medium", limit: 6, category: section }).catch(
      () => [],
    ),
    fed
      ? readFeed({ since: new Date(now - FED_TONE_DAYS * 86_400_000), minImpact: "medium", limit: 100, category: "fed" }).catch(
          () => [],
        )
      : Promise.resolve([]),
  ]);
  const data: Record<string, Obs[]> = { ...Object.fromEntries(extra), [slug]: all };
  return { all, data, stories, fedStories, now };
}

export async function generateMetadata(props: PageProps<"/apps/macro/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: seriesBySlug(slug)?.name ?? "Macro data" };
}

export default async function SeriesPage(props: PageProps<"/apps/macro/[slug]">) {
  const { slug } = await props.params;
  const def = seriesBySlug(slug);
  if (!def) notFound();

  const params = await props.searchParams;
  const asked = typeof params.range === "string" ? params.range : "";
  const range: Range = asked in RANGES ? (asked as Range) : "5y";

  const [{ all, data, stories, fedStories, now }, base] = await Promise.all([load(def.slug, def.section), hqBase()]);
  const s = stats(all);
  const next = nextEventFor(def.slug, new Date(now));
  const estimate = estimateFor(def.slug, data);
  const isFed = def.slug === "fed-funds" || def.slug === "effr";
  const upper = (def.slug === "fed-funds" ? all : data["fed-funds"] ?? []).at(-1)?.value;
  const twoYear = data.us2y?.at(-1)?.value;
  const lean = isFed && upper !== undefined && twoYear !== undefined ? rateLean(upper, twoYear) : null;
  const index = data["cpi-index"] ?? data["core-cpi-index"];
  const gap = index ? unpublishedYoy(all, index) : null;
  const cutoff = RANGES[range] ? new Date(now - RANGES[range] * 86_400_000).toISOString().slice(0, 10) : "";
  const shown = cutoff ? all.filter((p) => p.date >= cutoff) : all;

  const rows: [string, string][] = s
    ? [
        ["Actual", `${formatValue(s.actual.value, def)} (${formatDate(s.actual.date, def.frequency)})`],
        ["Previous", s.previous ? `${formatValue(s.previous.value, def)} (${formatDate(s.previous.date, def.frequency)})` : "-"],
        ["Highest", `${formatValue(s.highest.value, def)} (${formatDate(s.highest.date, def.frequency)})`],
        ["Lowest", `${formatValue(s.lowest.value, def)} (${formatDate(s.lowest.date, def.frequency)})`],
        ["Dates", `${formatDate(s.first.date, def.frequency)} to ${formatDate(s.actual.date, def.frequency)}`],
        ["Unit", def.unit],
        ["Frequency", def.frequency],
        ["Source", def.source],
      ]
    : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link
        href={`${base}/macro`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Macro data
      </Link>

      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <h1 className="font-news text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{def.name}</h1>
        {s ? (
          <p className="text-3xl font-semibold tabular-nums">
            {formatValue(s.actual.value, def)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {formatDate(s.actual.date, def.frequency)}
            </span>
          </p>
        ) : null}
        {gap ? (
          <p className="max-w-3xl rounded-lg border border-[#e0c98f] bg-[#f0dcae]/40 px-3 py-2 text-sm">
            BLS did not publish a year-on-year figure for {formatDate(gap, "Monthly")}: it collected no prices in{" "}
            {formatDate(shiftMonth(gap, -12), "Monthly")} because of the 2025 government shutdown, so there is no
            base to compare against. The monthly change for {formatDate(gap, "Monthly")} is published; see CPI month
            on month.
          </p>
        ) : null}
        <p className="max-w-3xl text-sm text-muted-foreground">{def.about}</p>
      </header>

      {next || estimate ? (
        <section className="flex flex-col gap-3">
          <SectionHead title="What to expect" note={next ? next.name : "Next release"} />
          {isFed ? (
            <FedLeanPanel lean={lean} tone={toneOf(fedStories)} days={FED_TONE_DAYS} />
          ) : null}
          <ExpectPanel
            def={def}
            next={next}
            estimate={estimate}
            noEstimate={isFed ? "No number for a rate decision. See what bonds are pricing and the tone of Fed news above." : undefined}
            last={s ? { value: formatValue(s.actual.value, def), date: formatDate(s.actual.date, def.frequency) } : null}
          />
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
        <nav aria-label="Range" className="flex w-fit gap-1 rounded-lg bg-muted p-1">
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <a
              key={r}
              href={`?range=${r}`}
              aria-current={r === range ? "page" : undefined}
              className={`rounded-md px-3 py-1 text-sm font-medium ${
                r === range ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "max" ? "Max" : r.toUpperCase()}
            </a>
          ))}
        </nav>
        <LineChart
          points={shown}
          suffix={def.suffix}
          decimals={def.decimals}
          daily={def.frequency === "Daily"}
          title={`${def.name}, ${range}`}
        />
      </section>

      {rows.length ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row" className="w-36 bg-muted/50 px-4 py-2.5 text-left font-medium">
                    {k}
                  </th>
                  <td className="px-4 py-2.5 tabular-nums">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">No data yet. It fills in on the next refresh.</p>
      )}

      <a
        href={def.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
      >
        Official source: {def.source} <ExternalLink className="size-3.5" aria-hidden />
      </a>

      {stories.length ? (
        <section className="flex flex-col gap-3">
          <SectionHead title="In the news this week" note="Medium and high impact stories in this section" />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((item) => (
              <li key={item.id}>
                <StoryCard item={item} base={base} now={now} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
