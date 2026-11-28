/**
 * The COT detail page's words and gauges, worked out from the numbers. Pure.
 *
 * The headline is written from the data every time, never by a model, so
 * it cannot drift from the table under it.
 */

export type RangeSpot = {
  low: { date: string; value: number };
  high: { date: string; value: number };
  /** Where the latest net sits between the low (0) and the high (1). */
  position: number;
};

/** Where `latest` sits within the low and high of `points`. Null with no spread. */
export function rangeSpot(points: { date: string; value: number }[], latest: number): RangeSpot | null {
  if (points.length === 0) return null;
  let low = points[0];
  let high = points[0];
  for (const p of points) {
    if (p.value < low.value) low = p;
    if (p.value > high.value) high = p;
  }
  const spread = high.value - low.value;
  if (spread <= 0) return null;
  const position = Math.min(1, Math.max(0, (latest - low.value) / spread));
  return { low, high, position };
}

/** How far into its range a position sits, in words a trader uses. */
export function crowding(position: number): string {
  if (position >= 0.9) return "near the top of its range, crowded";
  if (position >= 0.7) return "in the upper part of its range";
  if (position <= 0.1) return "near the bottom of its range, crowded the other way";
  if (position <= 0.3) return "in the lower part of its range";
  return "mid-range, not crowded";
}

function size(shareOfOi: number): string {
  const s = Math.abs(shareOfOi);
  if (s >= 0.2) return "a large";
  if (s >= 0.08) return "a sizeable";
  return "a small";
}

/**
 * One sentence on the week: who holds what, how big, and what they did.
 * "Funds hold a large net long in gold, and trimmed it by 9,399 contracts this week."
 */
export function cotHeadline(input: {
  subject: string;
  net: number;
  change: number | null;
  openInterest: number;
}): string {
  const { subject, net, change, openInterest } = input;
  if (net === 0) return `Funds are flat in ${subject} this week.`;
  const side = net > 0 ? "long" : "short";
  const share = openInterest > 0 ? net / openInterest : 0;
  const base = `Funds hold ${size(share)} net ${side} in ${subject}`;
  if (change === null) return `${base}.`;
  if (change === 0) return `${base}, unchanged on the week.`;
  const n = Math.abs(change).toLocaleString("en-US");
  // Same sign as the position: they added to it. Opposite: they cut it.
  const added = Math.sign(change) === Math.sign(net);
  const flipped = Math.sign(net - change) !== Math.sign(net) && net - change !== 0;
  if (flipped) return `${base}, after switching sides this week (${change > 0 ? "+" : "−"}${n} contracts).`;
  return `${base}, and ${added ? "added" : "trimmed it by"} ${n} contracts this week.`;
}
