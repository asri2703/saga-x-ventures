import { expect, test } from "vitest";
import { breakingAlert, officialAlert } from "@/lib/alerts/compose";
import { isBreaking, sameEvent, standing, wasUpdated } from "@/lib/terminal/breaking";
import { corroborationQuery, isGdeltSlot, parseRss, RSS_FEEDS } from "@/lib/terminal/sources";

const now = Date.parse("2026-11-27T13:00:00Z");

test("breaking means high impact and under half an hour old", () => {
  expect(isBreaking({ impact: "high", published_at: "2026-11-27T12:45:00Z" }, now)).toBe(true);
  expect(isBreaking({ impact: "high", published_at: "2026-11-27T12:29:00Z" }, now)).toBe(false);
  expect(isBreaking({ impact: "medium", published_at: "2026-11-27T12:55:00Z" }, now)).toBe(false);
});

test("a story reads as updated only when activity came well after first sight", () => {
  expect(wasUpdated({ published_at: "2026-11-27T06:30:00Z", last_update_at: "2026-11-27T12:48:00Z" })).toBe(true);
  expect(wasUpdated({ published_at: "2026-11-27T06:30:00Z", last_update_at: "2026-11-27T06:35:00Z" })).toBe(false);
});

test("standing ranks official over several outlets over one", () => {
  expect(standing({ official: true, source_count: 1, outlet: "White House" }).label).toBe("Official source");
  expect(standing({ official: false, source_count: 3, outlet: "BBC" }).label).toBe("Confirmed · 3 sources");
  expect(standing({ official: false, source_count: 1, outlet: "CNBC World" }).label).toBe("Reported by CNBC World");
});

test("the same event in two outlets' words is caught; different events are not", () => {
  expect(
    sameEvent(
      "China faces highest rate as US announces fresh raft of tariffs",
      "Trump slaps new tariffs on China, highest rate yet",
    ),
  ).toBe(true);
  expect(sameEvent("Iran vows to break US naval blockade", "ECB holds rates as inflation cools")).toBe(false);
});

test("a corroboration search keeps the telling words", () => {
  expect(corroborationQuery("Iran vows to break US naval blockade, claims full control of Hormuz")).toBe(
    "blockade control claims hormuz sourcelang:english",
  );
  expect(corroborationQuery("The end")).toBeNull();
});

test("GDELT is asked once per fifteen-minute slot when the wire runs every two minutes", () => {
  const slots = Array.from({ length: 30 }, (_, i) => isGdeltSlot(new Date(Date.UTC(2026, 10, 27, 13, i * 2))));
  expect(slots.filter(Boolean).length).toBe(4);
});

test("official feeds mark their headlines official", () => {
  const xml = "<rss><channel><item><title>Statement</title><link>https://x.gov/a</link><pubDate>Fri, 27 Nov 2026 12:00:00 GMT</pubDate></item></channel></rss>";
  expect(parseRss(xml, "rss", "White House", true)[0].official).toBe(true);
  expect(parseRss(xml, "rss", "BBC World")[0].official).toBeUndefined();
  expect(RSS_FEEDS.filter((f) => f.official).length).toBeGreaterThanOrEqual(8);
});

test("breaking and official alerts say who reported it", () => {
  const a = breakingAlert({ id: "s1", direction: "bullish", outlet: "Al Jazeera", official: false }, "Iran says it will break the US naval blockade.");
  expect(a).toMatchObject({ kind: "news", ref: "s1", title: "Breaking · Gold ▲" });
  expect(a.body).toBe("Iran says it will break the US naval blockade. (Reported by Al Jazeera)");
  const o = officialAlert({ id: "s1", title: "New tariffs on China" }, "White House");
  expect(o).toMatchObject({ ref: "s1:official", title: "Confirmed officially · White House" });
});
