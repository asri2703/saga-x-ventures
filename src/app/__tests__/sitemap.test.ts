import { expect, test } from "vitest";
import sitemap from "@/app/sitemap";

const paths = () =>
  sitemap().map((e) => e.url.replace("https://sagaxventures.com", ""));

test("no agency service URLs remain in the sitemap", () => {
  expect(paths().some((p) => p.startsWith("/services"))).toBe(false);
});

test("the sitemap lists the trading pages", () => {
  expect(paths()).toEqual(
    expect.arrayContaining([
      "",
      "/copytrade",
      "/fukyaa",
      "/coaching",
      "/events",
      "/blog",
      "/about",
      "/contact",
      "/privacy",
    ]),
  );
});

test("the logged redirect route is not offered to crawlers", () => {
  expect(paths().some((p) => p.startsWith("/go"))).toBe(false);
});

test("every entry is an absolute URL on the real domain", () => {
  for (const e of sitemap()) {
    expect(e.url).toMatch(/^https:\/\/sagaxventures\.com/);
  }
});

test("the retired Mastery page is not offered to a crawler", () => {
  // It is gone, and the product lives on its own site. A sitemap that
  // lists a URL which no longer exists is exactly what produces Search
  // Console's "Submitted URL not found (404)" — the one error this whole
  // change was made to avoid.
  expect(paths()).not.toContain("/mastery-signal");
});

test("the retired Mastery page redirects rather than 404s", async () => {
  // Anyone holding an old link — a bookmark, a message, a crawler that saw
  // it on a preview — lands on the product's own site instead of nothing.
  // Permanent, so a search engine moves any standing it had across.
  const { default: config } = await import("../../../next.config");
  const rules = await config.redirects!();
  const rule = rules.find((r) => r.source === "/mastery-signal");
  expect(rule).toBeDefined();
  expect(rule!.destination).toBe("https://www.masterysignal.com/");
  expect(rule!.permanent).toBe(true);
});
