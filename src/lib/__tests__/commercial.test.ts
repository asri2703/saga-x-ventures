import { expect, test } from "vitest";
import {
  copytrade,
  exampleSplit,
  fukyaa,
  fukyaaDeposit,
  masteryTiers,
  masterySubscriptionMyr,
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
  expect(fukyaaDeposit(new Date("2026-12-31T23:59:00Z"))).toEqual({
    usd: 500,
    isPromo: true,
  });
  expect(fukyaaDeposit(new Date("2027-01-01T00:00:00Z"))).toEqual({
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

test("an unset subscription price reads as an enquiry, not a broken number", () => {
  expect(formatPrice(masterySubscriptionMyr)).toBe("Price on enquiry");
});
