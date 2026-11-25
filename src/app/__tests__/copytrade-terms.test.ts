import fs from "node:fs";
import { expect, test } from "vitest";

/**
 * What /copytrade must and must not say.
 *
 * Until 25 November 2026 this file guarded a 30% weekly profit share whose
 * terms nobody had confirmed. The share turned out not to exist yet — the
 * broker's own join screen says "There are no fees" — so the arithmetic came
 * off the page entirely and these guards moved with it.
 *
 * What they protect now is the opposite problem. A visitor reaches the
 * broker's pages one click after this one, and three things there surprise
 * people: the provider is named "Fuky AA", the offer is labelled "High
 * Risk", and the minimum is written in cents, so a balance reads a hundred
 * times the money deposited. Saying all three in advance is most of what
 * this page is for, and each is the sort of line that gets trimmed by
 * somebody tidying copy who does not know why it is there.
 */

const SOURCE = fs.readFileSync("src/app/copytrade/page.tsx", "utf8");
const FLAT = SOURCE.replace(/\s+/g, " ");

test("the page names the provider a visitor will actually see", () => {
  // "Fuky AA" is the name on the broker's screen. Somebody who read a page
  // about Asri's account and then met a stranger's nickname at the moment of
  // joining is a visitor who closes the tab.
  expect(FLAT).toContain("Fuky AA");
});

test("the page states the broker's own risk label rather than softening it", () => {
  expect(FLAT).toContain("High Risk");
  // And does not contradict it. The owner asked for the risk to be framed
  // gently; framing is a choice, claiming the opposite of the broker's label
  // on the page it links to is not.
  expect(FLAT).not.toMatch(/low[-\s]risk|safe investment|no risk/i);
});

test("the page warns that a cent balance reads larger than the deposit", () => {
  // The single most alarming thing on the first screen after joining.
  expect(FLAT).toMatch(/cent account/i);
  expect(FLAT).toMatch(/hundred times/i);
});

test("the page states today's cost and promises nothing about tomorrow's", () => {
  // There is no fee today and the page may say so. What it may not do is
  // state a share that is not being taken, which is what it used to do.
  expect(FLAT).not.toMatch(/\b30\s?%|masterShare|investorShare|exampleSplit/);
  expect(FLAT).not.toMatch(/high[-\s]?water|gross|net of|recovered/i);
});

test("the page makes no claim about an outcome", () => {
  expect(FLAT).not.toMatch(
    /turn .{0,20}into|grow your|could (make|earn)|per day|daily target|a day\b/i,
  );
});

test("joining comes after funding, because the broker requires it", () => {
  // The copy page cannot link an account with no money in it. A visitor sent
  // to join first meets a screen that does nothing and assumes it is broken.
  const fund = FLAT.indexOf("Fund it");
  const join = FLAT.indexOf("Join the copy");
  expect(fund).toBeGreaterThan(-1);
  expect(join).toBeGreaterThan(fund);
});

test("the record section says there is no record, rather than implying one", () => {
  // It is the honest answer until the account feed is wired up, and it is
  // also the section most likely to be "improved" into something suggestive.
  expect(FLAT).toMatch(/no numbers on this page yet/i);
});
