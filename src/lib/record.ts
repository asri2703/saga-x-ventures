import { CENTS_PER_USD } from "@/lib/commercial";
import { serviceClient } from "@/lib/supabase";

/**
 * An account figure as dollars: "792.62", or "+292.62" / "−12.40" when
 * `signed`. `divisor` is how many of the account's units make a dollar —
 * 100 for a cent account, 1 for a dollar one (`divisorFor` in
 * record-accounts.ts). The unit is left to the caller, which sets it in
 * smaller type.
 */
export function usd(
  amount: number,
  signed = false,
  divisor: number = CENTS_PER_USD,
): string {
  const value = amount / divisor;
  const figure = new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  if (!signed) return value < 0 ? `−${figure}` : figure;
  if (value > 0) return `+${figure}`;
  if (value < 0) return `−${figure}`;
  return figure;
}

/**
 * The account's record.
 *
 * The one place the record on /copytrade reads from. The figures are each
 * account's own, posted hourly by a reporter EA on that account's terminal
 * (mt5/SagaRecordReporter.mq5 → /api/record/ingest → Supabase). Which
 * accounts, and in what unit, is `record-accounts.ts`.
 *
 * The balance is rebuilt from the deal history by the `account_daily_balance`
 * view, not read from the hourly snapshots: the EA sends every deal since the
 * account opened, so the line starts on the first deposit rather than on the
 * day the EA was attached. The two agree to the cent — the sum of the deals
 * is how MT5 computes its own balance.
 *
 * Nothing in this file is typed by hand. Until the EA has posted, there is
 * nothing to draw, and the chart says so rather than drawing a shape.
 */

export type RecordPoint = {
  /** What the x-axis reads at this point — "25 Nov". */
  label: string;
  /** The account's balance, in the account's own units. */
  value: number;
};

/** A year. Day-and-month labels are unique inside it, and the chart keys on
 *  them. */
const MAX_DAYS = 365;

/** Whether there is a database to read. Which accounts to read is
 *  `recordAccounts()`; the secret is the writer's business. */
