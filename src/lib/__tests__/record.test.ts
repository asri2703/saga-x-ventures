import fs from "node:fs";
import { expect, test } from "vitest";
import {
  type RecordDay,
  calendarMonths,
  dayLabel,
  fundingOf,
  lastReportAt,
  recordDays,
  recordFunding,
  summarise,
  toPoints,
  todayInMalaysia,
  usd,
} from "@/lib/record";

/**
 * The chart on /copytrade draws the master account's own readings, posted
 * by the reporter EA. These guard what makes that safe to publish: nothing
 * in the source is a typed-in figure, an unwired feed draws nothing, and the
 * note that says where the figures come from stays on the card.
 */

const SOURCE = fs.readFileSync("src/lib/record.ts", "utf8");
// One account's record — chart, note and all — is drawn by the panel; the
// page only chooses which accounts to hand it.
const PANEL = fs.readFileSync("src/components/record-panel.tsx", "utf8");
const FLAT = PANEL.replace(/\s+/g, " ");
const PAGE = fs.readFileSync("src/app/copytrade/page.tsx", "utf8");

test("the guards are reading the right files", () => {
  expect(SOURCE).toContain("export async function recordDays");
  expect(FLAT).toContain("<RecordChart");
  expect(PAGE).toContain("<RecordPanel");
});

test("no reading is typed into the source", () => {
  // The sample series this replaced lived in this file. A literal reading
  // here, on a trading page, is a track record somebody wrote.
  expect(SOURCE).not.toMatch(/label:\s*"\d+ [A-Z][a-z]{2}"/);
  expect(SOURCE).not.toMatch(/value:\s*\d/);
});

test("an unwired feed is an empty record, not an error", async () => {
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    await expect(recordDays(12345678)).resolves.toEqual([]);
    await expect(lastReportAt(12345678)).resolves.toBeNull();
  } finally {
    if (saved !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = saved;
  }
});

test("a day reads as day and month, whatever the runtime's zone", () => {
  expect(dayLabel("2026-11-25")).toBe("25 Nov");
  expect(dayLabel("2026-01-01")).toBe("1 Jan");
});

test("the note is attached to the chart, not left in the prose", () => {
  // `note=` is rendered inside the frame, so a screenshot of the card
  // carries it. A sibling paragraph is not.
  const chart = FLAT.slice(FLAT.indexOf("<RecordChart"));
  const close = chart.indexOf("/>");
  expect(close).toBeGreaterThan(-1);
  expect(chart.slice(0, close)).toMatch(/note="[^"]*MT5 terminal/);
  expect(chart.slice(0, close)).toMatch(/note="[^"]*deposits and withdrawals/);
});

