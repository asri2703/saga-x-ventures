import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  copytrade,
  fukyaa,
  masteryTiers,
  masteryPlans,
  masteryPlanTotalMyr,
  masteryPlanSavingMyr,
  fukyaaPlans,
  formatMyr,
  sellableFor,
  rentalMonthEnds,
} from "@/lib/commercial";
import { formatPrice } from "@/lib/coaching";

test("the profit share is gone, not merely unused", () => {
  // Until 25 November 2026 this file modelled a 30/70 weekly split, and
  // /copytrade rendered the arithmetic in full. The broker's own join page
  // says "There are no fees", and the owner confirmed it: nothing is
  // charged today. A page telling a buyer that 30% of their gain is taken,
  // beside a join screen telling them nothing is, is a false statement
  // about their money.
  //
  // Deleted rather than left in place unused, for the same reason the dated
  // deposit model below was: an unused export is still the one somebody
  // imports next. It comes back when profit sharing starts, from the git
  // history — `masterShare`, `investorShare`, `example` and `exampleSplit`.
  const source = fs.readFileSync(
    path.join(process.cwd(), "src", "lib", "commercial.ts"),
    "utf8",
  );
  for (const gone of [
    "masterShare",
    "investorShare",
    "exampleSplit",
  ]) {
    expect(source, gone).not.toContain(`${gone}:`);
    expect(source, gone).not.toContain(`function ${gone}`);
  }
});

test("the minimum survived the removal", () => {
  // Anti-vacuity. The test above would also pass on an empty file, and the
  // deposit minimum is the one copytrade figure three pages still read.
  expect(copytrade.minimumUsd).toBe(500);
});

test("the dated deposit model is gone, not merely unused", () => {
  // It described the same money a second way, which is how /fukyaa came to
  // quote a promotion while the homepage sold a package. An unused export is
  // still the one somebody imports next, so this fails if it comes back.
  const source = fs.readFileSync(
    path.join(process.cwd(), "src", "lib", "commercial.ts"),
    "utf8",
  );
  const live = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  expect(live).not.toMatch(/fukyaaDeposit|formatPromoEnd|promoEndsOn/);
  expect(live).not.toMatch(/depositPromoUsd|depositStandardUsd/);
});

test("the server rental is the only money figure in `fukyaa`", () => {
  expect(fukyaa.vpsMonthlyMyr).toBeGreaterThan(0);
  /* Narrowed from "exactly one key" when the rental month arrived: lengths
     of time belong here, prices do not. What this guards is the promo that
     was deleted in November — three money fields that the page then had to
     explain — and a second price appearing here is how that comes back. */
  const money = Object.keys(fukyaa).filter((key) =>
    /myr|usd|price|fee|cost/i.test(key),
  );
  expect(money).toEqual(["vpsMonthlyMyr"]);
});

test("the two automated packages are the cheaper deposit and the dearer", () => {
  // The whole shape of the offer: pay less up front and rent the server, or
  // pay more up front and it is included. Priced the other way round the page
  // would be asking for more money for less.
  const rented = fukyaaPlans.find((p) => p.key === "rented-vps")!;
  const included = fukyaaPlans.find((p) => p.key === "included-vps")!;
  expect(rented.depositUsd).toBeLessThan(included.depositUsd);
  expect(rented.vpsMonthlyMyr).not.toBeNull();
  expect(included.vpsMonthlyMyr).toBeNull();
});

test("the Mastery tiers carry the deposits the live site states", () => {
  expect(masteryTiers.map((t) => t.minDepositUsd)).toEqual([100, 300, 500]);
});

test("an unset price reads as an enquiry, not a broken number", () => {
  // The coaching ladder still has unset prices, and `formatMyr` is now the
  // only route a figure takes to a screen, so it has to keep answering the
  // same way for an absent one.
  expect(formatPrice(null)).toBe("Price on enquiry");
  expect(formatMyr(null)).toBe("Price on enquiry");
});

test("the longer Mastery term is the cheaper month", () => {
  // The whole argument for the six- and twelve-month packages. Priced the
  // other way round the page would be asking people to pay more to commit
  // for longer, and nothing else on the page would contradict it.
  const rates = masteryPlans.map((p) => p.monthlyMyr);
  expect(rates).toEqual([...rates].sort((a, b) => b - a));
  expect(masteryPlans.map((p) => p.months)).toEqual([1, 6, 12]);
});

