import fs from "node:fs";
import { expect, test } from "vitest";

/**
 * Copytrade carries the only financial terms on the site that nobody has
 * fully confirmed. Two things were asked and never answered: whether the
 * 30% is gross or net, and whether a high-water mark applies. The page must
 * state neither — writing an answer nobody gave would be a false statement
 * about someone's money.
 */
test("the page states nothing about a high-water mark or gross versus net", () => {
  const source = fs.readFileSync("src/app/copytrade/page.tsx", "utf8");
  expect(source).not.toMatch(
    /high[-\s]?water|gross|net of|before the master is paid|recovered/i,
  );
});

test("the page does not frame the example as an outcome", () => {
  const source = fs.readFileSync("src/app/copytrade/page.tsx", "utf8");
  expect(source).not.toMatch(/turn .{0,20}into|grow your|could (make|earn)/i);
});