test("the headline figure is dollars, with a cent account's own figure under it", () => {
  // A cent account counts in cents, so its balance reads a hundred times the
  // money deposited. The card leads with dollars and, for a cent account
  // only, prints the cent figure beneath — the number the reader sees in
  // MT5. A dollar account has no second figure to print.
  //
  // The conversion comes from the account's unit, never a typed number: a
  // literal 100 here is a second copy of `CENTS_PER_USD`.
  const chart = FLAT.slice(FLAT.indexOf("<RecordChart"));
  const props = chart.slice(0, chart.indexOf("/>"));
  expect(props).toContain('unit="USD"');
  expect(props).toMatch(/secondaryUnit=\{account\.unit === "cent" \? "cent" : undefined\}/);
  expect(props).toContain("divisor={divisor}");
  expect(FLAT).toContain("divisorFor(account.unit)");
  expect(props).not.toMatch(/divisor=\{\s*\d/);
});

/* Three days shaped like the real account's first week: a deposit on the
   first, a red day in the middle, a month boundary crossed. */
const DAYS: RecordDay[] = [
  { day: "2026-10-31", balance: 51162.63, funding: 49999.15, trading: 1163.48, closed: 862 },
  { day: "2026-11-01", balance: 50900.0, funding: 0, trading: -262.63, closed: 40 },
  { day: "2026-11-03", balance: 54725.67, funding: 0, trading: 3825.67, closed: 2029 },
];

test("dollars from cents, with a real minus sign", () => {
  expect(usd(79262.05)).toBe("792.62");
  expect(usd(29262.9, true)).toBe("+292.63");
  expect(usd(-1240, true)).toBe("−12.40");
  expect(usd(0, true)).toBe("0.00");
});

test("the summary's funding and trading add up to the last balance", () => {
  const s = summarise(DAYS);
  expect(s).not.toBeNull();
  if (!s) return;
  expect(s.since).toBe("2026-10-31");
  expect(s.days).toBe(4); // 31 Oct to 3 Nov, both counted
  expect(s.funding + s.trading).toBeCloseTo(DAYS[DAYS.length - 1].balance, 2);
  expect(summarise([])).toBeNull();
});

test("deposits and withdrawals are kept apart, and add up with trading to the balance", () => {
  // The previous master's real balance operations, 8 Jul to 9 Oct 2026.
  const funding = fundingOf([20000, -8120, -6000, -4000, -2000, -2000, -2000]);
  expect(funding).toEqual({ deposited: 20000, withdrawn: 24120 });
  // Its trading result and terminal balance on 25 Nov 2026.
  expect(funding.deposited - funding.withdrawn + 29499.34).toBeCloseTo(25379.34, 2);
  expect(fundingOf([])).toEqual({ deposited: 0, withdrawn: 0 });
});

test("an unwired feed has no funding either", async () => {
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    await expect(recordFunding(1)).resolves.toEqual({ deposited: 0, withdrawn: 0 });
  } finally {
    if (saved !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = saved;
  }
});

test("the chart's series is the daily balance", () => {
  expect(toPoints(DAYS).map((p) => p.value)).toEqual(DAYS.map((d) => d.balance));
});

test("the calendar has every day of each month, newest month first", () => {
  const [nov, oct] = calendarMonths(DAYS);
  expect(nov.label).toBe("November 2026");
  expect(nov.cells).toHaveLength(30);
  expect(oct.cells).toHaveLength(31);
  // 1 Nov 2026 is a Sunday: six empty slots before it in a Monday-first week.
  expect(nov.lead).toBe(6);
  // A day with no deals is a quiet cell, not a zero.
  expect(nov.cells[1].trading).toBeNull();
  // A red day stays red — the calendar does not hide its losses.
  expect(nov.cells[0].trading).toBeLessThan(0);
  expect(nov.trading).toBeCloseTo(-262.63 + 3825.67, 2);
  expect(calendarMonths(DAYS, 1)).toHaveLength(1);
});

test("days outside the record are not called quiet days", () => {
  const [nov, oct] = calendarMonths(DAYS, 3, "2026-11-05");
  // Before the first deposit: the account did not exist.
  expect(oct.cells[29].inRecord).toBe(false); // 30 Oct
  expect(oct.cells[30].inRecord).toBe(true); // 31 Oct
  // A quiet day inside the record is still in it.
  expect(nov.cells[1]).toMatchObject({ inRecord: true, trading: null }); // 2 Nov
  // Up to today, even past the last trade; nothing after it.
  expect(nov.cells[4].inRecord).toBe(true); // 5 Nov
  expect(nov.cells[5].inRecord).toBe(false); // 6 Nov
  // Without a today, the record ends on the last day with deals.
  expect(calendarMonths(DAYS)[0].cells[3].inRecord).toBe(false); // 4 Nov
});

test("today in Malaysia is eight hours ahead of UTC", () => {
  // 20:00 UTC on 25 Nov is 04:00 on 26 Nov in Kuala Lumpur.
  expect(todayInMalaysia(Date.parse("2026-11-25T20:00:00Z"))).toBe("2026-11-26");
  expect(todayInMalaysia(Date.parse("2026-11-25T15:59:00Z"))).toBe("2026-11-25");
});

test("the page regenerates rather than freezing at build", () => {
  // Without this the chart is whatever the feed held on deploy day.
  expect(PAGE).toMatch(/export const revalidate = \d+/);
});