function canRead(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** "2026-11-25" → "25 Nov". The day is already Malaysian, so read it in UTC
 *  to keep the runtime's own zone from moving it. */
export function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** One Malaysian calendar day of the account, in the account's own units
 *  (cents for a cent account). */
export type RecordDay = {
  /** "2026-11-25" */
  day: string;
  /** At the close of the day. */
  balance: number;
  /** Deposits less withdrawals made that day. */
  funding: number;
  /** What the trading did that day, after swap, commission and fees. */
  trading: number;
  /** Trades closed that day. */
  closed: number;
};

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Every day that has deals, oldest first.
 *
 * Unconfigured is an empty record, not an error: the site builds and serves
 * without the feed. A database error *is* thrown — the page is ISR, and a
 * failed regeneration keeps serving the last good page, where swallowing the
 * error would cache an empty chart for an hour.
 */
export async function recordDays(login: number): Promise<RecordDay[]> {
  if (!canRead()) return [];

  const { data, error } = await serviceClient()
    .from("account_daily_balance")
    .select("day, balance, funding, trading, closed")
    .eq("login", login)
    .order("day", { ascending: false })
    .limit(MAX_DAYS);

  if (error) throw new Error(`record: ${error.message}`);

  return (data ?? [])
    .map((row) => ({
      day: String(row.day),
      balance: num(row.balance),
      funding: num(row.funding),
      trading: num(row.trading),
      closed: num(row.closed),
    }))
    .reverse();
}

/**
 * When the EA last reported, as an ISO string — or null if it never has.
 * This is what the "updated" mark under the heading reads, so a feed that
 * has stopped says so instead of passing for live.
 */
export async function lastReportAt(login: number): Promise<string | null> {
  if (!canRead()) return null;

  const { data, error } = await serviceClient()
    .from("account_snapshots")
    .select("taken_at")
    .eq("login", login)
    .order("taken_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`record: ${error.message}`);
  return data ? new Date(String(data.taken_at)).toISOString() : null;
}

export type RecordFunding = {
  /** Every deposit, added up. Positive. */
  deposited: number;
  /** Every withdrawal, added up, as a positive figure. */
  withdrawn: number;
};

/**
 * Money in and money out, kept apart.
 *
 * Read from the deals themselves (type 2, MT5's balance operations) rather
 * than from the daily view's net figure: a deposit and a withdrawal on the
 * same day would net to one number there, and this has to show both. There
 * are only ever a handful of these rows per account.
 *
 * Shown as two figures, not one net one, because a net figure goes negative
 * the moment more has been withdrawn than deposited — which is a good fact
 * about an account, and reads as a fault when printed as "−4,120".
 */
export async function recordFunding(login: number): Promise<RecordFunding> {
  if (!canRead()) return { deposited: 0, withdrawn: 0 };

  const { data, error } = await serviceClient()
    .from("account_deals")
    .select("profit")
    .eq("login", login)
    .eq("type", 2);

  if (error) throw new Error(`record: ${error.message}`);
  return fundingOf((data ?? []).map((row) => num(row.profit)));
}

/** Split balance operations into deposits and withdrawals. */
export function fundingOf(amounts: number[]): RecordFunding {
  let deposited = 0;
  let withdrawn = 0;
  for (const a of amounts) {
    if (a > 0) deposited += a;
    else withdrawn -= a;
  }
  return { deposited, withdrawn };
}

/** Today's date in Malaysia, "2026-11-26". Reads the clock: only for pages
 *  that regenerate (see freshness.test.ts). */
export function todayInMalaysia(now: number = Date.now()): string {
  return new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** The chart's series. */
export function toPoints(days: RecordDay[]): RecordPoint[] {
  return days.map((d) => ({ label: dayLabel(d.day), value: d.balance }));
}

export type RecordSummary = {
  /** The first day with a deal. */
  since: string;
  /** Deposits less withdrawals, all time. */
  funding: number;
  /** Everything the trading did, all time. Balance = funding + trading. */
  trading: number;
  /** Calendar days from the first to the last, both counted. */
  days: number;
};

/** The figures above the chart, or null when there is nothing to sum. */
export function summarise(days: RecordDay[]): RecordSummary | null {
  if (days.length === 0) return null;
  const first = days[0].day;
  const last = days[days.length - 1].day;
  const span =
    (Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) /
    86_400_000;
  return {
    since: first,
    funding: days.reduce((s, d) => s + d.funding, 0),
    trading: days.reduce((s, d) => s + d.trading, 0),
    days: Math.round(span) + 1,
  };
}

export type CalendarCell = {
  day: string;
  /** Day of the month. */
  date: number;
  /** The day's trading in cents, or null for a day with no trades. */
  trading: number | null;
  closed: number;
  /** Inside the record: on or after the first day, on or before the last.
   *  A day outside it is not "no trades" — the account was not open yet, or
   *  the day has not happened. */
  inRecord: boolean;
};

export type CalendarMonth = {
  /** "November 2026" */
  label: string;
  /** Empty slots before the 1st, so the 1st lands under its weekday
   *  (Monday first). */
  lead: number;
  cells: CalendarCell[];
  /** The month's trading, in cents. */
  trading: number;
};

/**
 * The months that hold the record, newest first, at most `limit` of them.
 * Every day of each month is a cell, traded or not, so a quiet day reads as
 * quiet rather than vanishing.
 */
export function calendarMonths(
  days: RecordDay[],
  limit = 3,
  /** Malaysian date, "2026-11-26". The record runs to here, so a quiet
   *  weekend after the last trade reads as quiet, not as not-yet. Defaults
   *  to the last day with deals. */
  today?: string,
): CalendarMonth[] {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const firstDay = days[0]?.day ?? "";
  const lastDeal = days[days.length - 1]?.day ?? "";
  const lastDay = today && today > lastDeal ? today : lastDeal;
  const months = [...new Set(days.map((d) => d.day.slice(0, 7)))]
    .sort()
    .reverse()
    .slice(0, limit);

  return months.map((ym) => {
    const [y, m] = ym.split("-").map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells: CalendarCell[] = Array.from({ length }, (_, i) => {
      const day = `${ym}-${String(i + 1).padStart(2, "0")}`;
      const found = byDay.get(day);
      const traded = found && (found.closed > 0 || found.trading !== 0);
      return {
        day,
        date: i + 1,
        trading: traded ? found.trading : null,
        closed: found?.closed ?? 0,
        // ISO dates compare correctly as strings.
        inRecord: day >= firstDay && day <= lastDay,
      };
    });
    return {
      label: first.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      lead: (first.getUTCDay() + 6) % 7,
      cells,
      trading: cells.reduce((s, c) => s + (c.trading ?? 0), 0),
    };
  });
}
