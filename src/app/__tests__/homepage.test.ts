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

/**
 * The graph paper, and the three bands drawn on it.
 *
 * Pale bands running into each other with nothing behind them read as a gap
 * in the page rather than as sections, and a centred column leaves most of a
 * wide window empty either side of it. The hero establishes the sheet; the
 * two widest bands below reuse it, so those margins have a surface.
 *
 * The anchors are content, not markup: a heading can be reworded, but the
 * packages are still the packages and the award photo is still the award.
 */
const SHEET_BANDS = [{ what: "the award", anchor: "founder.award.image" }];

test("the hero's graph paper is behind the widest bands too", () => {
  const flat = HOME.replace(/\s+/g, " ");
  const sheets = flat.match(/hero-grid/g) ?? [];
  expect(sheets.length).toBe(1 + SHEET_BANDS.length);

  const hero = flat.indexOf("hero-grid");
  for (const band of SHEET_BANDS) {
    const at = flat.indexOf(band.anchor);
    expect(at, band.what).toBeGreaterThan(-1);
    // The nearest sheet ABOVE the band's content, and not the hero's.
    const sheet = flat.lastIndexOf("hero-grid", at);
    expect(sheet, band.what).toBeGreaterThan(hero);

    // A sheet pinned to inset-0 inside a static parent spreads over the
    // whole page, and one inside a parent with no overflow rule bleeds past
    // the band's edges. Both only show up in a browser, so they are
    // asserted here.
    const opens = flat.slice(flat.lastIndexOf("<Section", sheet), sheet);
    expect(opens, band.what).toContain("relative");
    expect(opens, band.what).toContain("overflow-hidden");
  }
});

test("the packages band has a surface of its own, not the hero's", () => {
  // Ruled paper behind the packages put the hero's drawing straight behind
  // the prices, and two bands drawn the same way stop reading as two
  // bands. Dots are the same hand at a lower volume: they fill the margins
  // either side of the column without competing with three cards.
  const flat = HOME.replace(/\s+/g, " ");
  // The switch, not the section's id: the id is on the opening tag, which
  // comes BEFORE the surface, so "the nearest one above this" would find
  // the hero's and pass on a band that has none of its own.
  const switchAt = flat.indexOf("<PlanSwitch");
  expect(switchAt).toBeGreaterThan(-1);

  const dots = flat.lastIndexOf("dot-field", switchAt);
  expect(dots).toBeGreaterThan(-1);
  // No band begins between the dots and the packages, so the dots are this
  // band's own. `<Section` followed by a space or a `>`: `<SectionHeading`
  // starts with the same nine characters and sits in exactly this gap.
  expect(flat.slice(dots, switchAt)).not.toMatch(/<Section[\s>]/);
  expect(flat.lastIndexOf("hero-grid", switchAt)).toBeLessThan(
    flat.indexOf("<Section", flat.indexOf("hero-grid")),
  );

  const opens = flat.slice(flat.lastIndexOf("<Section", dots), dots);
  expect(opens).toContain("relative");
  expect(opens).toContain("overflow-hidden");
});

test("the dot field is a real rule, not a class name nothing styles", () => {
  // A decorative layer with no CSS behind it is an empty div: the band
  // looks exactly as bare as before and every assertion above still passes.
  const css = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "globals.css"),
    "utf8",
  );
  const rule = css.slice(css.indexOf(".dot-field"));
  expect(rule).toMatch(/^\.dot-field\s*\{/);
  expect(rule.slice(0, rule.indexOf("}"))).toContain("radial-gradient");
});
