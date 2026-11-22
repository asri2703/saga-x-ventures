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
