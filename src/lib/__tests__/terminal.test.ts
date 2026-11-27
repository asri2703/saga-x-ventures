import { expect, test } from "vitest";
import { buildUserMessage, parseAssets, parseVerdicts } from "@/lib/terminal/classify";
import { parseUnsplashSearch } from "@/lib/terminal/images";
import { buildBriefMessage, parseBriefReply } from "@/lib/terminal/brief";
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
    {"i": 1, "relevant": true, "impact": "high", "direction": "bullish", "summary": "Iran closed the Strait of Hormuz. Oil supply risk lifts demand for gold.", "category": "geopolitics", "image_query": "oil tanker, strait"},
    {"i": 2, "relevant": false, "impact": null, "direction": null, "summary": null},
    {"i": 3, "relevant": true, "impact": "huge", "direction": "bullish", "summary": "x"},
    {"i": 4, "relevant": true, "impact": "low", "direction": "sideways", "summary": "Ringkasan."},
    {"i": 9, "relevant": true, "impact": "high", "direction": "bullish", "summary": "Out of range."}
  ]`;
  const v = parseVerdicts(text, 5);
  expect(v[0]).toEqual({
    relevant: true,
    impact: "high",
    direction: "bullish",
    summary: "Iran closed the Strait of Hormuz. Oil supply risk lifts demand for gold.",
    category: "geopolitics",
    // Punctuation is stripped: the query goes into a search URL.
    imageQuery: "oil tanker strait",
    assets: [],
  });
  expect(v[1]).toEqual({
    relevant: false,
    impact: null,
    direction: null,
    summary: null,
    category: null,
    imageQuery: null,
    assets: [],
  });
  // A section we do not have is dropped, not guessed; the story is kept.
  expect(v[3]?.category).toBeNull();
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

/* ------------------------------------------------------------------ *
 * Photos.
 * ------------------------------------------------------------------ */

test("an Unsplash result becomes a sized, credited, hotlinked photo", () => {
  const photo = parseUnsplashSearch({
    results: [
      // Not hosted on Unsplash's image CDN: skipped.
      { urls: { raw: "https://evil.example/x.jpg" }, user: { name: "A", links: { html: "https://unsplash.com/@a" } } },
      {
        urls: { raw: "https://images.unsplash.com/photo-1?ixid=abc" },
        user: { name: "Jane Doe", links: { html: "https://unsplash.com/@jane" } },
        links: { download_location: "https://api.unsplash.com/photos/1/download" },
      },
    ],
  });
  expect(photo?.url).toBe(
    "https://images.unsplash.com/photo-1?ixid=abc&w=1200&h=675&fit=crop&auto=format&q=75",
  );
  expect(photo?.credit).toBe("Jane Doe");
  expect(photo?.link).toBe("https://unsplash.com/@jane?utm_source=saga_x_hq&utm_medium=referral");
  expect(photo?.downloadLocation).toBe("https://api.unsplash.com/photos/1/download");
  expect(parseUnsplashSearch({ results: [] })).toBeNull();
  expect(parseUnsplashSearch({ errors: ["bad key"] })).toBeNull();
});

/* ------------------------------------------------------------------ *
 * The brief.
 * ------------------------------------------------------------------ */

test("an RSS teaser is kept as plain text, tags and entities removed", () => {
  const xml = `<item><title>Fed holds</title><link>https://f/a</link><pubDate>Wed, 18 Nov 2026 19:00:00 GMT</pubDate><description>&lt;p&gt;Rates  unchanged &amp; steady&lt;/p&gt;</description></item>`;
  expect(parseRss(xml, "rss", "x")[0].snippet).toBe("Rates unchanged & steady");
  const bare = `<item><title>A</title><link>https://f/b</link><pubDate>Wed, 18 Nov 2026 19:00:00 GMT</pubDate></item>`;
  expect(parseRss(bare, "rss", "x")[0].snippet).toBeUndefined();
});

const candidates = [
  { id: "11111111-1111-1111-1111-111111111111", headline: "Drone strike in Kuwait" },
  { id: "22222222-2222-2222-2222-222222222222", headline: "Fed holds rates" },
];

