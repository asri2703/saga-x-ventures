import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { site } from "@/lib/site";

/**
 * The footer speaks in the owner's own voice; the meta description does not.
 *
 * They used to be the same string. `site.description` is written for a search
 * result — third person, with the countries in it — and reading it under the
 * logo made the footer sound like a directory entry. They are two different
 * jobs, so they are two different strings, and this test is what keeps the
 * footer change from quietly rewriting every page's metadata.
 */

const FOOTER = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "site-footer.tsx"),
  "utf8",
);

test("the footer reads the owner's line, not the meta description", () => {
  expect(FOOTER).toContain("site.footerLine");
  expect(FOOTER).not.toContain("site.description");
});

test("the two lines are not the same sentence", () => {
  expect(site.footerLine).not.toBe(site.description);
  expect(site.footerLine.length).toBeGreaterThan(0);
});

test("the footer line is first person, and the meta description is not", () => {
  // The whole reason for the split. A search snippet that opens with "I"
  // tells a stranger nothing about whose practice this is.
  expect(site.footerLine).toMatch(/^I /);
  expect(site.description).toContain(site.founder.name);
});
