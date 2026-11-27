import { expect, test } from "vitest";
import { buildUserMessage, parseVerdicts } from "@/lib/terminal/classify";
import {
  dedupe,
  gdeltUrl,
  headlineKey,
  parseFinnhub,
  parseGdelt,
  parseGdeltDate,
  parseRss,
  type Headline,
} from "@/lib/terminal/sources";

/* ------------------------------------------------------------------ *
 * Sources.
 * ------------------------------------------------------------------ */

test("GDELT dates are read as UTC", () => {
  expect(parseGdeltDate("20261127T053000Z")?.toISOString()).toBe("2026-11-27T05:30:00.000Z");
  expect(parseGdeltDate("2026-11-27")).toBeNull();
});

test("GDELT articles without a title, link or time are skipped", () => {
  const rows = parseGdelt({
    articles: [
      { url: "https://a.example/1", title: "Iran closes Strait of Hormuz", seendate: "20261127T053000Z", domain: "a.example" },
      { url: "https://a.example/2", title: "", seendate: "20261127T053000Z" },
      { url: "", title: "No link", seendate: "20261127T053000Z" },
      { url: "https://a.example/3", title: "Bad time", seendate: "yesterday" },
    ],
  });
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ source: "gdelt", outlet: "a.example" });
  expect(parseGdelt({})).toEqual([]);
  expect(parseGdelt(null)).toEqual([]);
});

test("the GDELT request looks back a bounded window", () => {
  const url = new URL(gdeltUrl(30));
  expect(url.searchParams.get("timespan")).toBe("30min");
  expect(url.searchParams.get("format")).toBe("json");
});

test("RSS items are read, CDATA and entities included", () => {
  const xml = `<rss><channel>
    <item><title><![CDATA[FOMC statement]]></title><link>https://www.federalreserve.gov/a.htm</link><pubDate>Wed, 18 Nov 2026 19:00:00 GMT</pubDate></item>
    <item><title>Fed &amp; Treasury</title><link>https://www.federalreserve.gov/b.htm</link><pubDate>Thu, 19 Nov 2026 14:00:00 GMT</pubDate></item>
    <item><title>No date</title><link>https://www.federalreserve.gov/c.htm</link></item>
  </channel></rss>`;
  const rows = parseRss(xml, "rss", "federalreserve.gov");
  expect(rows.map((r) => r.headline)).toEqual(["FOMC statement", "Fed & Treasury"]);
  expect(rows[0].publishedAt.toISOString()).toBe("2026-11-18T19:00:00.000Z");
});

test("Finnhub times are seconds, not milliseconds", () => {
  const rows = parseFinnhub([
    { url: "https://f.example/1", headline: "Dollar slides", datetime: 1795757400, source: "Reuters" },
    { url: "https://f.example/2", headline: "No time" },
  ]);
  expect(rows).toHaveLength(1);
  expect(rows[0].publishedAt.getUTCFullYear()).toBe(2026);
  expect(parseFinnhub({ error: "bad key" })).toEqual([]);
});

const h = (url: string, headline: string): Headline => ({
  url,
  headline,
  source: "gdelt",
  outlet: "",
  publishedAt: new Date("2026-11-27T05:00:00Z"),
});

test("one story from two outlets is kept once", () => {
  expect(headlineKey("Trump: New Tariffs on  EU!?")).toBe("trump new tariffs on eu");
  const out = dedupe([
    h("https://a.example/1", "Trump announces new tariffs"),
    h("https://b.example/9", "TRUMP announces new tariffs."),
    h("https://a.example/1", "Different title, same link"),
    h("https://c.example/2", "Fed holds rates"),
  ]);
  expect(out.map((x) => x.url)).toEqual(["https://a.example/1", "https://c.example/2"]);
});

/* ------------------------------------------------------------------ *
 * Classification.
 * ------------------------------------------------------------------ */

test("headlines are numbered from one in the prompt", () => {
  const msg = buildUserMessage([h("u1", "First"), h("u2", "Second")]);
  expect(msg.split("\n")[0]).toMatch(/^1\. First/);
  expect(msg.split("\n")[1]).toMatch(/^2\. Second/);
});

test("verdicts map back to their headline and bad rows are dropped", () => {
  const text = `Here you go:
  [
    {"i": 1, "relevant": true, "impact": "high", "direction": "bullish", "summary_ms": "Iran menutup Selat Hormuz. Risiko bekalan minyak menaikkan permintaan emas."},
    {"i": 2, "relevant": false, "impact": null, "direction": null, "summary_ms": null},
    {"i": 3, "relevant": true, "impact": "huge", "direction": "bullish", "summary_ms": "x"},
    {"i": 4, "relevant": true, "impact": "low", "direction": "sideways", "summary_ms": "Ringkasan."},
    {"i": 9, "relevant": true, "impact": "high", "direction": "bullish", "summary_ms": "Out of range."}
  ]`;
  const v = parseVerdicts(text, 5);
  expect(v[0]).toEqual({
    relevant: true,
    impact: "high",
    direction: "bullish",
    summaryMs: "Iran menutup Selat Hormuz. Risiko bekalan minyak menaikkan permintaan emas.",
  });
  expect(v[1]).toEqual({ relevant: false, impact: null, direction: null, summaryMs: null });
  // An impact we do not know is a skipped row, asked again next run.
  expect(v[2]).toBeUndefined();
  // An unknown direction falls back to neutral rather than losing the story.
  expect(v[3]?.direction).toBe("neutral");
  expect(v[4]).toBeUndefined();
});

test("a reply that is not JSON skips the whole batch", () => {
  expect(parseVerdicts("Sorry, I cannot help with that.", 3)).toEqual([undefined, undefined, undefined]);
  expect(parseVerdicts("[not json]", 2)).toEqual([undefined, undefined]);
});
