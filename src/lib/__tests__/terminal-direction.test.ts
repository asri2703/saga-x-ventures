import { describe, expect, it } from "vitest";
import { leanFor, leansByWindow, leanTrend } from "../terminal/direction";

const NOW = Date.parse("2026-11-28T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const story = (h: number, ...moves: [string, string][]) => ({
  last_update_at: hoursAgo(h),
  assets: moves.map(([symbol, direction]) => ({ symbol, direction })),
});

const STORIES = [
  story(2, ["XAUUSD", "up"], ["USDJPY", "down"]),
  story(10, ["XAUUSD", "up"]),
  story(30, ["XAUUSD", "down"], ["DXY", "up"]),
  story(100, ["XAUUSD", "up"]),
  story(200, ["XAUUSD", "down"]),
  story(5, ["XAUUSD", "unclear"]),
];

describe("leanFor", () => {
  it("counts stories each way inside the window only", () => {
    expect(leanFor(STORIES, "XAUUSD", NOW - 24 * 3_600_000)).toEqual({ up: 2, down: 0 });
    expect(leanFor(STORIES, "XAUUSD", NOW - 72 * 3_600_000)).toEqual({ up: 2, down: 1 });
    expect(leanFor(STORIES, "XAUUSD", NOW - 168 * 3_600_000)).toEqual({ up: 3, down: 1 });
  });
  it("skips unclear moves and stories that do not tag the instrument", () => {
    expect(leanFor(STORIES, "EURUSD", 0)).toEqual({ up: 0, down: 0 });
    expect(leanFor([{ last_update_at: hoursAgo(1), assets: null }], "XAUUSD", 0)).toEqual({ up: 0, down: 0 });
  });
});

describe("leanTrend", () => {
  it("needs a clear lead to point a way", () => {
    expect(leanTrend({ up: 3, down: 1 })).toBe("up");
    expect(leanTrend({ up: 1, down: 4 })).toBe("down");
    expect(leanTrend({ up: 5, down: 4 })).toBe("flat");
    expect(leanTrend({ up: 0, down: 0 })).toBe("flat");
  });
  it("treats a 60/40 split as a lead", () => {
    expect(leanTrend({ up: 6, down: 4 })).toBe("up");
  });
});

describe("leansByWindow", () => {
  it("gives every instrument all three windows", () => {
    const leans = leansByWindow(STORIES, ["XAUUSD", "DXY"], NOW);
    expect(leans.XAUUSD["1d"]).toEqual({ up: 2, down: 0 });
    expect(leans.XAUUSD["1w"]).toEqual({ up: 3, down: 1 });
    expect(leans.DXY["1d"]).toEqual({ up: 0, down: 0 });
    expect(leans.DXY["3d"]).toEqual({ up: 1, down: 0 });
  });
});
