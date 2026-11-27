import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LineChart } from "@/components/hq/line-chart";
import { StoryCard } from "@/components/hq/story-card";
import { hqBase } from "@/lib/hq";
import { seriesBySlug } from "@/lib/macro/series";
import { readSeries, stats } from "@/lib/macro/store";
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

/** The series, and the wire's medium and high stories in its section this week. */
async function load(slug: string, section: Category) {
  const now = Date.now();
  const [all, stories] = await Promise.all([
    readSeries(slug),
    readFeed({ since: new Date(now - 7 * 86_400_000), minImpact: "medium", limit: 6, category: section }).catch(
      () => [],
    ),
  ]);
  return { all, stories, now };
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

  const [{ all, stories, now }, base] = await Promise.all([load(def.slug, def.section), hqBase()]);
  const s = stats(all);
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

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{def.name}</h1>
        {s ? (
          <p className="text-3xl font-semibold tabular-nums">
            {formatValue(s.actual.value, def)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {formatDate(s.actual.date, def.frequency)}
            </span>
          </p>
        ) : null}
        <p className="max-w-3xl text-sm text-muted-foreground">{def.about}</p>
      </header>

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
          <h2 className="font-semibold">Related stories this week</h2>
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
