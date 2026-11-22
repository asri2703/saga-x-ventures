import { expect, test } from "vitest";
import {
  coachingClasses,
  coachingPrices,
  getPrice,
  formatPrice,
} from "@/lib/coaching";

test("the ladder is three classes in order", () => {
  expect(coachingClasses.map((c) => c.slug)).toEqual([
    "basic-trading",
    "advance",
    "news-trading",
  ]);
});

test("formatPrice renders ringgit with a thousands separator", () => {
  expect(formatPrice(4970)).toBe("RM4,970");
});

test("an unset price reads as an enquiry, never as a broken number", () => {
  expect(formatPrice(null)).toBe("Price on enquiry");
  expect(formatPrice(null)).not.toMatch(/null|undefined|NaN/);
});

test("every class has a price entry for both modes", () => {
  for (const c of coachingClasses) {
    expect(getPrice(c.slug, "online"), `${c.slug} online`).not.toBeUndefined();
    expect(getPrice(c.slug, "onsite"), `${c.slug} onsite`).not.toBeUndefined();
  }
  expect(coachingPrices).toHaveLength(coachingClasses.length * 2);
});

test("getPrice returns null, not undefined, for a class whose price is unset", () => {
  const anyUnset = coachingPrices.some((p) => p.myr === null);
  expect(anyUnset).toBe(true);
  expect(getPrice("basic-trading", "online")).toBeNull();
});

test("an unknown class has no price rather than throwing", () => {
  expect(() => getPrice("nope", "online")).not.toThrow();
  expect(getPrice("nope", "online")).toBeUndefined();
});
