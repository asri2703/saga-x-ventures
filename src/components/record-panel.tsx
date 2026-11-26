import { type RecordAccount, divisorFor } from "@/lib/record-accounts";
import {
  type RecordDay,
  type RecordFunding,
  calendarMonths,
  summarise,
  toPoints,
} from "@/lib/record";
import { performance as performanceOf } from "@/lib/record-outcomes";
import { RecordCalendar } from "@/components/record-calendar";
import { RecordChart } from "@/components/record-chart";
import { RecordLive } from "@/components/record-live";
import { RecordStats } from "@/components/record-stats";

/**
 * One account's whole record: when it last reported, the four figures, the
 * balance, and the calendar.
 *
 * Server-rendered and handed to `RecordTabs` as a prop, so switching account
 * swaps markup that is already built. Nothing in here carries `data-reveal`:
 * the reveals are collected once on mount, and a panel that is not showing
 * then would arrive later hidden with nothing to un-hide it (the same rule
 * `plan-switch.tsx` follows). The tabs' wrapper carries the reveal instead.
 */
export function RecordPanel({
  account,
  days,
  funding,
  lastAt,
  today,
}: {
  account: RecordAccount;
  days: RecordDay[];
  funding: RecordFunding;
  lastAt: string | null;
  /** Malaysian date; the calendar's record runs to here. */
  today: string;
}) {
  const divisor = divisorFor(account.unit);
  const summary = summarise(days);
  const perf = performanceOf(days);
  /* The whole record, not the last three months. The calendar shows one
     month at a time behind a picker now, so its height no longer grows with
     the record and there is nothing to be gained by withholding the rest. */
  const months = calendarMonths(days, 24, today);

  return (
    <div>
      {/* The per-account note was here. It went with the badges — see
          `record-accounts.ts`. What it said that still matters ("updated
          every hour") is in the chart's own note, which a screenshot of the
          card carries and a caption above it would not. */}
      {lastAt ? (
        <div className="text-center">
          <RecordLive at={lastAt} />
        </div>
      ) : null}

      {summary ? (
        <div className="record mt-6">
          <RecordStats
            summary={summary}
            funding={funding}
            divisor={divisor}
            performance={perf}
          />
        </div>
      ) : null}

      <div className={summary ? "mt-4" : "mt-6"}>
        <RecordChart
          points={toPoints(days)}
          name="Balance"
          /* The card leads with the dollar figure; for a cent account it
             prints the account's own figure under it, the number the reader
             sees in MT5. The conversion is `divisorFor`, which reads
             `CENTS_PER_USD`, so there is one place that knows what a cent
             account's unit is. */
          unit="USD"
          divisor={divisor}
          secondaryUnit={account.unit === "cent" ? "cent" : undefined}
          note="From this account's MT5 terminal, updated every hour: each point is the balance at the close of its day, from every deal since the account opened. The balance includes deposits and withdrawals. Past results do not predict future ones."
          empty="The line starts the day this account's feed is connected. Nothing is drawn here until it is."
        />
      </div>

      {months.length > 0 ? (
        <div className="record mt-4">
          <RecordCalendar months={months} divisor={divisor} />
        </div>
      ) : null}
    </div>
  );
}