test("a duplicate answer files the headline under the story it names", () => {
  expect(parseBriefReply('{"same_as": 2}', candidates)).toEqual({
    kind: "duplicate",
    parentId: "22222222-2222-2222-2222-222222222222",
  });
  // A number outside the list is not trusted.
  expect(parseBriefReply('{"same_as": 9}', candidates)).toEqual({ kind: "unusable" });
});

test("a brief needs every section, or it waits for the next run", () => {
  const full = {
    title: "Kuwait strike widens Gulf risk",
    what_happened: "A drone struck Kuwait.",
    why_it_matters: "It widens the conflict.",
    gold_impact: "Supportive for gold as a haven.",
    what_to_watch: "Whether shipping is disrupted.",
  };
  const ok = parseBriefReply(`Sure: ${JSON.stringify({ same_as: null, brief: full })}`, candidates);
  expect(ok).toEqual({ kind: "brief", brief: full });

  const missing = { ...full, what_to_watch: "" };
  expect(parseBriefReply(JSON.stringify({ same_as: null, brief: missing }), candidates)).toEqual({
    kind: "unusable",
  });
  expect(parseBriefReply("not json", candidates)).toEqual({ kind: "unusable" });
});

test("the brief prompt lists existing stories by number", () => {
  const msg = buildBriefMessage(
    { headline: "New", outlet: "BBC", publishedAt: "2026-11-27T05:00:00Z", snippet: null, impact: "high", direction: "bullish", assets: "XAUUSD up" },
    candidates,
  );
  expect(msg).toContain("1. Drone strike in Kuwait");
  expect(msg).toContain("2. Fed holds rates");
  expect(msg).toContain("Teaser: (none)");
});

/* ------------------------------------------------------------------ *
 * Forex.
 * ------------------------------------------------------------------ */

test("only listed instruments with a known direction are kept, five at most", () => {
  expect(
    parseAssets([
      { symbol: "XAUUSD", direction: "up" },
      { symbol: "eurusd", direction: "down" }, // case is forgiven
      { symbol: "BTCUSD", direction: "up" }, // not ours
      { symbol: "USDJPY", direction: "sideways" }, // not a direction
      { symbol: "XAUUSD", direction: "down" }, // a repeat
      { symbol: "GBPUSD", direction: "unclear" },
      { symbol: "AUDUSD", direction: "up" },
      { symbol: "NZDUSD", direction: "up" },
      { symbol: "USDCAD", direction: "down" }, // the sixth
    ]),
  ).toEqual([
    { symbol: "XAUUSD", direction: "up" },
    { symbol: "EURUSD", direction: "down" },
    { symbol: "GBPUSD", direction: "unclear" },
    { symbol: "AUDUSD", direction: "up" },
    { symbol: "NZDUSD", direction: "up" },
  ]);
  expect(parseAssets("XAUUSD")).toEqual([]);
});

test("a reply cut off by max_tokens keeps every verdict that finished", () => {
  const cut =
    'Here: [{"i":1,"relevant":true,"impact":"high","direction":"bullish","summary":"A \\"quoted\\" {brace}.","category":"geopolitics","image_query":"x","assets":[{"symbol":"USDJPY","direction":"down"}]},' +
    '{"i":2,"relevant":false},{"i":3,"relevant":true,"impact":"medium","summ';
  const v = parseVerdicts(cut, 3);
  expect(v[0]?.summary).toBe('A "quoted" {brace}.');
  expect(v[0]?.assets).toEqual([{ symbol: "USDJPY", direction: "down" }]);
  expect(v[1]?.relevant).toBe(false);
  expect(v[2]).toBeUndefined();
});

test("a verdict carries its instruments", () => {
  const v = parseVerdicts(
    `[{"i":1,"relevant":true,"impact":"high","direction":"bullish","summary":"BoJ hikes.","category":"central-banks","image_query":"central bank","assets":[{"symbol":"USDJPY","direction":"down"}]}]`,
    1,
  );
  expect(v[0]?.category).toBe("central-banks");
  expect(v[0]?.assets).toEqual([{ symbol: "USDJPY", direction: "down" }]);
});

test("RDF feeds that date items with dc:date are read", () => {
  const xml = `<item rdf:about="x"><title>BoJ statement</title><link>https://boj/a</link><dc:date>2026-11-27T14:00:00+09:00</dc:date></item>`;
  expect(parseRss(xml, "rss", "Bank of Japan")[0].publishedAt.toISOString()).toBe("2026-11-27T05:00:00.000Z");
});
