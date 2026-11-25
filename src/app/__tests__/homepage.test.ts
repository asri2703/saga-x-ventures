import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { getProduct, outbound, type OutboundKey } from "@/lib/products";
import { fukyaaPlanCards, masteryPlanCards } from "@/lib/plans";
import { coachingClasses, classList } from "@/lib/coaching";

/**
 * The packages are the one part of the homepage that costs a visitor money to
 * get wrong, so what holds them together is held here rather than left to a
 * reading.
 */

const HOME = fs.readFileSync(
  path.join(process.cwd(), "src", "app", "page.tsx"),
  "utf8",
);

test("the warning about two accounts comes before the packages, not after", () => {
  // It decides whether to open one broker account or two. Below the packages
  // it is advice given to someone who has already picked one and clicked.
  //
  // Whitespace is collapsed first: the sentence is prose inside JSX, so the
  // formatter breaks it wherever the line runs long, and a guard about the
  // order of two things should not fail because one of them reflowed.
  const flat = HOME.replace(/\s+/g, " ");
  const warning = flat.indexOf("separate accounts");
  const packages = flat.indexOf("<PlanGroup");
  expect(warning).toBeGreaterThan(-1);
  expect(packages).toBeGreaterThan(-1);
  expect(warning).toBeLessThan(packages);
});

test("every package carries a figure and an action", () => {
  // A package card with no price is the one thing this section exists to
  // prevent, and an unformatted `undefined` would render as empty space
  // rather than fail anything.
  const cards = [...masteryPlanCards(), ...fukyaaPlanCards()];
  expect(cards.length).toBeGreaterThan(4);
  for (const card of cards) {
    expect(card.price, card.key).toMatch(/\d/);
    expect(card.price, card.key).not.toMatch(/undefined|NaN/);
    expect(card.action.href, card.key).not.toBe("");
    expect(card.includes.length, card.key).toBeGreaterThan(1);
  }
});

test("no package links to an outbound key that is not set", () => {
  // A key can be declared before its URL exists — `copytrade-join` was, until
  // 25 November 2026. A card linking to "" is a link to the current page: it
  // looks like it worked and did not, which is worse than saying nothing.
  for (const card of [...masteryPlanCards(), ...fukyaaPlanCards()]) {
    const key = card.action.href.replace(/^\/go\//, "");
    if (key === card.action.href) continue;
    expect(outbound[key as OutboundKey], card.key).not.toBe("");
  }
});

test("the products the packages sell still exist", () => {
  // The cards are built from `commercial.ts` and link to pages named here.
  // Renaming a product key would otherwise leave the section selling nothing.
  expect(getProduct("mastery-signal")).toBeDefined();
  expect(getProduct("fukyaa")).toBeDefined();
  expect(getProduct("copytrade")).toBeDefined();
});

/* ------------------------------------------------------------------ *
 * Coaching, the closing section.
 * ------------------------------------------------------------------ */

test("the closing section names the classes from the ladder, not by hand", () => {
  // It used to read "Basic trading, then advance, then trading the news" —
  // three names typed into prose, none of them matching what /coaching calls
  // them. Renaming a class there left this sentence describing classes that
  // no longer existed under those names.
  const flat = HOME.replace(/\s+/g, " ");
  expect(flat).toContain("{classList()}");
  for (const c of coachingClasses) {
    expect(flat, c.slug).not.toContain(c.name);
  }
});

test("the sentence the homepage renders is the three class names", () => {
  // Anti-vacuity for the test above: that one proves the names are not
  // typed in, this one proves what arrives instead is the real list.
  expect(classList()).toBe("Basic Trading, Advanced Trading and News Trading");
});

test("the award section is drawn on the same graph paper as the hero", () => {
  // Two cream bands in a row with nothing behind them read as a gap rather
  // than as two sections. The hero already establishes the sheet; the award
  // reuses it so the page has a surface rather than a hole in the middle.
  const flat = HOME.replace(/\s+/g, " ");
  const sheets = flat.match(/hero-grid/g) ?? [];
  expect(sheets.length).toBe(2);

  // It has to be behind the award, not behind something else that happens
  // to come later in the file.
  const award = flat.indexOf("founder.award.image");
  const before = flat.lastIndexOf("hero-grid", award);
  const hero = flat.indexOf("hero-grid");
  expect(before).toBeGreaterThan(hero);

  // A sheet pinned to inset-0 inside a static parent spreads over the whole
  // page, and one inside a parent with no overflow rule bleeds past the
  // band's edges. Both are the kind of thing that only shows up in a
  // browser, so they are asserted here.
  const section = flat.lastIndexOf("<Section", before);
  const opens = flat.slice(section, before);
  expect(opens).toContain("relative");
  expect(opens).toContain("overflow-hidden");
});
