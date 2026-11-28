import { expect, test } from "vitest";
import { creditLine, parseCommonsSearch, parsePexelsSearch } from "@/lib/terminal/images";
import { mapSvg } from "@/lib/terminal/map-svg";
import { findPlace, placeBySlug, PLACES } from "@/lib/terminal/places";
import { groupBySlug, groupOf, SECTION_GROUPS } from "@/lib/terminal/sections";
import type { FeedItem } from "@/lib/terminal/store";
import { buildWire, isIssue, latestUpdate, LATEST_COUNT } from "@/lib/terminal/wire";

const NOW = Date.parse("2026-11-28T12:00:00Z");
const minsAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

function item(over: Partial<FeedItem> & { id: string }): FeedItem {
  const published = over.published_at ?? minsAgo(120);
  return {
    headline: `Story ${over.id}`,
    url: `https://example.com/${over.id}`,
    outlet: "Example",
    published_at: published,
    impact: "medium",
    direction: "neutral",
    summary: null,
    category: "geopolitics",
    image_url: null,
    image_credit: null,
    image_link: null,
    image_source: null,
    assets: [],
    brief: null,
    last_update_at: published,
    source_count: 1,
    official: false,
    sources: [{ outlet: "Example", url: `https://example.com/${over.id}`, headline: "x", published_at: published }],
    ...over,
  };
}

/* ---------------------------------- wire ---------------------------------- */

test("latestUpdate picks the newest later filing, not the original", () => {
  const s = item({
    id: "a",
    published_at: minsAgo(300),
    sources: [
      { outlet: "A", url: "u1", headline: "h", published_at: minsAgo(300) },
      { outlet: "B", url: "u2", headline: "h", published_at: minsAgo(60) },
      { outlet: "C", url: "u3", headline: "h", published_at: minsAgo(200) },
    ],
  });
  expect(latestUpdate(s)?.outlet).toBe("B");
  expect(latestUpdate(item({ id: "b" }))).toBeNull();
});

test("an issue is high impact, recently updated and carried by several outlets", () => {
  expect(isIssue(item({ id: "a", impact: "high", source_count: 3, last_update_at: minsAgo(30) }), NOW)).toBe(true);
  expect(isIssue(item({ id: "b", impact: "medium", source_count: 3, last_update_at: minsAgo(30) }), NOW)).toBe(false);
  expect(isIssue(item({ id: "c", impact: "high", source_count: 1, last_update_at: minsAgo(30) }), NOW)).toBe(false);
  expect(isIssue(item({ id: "d", impact: "high", source_count: 4, last_update_at: minsAgo(13 * 60) }), NOW)).toBe(
    false,
  );
});

test("buildWire puts the newest first, one line per story, and never repeats breaking", () => {
  const breaking = item({ id: "brk", impact: "high", published_at: minsAgo(5) });
  const old = item({
    id: "old",
    impact: "high",
    published_at: minsAgo(600),
    last_update_at: minsAgo(10),
    source_count: 3,
    sources: [
      { outlet: "A", url: "u1", headline: "h", published_at: minsAgo(600) },
      { outlet: "B", url: "u2", headline: "h", published_at: minsAgo(10) },
    ],
  });
  const mid = item({ id: "mid", published_at: minsAgo(30) });
  const quiet = item({ id: "low", impact: "low", published_at: minsAgo(1) });
  const wire = buildWire([breaking, mid, old, quiet], NOW);

  expect(wire.breaking?.id).toBe("brk");
  expect(wire.latest.map((e) => e.item.id)).toEqual(["old", "mid"]);
  expect(wire.latest[0].kind).toBe("update");
  expect(wire.issues.map((i) => i.id)).toEqual(["old"]);
  expect(wire.rest.low.map((i) => i.id)).toEqual(["low"]);
  expect(wire.rest.medium).toEqual([]);
});

test("buildWire caps latest and spills the rest into more stories", () => {
  const many = Array.from({ length: LATEST_COUNT + 3 }, (_, n) => item({ id: `s${n}`, published_at: minsAgo(60 + n) }));
  const wire = buildWire(many, NOW);
  expect(wire.latest).toHaveLength(LATEST_COUNT);
  expect(wire.rest.medium).toHaveLength(3);
});

