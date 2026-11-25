import fs from "node:fs";
import { expect, test } from "vitest";
import { RECORD_IS_SAMPLE, hasRecord, recordPoints } from "@/lib/record";

/**
 * The chart on /copytrade is drawing invented readings, at the owner's
 * instruction, while the site is unreleased and the account feed is not
 * wired up.
 *
 * That is a reasonable thing to want and a dangerous thing to forget. A
 * rising line on a trading page is a track record to everyone who sees it,
 * and a caption written under a picture is not part of the picture: the
 * screenshot that ends up in a WhatsApp group carries the line alone.
 *
 * So these guard the two things that make it safe, and they are written to
 * fail loudly on the day the feed lands and somebody changes one half of it.
 */

const SOURCE = fs.readFileSync("src/lib/record.ts", "utf8");
const PAGE = fs.readFileSync("src/app/copytrade/page.tsx", "utf8");
const FLAT = PAGE.replace(/\s+/g, " ");

test("the guards are reading the right files", () => {
  expect(SOURCE).toContain("export function recordPoints");
  expect(FLAT).toContain("<RecordChart");
});

test("the flag and the readings agree", () => {
  // Turning the flag off while the invented readings are still in the file
  // would publish them as the account's own history.
  if (!RECORD_IS_SAMPLE) {
    expect(SOURCE, "sample readings left behind").not.toMatch(
      /label:\s*"\d+ Nov"/,
    );
  }
  expect(hasRecord()).toBe(recordPoints().length > 0);
});

test("a sample series is labelled as one, inside the card", () => {
  if (!RECORD_IS_SAMPLE) return;
  // `note` prints inside the chart's own frame, above the readings table,
  // so a screenshot of the card carries it.
  expect(FLAT).toMatch(/note=/);
  expect(FLAT).toMatch(/Sample figures/);
  expect(FLAT).toMatch(/not connected yet/i);
});

test("the note is attached to the chart, not left in the prose", () => {
  if (!RECORD_IS_SAMPLE) return;
  // The section's own copy is the owner's, and on 25 November 2026 he
  // replaced the heading that said the numbers were not real. That makes
  // the card's own note the single thing standing between a sample shape
  // and a reader who takes it for a history, so it has to be ON the chart:
  // `note=` is rendered inside the frame, a sibling paragraph is not.
  const chart = FLAT.slice(FLAT.indexOf("<RecordChart"));
  const close = chart.indexOf("/>");
  expect(close).toBeGreaterThan(-1);
  expect(chart.slice(0, close)).toMatch(/note=\{[\s\S]*Sample figures/);
});

test("the sample shape is not a straight climb", () => {
  if (!RECORD_IS_SAMPLE) return;
  const values = recordPoints().map((p) => p.value);
  const falls = values.filter((v, i) => i > 0 && v < values[i - 1]).length;
  // A line that only goes up is the shape of a claim. This one has to come
  // down more than once, and must not end on its own high.
  expect(falls).toBeGreaterThan(1);
  expect(values[values.length - 1]).toBeLessThan(Math.max(...values));
});

test("the headline figure is standard, with the cent figure under it", () => {
  // The account is a cent account, so the feed counts in cents and a balance
  // reads a hundred times the money deposited. The owner's clients were
  // reading 54,900 and doing the arithmetic themselves, or not doing it.
  //
  // So the card leads with the standard figure and prints the cent figure
  // beneath it — both, because the second is the number they will see when
  // they log in to MT5, and a page that shows only the first teaches them to
  // distrust it.
  //
  // The conversion is derived, never typed: a page that passes a literal
  // 100 is a second copy of `CENTS_PER_USD`, and the two disagree the day
  // one of them changes.
  const chart = FLAT.slice(FLAT.indexOf("<RecordChart"));
  const props = chart.slice(0, chart.indexOf("/>"));
  expect(props).toContain('unit="USD"');
  expect(props).toContain('secondaryUnit="cent"');
  expect(props).toContain("divisor={CENTS_PER_USD}");
  expect(props).not.toMatch(/divisor=\{\s*\d/);
});
