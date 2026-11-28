import { expect, test } from "vitest";
import { RELATED, relatedStories, storyMatches } from "@/lib/macro/related";
import { SERIES } from "@/lib/macro/series";

const story = (headline: string, summary: string | null = null, title: string | null = null) => ({
  headline,
  summary,
  brief: title ? { title } : null,
});

test("every series on the page has related words", () => {
  for (const s of SERIES) expect(RELATED[s.slug], s.slug).toBeDefined();
});

test("NFP picks up payroll and hiring stories, not unrelated data", () => {
  const nfp = RELATED.nfp.match;
  expect(storyMatches(story("US nonfarm payrolls beat forecasts"), nfp)).toBe(true);
  expect(storyMatches(story("Hiring slows as firms wait on tariffs"), nfp)).toBe(true);
  expect(storyMatches(story("Fed's Waller", "He says the jobs report was soft"), nfp)).toBe(true);
  expect(storyMatches(story("Non-farm payroll preview"), nfp)).toBe(true);
  expect(storyMatches(story("Retail sales rise 0.4%"), nfp)).toBe(false);
  expect(storyMatches(story("Oil jumps on Hormuz"), nfp)).toBe(false);
});

test("the brief's title and the summary count as well as the headline", () => {
  expect(storyMatches(story("Markets wrap", null, "Payrolls surprise to the upside"), RELATED.nfp.match)).toBe(true);
  expect(storyMatches(story("Dollar slips", "Traders cut bets after soft CPI"), RELATED["cpi-mom"].match)).toBe(true);
});

test("words match whole words, so 'fed' does not hit 'federation' or 'fedex'", () => {
  const fed = RELATED["fed-funds"].match;
  expect(storyMatches(story("FedEx shares fall"), fed)).toBe(false);
  expect(storyMatches(story("Football federation fines club"), fed)).toBe(false);
  expect(storyMatches(story("Fed holds rates, signals patience"), fed)).toBe(true);
});

test("relatedStories keeps order and caps the count", () => {
  const items = [story("Payrolls jump"), story("Oil falls"), story("Jobs report due Friday"), story("ADP hiring cools")];
  expect(relatedStories("nfp", items, 2).map((s) => s.headline)).toEqual(["Payrolls jump", "Jobs report due Friday"]);
  expect(relatedStories("unknown", items, 5)).toEqual([]);
});