/* -------------------------------- sections -------------------------------- */

test("every category belongs to exactly one section", () => {
  const seen = SECTION_GROUPS.flatMap((g) => [...g.categories]);
  expect(new Set(seen).size).toBe(seen.length);
  expect(groupOf("fed")?.slug).toBe("central-banks");
  expect(groupOf("us-data")?.slug).toBe("data");
  expect(groupOf(null)).toBeUndefined();
  expect(groupBySlug("gold")?.categories).toEqual(["gold-demand"]);
  expect(groupBySlug("nope")).toBeUndefined();
});

/* --------------------------------- places --------------------------------- */

test("the most specific place wins: a strait before the country beside it", () => {
  expect(findPlace("Iran threatens to close the Strait of Hormuz")?.slug).toBe("hormuz");
  expect(findPlace("Tehran rejects talks")?.slug).toBe("iran");
  expect(findPlace("Payrolls beat forecasts")).toBeNull();
  expect(placeBySlug("taiwan")?.name).toBeTruthy();
});

test("place slugs are unique and safe in a URL", () => {
  const slugs = PLACES.map((p) => p.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
});

test("mapSvg draws a framed map with the place, a marker and the credit", () => {
  const place = placeBySlug("hormuz");
  if (!place) throw new Error("hormuz missing");
  const svg = mapSvg(place);
  expect(svg.startsWith("<svg")).toBe(true);
  expect(svg).toContain('viewBox="0 0 640 360"');
  expect(svg).toContain("Strait of Hormuz");
  expect(svg).toContain("Natural Earth");
  expect(svg).toContain("<path");
});

/* --------------------------------- images --------------------------------- */

test("creditLine names the library, and leaves a Commons credit as it is", () => {
  expect(creditLine("Jane Doe", "unsplash")).toBe("Jane Doe / Unsplash");
  expect(creditLine("Jane Doe", "pexels")).toBe("Jane Doe / Pexels");
  expect(creditLine("Jane / Wikimedia Commons, CC BY 4.0", "wikimedia")).toBe("Jane / Wikimedia Commons, CC BY 4.0");
  expect(creditLine("Jane Doe", null)).toBe("Jane Doe / Unsplash");
});

test("parsePexelsSearch takes the first photo with a credit", () => {
  const photo = parsePexelsSearch({
    photos: [
      { src: { landscape: "https://elsewhere.com/x.jpg" }, photographer: "A", url: "https://www.pexels.com/photo/1" },
      {
        src: { landscape: "https://images.pexels.com/photos/2/a.jpg" },
        photographer: "Ben",
        url: "https://www.pexels.com/photo/2",
      },
    ],
  });
  expect(photo).toEqual({
    url: "https://images.pexels.com/photos/2/a.jpg",
    credit: "Ben",
    link: "https://www.pexels.com/photo/2",
    source: "pexels",
  });
  expect(parsePexelsSearch({ error: "bad key" })).toBeNull();
});

function commonsPage(index: number, licence: string, w: number, h: number) {
  return {
    index,
    imageinfo: [
      {
        thumburl: `https://upload.wikimedia.org/thumb/${index}.jpg`,
        descriptionurl: `https://commons.wikimedia.org/wiki/File:${index}.jpg`,
        thumbwidth: w,
        thumbheight: h,
        extmetadata: {
          LicenseShortName: { value: licence },
          Artist: { value: '<a href="x">Sam Lee</a>' },
        },
      },
    ],
  };
}

test("parseCommonsSearch keeps only free, landscape files, with author and licence", () => {
  const photo = parseCommonsSearch({
    query: {
      pages: {
        "1": commonsPage(1, "All rights reserved", 1200, 675),
        "2": commonsPage(2, "CC BY-SA 4.0", 600, 900),
        "3": commonsPage(3, "CC BY-SA 4.0", 1200, 675),
      },
    },
  });
  expect(photo?.url).toBe("https://upload.wikimedia.org/thumb/3.jpg");
  expect(photo?.credit).toBe("Sam Lee / Wikimedia Commons, CC BY-SA 4.0");
  expect(photo?.source).toBe("wikimedia");
  expect(parseCommonsSearch({})).toBeNull();
});
