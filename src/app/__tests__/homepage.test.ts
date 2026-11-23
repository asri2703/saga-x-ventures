import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { retailProducts } from "@/lib/products";

/**
 * The fork is the one part of the homepage that costs a visitor money to get
 * wrong, so two things about it are held here rather than left to a reading.
 */

const HOME = fs.readFileSync(
  path.join(process.cwd(), "src", "app", "page.tsx"),
  "utf8",
);

test("the warning about two accounts comes before the columns, not after", () => {
  // It decides whether to open one account or two. Below the CTAs it is
  // advice given to someone who has already clicked.
  const warning = HOME.indexOf("that is two accounts");
  const columns = HOME.indexOf("<AccountGateway");
  expect(warning).toBeGreaterThan(-1);
  expect(columns).toBeGreaterThan(-1);
  expect(warning).toBeLessThan(columns);
});

test("the fork states each product's qualifier", () => {
  // The cent column's 500 USD minimum is the single fact that decides
  // whether a visitor should bother, and the fork used not to mention it.
  const gateway = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "account-gateway.tsx"),
    "utf8",
  );
  expect(gateway).toContain("requirement");

  const withQualifier = retailProducts.filter(
    (p) => p.requirement(new Date()) !== null,
  );
  expect(withQualifier.length).toBeGreaterThan(1);
});
