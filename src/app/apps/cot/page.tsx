import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { CotMarketCard, NextReleaseCard } from "@/components/hq/cot-blocks";
import { hqBase } from "@/lib/hq";
import { COT_SOURCE_URL } from "@/lib/cot/markets";
import { nextRelease } from "@/lib/cot/schedule";
import { readCotLatest, type CotView } from "@/lib/cot/store";

/**
 * Positioning: the CFTC's Commitments of Traders for gold, the dollar index
 * and the seven majors, with a countdown to the next report.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Positioning (COT)" };

async function load() {
  const now = new Date();
  try {
    return { views: await readCotLatest(now, 12), next: nextRelease(now), error: null as string | null };
  } catch (error) {
    return { views: [] as CotView[], next: nextRelease(now), error: String(error) };
  }
}

export default async function CotIndex() {
  const [{ views, next, error }, base] = await Promise.all([load(), hqBase()]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Positioning (COT)</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Where the big speculators stand in gold and currency futures, from the CFTC&apos;s weekly
          Commitments of Traders. Positions are taken on Tuesday and published later in the week. A
          bias is the speculators&apos; lean on the pair as members trade it.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <NextReleaseCard next={next} />
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-5 text-sm lg:col-span-2">
          <p>
            <span className="font-medium">Gold</span> follows managed money (hedge funds and CTAs) against
            producers and merchants. <span className="font-medium">Currencies</span> follow leveraged funds
            against dealers. Numbers are futures contracts, net long minus short.
          </p>
          <p className="text-muted-foreground">
            A crowded side can unwind fast; a growing position confirms a trend. COT is a weekly
            picture, not an entry signal.
          </p>
          <a
            href={COT_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 font-medium underline-offset-4 hover:underline"
          >
            Official source: CFTC <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">Could not read COT data: {error}</p> : null}
      {views.length === 0 && !error ? (
        <p className="text-sm text-muted-foreground">No COT data yet. It fills in after the first refresh.</p>
      ) : null}

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {views.map((v) => (
          <li key={v.market.slug}>
            <CotMarketCard view={v} base={base} />
          </li>
        ))}
      </ol>
    </div>
  );
}
