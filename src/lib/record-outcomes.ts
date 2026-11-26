import type { RecordDay } from "@/lib/record";

/**
 * What a stretch of this record actually did, as a spread rather than a rate.
 *
 * The calculator on /copytrade answers "how much do I need to deposit to make
 * $X a month". Every honest version of that answer rests on a return, and the
 * question is which one.
 *
 * An average will not do it. The three accounts run the same EA on the same
 * settings and their averages are 28%, 87% and 220% a month — the spread is
 * not strategy, it is length: the shortest record has the highest average,
 * because a short record is a lucky streak that has not met its bad week yet.
 * Compounding any of them produces numbers that discredit the page they sit
 * on.
 *
 * So the basis here is every stretch of `window` trading days the record
 * actually contains, scored and sorted. On the longest account that is 81
 * overlapping thirty-day stretches, of which five lost money. A calendar-month
 * view of the same record shows no losing month at all — the losses sit inside
 * the months, and only a rolling window finds them. That is the whole reason
 * this is not grouped by month.
 *
 * Everything here is a ratio, so it is unit-free: a cent account and a dollar
 * account produce the same numbers and no divisor is needed.
 */

export type Outcomes = {
  /** Trading days per stretch. */
  window: number;
  /** How many stretches the record holds. Below one, there is no answer. */
  count: number;
  /** Ratios: 0.268 is +26.8%. */
  worst: number;
  lower: number;
  median: number;
  upper: number;
  best: number;
  /** Stretches that ended down. The figure the page must not round away. */
  losing: number;
};

/**
 * One day's return, on the capital actually at risk that day.
 *
 * `balance` is cumulative and already includes funding, so the previous day's
 * balance plus today's funding is the base today's trading worked on. Adding
 * the funding is what makes a day-one deposit the denominator of day one
 * rather than a division by zero.
 *
 * Days the record does not contain — weekends, quiet days — have no row at
 * all. That is fine and needs no filling: because `balance` is cumulative, the
 * previous ROW's balance is still the true balance on the day before this one.
 */
export function dailyReturns(days: RecordDay[]): number[] {
  const out: number[] = [];
  let previous = 0;
  for (const day of days) {
    /* Funding is counted at the END of the day, so a day's trading is
       measured against the capital that was already there.
       ---------------------------------------------------------------
       The daily rows do not keep the time of a deal, so on a day that had
       both a withdrawal and trading we have to choose when the money left.
       Counting it at the start shrinks the base and raises the return;
       counting it at the end does the opposite. On the longest account —
       six such days — the two readings are 267.2% and 257.9%. The truth is
       between them and we cannot see which without the timestamps.
       So this takes the lower, on the owner's own standing instruction
       about which way to lean when the method is uncertain: never the
       flattering one. The first day is the exception, because there is no
       prior capital at all and the day's own deposit is the only base
       there is. */
    const base = previous > 0 ? previous : previous + day.funding;
    out.push(base > 0 ? day.trading / base : 0);
    previous = day.balance;
  }
  return out;
}

export type Performance = {
  /** Time-weighted return over the whole record. 0.646 is +64.6%. */
  returnPct: number;
  /** Deepest fall from a peak, as a negative ratio. 0 when never below one. */
  deepest: number;
  /**
   * Where that fall stands now. `null` when there has never been one.
   *
   * This is not a fact about today that can be written down once. An account
   * sitting below its peak crosses back over it on some ordinary Tuesday,
   * and the reading has to change by itself when it does — the page is
   * rebuilt on every hourly report, so it will.
   */
  recovery:
    | { kind: "recovered"; days: number }
    | { kind: "open"; fromPeak: number }
    | null;
};

/** The whole record's return, its deepest fall, and whether it came back. */
export function performance(days: RecordDay[]): Performance | null {
  if (days.length === 0) return null;

  const returns = dailyReturns(days);

  let index = 1;
  let peak = 1;
  let deepest = 0;
  let troughAt = -1;
  let peakAtTrough = 1;

  const indices: number[] = [];
  for (const r of returns) {
    index *= Math.max(1 + r, 1e-9);
    indices.push(index);
    if (index > peak) peak = index;
    const drawdown = index / peak - 1;
    if (drawdown < deepest) {
      deepest = drawdown;
      troughAt = indices.length - 1;
      peakAtTrough = peak;
    }
  }

  let recovery: Performance["recovery"] = null;
  if (troughAt >= 0) {
    /* A float product lands on the last bit, and an account can sit a
       hundredth of a percent under its peak for weeks. The tolerance is far
       below anything the page prints. */
    const back = indices.findIndex(
      (value, i) => i > troughAt && value >= peakAtTrough * (1 - 1e-9),
    );
    recovery =
      back === -1
        ? { kind: "open", fromPeak: indices[indices.length - 1] / peak - 1 }
        : {
            kind: "recovered",
            days: daysBetween(days[troughAt].day, days[back].day),
          };
  }

  return { returnPct: index - 1, deepest, recovery };
}

