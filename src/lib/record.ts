/**
 * The account's record.
 *
 * This is the one place the chart on /copytrade reads from. When the VPS API
 * is ready, the whole change is here: fetch the series, return it, and set
 * `RECORD_IS_SAMPLE` to false. Nothing else has to move.
 *
 * Today it returns a shape, not a history, because the owner wants the chart
 * visible while the site is still unreleased. Two things keep that honest:
 *
 * 1. `RECORD_IS_SAMPLE`. The page reads it and says so on the chart itself,
 *    inside the frame, where a screenshot carries it. A rising line on a
 *    trading page is a track record to everyone who sees it, and a caption
 *    under a picture is not part of the picture.
 *
 * 2. The shape. It rises, falls, rises and ends below its own high, because
 *    a sample that only goes up is the shape of a claim rather than the
 *    shape of an account.
 *
 * The day the feed lands, both go: real readings, and the flag off.
 */

export type RecordPoint = {
  /** What the x-axis reads at this point — a date, as the feed states it. */
  label: string;
  /** The account's balance, in the account's own cent units. */
  value: number;
};

/**
 * Whether what `recordPoints` returns is invented.
 *
 * True until the feed is wired. `record.test.ts` fails if this is turned off
 * while the readings below are still the ones written in this file, so the
 * flag cannot be switched and the sample left behind.
 */
export const RECORD_IS_SAMPLE = true;

const SAMPLE: RecordPoint[] = [
  { label: "1 Nov", value: 50000 },
  { label: "4 Nov", value: 51200 },
  { label: "7 Nov", value: 50400 },
  { label: "10 Nov", value: 52800 },
  { label: "13 Nov", value: 52100 },
  { label: "16 Nov", value: 54300 },
  { label: "19 Nov", value: 53100 },
  { label: "22 Nov", value: 55600 },
  { label: "25 Nov", value: 54900 },
];

export function recordPoints(): RecordPoint[] {
  return RECORD_IS_SAMPLE ? SAMPLE : [];
}

/** Whether there is anything to draw. Named, because "length === 0" in a
    page reads as a list being empty rather than as a feed being unwired. */
export function hasRecord(): boolean {
  return recordPoints().length > 0;
}
