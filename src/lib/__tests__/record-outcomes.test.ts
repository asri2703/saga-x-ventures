import { expect, test } from "vitest";
import type { RecordDay } from "@/lib/record";
import {
  dailyReturns,
  depositFor,
  outcomes,
  performance,
  project,
} from "@/lib/record-outcomes";

/**
 * The return maths, which decides figures about money on a public page.
 *
 * Fixtures are synthetic. The repo is public and the real logins live only
 * in the environment, so nothing here is a copy of a real account — these
 * exercise the shapes the real records take.
 */

/** Days from a list of [trading, funding] pairs, balance accumulated. */
function days(steps: [number, number][]): RecordDay[] {
  let balance = 0;
  return steps.map(([trading, funding], i) => {
    balance += trading + funding;
    return {
      day: `2026-01-${String(i + 1).padStart(2, "0")}`,
      balance,
      funding,
      trading,
      closed: 1,
    };
  });
}

/** A flat 10% a day on 1,000, for `n` days, no cash flow after the first. */
function steady(n: number): [number, number][] {
  const out: [number, number][] = [[0, 1000]];
  let balance = 1000;
  for (let i = 0; i < n; i++) {
    const gain = balance * 0.1;
    out.push([gain, 0]);
    balance += gain;
  }
  return out;
}

test("a mid-record deposit does not change the return", () => {
  /* This is the property that makes the measure correct and the one the
     naive `trading ÷ deposits` fails. Same trading, same days; one account
     is topped up halfway and the other is not. */
  const plain = days([
    [0, 1000],
    [100, 0],
    [110, 0],
  ]);
  const topped = days([
    [0, 1000],
    [100, 0],
    [110, 0],
  ]);
  // Same trading days, but 5,000 arrives before the last one.
  const withDeposit = days([
    [0, 1000],
    [100, 0],
    [110, 5000],
  ]);

  const a = performance(plain)!.returnPct;
  const b = performance(topped)!.returnPct;
  const c = performance(withDeposit)!.returnPct;

  expect(a).toBeCloseTo(b, 10);
  expect(c).toBeCloseTo(a, 10);
});

test("the naive measure would have moved, so the test above is not vacuous", () => {
  const plain = days([
    [0, 1000],
    [100, 0],
    [110, 0],
  ]);
  const withDeposit = days([
    [0, 1000],
    [100, 0],
    [110, 5000],
  ]);
  const naive = (d: RecordDay[]) => {
    const deposits = d.reduce((s, x) => s + Math.max(0, x.funding), 0);
    const trading = d.reduce((s, x) => s + x.trading, 0);
    return trading / deposits;
  };
  // 210/1000 against 210/6000 — the thing time-weighting removes.
  expect(naive(plain)).not.toBeCloseTo(naive(withDeposit), 3);
});

test("a withdrawal is counted at the end of the day, never the start", () => {
  /* Counting it at the start shrinks the base and flatters the return. The
     owner's instruction is to lean the other way when the method is
     uncertain, so the day's trading is measured on the capital that was
     already there. */
  const d = days([
    [0, 1000],
    [100, -500],
  ]);
  const [, second] = dailyReturns(d);
  expect(second).toBeCloseTo(100 / 1000, 10); // not 100 / 500
});

test("the first day is measured on its own deposit", () => {
  // There is no prior capital, so the day's own funding is the only base.
  const [first] = dailyReturns(days([[50, 1000]]));
  expect(first).toBeCloseTo(50 / 1000, 10);
});

test("a fall that came back reports how long it took", () => {
  const d = days([
    [0, 1000], // 1 Jan, deposit
    [100, 0], // 2 Jan, peak
    [-550, 0], // 3 Jan, trough
    [300, 0], // 4 Jan
    [400, 0], // 5 Jan, back above the peak
  ]);
  const p = performance(d)!;
  expect(p.deepest).toBeLessThan(-0.4);
  expect(p.recovery?.kind).toBe("recovered");
  expect(p.recovery).toMatchObject({ days: 2 }); // 3 Jan → 5 Jan
});

test("a fall that has not come back reports how far it still is", () => {
  const d = days([
    [0, 1000],
    [100, 0],
    [-550, 0],
    [100, 0], // climbing, still under the peak
  ]);
  const p = performance(d)!;
  expect(p.recovery?.kind).toBe("open");
  if (p.recovery?.kind !== "open") throw new Error("unreachable");
  expect(p.recovery.fromPeak).toBeLessThan(0);
});

test("one day before its recovery, the same record reads as open", () => {
  /* Anti-vacuity for the pair above: truncate the recovered fixture and the
     field has to flip by itself. This is the behaviour the live page depends
     on — an account below its peak crosses back on an ordinary day and
     nothing redeploys. */
  const full = days([
    [0, 1000],
    [100, 0],
    [-550, 0],
    [300, 0],
    [400, 0],
  ]);
  expect(performance(full)!.recovery?.kind).toBe("recovered");
  expect(performance(full.slice(0, 4))!.recovery?.kind).toBe("open");
});

