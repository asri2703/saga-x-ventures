import { expect, test } from "vitest";
import { cotHeadline, crowding, rangeSpot } from "@/lib/cot/story";

const OI = 407_834;

test("the headline names size, side and the week's move", () => {
  expect(cotHeadline({ subject: "gold futures", net: 102_942, change: -9_399, openInterest: OI })).toBe(
    "Funds hold a large net long in gold futures, and trimmed it by 9,399 contracts this week.",
  );
  expect(cotHeadline({ subject: "gold futures", net: 102_942, change: 5_000, openInterest: OI })).toBe(
    "Funds hold a large net long in gold futures, and added 5,000 contracts this week.",
  );
});

test("a short position that grows is 'added', one that shrinks is 'trimmed'", () => {
  // 23,790 of 200,000 open contracts is 12%: sizeable.
  const base = { subject: "Japanese yen futures", openInterest: 200_000 };
  expect(cotHeadline({ ...base, net: -23_790, change: -6_935 })).toContain("net short");
  expect(cotHeadline({ ...base, net: -23_790, change: -6_935 })).toContain("added 6,935");
  expect(cotHeadline({ ...base, net: -23_790, change: 3_000 })).toContain("trimmed it by 3,000");
  expect(cotHeadline({ ...base, net: -23_790, change: -6_935 })).toContain("a sizeable");
});

test("switching sides, no change and no prior week each read correctly", () => {
  const base = { subject: "euro futures", openInterest: 800_000 };
  expect(cotHeadline({ ...base, net: 5_000, change: 12_000 })).toContain("after switching sides");
  expect(cotHeadline({ ...base, net: 5_000, change: 0 })).toContain("unchanged on the week");
  expect(cotHeadline({ ...base, net: 5_000, change: null })).toBe("Funds hold a small net long in euro futures.");
  expect(cotHeadline({ ...base, net: 0, change: 10 })).toBe("Funds are flat in euro futures this week.");
});

test("range spot places the latest net between the low and high", () => {
  const points = [
    { date: "2024-02-13", value: 34_176 },
    { date: "2024-09-24", value: 219_029 },
    { date: "2026-11-17", value: 102_942 },
  ];
  const spot = rangeSpot(points, 102_942);
  expect(spot?.low.date).toBe("2024-02-13");
  expect(spot?.high.date).toBe("2024-09-24");
  expect(Math.round((spot?.position ?? 0) * 100)).toBe(37);
  expect(rangeSpot([], 1)).toBeNull();
  expect(rangeSpot([{ date: "a", value: 5 }], 5)).toBeNull();
});

test("crowding words follow the position in the range", () => {
  expect(crowding(0.95)).toContain("crowded");
  expect(crowding(0.37)).toBe("mid-range, not crowded");
  expect(crowding(0.05)).toContain("crowded the other way");
});
