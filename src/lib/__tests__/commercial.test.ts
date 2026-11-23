import { expect, test } from "vitest";
import {
  copytrade,
  exampleSplit,
  fukyaa,
  fukyaaDeposit,
  formatPromoEnd,
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

test("the Fukyaa promo expires on its own", () => {
  // A promotional figure typed into a page becomes a false price on a date
  // everybody already knows, and nobody notices until a customer is angry.
  expect(fukyaaDeposit(new Date("2026-12-31T23:59:00+08:00"))).toEqual({
    usd: 500,
    isPromo: true,
  });
  expect(fukyaaDeposit(new Date("2027-01-01T00:00:00+08:00"))).toEqual({
    usd: 1000,
    isPromo: false,
  });
});

test("the promo is the cheaper of the two, not the dearer", () => {
  expect(fukyaa.depositPromoUsd).toBeLessThan(fukyaa.depositStandardUsd);
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

test("the promo ends at midnight in Malaysia, not at eight in the morning", () => {
  // The owner and his clients are in UTC+8. An expiry pinned to UTC would
  // leave the promotional figure on the page through the first working
  // morning of the new year.
  expect(fukyaaDeposit(new Date("2026-12-31T23:59:00+08:00")).isPromo).toBe(
    true,
  );
  expect(fukyaaDeposit(new Date("2027-01-01T00:00:01+08:00")).isPromo).toBe(
    false,
  );
});

test("the promo deadline reads as a date, not as a database value", () => {
  expect(formatPromoEnd()).toBe("31 December 2026");
});
