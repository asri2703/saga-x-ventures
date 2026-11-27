import { expect, test } from "vitest";
import { cotAlert, macroAlert, newsAlert } from "@/lib/alerts/compose";
import { cleanTopics, isSubscription } from "@/lib/alerts/push";
import { cotViews } from "@/lib/cot/store";
import { seriesBySlug } from "@/lib/macro/series";

test("a news alert leads with impact and lean, and stays short", () => {
  const a = newsAlert(
    { id: "abc", direction: "bullish" },
    { title: "Iran closes the Strait of Hormuz", what_happened: "x ".repeat(200) },
  );
  expect(a).toMatchObject({ kind: "news", ref: "abc", title: "High impact · Bullish gold", path: "/terminal/abc" });
  expect(a.body.startsWith("Iran closes the Strait of Hormuz.")).toBe(true);
  expect(a.body.length).toBeLessThanOrEqual(180);
  expect(newsAlert({ id: "b", direction: "neutral" }, { title: "T", what_happened: "W" }).title).toBe("High impact");
});

test("a COT alert is keyed by the report date and names each pair's lean", () => {
  const base = { open_interest: 100, hedge_long: 0, hedge_short: 0 };
  const views = cotViews([
    { market: "gold", report_date: "2026-11-10", spec_long: 120, spec_short: 10, ...base },
    { market: "gold", report_date: "2026-11-17", spec_long: 110, spec_short: 10, ...base },
    { market: "jpy", report_date: "2026-11-17", spec_long: 10, spec_short: 40, ...base },
    { market: "dxy", report_date: "2026-11-17", spec_long: 10, spec_short: 40, ...base },
  ]);
  const a = cotAlert(views)!;
  expect(a).toMatchObject({ kind: "cot", ref: "2026-11-17", title: "COT out: funds net long gold", path: "/cot" });
  expect(a.body).toBe("Managed money +100 contracts (-10 on the week). USDJPY bullish.");
  expect(cotAlert([])).toBeNull();
});

test("a macro alert shows the reading and the one before", () => {
  const def = seriesBySlug("cpi-yoy")!;
  const a = macroAlert(def, { date: "2026-10-01", value: 2.94 }, { date: "2026-09-01", value: 3.01 });
  expect(a.ref).toBe("cpi-yoy:2026-10-01");
  expect(a.title).toContain(def.name);
  expect(a.body).toContain("previous");
  expect(a.path).toBe("/macro/cpi-yoy");
});

test("only real https push subscriptions are accepted", () => {
  expect(isSubscription({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "a", auth: "b" } })).toBe(true);
  expect(isSubscription({ endpoint: "http://evil", keys: { p256dh: "a", auth: "b" } })).toBe(false);
  expect(isSubscription({ endpoint: "https://x" })).toBe(false);
  expect(isSubscription(null)).toBe(false);
});

test("topics fall back to all three when none are valid", () => {
  expect(cleanTopics(["cot", "spam"])).toEqual(["cot"]);
  expect(cleanTopics([])).toEqual(["news", "cot", "macro"]);
  expect(cleanTopics("news")).toEqual(["news", "cot", "macro"]);
});
