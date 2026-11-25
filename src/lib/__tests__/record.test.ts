import fs from "node:fs";
import { expect, test } from "vitest";
import { hasRecord, recordPoints } from "@/lib/record";

/**
 * The chart on /copytrade is built and waiting for a feed that does not
 * exist yet. The tempting thing to do with an empty chart is to give it
 * something to draw — a sample series, a demo curve, a "representative"
 * shape to check the styling with.
 *
 * On a trading page a rising line is a track record to everyone who sees
 * it, whatever the caption underneath says, and a screenshot carries the
 * line without the caption. These guards hold the file empty until the
 * numbers are real, and `claims.test.ts` holds the rest of the site to the
 * same rule.
 *
 * They are meant to be deleted in the same change that wires the feed up —
 * at which point the series is the account's own and no longer invented.
 */

const SOURCE = fs.readFileSync("src/lib/record.ts", "utf8");

test("the guard is reading the right file", () => {
  expect(SOURCE).toContain("export function recordPoints");
});

test("there is no series yet", () => {
  expect(recordPoints()).toEqual([]);
  expect(hasRecord()).toBe(false);
});

test("no sample readings are written into the file", () => {
  // Any object literal carrying a value is a reading, and a reading nobody
  // took is a fabricated one.
  expect(SOURCE).not.toMatch(/value:\s*[\d.]/);
  expect(SOURCE).not.toMatch(/label:\s*"/);
});

test("the page states the absence rather than leaving a blank frame", () => {
  const page = fs.readFileSync("src/app/copytrade/page.tsx", "utf8");
  expect(page).toMatch(/no numbers on this page yet/i);
  // The chart's own empty state, which is what a reader sees inside the
  // frame if they skip the heading.
  expect(page).toMatch(/empty=/);
});
