import { expect, test } from "vitest";
import { EVENTS, nextEvent, nextEventFor, upcoming } from "@/lib/macro/calendar";
import { cpiYoyEstimate, estimateFor, rateLean, shiftMonth, toneOf, trendEstimate } from "@/lib/macro/expect";
import { deriveBls } from "@/lib/macro/fetchers";
import { SERIES } from "@/lib/macro/series";

/* -------------------------------- calendar -------------------------------- */

const NOW = new Date("2026-11-28T06:00:00Z");

test("the next release of each event, at New York time in winter", () => {
  expect(nextEvent("jobs", NOW)?.at.toISOString()).toBe("2026-12-04T13:30:00.000Z");
  expect(nextEvent("fomc", NOW)?.at.toISOString()).toBe("2026-12-09T19:00:00.000Z");
  expect(nextEvent("cpi", NOW)?.at.toISOString()).toBe("2026-12-10T13:30:00.000Z");
});

test("summer releases use daylight time, and a passed release moves to the next", () => {
  expect(nextEvent("fomc", new Date("2027-06-01T00:00:00Z"))?.at.toISOString()).toBe("2027-06-09T18:00:00.000Z");
  expect(nextEvent("cpi", new Date("2026-12-10T13:31:00Z"))?.at.toISOString().slice(0, 10)).toBe("2027-01-13");
  expect(nextEvent("cpi", new Date("2030-01-01T00:00:00Z"))).toBeNull();
});

test("series map to their release, daily market series to none", () => {
  expect(nextEventFor("cpi-mom", NOW)?.kind).toBe("cpi");
  expect(nextEventFor("nfp", NOW)?.kind).toBe("jobs");
  expect(nextEventFor("fed-funds", NOW)?.kind).toBe("fomc");
  expect(nextEventFor("us10y", NOW)).toBeNull();
});

test("upcoming lists the next two weeks in order", () => {
  expect(upcoming(NOW, 14).map((e) => e.kind)).toEqual(["jobs", "fomc", "cpi"]);
});

test("the October 2027 strategy meeting has no decision, so it is not listed", () => {
  expect(EVENTS.fomc.days).not.toContain("2027-10-27");
  for (const days of Object.values(EVENTS).map((e) => e.days)) {
    expect([...days].sort()).toEqual(days);
  }
});

/* -------------------------------- estimates ------------------------------- */

test("shiftMonth crosses year ends both ways", () => {
  expect(shiftMonth("2026-12-01", 1)).toBe("2027-01-01");
  expect(shiftMonth("2026-01-01", -1)).toBe("2025-12-01");
  expect(shiftMonth("2026-11-01", -12)).toBe("2025-11-01");
});

test("trend estimate is the three-month average, for the month after", () => {
  const est = trendEstimate(
    [
      { date: "2026-08-01", value: 100 },
      { date: "2026-09-01", value: 200 },
      { date: "2026-10-01", value: 300 },
    ],
    3,
    0,
    "K",
  );
  expect(est?.value).toBe(200);
  expect(est?.period).toBe("2026-11-01");
  expect(est?.working).toBe("100K + 200K + 300K ÷ 3");
  expect(trendEstimate([{ date: "2026-10-01", value: 1 }], 3, 0, "K")).toBeNull();
});

test("year-on-year CPI by base effect: last + new month - month dropping out", () => {
  const yoy = [{ date: "2026-10-01", value: 3.0 }];
  const mom = [
    { date: "2025-11-01", value: 0.1 },
    { date: "2026-08-01", value: 0.2 },
    { date: "2026-09-01", value: 0.3 },
    { date: "2026-10-01", value: 0.4 },
  ];
  const est = cpiYoyEstimate(yoy, mom);
  expect(est?.value).toBe(3.2);
  expect(est?.period).toBe("2026-11-01");
  // Without the month that drops out, there is no honest estimate.
  expect(cpiYoyEstimate(yoy, mom.slice(1))).toBeNull();
});

test("estimateFor picks the right method per series and none for daily ones", () => {
  const months = (vals: number[]) => vals.map((value, i) => ({ date: shiftMonth("2026-08-01", i), value }));
  const data = { nfp: months([120, 150, 90]), "cpi-mom": months([0.2, 0.3, 0.4]) };
  expect(estimateFor("nfp", data)?.value).toBe(120);
  expect(estimateFor("cpi-mom", data)?.value).toBe(0.3);
  expect(estimateFor("us10y", data)).toBeNull();
});

test("rate lean reads the 2-year against the middle of the Fed range", () => {
  expect(rateLean(4.0, 3.5).lean).toBe("cuts");
  expect(rateLean(4.0, 3.9).lean).toBe("hold");
  expect(rateLean(4.0, 4.3).lean).toBe("hikes");
  expect(rateLean(4.0, 3.5).sentence).toContain("0.38 points below");
});

test("tone counts gold-bearish Fed stories as hawkish", () => {
  const d = (direction: string) => ({ direction });
  expect(toneOf([d("bearish"), d("bearish"), d("bearish"), d("bullish")]).label).toBe("Hawkish");
  expect(toneOf([d("bullish"), d("bullish"), d("bullish"), d("neutral")]).label).toBe("Dovish");
  expect(toneOf([d("bullish"), d("bearish"), d("bullish"), d("bearish")]).label).toBe("Mixed");
  // One or two stories are too few to call.
  expect(toneOf([d("bearish")]).label).toBe("Quiet");
  expect(toneOf([]).label).toBe("Quiet");
});

/* ------------------------------ monthly CPI ------------------------------- */

test("seasonally adjusted CPI becomes a month-on-month series", () => {
  const raw = new Map([["CUSR0000SA0", new Map([["2026-09", 100], ["2026-10", 100.5]])]]);
  expect(deriveBls(raw)).toEqual([{ series: "cpi-mom", date: "2026-10-01", value: 0.5 }]);
  expect(SERIES.some((s) => s.slug === "cpi-mom")).toBe(true);
});
