import Link from "next/link";
import { Briefcase, CalendarClock, Factory, Landmark, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import { Countdown } from "@/components/hq/cot-countdown";
import type { EventKind, NextEvent } from "@/lib/macro/calendar";
import type { Estimate, RateLean, Tone } from "@/lib/macro/expect";
import { formatDate } from "@/lib/macro/format";
import type { SeriesDef } from "@/lib/macro/series";
import { cn } from "@/lib/utils";

/**
 * Macro blocks: the release calendar strip and the "what to expect" panel.
 * Times show in Malaysia time; the publishers' schedules are New York time.
 */

const EVENT_ICON: Record<EventKind, typeof Landmark> = {
  fomc: Landmark,
  cpi: ShoppingCart,
  jobs: Briefcase,
  ppi: Factory,
  gdp: TrendingUp,
  pce: Receipt,
};

/** Where each event's detail lives. */
export const EVENT_SERIES: Record<EventKind, string> = {
  fomc: "fed-funds",
  cpi: "cpi-mom",
  jobs: "nfp",
  ppi: "ppi-mom",
  gdp: "gdp",
  pce: "core-pce-yoy",
};

export function eventTime(at: Date): string {
  return at.toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The next few scheduled releases, soonest first, each with a live countdown. */
export function ComingUp({ events, base }: { events: NextEvent[]; base: string }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No scheduled US release in the next two weeks.</p>;
  }
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {events.map((e) => {
        const Icon = EVENT_ICON[e.kind];
        return (
          <li key={`${e.kind}-${e.at.toISOString()}`}>
            <Link
              href={`${base}/macro/${EVENT_SERIES[e.kind]}`}
              className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="size-3.5" aria-hidden /> {eventTime(e.at)} MYT
              </span>
              <span className="font-news text-lg font-semibold leading-tight group-hover:underline">{e.name}</span>
              <Countdown at={e.at.toISOString()} className="mt-auto font-mono text-sm tabular-nums text-foreground/80" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * What to expect from the next release: when it is, the Saga estimate with
 * its working, and the last reading to compare against.
 */
export function ExpectPanel({
  def,
  next,
  estimate,
  last,
  noEstimate = "Not enough history yet",
}: {
  /** What the estimate column says when there is none. */
  noEstimate?: string;
  def: SeriesDef;
  next: NextEvent | null;
  estimate: Estimate | null;
  last: { value: string; date: string } | null;
}) {
  if (!next && !estimate) return null;
  return (
    <section className="grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-3">
      <div className="flex flex-col gap-1 border-b border-border p-4 sm:border-r sm:border-b-0">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" aria-hidden /> Next release
        </span>
        {next ? (
          <>
            <span className="font-news text-lg font-semibold">{eventTime(next.at)} MYT</span>
            <Countdown at={next.at.toISOString()} className="font-mono text-sm tabular-nums text-muted-foreground" />
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Not on the published schedule yet</span>
        )}
      </div>
      <div className="flex flex-col gap-1 border-b border-border bg-highlight/50 p-4 sm:border-r sm:border-b-0">
        <span className="text-xs text-muted-foreground">
          Saga estimate{estimate ? `, ${formatDate(estimate.period, "Monthly")}` : ""}
        </span>
        {estimate ? (
          <>
            <span className="text-3xl font-semibold tabular-nums">
              {estimate.value.toLocaleString("en-US", {
                minimumFractionDigits: def.decimals,
                maximumFractionDigits: def.decimals,
              })}
              {def.suffix}
            </span>
            <span className="text-xs text-muted-foreground">{estimate.method}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{estimate.working}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{noEstimate}</span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted-foreground">Last reading</span>
        {last ? (
          <>
            <span className="text-3xl font-semibold tabular-nums">{last.value}</span>
            <span className="text-xs text-muted-foreground">{last.date}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No data yet</span>
        )}
      </div>
      <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground sm:col-span-3">
        The Saga estimate is our own arithmetic on the official history, not the economists&apos; consensus,
        which is sold under licence. Use it as a reference point, not a forecast.
      </p>
    </section>
  );
}

const TONE_STYLE: Record<Tone["label"], string> = {
  Hawkish: "bg-down-soft text-down",
  Dovish: "bg-up-soft text-up",
  Mixed: "bg-muted text-foreground",
  Quiet: "bg-muted text-muted-foreground",
};

/** Before a Fed decision: which way bonds lean, and the tone of Fed news on the wire. */
export function FedLeanPanel({ lean, tone, days }: { lean: RateLean | null; tone: Tone; days: number }) {
  return (
    <section className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 bg-card p-4">
        <span className="text-xs text-muted-foreground">What bonds are pricing</span>
        {lean ? (
          <>
            <span className="font-news text-2xl font-semibold capitalize">
              {lean.lean === "hold" ? "Hold" : lean.lean}
            </span>
            <span className="text-sm text-muted-foreground">{lean.sentence}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Needs the 2-year yield and the Fed range.</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 bg-card p-4">
        <span className="text-xs text-muted-foreground">Tone of Fed news, last {days} days</span>
        <span className={cn("w-fit rounded-md px-2 py-0.5 font-news text-2xl font-semibold", TONE_STYLE[tone.label])}>
          {tone.label}
        </span>
        <span className="text-sm text-muted-foreground">
          {tone.hawkish} {tone.hawkish === 1 ? "story leans" : "stories lean"} hawkish, {tone.dovish}{" "}
          {tone.dovish === 1 ? "leans" : "lean"} dovish.{" "}
          {tone.label === "Quiet" && tone.hawkish + tone.dovish > 0 ? "Too few to call a tone. " : ""}
          From the wire&apos;s read of each Fed story&apos;s effect on gold.
        </span>
      </div>
    </section>
  );
}
