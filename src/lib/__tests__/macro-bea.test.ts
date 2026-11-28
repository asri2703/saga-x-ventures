import { expect, test } from "vitest";
import { nextEvent, nextEventFor } from "@/lib/macro/calendar";
import { estimateFor } from "@/lib/macro/expect";
import { BEA_TABLES, beaPeriod, deriveBls, deriveFromIndex, parseBea } from "@/lib/macro/fetchers";
import { formatDate } from "@/lib/macro/format";
import { RELATED, storyMatches } from "@/lib/macro/related";

const GDP_TABLE = BEA_TABLES[0];
const PCE_TABLE = BEA_TABLES[1];

test("BEA periods become the first day of the quarter or month", () => {
  expect(beaPeriod("2026Q3")).toBe("2026-07-01");
  expect(beaPeriod("2026Q1")).toBe("2026-01-01");
  expect(beaPeriod("2026M10")).toBe("2026-10-01");
  expect(beaPeriod("2026")).toBeNull();
});

test("GDP comes from Table 1.1.1's first line, commas and all", () => {
  const body = {
    BEAAPI: {
      Results: {
        Data: [
          { SeriesCode: "A191RL", LineDescription: "Gross domestic product", TimePeriod: "2026Q3", DataValue: "2.4" },
          { SeriesCode: "DPCERL", LineDescription: "Personal consumption expenditures", TimePeriod: "2026Q3", DataValue: "3.0" },
        ],
      },
    },
  };
  expect(parseBea(body, GDP_TABLE)).toEqual([{ series: "gdp", date: "2026-07-01", value: 2.4 }]);
});

test("the PCE and core PCE price indexes are picked by their line names", () => {
  const body = {
    BEAAPI: {
      Results: {
        Data: [
          { LineDescription: "Personal consumption expenditures (PCE)", TimePeriod: "2026M09", DataValue: "128.500" },
          { LineDescription: "PCE excluding food and energy", TimePeriod: "2026M09", DataValue: "1,127.25" },
          { LineDescription: "Goods", TimePeriod: "2026M09", DataValue: "110.0" },
        ],
      },
    },
  };
  expect(parseBea(body, PCE_TABLE)).toEqual([
    { series: "pce-index", date: "2026-09-01", value: 128.5 },
    { series: "core-pce-index", date: "2026-09-01", value: 1127.25 },
  ]);
});

test("a BEA error reply is raised, not read as no data", () => {
  expect(() => parseBea({ BEAAPI: { Results: { Error: { APIErrorDescription: "Invalid UserID" } } } }, GDP_TABLE)).toThrow(
    /Invalid UserID/,
  );
});

test("PCE month-on-month and year-on-year come from the index", () => {
  const points = [
    { series: "pce-index", date: "2025-10-01", value: 100 },
    { series: "pce-index", date: "2026-09-01", value: 102.5 },
    { series: "pce-index", date: "2026-10-01", value: 103 },
  ];
  const out = deriveFromIndex(points, "pce-index", "pce-mom", "pce-yoy");
  expect(out).toContainEqual({ series: "pce-mom", date: "2026-10-01", value: 0.488 });
  expect(out).toContainEqual({ series: "pce-yoy", date: "2026-10-01", value: 3 });
});

test("PPI: adjusted index for the monthly change, unadjusted for year on year and the level", () => {
  const raw = new Map([
    ["WPSFD4", new Map([["2026-09", 159.699], ["2026-10", 160.254]])],
    ["WPUFD4", new Map([["2025-10", 150.439], ["2026-10", 160.248]])],
  ]);
  const points = deriveBls(raw);
  expect(points.find((p) => p.series === "ppi-mom")?.value).toBe(0.348);
  expect(points.find((p) => p.series === "ppi-yoy")?.value).toBe(6.52);
  expect(points.filter((p) => p.series === "ppi-index")).toHaveLength(2);
});

test("quarterly dates read as quarters, and GDP's estimate is for the next quarter", () => {
  expect(formatDate("2026-07-01", "Quarterly")).toBe("Q3 2026");
  expect(formatDate("2026-10-01", "Quarterly")).toBe("Q4 2026");
  const gdp = ["2025-10-01", "2026-01-01", "2026-04-01", "2026-07-01"].map((date, i) => ({
    date,
    value: [1.0, 2.0, 3.0, 2.0][i],
  }));
  const est = estimateFor("gdp", { gdp });
  expect(est?.value).toBe(2);
  expect(est?.period).toBe("2026-10-01");
  expect(est?.method).toBe("Average of the last 4 quarters.");
});

test("PPI, GDP and PCE have their next release from the published schedules", () => {
  const now = new Date("2026-11-28T06:00:00Z");
  expect(nextEvent("ppi", now)?.at.toISOString()).toBe("2026-12-15T13:30:00.000Z");
  expect(nextEvent("gdp", now)?.at.toISOString()).toBe("2026-12-23T13:30:00.000Z");
  expect(nextEventFor("core-pce-yoy", now)?.kind).toBe("pce");
  expect(nextEventFor("core-ppi-mom", now)?.kind).toBe("ppi");
});

test("related words for the new series", () => {
  expect(storyMatches({ headline: "Core PCE cools in October", summary: null, brief: null }, RELATED["core-pce-yoy"].match)).toBe(true);
  expect(storyMatches({ headline: "Producer prices jump on energy", summary: null, brief: null }, RELATED["ppi-mom"].match)).toBe(true);
  expect(storyMatches({ headline: "US economy grew 2.4% in Q3", summary: null, brief: null }, RELATED.gdp.match)).toBe(true);
});
