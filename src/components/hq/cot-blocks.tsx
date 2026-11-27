import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/hq/cot-countdown";
import type { NextRelease } from "@/lib/cot/schedule";
import type { CotView } from "@/lib/cot/store";
import { cn } from "@/lib/utils";

/**
 * COT building blocks, shared by the overview and the Positioning section.
 *
 * Each block stands on its own so it can be moved, resized or dropped
 * without touching the others: the release countdown, one market's card,
 * the compact list, and the overview strip that puts them together.
 */

const UP = "#3f7a55";
const DOWN = "#c24d5a";

export function signed(n: number): string {
  return `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toLocaleString("en-US")}`;
}

function when(at: Date, timeZone: string): string {
  return at.toLocaleString("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BiasBadge({ view }: { view: CotView }) {
  const style =
    view.pairBias === "Bullish"
      ? "bg-[#cfe0d4] text-foreground"
      : view.pairBias === "Bearish"
        ? "bg-[#fbdcdf] text-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <Badge className={cn("rounded-full border-transparent", style)}>
      {view.pairBias} {view.market.symbol}
    </Badge>
  );
}

/** Weekly net position as bars around a zero line. */
export function NetBars({ history, className }: { history: CotView["history"]; className?: string }) {
  if (history.length === 0) return null;
  const W = 160;
  const H = 48;
  const max = Math.max(1, ...history.map((h) => Math.abs(h.value)));
  const hasNeg = history.some((h) => h.value < 0);
  const hasPos = history.some((h) => h.value > 0);
  const zero = hasNeg && hasPos ? H / 2 : hasNeg ? 2 : H - 2;
  const room = hasNeg && hasPos ? H / 2 - 2 : H - 4;
  const step = W / history.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Net position, weekly">
      {history.map((h, i) => {
        const len = Math.max(1, (Math.abs(h.value) / max) * room);
        const last = i === history.length - 1;
        return (
          <rect
            key={h.date}
            x={i * step + 2}
            width={step - 4}
            y={h.value >= 0 ? zero - len : zero}
            height={len}
            rx={1.5}
            fill={h.value >= 0 ? UP : DOWN}
            opacity={last ? 1 : 0.45}
          >
            <title>{`${h.date}: ${signed(h.value)}`}</title>
          </rect>
        );
      })}
      <line x1={0} x2={W} y1={zero} y2={zero} className="stroke-border" strokeWidth={1} />
    </svg>
  );
}

/** The countdown to the CFTC's next report, in Malaysia and New York time. */
export function NextReleaseCard({ next, className }: { next: NextRelease; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border border-border bg-card p-5", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarClock className="size-4" aria-hidden /> Next COT release
      </div>
      <Countdown at={next.at.toISOString()} className="text-3xl font-semibold tabular-nums" />
      <p className="text-sm">{when(next.at, "Asia/Kuala_Lumpur")} MYT</p>
      <p className="text-xs text-muted-foreground">{when(next.at, "America/New_York")} New York</p>
      <div className="flex flex-wrap gap-1.5">
        {next.delayed ? (
          <Badge className="rounded-full border-transparent bg-accent text-foreground">Moved by a US holiday</Badge>
        ) : null}
        {next.estimated ? (
          <Badge className="rounded-full border-border bg-muted text-muted-foreground">Estimated date</Badge>
        ) : null}
      </div>
    </div>
  );
}

/** One market: net position, weekly change, long share and recent bars. */
export function CotMarketCard({ view, base, className }: { view: CotView; base: string; className?: string }) {
  const longPct = Math.round(view.longShare * 100);
  return (
    <Link
      href={`${base}/cot/${view.market.slug}`}
      className={cn("group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium group-hover:underline">{view.market.name}</h3>
          <span className="text-xs text-muted-foreground">{view.market.specLabel}, net contracts</span>
        </div>
        <BiasBadge view={view} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-3xl font-semibold tabular-nums">{signed(view.net)}</span>
          {view.change !== null ? (
            <span className="text-xs tabular-nums" style={{ color: view.change >= 0 ? UP : DOWN }}>
              {signed(view.change)} on the week
            </span>
          ) : null}
        </div>
        <NetBars history={view.history} className="h-12 w-32" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div style={{ width: `${longPct}%`, background: UP }} />
          <div className="flex-1" style={{ background: DOWN }} />
        </div>
        <span className="text-xs text-muted-foreground">
          {longPct}% long, {100 - longPct}% short · positions at {view.date}
        </span>
      </div>
    </Link>
  );
}

/** A tight list for every market but the featured one. */
export function CotList({ views, base }: { views: CotView[]; base: string }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {views.map((v) => (
        <li key={v.market.slug}>
          <Link
            href={`${base}/cot/${v.market.slug}`}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-muted/50"
          >
            <span className="w-20 font-medium">{v.market.symbol}</span>
            <span className="flex-1 text-right tabular-nums">{signed(v.net)}</span>
            <span
              className="w-20 text-right text-xs tabular-nums"
              style={{ color: v.change === null ? undefined : v.change >= 0 ? UP : DOWN }}
            >
              {v.change === null ? "-" : signed(v.change)}
            </span>
            <span className="w-16 text-right">
              <span className="text-xs" style={{ color: v.pairBias === "Bearish" ? DOWN : v.pairBias === "Bullish" ? UP : undefined }}>
                {v.pairBias}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The overview strip: countdown, gold, and the majors in one row. */
export function CotOverviewBlock({ views, next, base }: { views: CotView[]; next: NextRelease; base: string }) {
  const gold = views.find((v) => v.market.slug === "gold");
  const rest = views.filter((v) => v.market.slug !== "gold");
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Positioning (COT)</h2>
          <p className="text-sm text-muted-foreground">How the big speculators are placed, from the CFTC each week</p>
        </div>
        <Link href={`${base}/cot`} className="text-sm font-medium underline-offset-4 hover:underline">
          Open positioning
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <NextReleaseCard next={next} />
        {gold ? (
          <CotMarketCard view={gold} base={base} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            No COT data yet. It fills in after the first refresh.
          </div>
        )}
        {rest.length ? <CotList views={rest} base={base} /> : null}
      </div>
    </section>
  );
}
