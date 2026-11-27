import { expect, test } from "vitest";
import { type RecordDay, calendarMonths } from "@/lib/record";

/**
 * A new month appears by itself.
 *
 * The months are not a list anybody maintains: they are the distinct
 * `YYYY-MM` prefixes of the days the record holds, newest first. So the
 * first December deal creates December, and nothing has to be deployed on
 * the first of the month — which is exactly when nobody is watching.
 *
 * This guards the rollover specifically, because it is the kind of fault
 * that cannot be seen until the date arrives and then cannot be missed.
 */

function day(date: string, trading = 10): RecordDay {
  return { day: date, balance: 1000, funding: 0, trading, closed: 1 };
}

test("the first day of a new month creates that month, newest first", () => {
  const before = calendarMonths([day("2026-11-27"), day("2026-11-30")], 24, "2026-11-30");
  expect(before.map((m) => m.label)).toEqual(["November 2026"]);

  // One December deal lands. Nothing else changes.
  const after = calendarMonths(
    [day("2026-11-27"), day("2026-11-30"), day("2026-12-01")],
    24,
    "2026-12-01",
  );
  expect(after.map((m) => m.label)).toEqual(["December 2026", "November 2026"]);
});

test("the newest month is first, so the picker opens on it", () => {
  // `RecordCalendar` shows months[0]. That has to be the month being traded.
  const months = calendarMonths(
    [day("2026-09-15"), day("2026-12-02"), day("2026-10-20")],
    24,
    "2026-12-02",
  );
  expect(months[0].label).toBe("December 2026");
});

test("a new year sorts after the old one", () => {
  // The prefixes are compared as strings, and "2026-12" < "2027-01" holds.
  const months = calendarMonths(
    [day("2026-12-30"), day("2027-01-02")],
    24,
    "2027-01-02",
  );
  expect(months.map((m) => m.label)).toEqual(["January 2027", "December 2026"]);
});

test("each month gets its own length and its own first weekday", () => {
  // Anti-vacuity: a generated month that was always 31 days starting Monday
  // would pass the tests above. These are the two things that differ.
  const dec = calendarMonths([day("2026-12-01")], 24, "2026-12-01")[0];
  const feb = calendarMonths([day("2027-02-01")], 24, "2027-02-01")[0];
  const leap = calendarMonths([day("2028-02-01")], 24, "2028-02-01")[0];

  expect(dec.cells).toHaveLength(31);
  expect(feb.cells).toHaveLength(28);
  expect(leap.cells).toHaveLength(29); // 2028 is a leap year
  // 1 Dec 2026 is a Tuesday, so one empty cell leads it (Monday first).
  expect(dec.lead).toBe(1);
});

test("days that have not happened yet are not called quiet", () => {
  // A month generated on its first day is mostly future. Those cells must
  // read as outside the record, not as days with no trades — the second is
  // a claim about a day that has not come.
  const dec = calendarMonths([day("2026-12-01")], 24, "2026-12-01")[0];
  expect(dec.cells[0].inRecord).toBe(true);
  expect(dec.cells[1].inRecord).toBe(false);
  expect(dec.cells[30].inRecord).toBe(false);
});
