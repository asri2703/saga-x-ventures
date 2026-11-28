import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LineChart } from "@/components/hq/line-chart";
import { MoreStories } from "@/components/hq/wire-blocks";
import { RELATED, relatedStories } from "@/lib/macro/related";
import { hqBase } from "@/lib/hq";
import { seriesBySlug } from "@/lib/macro/series";
import { readSeries, stats, type Obs } from "@/lib/macro/store";
import { nextEventFor } from "@/lib/macro/calendar";
import { estimateFor, rateLean, shiftMonth, toneOf, unpublishedYoy, YOY_INDEX } from "@/lib/macro/expect";
import { eventTime, ExpectPanel, FedLeanPanel } from "@/components/hq/macro-blocks";
import { SectionHead } from "@/components/hq/page-head";
import { readFeed } from "@/lib/terminal/store";
import { formatDate, formatValue } from "@/lib/macro/format";
import { NEEDS } from "@/lib/macro/needs";

/**
 * One economic series: its history as a chart, the stats a trader looks for
 * first (actual, previous, highest, lowest), where it comes from, and the
 * wire's stories about it (matched by its own words, related.ts).
 */

export const dynamic = "force-dynamic";

const RANGES = { "1y": 365, "5y": 5 * 365, "10y": 10 * 365, max: 0 } as const;
type Range = keyof typeof RANGES;

const FED_TONE_DAYS = 14;
/** How far back the related stories reach, and how many show at most. */
const RELATED_DAYS = 30;
const RELATED_LIMIT = 15;

/** The series, what its estimate needs, and the wire's stories about it. */
async function load(slug: string) {
  const now = Date.now();
  const since = new Date(now - 3 * 365 * 86_400_000).toISOString().slice(0, 10);
  const fed = slug === "fed-funds" || slug === "effr";
  const [all, extra, stories, fedStories] = await Promise.all([
    readSeries(slug),
    Promise.all((NEEDS[slug] ?? []).map(async (s) => [s, await readSeries(s, since).catch(() => [])] as const)),
    // Every section, then narrowed by the series' own words (related.ts).
    readFeed({ since: new Date(now - RELATED_DAYS * 86_400_000), minImpact: "low", limit: 400 })
      .then((items) => relatedStories(slug, items, RELATED_LIMIT))
      .catch(() => []),
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
  return { title: seriesBySlug(slug)?.name ?? "Economy" };
}

export default async function SeriesPage(props: PageProps<"/apps/macro/[slug]">) {
  const { slug } = await props.params;
  const def = seriesBySlug(slug);
  if (!def) notFound();

  const params = await props.searchParams;
  const asked = typeof params.range === "string" ? params.range : "";
  const range: Range = asked in RANGES ? (asked as Range) : "5y";

  const [{ all, data, stories, fedStories, now }, base] = await Promise.all([load(def.slug), hqBase()]);
  const s = stats(all);
  const next = nextEventFor(def.slug, new Date(now));
  const estimate = estimateFor(def.slug, data);
  const isFed = def.slug === "fed-funds" || def.slug === "effr";
  const topic = RELATED[def.slug]?.topic;
  const upper = (def.slug === "fed-funds" ? all : data["fed-funds"] ?? []).at(-1)?.value;
  const twoYear = data.us2y?.at(-1)?.value;
  const lean = isFed && upper !== undefined && twoYear !== undefined ? rateLean(upper, twoYear) : null;
  const index = YOY_INDEX[def.slug] ? data[YOY_INDEX[def.slug]] : undefined;
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
        <ArrowLeft className="size-4" aria-hidden /> Economy
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
          <p className="max-w-3xl rounded-lg border border-highlight-border bg-highlight/50 px-3 py-2 text-sm">
            BLS did not publish a YoY figure for {formatDate(gap, "Monthly")}: it collected no prices in{" "}
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

      {topic ? (
        <section className="flex flex-col gap-3">
          <SectionHead title={`${topic.charAt(0).toUpperCase()}${topic.slice(1)} in the news`} note={`Stories about ${topic}, past ${RELATED_DAYS} days, newest first`} />
          {stories.length ? (
            <MoreStories items={stories} base={base} now={now} />
          ) : (
            <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              No stories about {topic} on the wire in the past {RELATED_DAYS} days.
              {next ? ` They usually pick up in the days before the next release, ${eventTime(next.at)} MYT.` : ""}
            </p>
          )}
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

    </div>
  );
}
