import { expect, test } from "vitest";
import { formatCountdown } from "@/components/hq/cot-countdown";
import { cotUrl, parseCot } from "@/lib/cot/fetch";
import { COT_MARKETS } from "@/lib/cot/markets";
import { newYorkOffset, nextRelease, releaseInstant } from "@/lib/cot/schedule";
import { cotViews } from "@/lib/cot/store";

test("gold reads managed money and producers from the Disaggregated report", () => {
  const rows = parseCot(
    [
      {
        cftc_contract_market_code: "088691",
        report_date_as_yyyy_mm_dd: "2026-11-17T00:00:00.000",
        open_interest_all: "407834",
        m_money_positions_long_all: "121994",
        m_money_positions_short_all: "19052",
        prod_merc_positions_long: "20252",
        prod_merc_positions_short: "24843",
      },
      { cftc_contract_market_code: "001602", report_date_as_yyyy_mm_dd: "2026-11-17T00:00:00.000" },
      { cftc_contract_market_code: "088691", report_date_as_yyyy_mm_dd: "bad" },
    ],
    "disaggregated",
  );
  expect(rows).toEqual([
    {
      market: "gold",
      report_date: "2026-11-17",
      open_interest: 407834,
      spec_long: 121994,
      spec_short: 19052,
      hedge_long: 20252,
      hedge_short: 24843,
    },
  ]);
});

test("currencies read leveraged funds and dealers, and skip rows from the other report", () => {
  const yen = {
    cftc_contract_market_code: "097741",
    report_date_as_yyyy_mm_dd: "2026-11-17T00:00:00.000",
    open_interest_all: "390361",
    lev_money_positions_long: "93108",
    lev_money_positions_short: "116898",
    dealer_positions_long_all: "12833",
    dealer_positions_short_all: "126464",
  };
  expect(parseCot([yen], "tff")[0]).toMatchObject({ market: "jpy", spec_long: 93108, hedge_short: 126464 });
  expect(parseCot([yen], "disaggregated")).toEqual([]);
  expect(parseCot("nope", "tff")).toEqual([]);
});

test("the query asks only for the report's own markets, from a date", () => {
  const url = decodeURIComponent(cotUrl("disaggregated", "2026-01-01"));
  expect(url).toContain("72hh-3qpy");
  expect(url).toContain("'088691'");
  expect(url).not.toContain("'099741'");
  expect(url).toContain("'2026-01-01T00:00:00'");
});

test("every market has a unique slug and code", () => {
  expect(new Set(COT_MARKETS.map((m) => m.slug)).size).toBe(COT_MARKETS.length);
  expect(new Set(COT_MARKETS.map((m) => m.code)).size).toBe(COT_MARKETS.length);
});

test("views give net, weekly change, and the lean on the pair members trade", () => {
  const base = { open_interest: 100, hedge_long: 0, hedge_short: 0 };
  const views = cotViews([
    { market: "jpy", report_date: "2026-11-17", spec_long: 90, spec_short: 120, ...base },
    { market: "jpy", report_date: "2026-11-10", spec_long: 100, spec_short: 100, ...base },
    { market: "gold", report_date: "2026-11-17", spec_long: 75, spec_short: 25, ...base },
  ]);
  const gold = views.find((v) => v.market.slug === "gold")!;
  const jpy = views.find((v) => v.market.slug === "jpy")!;
  expect(views[0].market.slug).toBe("gold");
  expect(gold).toMatchObject({ net: 50, change: null, longShare: 0.75, pairBias: "Bullish" });
  // Funds short the yen are long USDJPY.
  expect(jpy).toMatchObject({ net: -30, change: -30, pairBias: "Bullish", date: "2026-11-17" });
  expect(jpy.history.map((h) => h.date)).toEqual(["2026-11-10", "2026-11-17"]);
});

test("releases are 15:30 New York in both winter and summer time", () => {
  expect(newYorkOffset(new Date("2026-12-01T12:00:00Z"))).toBe(-300);
  expect(newYorkOffset(new Date("2026-07-01T12:00:00Z"))).toBe(-240);
  expect(releaseInstant("2026-11-30").toISOString()).toBe("2026-11-30T20:30:00.000Z");
  expect(releaseInstant("2026-07-10").toISOString()).toBe("2026-07-10T19:30:00.000Z");
});

test("the next release follows the CFTC list, then falls back to Friday", () => {
  const thanksgiving = nextRelease(new Date("2026-11-27T12:00:00Z"));
  expect(thanksgiving).toEqual({ at: new Date("2026-11-30T20:30:00Z"), delayed: true, estimated: false });
  expect(nextRelease(new Date("2026-11-30T20:31:00Z")).at.toISOString()).toBe("2026-12-04T20:30:00.000Z");
  const later = nextRelease(new Date("2027-01-04T12:00:00Z"));
  expect(later).toEqual({ at: new Date("2027-01-08T20:30:00Z"), delayed: false, estimated: true });
});

test("the countdown reads days, hours, minutes and seconds", () => {
  expect(formatCountdown(3 * 86_400 + 2 * 3600 + 5 * 60 + 9)).toBe("3d 02h 05m 09s");
  expect(formatCountdown(59)).toBe("00h 00m 59s");
  expect(formatCountdown(0)).toBe("Due now");
});
