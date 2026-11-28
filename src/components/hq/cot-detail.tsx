import { crowding, type RangeSpot } from "@/lib/cot/story";
import { signed } from "./cot-blocks";

/**
 * The COT detail page's two pictures: where the position sits in its range
 * (is it crowded?), and the tug of war between the two sides.
 */

const UP = "#3f7a55";
const DOWN = "#c24d5a";

function day(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  });
}

/** "3y" → "3 years", for sentences; "max" → "all the history we hold". */
export function rangeWords(range: string): string {
  if (range === "max") return "all the history we hold";
  const n = Number.parseInt(range, 10);
  return n === 1 ? "the past year" : `the past ${n} years`;
}

/** The latest net on a track from the range's low to its high. */
export function RangeGauge({ spot, net, range }: { spot: RangeSpot; net: number; range: string }) {
  const pct = Math.round(spot.position * 100);
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-news text-lg font-semibold">How crowded is this trade?</h2>
        <p className="text-sm text-muted-foreground">
          This week&apos;s net position against its lowest and highest over {rangeWords(range)}. Near either end
          means most funds are already on one side.
        </p>
      </div>
      <div className="relative pt-7 pb-1">
        <span
          className="absolute top-0 -translate-x-1/2 rounded bg-primary px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-primary-foreground tabular-nums"
          style={{ left: `clamp(2.5rem, ${pct}%, calc(100% - 2.5rem))` }}
        >
          {signed(net)}
        </span>
        <div
          className="h-3 rounded-full"
          style={{ background: `linear-gradient(90deg, ${DOWN}33 0%, #e9dfca 50%, ${UP}33 100%)` }}
          role="img"
          aria-label={`Latest net ${signed(net)}, ${pct}% of the way from the ${range} low to the high`}
        />
        <span
          className="absolute bottom-0 h-5 w-1 -translate-x-1/2 rounded-full bg-primary ring-2 ring-card"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between gap-3 text-xs tabular-nums">
        <span className="flex flex-col">
          <span className="text-muted-foreground">Low</span>
          <span className="font-medium">{signed(spot.low.value)}</span>
          <span className="text-muted-foreground">{day(spot.low.date)}</span>
        </span>
        <span className="flex flex-col text-right">
          <span className="text-muted-foreground">High</span>
          <span className="font-medium">{signed(spot.high.value)}</span>
          <span className="text-muted-foreground">{day(spot.high.date)}</span>
        </span>
      </div>
      <p className="text-sm">
        <span className="font-semibold tabular-nums">{pct}%</span> of the way from the low to the high:{" "}
        {crowding(spot.position)}.
      </p>
    </section>
  );
}

function Side({ label, long, short }: { label: string; long: number; short: number }) {
  const total = long + short;
  const longPct = total > 0 ? Math.round((long / total) * 100) : 50;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">net {signed(long - short)}</span>
      </div>
      <div
        className="flex h-3.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`${label}: ${longPct}% long, ${100 - longPct}% short`}
      >
        <div style={{ width: `${longPct}%`, background: UP }} />
        <div className="flex-1" style={{ background: DOWN }} />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>
          Long {long.toLocaleString("en-US")} ({longPct}%)
        </span>
        <span>
          Short {short.toLocaleString("en-US")} ({100 - longPct}%)
        </span>
      </div>
    </div>
  );
}

/** Speculators against hedgers, each as a long/short split. */
export function TugOfWar({
  specLabel,
  hedgeLabel,
  row,
}: {
  specLabel: string;
  hedgeLabel: string;
  row: { spec_long: number; spec_short: number; hedge_long: number; hedge_short: number; open_interest: number };
}) {
  const net = row.spec_long - row.spec_short;
  const share = row.open_interest > 0 ? Math.round((Math.abs(net) / row.open_interest) * 100) : 0;
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h2 className="font-news text-lg font-semibold">Who holds what</h2>
      <Side label={specLabel} long={row.spec_long} short={row.spec_short} />
      <Side label={hedgeLabel} long={row.hedge_long} short={row.hedge_short} />
      <p className="text-sm text-muted-foreground">
        The speculators&apos; net is {share}% of all {row.open_interest.toLocaleString("en-US")} open contracts.
      </p>
    </section>
  );
}
