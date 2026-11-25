import { expect, test } from "vitest";
import { MAX_DEALS, authorised, feedConfig, parseReport } from "@/lib/record-feed";

/**
 * What the ingest route accepts. Whatever passes here is published on
 * /copytrade as the master account's record, so the tests are about what is
 * refused.
 */

const SECRET = "x".repeat(40);
const NOW = Math.floor(Date.now() / 1000);

const GOOD = {
  login: 12345678,
  taken_at: NOW - 60,
  balance: 54900.12,
  equity: 54800.5,
  equity_low: 54000,
  deals: [
    {
      ticket: 1001,
      position_id: 900,
      time: NOW - 3600,
      type: 1,
      entry: 1,
      symbol: "XAUUSDc",
      volume: 0.1,
      price: 2650.12,
      profit: 120.5,
      swap: -1.2,
      commission: 0,
      fee: 0,
    },
  ],
};

const ENV = {
  RECORD_INGEST_SECRET: SECRET,
  RECORD_ACCOUNT_LOGIN: "12345678",
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service",
};

test("configured only with a long secret, at least one login and Supabase", () => {
  expect(feedConfig(ENV)).toEqual({ secret: SECRET, logins: [12345678] });
  expect(feedConfig({ ...ENV, RECORD_INGEST_SECRET: "short" })).toBeNull();
  expect(feedConfig({ ...ENV, RECORD_ACCOUNT_LOGIN: undefined })).toBeNull();
  expect(feedConfig({ ...ENV, RECORD_ACCOUNT_LOGIN: "abc" })).toBeNull();
  expect(feedConfig({ ...ENV, SUPABASE_SERVICE_ROLE_KEY: undefined })).toBeNull();
});

test("the feed accepts exactly the accounts the page shows", () => {
  const config = feedConfig({
    ...ENV,
    RECORD_ACCOUNT_LOGIN_2: "222",
    RECORD_ACCOUNT_UNIT_2: "usd",
    // No unit: not shown, so not accepted either.
    RECORD_ACCOUNT_LOGIN_3: "333",
  });
  expect(config?.logins).toEqual([12345678, 222]);
});

test("the secret must match exactly", () => {
  expect(authorised(`Bearer ${SECRET}`, SECRET)).toBe(true);
  expect(authorised(`bearer ${SECRET}`, SECRET)).toBe(true);
  expect(authorised(`Bearer ${SECRET}y`, SECRET)).toBe(false);
  expect(authorised(`Bearer ${"y".repeat(40)}`, SECRET)).toBe(false);
  expect(authorised(null, SECRET)).toBe(false);
  expect(authorised("", SECRET)).toBe(false);
});

test("a good report parses, truncated to the minute", () => {
  const result = parseReport(GOOD);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.report.takenAt.getUTCSeconds()).toBe(0);
  expect(result.report.deals).toHaveLength(1);
  expect(result.report.deals[0]).toMatchObject({
    ticket: 1001,
    positionId: 900,
    symbol: "XAUUSDc",
    profit: 120.5,
  });
});

test("deals are optional, equity_low is optional", () => {
  const result = parseReport({ ...GOOD, deals: undefined, equity_low: undefined });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.report.deals).toEqual([]);
    expect(result.report.equityLow).toBeNull();
  }
});

test.each([
  ["not an object", "nope"],
  ["no login", { ...GOOD, login: undefined }],
  ["login zero", { ...GOOD, login: 0 }],
  ["balance as a string", { ...GOOD, balance: "54900" }],
  ["equity NaN", { ...GOOD, equity: Number.NaN }],
  ["a reading from the future", { ...GOOD, taken_at: NOW + 7200 }],
  ["a reading before 2000", { ...GOOD, taken_at: 1000 }],
  ["time in milliseconds", { ...GOOD, taken_at: Date.now() }],
  ["deals not a list", { ...GOOD, deals: {} }],
  ["a deal with no ticket", { ...GOOD, deals: [{ ...GOOD.deals[0], ticket: undefined }] }],
  ["a deal with a string profit", { ...GOOD, deals: [{ ...GOOD.deals[0], profit: "1" }] }],
])("refuses %s", (_name, body) => {
  expect(parseReport(body).ok).toBe(false);
});

test("refuses more deals than one request may carry", () => {
  const deals = Array.from({ length: MAX_DEALS + 1 }, (_, i) => ({
    ...GOOD.deals[0],
    ticket: i + 1,
  }));
  expect(parseReport({ ...GOOD, deals }).ok).toBe(false);
});