test("a record that never fell reports no fall and no recovery", () => {
  const p = performance(days(steady(5)))!;
  expect(p.deepest).toBe(0);
  expect(p.recovery).toBeNull();
});

test("stretches are every window the record holds, and short records get none", () => {
  expect(outcomes(days(steady(40)), 30)).not.toBeNull();
  // 9 trading days cannot supply a 30-day stretch, and the page would
  // rather show nothing than extrapolate from one.
  expect(outcomes(days(steady(9)), 30)).toBeNull();
});

test("a losing stretch is counted, not smoothed away", () => {
  const steps: [number, number][] = [[0, 1000]];
  let balance = 1000;
  for (let i = 0; i < 40; i++) {
    // One violent down day inside an otherwise rising record.
    const move = i === 20 ? -balance * 0.4 : balance * 0.02;
    steps.push([move, 0]);
    balance += move;
  }
  const spread = outcomes(days(steps), 10)!;
  expect(spread.losing).toBeGreaterThan(0);
  expect(spread.worst).toBeLessThan(0);
  // Anti-vacuity: the same shape without the crash has no losing stretch.
  expect(outcomes(days(steady(40)), 10)!.losing).toBe(0);
});

test("the spread is ordered and the middle sits inside it", () => {
  const spread = outcomes(days(steady(60)), 30)!;
  expect(spread.worst).toBeLessThanOrEqual(spread.lower);
  expect(spread.lower).toBeLessThanOrEqual(spread.median);
  expect(spread.median).toBeLessThanOrEqual(spread.upper);
  expect(spread.upper).toBeLessThanOrEqual(spread.best);
});

test("a deposit is only worked out from a middle that makes money", () => {
  expect(depositFor(500, 0.25)).toBeCloseTo(2000, 6);
  // A record whose typical stretch loses money cannot answer a profit goal.
  expect(depositFor(500, -0.1)).toBeNull();
  expect(depositFor(500, 0)).toBeNull();
  expect(depositFor(0, 0.25)).toBeNull();
});

test("returns are unit-free, so a cent account and a dollar one agree", () => {
  const dollars = days([
    [0, 1000],
    [100, 0],
  ]);
  const cents = days([
    [0, 100000],
    [10000, 0],
  ]);
  expect(performance(cents)!.returnPct).toBeCloseTo(
    performance(dollars)!.returnPct,
    10,
  );
});

test("the master's share comes out of the goal, and the rest is the follower's", () => {
  /* The panel used to report what the ACCOUNT makes as though the follower
     kept all of it, while the FAQ further down the same page said thirty
     percent of it does not. Two parts of one page disagreeing about money. */
  const spread = outcomes(days(steady(40)), 21)!;
  const p = project(1000, spread, 30, null)!;

  expect(p.gross).toBe(1000);
  expect(p.fees).toBeCloseTo(300, 10);
  expect(p.net).toBeCloseTo(700, 10);
  // The split is exhaustive: nothing is lost between the two.
  expect(p.fees + p.net).toBeCloseTo(p.gross, 10);
});

test("a zero share leaves the goal whole, so the split is not hardcoded", () => {
  // Anti-vacuity: the numbers above would also pass if 30 were baked in.
  const spread = outcomes(days(steady(40)), 21)!;
  const free = project(1000, spread, 0, null)!;
  const half = project(1000, spread, 50, null)!;

  expect(free.net).toBeCloseTo(1000, 10);
  expect(free.fees).toBeCloseTo(0, 10);
  expect(half.net).toBeCloseTo(500, 10);
});

test("daily and weekly are after the share, like the nett figure", () => {
  /* One panel, one meaning of a dollar. If these were gross, two money
     boxes would mean the follower's money and two would mean the
     account's, side by side and unlabelled. */
  const spread = outcomes(days(steady(40)), 21)!;
  const gross = project(1000, spread, 0, null)!;
  const taxed = project(1000, spread, 30, null)!;

  expect(taxed.daily).toBeCloseTo(gross.daily * 0.7, 10);
  expect(taxed.weekly).toBeCloseTo(gross.weekly * 0.7, 10);
});

test("the deposit is sized by the account's rate, not by the share", () => {
  // The share is taken from the profit, not from the capital: changing it
  // must not move what has to be deposited.
  const spread = outcomes(days(steady(40)), 21)!;
  expect(project(1000, spread, 30, null)!.deposit).toBeCloseTo(
    project(1000, spread, 0, null)!.deposit,
    10,
  );
});