test("the Mastery total and saving are consistent with the rate", () => {
  for (const plan of masteryPlans) {
    expect(masteryPlanTotalMyr(plan)).toBe(plan.monthlyMyr * plan.months);
  }
  const monthly = masteryPlans[0];
  expect(masteryPlanSavingMyr(monthly)).toBe(0);
  for (const plan of masteryPlans.slice(1)) {
    // The saving must be what the two totals actually differ by, not a figure
    // of its own. A discount a buyer can check and find wrong is worse than
    // no discount stated.
    expect(masteryPlanSavingMyr(plan)).toBe(
      monthly.monthlyMyr * plan.months - masteryPlanTotalMyr(plan),
    );
  }
});

test("exactly one Mastery term is recommended, and it is the longest", () => {
  const picked = masteryPlans.filter((p) => p.recommended);
  expect(picked).toHaveLength(1);
  expect(picked[0].months).toBe(Math.max(...masteryPlans.map((p) => p.months)));
});

test("exactly one Fukyaa package is recommended", () => {
  // Two recommendations is no recommendation, and none loses the one piece of
  // steering the owner actually gave.
  expect(fukyaaPlans.filter((p) => p.recommended)).toHaveLength(1);
});

test("the recommended Fukyaa package is the one with nothing monthly", () => {
  const pick = fukyaaPlans.find((p) => p.recommended)!;
  expect(pick.vpsMonthlyMyr).toBeNull();
  expect(pick.gainSharePct).toBeNull();
});

test("a Fukyaa package charges monthly or shares the gain, never both", () => {
  for (const plan of fukyaaPlans) {
    expect(
      plan.vpsMonthlyMyr !== null && plan.gainSharePct !== null,
      `${plan.key} takes a rental and a share`,
    ).toBe(false);
  }
});



/* ------------------------------------------------------------------ *
 * What the checkout may sell
 * ------------------------------------------------------------------ */

describe("sellableFor", () => {
  test("a Mastery term resolves to the whole term's price", () => {
    const year = masteryPlans.find((plan) => plan.key === "year")!;
    const sellable = sellableFor("year");

    expect(sellable).not.toBeNull();
    expect(sellable!.product).toBe("mastery-signal");
    expect(sellable!.amountSen).toBe(masteryPlanTotalMyr(year) * 100);
    expect(sellable!.needsMt5Login).toBe(false);
  });

  test("the rented-server package costs one month of rent", () => {
    const sellable = sellableFor("rented-vps");

    expect(sellable).not.toBeNull();
    expect(sellable!.product).toBe("fukyaa");
    expect(sellable!.amountSen).toBe(fukyaa.vpsMonthlyMyr * 100);
    // The account it runs on has to be named, or nobody knows what to
    // connect to the server.
    expect(sellable!.needsMt5Login).toBe(true);
  });

  test("the package that includes the server has nothing to pay", () => {
    const sellable = sellableFor("included-vps");

    expect(sellable).not.toBeNull();
    expect(sellable!.amountSen).toBe(0);
    expect(sellable!.needsMt5Login).toBe(true);
  });

  test("copytrade is not sold here: it is settled from the gain", () => {
    expect(sellableFor("copytrade")).toBeNull();
  });

  test("an unknown key sells nothing", () => {
    expect(sellableFor("year-and-a-half")).toBeNull();
    expect(sellableFor("")).toBeNull();
  });
});

describe("the rental month", () => {
  test("a payment buys exactly one month from the day it settles", () => {
    const paidAt = new Date("2026-11-27T03:00:00Z");
    expect(rentalMonthEnds(paidAt).toISOString()).toBe(
      new Date("2026-12-27T03:00:00Z").toISOString(),
    );
  });

  test("the reminder goes out before the month is out, not after", () => {
    // A reminder that arrives the day the server stops is not a reminder.
    expect(fukyaa.remindDaysBefore).toBeGreaterThan(0);
    expect(fukyaa.remindDaysBefore).toBeLessThan(fukyaa.monthDays);
  });
});
