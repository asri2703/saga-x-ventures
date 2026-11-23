import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * The claims guard.
 *
 * The owner's own Mastery system forbids its content agents from stating win
 * rates, profits or guarantees. The parent site has to hold the same line —
 * partly for consistency, mostly because performance claims on a trading site
 * in Malaysia are a regulatory exposure nobody needs.
 *
 * The "1,200 traders" figure is a twelve-year career total. It is not a
 * member count of anything, it cannot be verified from any database, and
 * phrasing it as membership would be a claim the business cannot support.
 *
 * This walks real source and content rather than checking a list someone has
 * to remember to update.
 */

const ROOTS = ["src", "content"];
const EXTENSIONS = new Set([".ts", ".tsx", ".md"]);

/**
 * A guard that cannot tell a prohibition from a violation forbids writing
 * the rule down. Documentation that quotes a banned phrase in order to ban
 * it marks the line `claims-guard: allow` and is skipped.
 *
 * The escape hatch is per line, never per file, so it cannot be used to wave
 * a whole page through.
 */
const ALLOW = "claims-guard: allow";

function strip(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.includes(ALLOW))
    .join("\n");
}

function readAllCopy(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__" || entry.name === "node_modules") continue;
        walk(full);
        continue;
      }
      if (!EXTENSIONS.has(path.extname(entry.name))) continue;
      out.push({ file: full, text: strip(fs.readFileSync(full, "utf8")) });
    }
  };

  for (const root of ROOTS) walk(path.join(process.cwd(), root));
  return out;
}

test("the guard is actually reading files", () => {
  // Without this, every assertion below passes vacuously on an empty list.
  expect(readAllCopy().length).toBeGreaterThan(10);
});

/**
 * An accuracy percentage is a win rate under another name.
 *
 * It was added to this pattern when the owner asked for one on the hero. The
 * figure is allowed in exactly one place, `heroCards` in `commercial.ts`,
 * marked per line. Leaving the rule blind to the word would have left a guard
 * that claims to stop performance claims and quietly does not.
 */
const PERFORMANCE_CLAIM =
  /win[-\s]?rate|guarantee[ds]?\b|guaranteeing|profit\s+(of|up to)|\d\s?%\s*(accura|win|success)|accuracy\s+(rate|of)/i;

test("the performance detector works", () => {
  expect("97% accuracy").toMatch(PERFORMANCE_CLAIM);
  expect("A 92% win rate").toMatch(PERFORMANCE_CLAIM);
  expect("70% stays with you").not.toMatch(PERFORMANCE_CLAIM);
});

test("no win-rate, profit or guarantee claims appear in source or content", () => {
  for (const { file, text } of readAllCopy()) {
    expect(text, file).not.toMatch(PERFORMANCE_CLAIM);
  }
});

test("the 1,200 figure is never phrased as membership", () => {
  for (const { file, text } of readAllCopy()) {
    expect(text, file).not.toMatch(
      /1,?200\+?\s+(active\s+)?(members|subscribers|users)/i,
    );
  }
});

/**
 * Prices are config.
 *
 * The owner is still settling the coaching numbers and expects to change them
 * without a code change, so a ringgit figure typed into a page is a bug even
 * when the figure is currently right. Everything goes through formatPrice.
 */
const PRICE_LITERAL = /RM\s?\d|\d\s?USD/;

test("the money detector actually catches a hardcoded figure", () => {
  // Without this the scan below could pass because the regex is wrong.
  expect("Onsite RM4,970 all in").toMatch(PRICE_LITERAL);
  expect("Minimum 500 USD deposit").toMatch(PRICE_LITERAL);
  expect("Price on enquiry").not.toMatch(PRICE_LITERAL);
});

test("no money figure is hardcoded in a page or component", () => {
  // Both the coaching prices and Fukyaa's deposit minimum are config. A
  // figure typed into prose is a bug even while it is still correct: it goes
  // stale silently and then two pages disagree about the same number.
  for (const { file, text } of readAllCopy()) {
    if (!file.includes("app") && !file.includes("components")) continue;
    expect(text, file).not.toMatch(PRICE_LITERAL);
  }
});

test("no agency-era social profiles remain", () => {
  for (const { file, text } of readAllCopy()) {
    expect(text, file).not.toMatch(/sagaxmedia|sagaxmarketing/i);
  }
});
