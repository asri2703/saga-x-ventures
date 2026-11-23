import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { stepIsReady, type GuideStep } from "@/components/product-guide";

const step = (over: Partial<GuideStep>): GuideStep => ({
  n: 1,
  title: "t",
  body: "b",
  outbound: null,
  cta: null,
  ...over,
});

test("a step with no destination yet renders no link", () => {
  // copytrade-join is empty until the owner supplies it. A link to "" is a
  // link to the current page, which looks like it worked and did not.
  expect(stepIsReady(step({ outbound: "copytrade-join", cta: "Join" }))).toBe(
    false,
  );
  expect(stepIsReady(step({ outbound: "broker-cent", cta: "Open" }))).toBe(
    true,
  );
  expect(stepIsReady(step({ outbound: null, cta: null }))).toBe(false);
});

test("a destination with no label is not a link either", () => {
  expect(stepIsReady(step({ outbound: "broker-cent", cta: null }))).toBe(false);
});

/* ------------------------------------------------------------------ *
 * The guide's shape. Checked against the source because the suite runs
 * in node with no DOM, and these are claims about structure.
 * ------------------------------------------------------------------ */

const GUIDE = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "product-guide.tsx"),
  "utf8",
);

test("the route cards lead to the steps they describe", () => {
  // They were plain divs. A visitor told to "pick one" clicked a card that
  // did nothing, and the steps for both routes were already further down.
  expect(GUIDE).toMatch(/href=\{`#\$\{route\.key\}`\}/);
});

test("the guide does not claim the steps change with the route", () => {
  // Both routes render unconditionally, one after the other. Saying they
  // swap describes an interface the page does not have.
  // Collapsed, because JSX wraps prose across lines and a contiguous search
  // would pass on a sentence that is still there.
  expect(GUIDE.replace(/\s+/g, " ")).not.toContain(
    "The steps below change with it",
  );
});

test("a page's own sections can sit before the closing ask", () => {
  // Copytrade's fee terms are the most important commercial content on the
  // site and used to render after the CTA, because the guide owned the end
  // of the page.
  expect(GUIDE).toContain("afterIntro");
  const slot = GUIDE.indexOf("{afterIntro}");
  const close = GUIDE.indexOf("Ask about {product.name}");
  expect(slot).toBeGreaterThan(-1);
  expect(slot).toBeLessThan(close);
});
