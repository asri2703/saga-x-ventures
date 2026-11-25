/**
 * The account's record.
 *
 * This is the one place the chart on /copytrade reads from, and today it is
 * empty on purpose. The account is live and trading; what is missing is a
 * feed, not a history.
 *
 * When the VPS API is ready, this is the whole change: fetch the series here
 * and return it. The page, the chart and the empty state all already behave
 * correctly for both cases, so nothing else has to be touched.
 *
 * What must NOT happen in the meantime is a sample series, a demo curve or a
 * "representative" shape. A rising line on a trading page is a track record
 * to everyone who sees it, whatever the caption says, and nobody screenshots
 * the caption. Empty is the honest state and the page says so in words.
 */

export type RecordPoint = {
  /** What the x-axis reads at this point — a date, as the feed states it. */
  label: string;
  /** The account's balance, in the account's own currency units. */
  value: number;
};

export function recordPoints(): RecordPoint[] {
  return [];
}

/** Whether there is anything to draw. Named, because "length === 0" in a
    page reads as a list being empty rather than as a feed being unwired. */
export function hasRecord(): boolean {
  return recordPoints().length > 0;
}