/** Calendar days from one ISO date to another, counting neither twice. */
function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

/** The product of a stretch, as a ratio. */
function compound(returns: number[]): number {
  let factor = 1;
  for (const r of returns) {
    // An account taken past zero would send the product negative and every
    // stretch containing it meaningless. Floor the factor and let the stretch
    // read as a near-total loss, which is what it was.
    factor *= Math.max(1 + r, 1e-9);
  }
  return factor - 1;
}

/** Linear-interpolated percentile over a sorted ascending list. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const at = (sorted.length - 1) * p;
  const low = Math.floor(at);
  const high = Math.ceil(at);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (at - low);
}

/**
 * Every `window`-trading-day stretch in the record, summarised.
 *
 * Returns null when the record is shorter than one stretch — the calculator
 * then has nothing honest to say and says nothing, rather than extrapolating
 * from a record too short to carry the question.
 */
export function outcomes(days: RecordDay[], window = MONTH): Outcomes | null {
  if (window < 1 || days.length < window) return null;

  const returns = dailyReturns(days);
  const scored: number[] = [];
  for (let i = 0; i + window <= returns.length; i++) {
    scored.push(compound(returns.slice(i, i + window)));
  }
  if (scored.length === 0) return null;

  const sorted = [...scored].sort((a, b) => a - b);
  return {
    window,
    count: scored.length,
    worst: sorted[0],
    lower: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    upper: percentile(sorted, 0.75),
    best: sorted[sorted.length - 1],
    losing: scored.filter((value) => value < 0).length,
  };
}

/**
 * The deposit a goal implies, at the middle of the spread.
 *
 * The middle, not the average: half the stretches on record did better than
 * this and half did worse, which is the only honest thing a single number can
 * claim. Null when the middle is not positive — a record whose typical stretch
 * loses money cannot be turned into a deposit for a profit goal, and the
 * calculator says so instead of dividing by a negative.
 */
export function depositFor(goal: number, median: number): number | null {
  if (!(goal > 0) || !(median > 0)) return null;
  return goal / median;
}

/**
 * Lots traded in a day for every $1,000 of capital.
 *
 * Total volume over total capital-days, not the average of each day's
 * ratio. The two are not the same and the difference is not small: a day
 * early in the record, when the account was small, produces a huge ratio
 * that an average then carries for the whole series. On the longest record
 * the average of ratios says 113 and this says 1.7.
 *
 * `capital` is the previous day's closing balance, in the account's own
 * units, so `divisor` converts it to dollars. Lots are lots in either case.
 */
export function lotsPerDayPer1000(
  days: RecordDay[],
  totalLots: number,
  divisor: number,
): number | null {
  let capitalDays = 0;
  let previous = 0;
  for (const day of days) {
    if (previous > 0) capitalDays += previous / divisor;
    previous = day.balance;
  }
  if (capitalDays <= 0 || !(totalLots > 0)) return null;
  return totalLots / (capitalDays / 1000);
}

export type Projection = {
  /** What the goal implies, at the middle of the spread. */
  deposit: number;
  /** Dollars a day and a week, at the same rate. */
  daily: number;
  weekly: number;
  /** The middle stretch's return, as a ratio. */
  monthly: number;
  /** Deepest fall on record, as a ratio, and what it costs on this deposit. */
  drawdown: number;
  drawdownAmount: number;
  /** Lots this deposit would trade in a day, or null when unknown. */
  lots: number | null;
};

/** Trading days in a week. The record has no weekend rows. */
const WEEK = 5;

/**
 * Trading days in a month.
 *
 * Twenty-one, not thirty. The record holds no weekends, so a thirty-row
 * stretch is six calendar weeks — and a calculator that called it "a month"
 * sized every deposit for roughly forty percent more time than the person
 * asked for. Someone wanting $500 a month would have been given the deposit
 * that makes $500 in six weeks.
 */
export const MONTH = 21;

/**
 * The goal, turned into the six figures the calculator shows.
 *
 * Daily and weekly are the monthly rate taken down, not measured
 * separately: one rate stated three ways cannot contradict itself, and a
 * separately-measured daily average would not multiply back to the monthly
 * figure beside it.
 */
export function project(
  goal: number,
  spread: Outcomes,
  deepest: number,
  lots: number | null,
): Projection | null {
  const deposit = depositFor(goal, spread.median);
  if (deposit === null) return null;

  const daily = Math.pow(1 + spread.median, 1 / spread.window) - 1;
  const weekly = Math.pow(1 + daily, WEEK) - 1;

  return {
    deposit,
    daily: deposit * daily,
    weekly: deposit * weekly,
    monthly: spread.median,
    drawdown: deepest,
    drawdownAmount: deposit * deepest,
    lots: lots === null ? null : (deposit / 1000) * lots,
  };
}
