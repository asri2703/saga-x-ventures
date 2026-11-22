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
