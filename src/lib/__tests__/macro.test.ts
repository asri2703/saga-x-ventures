import { expect, test } from "vitest";
import { deriveBls, parseBls, parseNyFed, parseTreasuryCsv } from "@/lib/macro/fetchers";
import { SERIES } from "@/lib/macro/series";
import { stats } from "@/lib/macro/store";

test("the New York Fed gives two series: the effective rate and the target top", () => {
  const points = parseNyFed({
    refRates: [
      { effectiveDate: "2026-11-24", percentRate: 3.88, targetRateFrom: 3.75, targetRateTo: 4.0 },
      { effectiveDate: "bad", percentRate: 1 },
    ],
  });
  expect(points).toEqual([
    { series: "effr", date: "2026-11-24", value: 3.88 },
    { series: "fed-funds", date: "2026-11-24", value: 4.0 },
  ]);
  expect(parseNyFed({})).toEqual([]);
});

function bls(id: string, rows: [string, string, string][]) {
  return { seriesID: id, data: rows.map(([year, period, value]) => ({ year, period, value })) };
}

test("BLS months become levels, monthly changes and year-on-year rates", () => {
  const raw = parseBls({
    status: "REQUEST_SUCCEEDED",
    Results: {
      series: [
        bls("LNS14000000", [["2026", "M10", "4.4"], ["2026", "M13", "4.3"]]),
        bls("CES0000000001", [["2026", "M10", "159293"], ["2026", "M09", "159128"]]),
        bls("CUUR0000SA0", [["2026", "M10", "330"], ["2025", "M10", "320"]]),
      ],
    },
  });
  const points = deriveBls(raw);
  // The annual average (M13) is not a month.
  expect(points).toContainEqual({ series: "unemployment", date: "2026-10-01", value: 4.4 });
  expect(points.filter((p) => p.series === "unemployment")).toHaveLength(1);
  // Payrolls are reported as jobs added: this month less last month.
  expect(points).toContainEqual({ series: "nfp", date: "2026-10-01", value: 165 });
  // CPI year on year: 330 against 320 a year earlier.
  expect(points).toContainEqual({ series: "cpi-yoy", date: "2026-10-01", value: 3.125 });
  // A month without its comparison is left out, not guessed.
  expect(points.find((p) => p.series === "nfp" && p.date === "2026-09-01")).toBeUndefined();
});

test("Treasury CSV columns are matched by name, dates turned to ISO", () => {
  const csv = `Date,"1 Mo","2 Yr","10 Yr"\n11/25/2026,4.27,4.61,4.85\n11/24/2026,4.21,4.63,N/A`;
  expect(parseTreasuryCsv(csv, { "2 Yr": "us2y", "10 Yr": "us10y" })).toEqual([
    { series: "us2y", date: "2026-11-25", value: 4.61 },
    { series: "us10y", date: "2026-11-25", value: 4.85 },
    { series: "us2y", date: "2026-11-24", value: 4.63 },
  ]);
});

test("stats pick actual, previous, highest and lowest", () => {
  const s = stats([
    { date: "2026-01-01", value: 2 },
    { date: "2026-02-01", value: 5 },
    { date: "2026-03-01", value: 1 },
    { date: "2026-04-01", value: 3 },
  ]);
  expect(s?.actual.value).toBe(3);
  expect(s?.previous?.value).toBe(1);
  expect(s?.highest.date).toBe("2026-02-01");
  expect(s?.lowest.date).toBe("2026-03-01");
  expect(stats([])).toBeNull();
});

test("every series a fetcher writes is defined, and slugs are unique", () => {
  const slugs = SERIES.map((s) => s.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const slug of ["fed-funds", "effr", "cpi-yoy", "core-cpi-yoy", "unemployment", "nfp", "earnings-yoy", "us2y", "us10y", "us10y-real"]) {
    expect(slugs).toContain(slug);
  }
});
