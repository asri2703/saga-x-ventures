import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { BiasBadge, signed } from "@/components/hq/cot-blocks";
import { LineChart } from "@/components/hq/line-chart";
import { hqBase } from "@/lib/hq";
import { COT_SOURCE_URL, cotMarket } from "@/lib/cot/markets";
import { cotViews, readCotHistory } from "@/lib/cot/store";

/**
 * One market's positioning: the speculators' net position over time, and
 * the latest week laid out for both sides.
 */

export const dynamic = "force-dynamic";

const RANGES = { "1y": 365, "3y": 3 * 365, "5y": 5 * 365, max: 0 } as const;
type Range = keyof typeof RANGES;

export async function generateMetadata(props: PageProps<"/apps/cot/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: cotMarket(slug)?.name ?? "Positioning (COT)" };
}

async function load(slug: string) {
  return { all: await readCotHistory(slug), now: Date.now() };
}

export default async function CotMarketPage(props: PageProps<"/apps/cot/[slug]">) {
  const { slug } = await props.params;
  const market = cotMarket(slug);
  if (!market) notFound();

  const params = await props.searchParams;
  const asked = typeof params.range === "string" ? params.range : "";
  const range: Range = asked in RANGES ? (asked as Range) : "3y";

  const [{ all, now }, base] = await Promise.all([load(market.slug), hqBase()]);
  const cutoff = RANGES[range] ? new Date(now - RANGES[range] * 86_400_000).toISOString().slice(0, 10) : "";
  const shown = (cutoff ? all.filter((r) => r.report_date >= cutoff) : all).map((r) => ({
    date: r.report_date,
    value: r.spec_long - r.spec_short,
  }));
  const view = cotViews(all, 1)[0];
  const latest = all[all.length - 1];

  let high = shown[0];
  let low = shown[0];
  for (const p of shown) {
    if (p.value > high.value) high = p;
    if (p.value < low.value) low = p;
  }

  const rows: [string, string][] = latest
    ? [
        ["Positions at", latest.report_date],
        [`${market.specLabel}, long`, latest.spec_long.toLocaleString("en-US")],
        [`${market.specLabel}, short`, latest.spec_short.toLocaleString("en-US")],
        [`${market.specLabel}, net`, signed(latest.spec_long - latest.spec_short)],
        ["Change on the week", view?.change === null || !view ? "-" : signed(view.change)],
        [`${market.hedgeLabel}, net`, signed(latest.hedge_long - latest.hedge_short)],
        ["Open interest", latest.open_interest.toLocaleString("en-US")],
        ...(high ? ([[`Highest net (${range})`, `${signed(high.value)} (${high.date})`]] as [string, string][]) : []),
        ...(low ? ([[`Lowest net (${range})`, `${signed(low.value)} (${low.date})`]] as [string, string][]) : []),
        ["Source", "CFTC Commitments of Traders, futures only"],
      ]
    : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link
        href={`${base}/cot`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Positioning (COT)
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{market.name}</h1>
          {view ? <BiasBadge view={view} /> : null}
        </div>
        {view ? (
          <p className="text-3xl font-semibold tabular-nums">
            {signed(view.net)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {market.specLabel}, net contracts, {view.date}
            </span>
          </p>
        ) : null}
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
        <LineChart points={shown} suffix="" decimals={0} daily title={`${market.name} net position, ${range}`} />
      </section>

      {rows.length ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row" className="w-56 bg-muted/50 px-4 py-2.5 text-left font-medium">
                    {k}
                  </th>
                  <td className="px-4 py-2.5 tabular-nums">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">No data yet. It fills in after the first refresh.</p>
      )}

      <a
        href={COT_SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
      >
        Official source: CFTC <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </div>
  );
}
