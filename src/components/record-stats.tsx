import { type RecordFunding, type RecordSummary, usd } from "@/lib/record";
import type { Performance } from "@/lib/record-outcomes";

/**
 * The figures above the chart.
 *
 * Deposits, withdrawals and trading are kept apart on purpose. A balance
 * that rose from a deposit and one that rose from trading draw the same
 * line; these are what tell a reader which they are looking at. They add up:
 * deposited − withdrawn + trading result = the balance on the card below.
 *
 * Deposited and withdrawn are two figures rather than one net one. An
 * account that has paid out more than it took in has a negative net, which
 * is a good fact that reads as a fault when printed as one number.
 *
 * Return and deepest fall join them because the absolute figures alone
 * cannot be compared between accounts funded a hundredfold apart, and
 * because a page that prints a return and not a drawdown has shown a reader
 * one side of a strategy that has twice lost a quarter of an account in a
 * day. The two travel together or neither is honest.
 *
 * Server-rendered: every figure is computed from the deal history at render.
 */
export function RecordStats({
  summary,
  funding,
  divisor,
  performance,
}: {
  summary: RecordSummary;
  funding: RecordFunding;
  /** Account units per dollar: 100 for a cent account, 1 otherwise. */
  divisor: number;
  performance: Performance | null;
}) {
  const since = new Date(`${summary.since}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
  );
  const days = new Intl.NumberFormat("en-MY").format(summary.days);
  const tone =
    summary.trading > 0
      ? "record-stat-value--up"
      : summary.trading < 0
        ? "record-stat-value--down"
        : "";

  /* A ratio as a signed percentage. The minus is U+2212, to match `usd()`.
     Zero takes no sign: "Deepest fall +0.0%" reads as a gain of nothing,
     which is not what an account that has never fallen did. */
  const pct = (ratio: number) => {
    const body = `${(Math.abs(ratio) * 100).toFixed(1)}%`;
    if (Math.abs(ratio) < 0.00005) return body;
    return `${ratio < 0 ? "−" : "+"}${body}`;
  };

  const recovery = performance?.recovery;

  const stats = [
    {
      label: "Recording since",
      value: since,
      unit: null,
      sub: `${days} day${summary.days === 1 ? "" : "s"}`,
      tone: "",
    },
    {
      label: "Deposited",
      value: usd(funding.deposited, false, divisor),
      unit: "USD",
      sub: null,
      tone: "",
    },
    {
      label: "Withdrawn",
      value: usd(funding.withdrawn, false, divisor),
      unit: "USD",
      sub: null,
      tone: "",
    },
    {
      label: "Trading result",
      value: usd(summary.trading, true, divisor),
      unit: "USD",
      sub: null,
      tone,
    },
    ...(performance
      ? [
          {
            label: "Return",
            value: pct(performance.returnPct),
            unit: null,
            sub: null,
            tone:
              performance.returnPct > 0
                ? "record-stat-value--up"
                : performance.returnPct < 0
                  ? "record-stat-value--down"
                  : "",
          },
          {
            label: "Deepest fall",
            value: pct(performance.deepest),
            unit: null,
            /* Two readings from one field. An account below its peak says
               how far; one that climbed back says how long it took. */
            sub:
              recovery?.kind === "recovered"
                ? `recovered in ${recovery.days} day${recovery.days === 1 ? "" : "s"}`
                : recovery?.kind === "open"
                  ? `now ${pct(recovery.fromPeak)} from peak`
                  : null,
            tone: performance.deepest < 0 ? "record-stat-value--down" : "",
          },
        ]
      : []),
  ];

  return (
    <dl className="record-stats">
      {stats.map((s) => (
        <div key={s.label} className="record-stat">
          <dt>{s.label}</dt>
          <dd className={`record-stat-value tnum ${s.tone}`}>
            {s.value}
            {s.unit ? <span className="record-stat-unit">{s.unit}</span> : null}
          </dd>
          {s.sub ? <dd className="record-stat-sub">{s.sub}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
