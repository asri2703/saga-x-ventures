import { type RecordFunding, type RecordSummary, usd } from "@/lib/record";

/**
 * The four figures above the chart.
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
 * Server-rendered: every figure is computed from the deal history at render.
 */
export function RecordStats({
  summary,
  funding,
  divisor,
}: {
  summary: RecordSummary;
  funding: RecordFunding;
  /** Account units per dollar: 100 for a cent account, 1 otherwise. */
  divisor: number;
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
