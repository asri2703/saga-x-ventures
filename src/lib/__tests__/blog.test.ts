import { expect, test } from "vitest";
import { getPosts, latestPosts } from "@/lib/blog";

/**
 * The three agency posts are deleted and replacements may not exist at
 * launch, so every caller has to survive an empty blog. The homepage has a
 * "latest writing" section and the blog index has a list; neither may assume
 * a first post exists.
 */

test("an empty blog yields no posts and does not throw", () => {
  expect(() => getPosts()).not.toThrow();
  expect(Array.isArray(getPosts())).toBe(true);
});

test("latestPosts returns an empty array rather than undefined when there is nothing to show", () => {
  const latest = latestPosts(3);
  expect(Array.isArray(latest)).toBe(true);
  expect(latest.length).toBeLessThanOrEqual(3);
});

test("latestPosts never returns more than asked for", () => {
  expect(latestPosts(0)).toHaveLength(0);
});

test("no marketing-era posts survive", () => {
  const slugs = getPosts().map((p) => p.slug);
  expect(slugs).not.toContain("google-ads-clicks-but-no-enquiries");
  expect(slugs).not.toContain("google-maps-local-seo-malaysia");
  expect(slugs).not.toContain("website-visitors-but-no-enquiries");
});
