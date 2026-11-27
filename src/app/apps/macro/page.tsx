import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/hq/line-chart";
import { hqBase } from "@/lib/hq";
import { formatDate, formatValue } from "@/lib/macro/format";
import { SERIES } from "@/lib/macro/series";
import { readSeries, stats, type Obs } from "@/lib/macro/store";

/**
 * Macro data: the US numbers gold and the dollar trade on, each from its
 * publisher (New York Fed, BLS, US Treasury), refreshed twice a day.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Macro data" };

async function load() {
  const now = Date.now();
  const results = await Promise.all(
    SERIES.map(async (def) => {
      const back = def.frequency === "Daily" ? 365 : 730;
      const since = new Date(now - back * 86_400_000).toISOString().slice(0, 10);
      try {
        const points = await readSeries(def.slug, since);
        return { def, points, error: null as string | null };
      } catch (error) {
        return { def, points: [] as Obs[], error: String(error) };
      }
    }),
  );
  return results;
}

export default async function MacroIndex() {
  const [rows, base] = await Promise.all([load(), hqBase()]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Macro data</h1>
        <p className="text-sm text-muted-foreground">
          The US numbers gold and the dollar trade on, straight from the New York Fed, the Bureau of
          Labor Statistics and the US Treasury.
        </p>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ def, points }) => {
          const s = stats(points);
          const change = s?.previous ? s.actual.value - s.previous.value : 0;
          const Arrow = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : ArrowRight;
          return (
            <li key={def.slug}>
              <Link
                href={`${base}/macro/${def.slug}`}
                className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-medium leading-snug group-hover:underline">{def.name}</h2>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{def.frequency}</span>
                </div>
                {s ? (
                  <>
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-3xl font-semibold tabular-nums">{formatValue(s.actual.value, def)}</span>
                        {s.previous ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Arrow className="size-3.5" aria-hidden />
                            Previous {formatValue(s.previous.value, def)}
                          </span>
                        ) : null}
                      </div>
                      <Sparkline points={points} className="h-10 w-28 text-primary" />
                    </div>
                    <p className="mt-auto text-xs text-muted-foreground">
                      {formatDate(s.actual.date, def.frequency)} · {def.source}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet. It fills in on the next refresh.</p>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
