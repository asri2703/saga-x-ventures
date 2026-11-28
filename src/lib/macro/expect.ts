import type { Obs } from "./store";

/**
 * Saga estimates: what the next number is likely to be, worked out in the
 * open from the publishers' own history. Pure.
 *
 * These are not the market consensus. The consensus traders quote is a poll
 * of bank economists that news agencies sell under licence; HQ does not
 * carry it. Each estimate here says how it was made, so a member can judge
 * it, and the page shows the official number next to it once it lands.
 *
 *  - CPI, month on month: the average of the last three seasonally
 *    adjusted months (momentum).
 *  - CPI, year on year: base effect, from the index level rolled forward
 *    one month at its 3-month pace, against the same month a year before.
 *  - Payrolls, unemployment, earnings: the three-month average, the trend
 *    desks use to smooth one noisy month.
 *  - Fed funds: no number. The two-year Treasury yield against the middle of
 *    the Fed's range shows which way bonds lean over the next two years.
 */

export type Estimate = {
  value: number;
  /** For which month or period, e.g. "2026-11-01" (first of the month). */
  period: string;
  /** How it was worked out, in one sentence. */
  method: string;
  /** The numbers that went in, for the "show working" line. */
  working: string;
};

/** Half away from zero, so -0.375 is -0.38 like 0.375 is 0.38. */
const round = (v: number, decimals: number) =>
  (Math.sign(v) * Math.round(Math.abs(v) * 10 ** decimals + Number.EPSILON)) / 10 ** decimals;

function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** "2026-10-01" → "2026-11-01" (or back, with a negative step). */
export function shiftMonth(date: string, step: number): string {
  const [y, m] = date.split("-").map(Number);
  const total = y * 12 + (m - 1) + step;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

function fmt(v: number, decimals: number, suffix: string): string {
  return `${v.toFixed(decimals)}${suffix}`;
}

/** The average of the last `n` readings, as the estimate for the month after. */
export function trendEstimate(points: Obs[], n: number, decimals: number, suffix: string): Estimate | null {
  if (points.length < n) return null;
  const last = points.slice(-n);
  const value = round(avg(last.map((p) => p.value)), decimals);
  return {
    value,
    period: shiftMonth(last[last.length - 1].date, 1),
    method: `Average of the last ${n} months.`,
    working: last.map((p) => fmt(p.value, decimals, suffix)).join(" + ") + ` ÷ ${n}`,
  };
}

/**
 * Next year-on-year CPI by base effect, from the price index itself: roll
 * the latest index forward one month at the recent monthly pace, then set
 * it against the same month a year earlier.
 *
 *   next ≈ index(last) × (1 + average of the last 3 monthly changes) ÷ index(12 months before next) − 1
 *
 * Working from index levels rather than the last year-on-year rate means a
 * month with no published year-on-year figure (October 2026, whose October
 * 2025 base was never collected) does not stop the estimate for the month
 * after it. If the base month itself is missing, there is no estimate.
 */
export function cpiYoyEstimate(index: Obs[], mom: Obs[]): Estimate | null {
  const last = index[index.length - 1];
  if (!last || mom.length < 3) return null;
  const target = shiftMonth(last.date, 1);
  const recent = mom.slice(-3);
  // The momentum must run up to the index's own latest month.
  if (recent[recent.length - 1].date !== last.date) return null;
  const mNew = avg(recent.map((p) => p.value));
  const base = index.find((p) => p.date === shiftMonth(target, -12));
  if (!base) return null;
  const projected = last.value * (1 + mNew / 100);
  const value = round((projected / base.value - 1) * 100, 1);
  return {
    value,
    period: target,
    method:
      "Base effect: the latest price index rolled forward at its 3-month pace, against the same month a year earlier.",
    working: `${last.value.toFixed(1)} × (1 + ${mNew.toFixed(2)}%) ÷ ${base.value.toFixed(1)} − 1`,
  };
}

/**
 * When the price index has a newer month than year-on-year, that month's
 * year-on-year change was not published (no base a year earlier). Returns
 * that month, or null.
 */
export function unpublishedYoy(yoy: Obs[], index: Obs[]): string | null {
  const y = yoy.at(-1)?.date;
  const i = index.at(-1)?.date;
  return y && i && i > y ? i : null;
}

/** Each series' estimate, given every series' history by slug. */
export function estimateFor(slug: string, data: Record<string, Obs[] | undefined>): Estimate | null {
  const own = data[slug] ?? [];
  switch (slug) {
    case "cpi-mom":
    case "core-cpi-mom":
      return trendEstimate(own, 3, 1, "%");
    case "cpi-yoy":
      return cpiYoyEstimate(data["cpi-index"] ?? [], data["cpi-mom"] ?? []);
    case "core-cpi-yoy":
      return cpiYoyEstimate(data["core-cpi-index"] ?? [], data["core-cpi-mom"] ?? []);
    case "nfp":
      return trendEstimate(own, 3, 0, "K");
    case "unemployment":
    case "earnings-yoy":
      return trendEstimate(own, 3, 1, "%");
    default:
      return null;
  }
}

export type RateLean = {
  lean: "cuts" | "hold" | "hikes";
  /** Two-year yield minus the middle of the Fed's range, in points. */
  spread: number;
  sentence: string;
};

/** Which way bonds lean on Fed policy, from the 2-year yield and the target range. */
export function rateLean(upper: number, twoYear: number): RateLean {
  const mid = upper - 0.125;
  const spread = round(twoYear - mid, 2);
  const lean = spread <= -0.25 ? "cuts" : spread >= 0.25 ? "hikes" : "hold";
  const gap = `${Math.abs(spread).toFixed(2)} points ${spread < 0 ? "below" : "above"} the middle of the Fed's range`;
  const sentence =
    lean === "cuts"
      ? `The 2-year yield is ${gap}, so bonds are pricing rate cuts over the next two years.`
      : lean === "hikes"
        ? `The 2-year yield is ${gap}, so bonds are pricing rate rises over the next two years.`
        : `The 2-year yield is ${gap}, close enough that bonds expect rates to stay about where they are.`;
  return { lean, spread, sentence };
}

export const TONE_MIN = 3;

export type Tone = { hawkish: number; dovish: number; label: "Hawkish" | "Dovish" | "Mixed" | "Quiet" };

/**
 * The lean of recent central-bank stories on the wire. The classifier marks
 * each story bearish or bullish for gold; for a central-bank story that is
 * a fair stand-in for hawkish (higher rates) or dovish.
 */
export function toneOf(items: { direction: string }[]): Tone {
  const hawkish = items.filter((i) => i.direction === "bearish").length;
  const dovish = items.filter((i) => i.direction === "bullish").length;
  const total = hawkish + dovish;
  // Under three directional stories is too few to call a tone.
  const label =
    total < TONE_MIN ? "Quiet" : hawkish / total >= 0.6 ? "Hawkish" : dovish / total >= 0.6 ? "Dovish" : "Mixed";
  return { hawkish, dovish, label };
}
