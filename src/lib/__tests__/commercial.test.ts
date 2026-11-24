import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import {
  copytrade,
  exampleSplit,
  fukyaa,
  masteryTiers,
  masteryPlans,
  masteryPlanTotalMyr,
  masteryPlanSavingMyr,
  fukyaaPlans,
  formatMyr,
} from "@/lib/commercial";
import { formatPrice } from "@/lib/coaching";

test("the shares account for the whole gain", () => {
  expect(copytrade.masterShare + copytrade.investorShare).toBe(100);
});

test("the worked example is the owner's: 500 grows to 600, split 30 and 70", () => {
  const s = exampleSplit();
  expect(s.gain).toBe(100);
  expect(s.master).toBe(30);
  expect(s.investor).toBe(70);
});

test("the example derives from the shares rather than repeating them", () => {
  // If a share changes, the example must move with it or the page lies.
  const s = exampleSplit();
  expect(s.master).toBe((s.gain * copytrade.masterShare) / 100);
  expect(s.investor).toBe((s.gain * copytrade.investorShare) / 100);
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

test("the server rental is the only recurring Fukyaa figure", () => {
  expect(fukyaa.vpsMonthlyMyr).toBeGreaterThan(0);
  expect(Object.keys(fukyaa)).toEqual(["vpsMonthlyMyr"]);
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
  expect(pick.weeklyShare).toBeNull();
});

test("a Fukyaa package charges monthly or shares the gain, never both", () => {
  for (const plan of fukyaaPlans) {
    expect(
      plan.vpsMonthlyMyr !== null && plan.weeklyShare !== null,
      `${plan.key} takes a rental and a share`,
    ).toBe(false);
  }
});


