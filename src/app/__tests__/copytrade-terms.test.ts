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

test("the page states what the copy costs", () => {
  // Between 25 November 2026 and the owner setting his own terms, this guard
  // ran the other way: the page was forbidden from naming a share, because
  // the broker's join screen said there were no fees and none was taken.
  // There is one now, it is monthly, and the page has to say so before a
  // reader funds an account on the strength of "no fees".
  expect(FLAT).toMatch(/profit, settled monthly/i);
  expect(FLAT).toContain("formatPct(copytrade.masterSharePct)");
});

test("the rate is read from config, never typed into the prose", () => {
  // A share written into a sentence is a second copy of a number that will
  // be changed in one place — and it is the number a reader acts on.
  expect(FLAT).not.toMatch(/\b30\s?%/);
  expect(FLAT).not.toMatch(/exampleSplit/);
});

test("the page does not describe how a loss is carried", () => {
  // High-water marks, gross against net, loss recovery: real terms of a real
  // profit share, none of them settled. Writing one down before it is agreed
  // states a rule the owner has not made.
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
  // The headings are the owner's and have been rewritten twice; what the
  // guard is actually about is the order, so it anchors on the two words
  // that cannot change without the steps themselves changing.
  const fund = FLAT.indexOf("Fund your account");
  const join = FLAT.indexOf("Subscribe to the copy");
  expect(fund).toBeGreaterThan(-1);
  expect(join).toBeGreaterThan(fund);
});

test("the hero's call to action starts the process rather than skipping it", () => {
  // It reads "Join us now", and the temptation is to point it straight at
  // the broker's copy page. That page cannot link an account with no money
  // in it, so the visitor would meet a dead screen — and would skip the
  // cent-account warning and the "High Risk" label on the way. It sends
  // them to step one instead.
  // From the headline, not from the top of the file: the steps table is
  // declared above the JSX and carries the copy-join link legitimately.
  // Anchored on the end of the hero's own section, not on a phrase from the
  // next one: the band below has been rewritten twice and took its headings
  // with it, and a missing anchor makes indexOf return -1, which slices a
  // guard down to nothing without failing.
  const heroEnds = FLAT.indexOf("What is copytrade");
  expect(heroEnds).toBeGreaterThan(-1);
  const hero = FLAT.slice(FLAT.indexOf("<h1"), heroEnds);
  expect(hero).toContain('href="#steps"');
  expect(hero).not.toContain("copytrade-join");
});

test("the record section says there is no record, rather than implying one", () => {
  // It is the honest answer until the account feed is wired up, and it is
  // also the section most likely to be "improved" into something suggestive.
  // The chart now draws a sample shape there, at the owner's instruction, so
  // what this holds is the sentence that stops the shape being read as one.
  // `record.test.ts` guards the rest of that arrangement.
  expect(FLAT).toMatch(/The numbers are not/i);
});
