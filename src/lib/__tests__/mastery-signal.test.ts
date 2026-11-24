import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { stepIsReady, type GuideStep } from "@/components/product-guide";
import { masterySignalRoutes } from "@/lib/mastery-signal";

const SOURCE = fs.readFileSync(
  path.join(process.cwd(), "src", "lib", "mastery-signal.ts"),
  "utf8",
);

const step = (over: Partial<GuideStep>): GuideStep => ({
  n: 1,
  title: "t",
  body: "b",
  outbound: null,
  cta: null,
  ...over,
});

test("the direct route no longer promises a checkout that is being built", () => {
  // It was a promise this release either keeps or breaks. It keeps it.
  expect(SOURCE).not.toMatch(/being built|will replace this step/i);
});

test("it no longer offers DuitNow QR", () => {
  // Billplz only for this release; the QR path is a non-goal. Offering a way
  // to pay that nothing implements is worse than offering one way.
  expect(SOURCE).not.toMatch(/DuitNow/i);
});

test("the direct route's first step opens the checkout", () => {
  const direct = masterySignalRoutes().find((route) => route.key === "direct");
  expect(direct).toBeDefined();
  expect(direct?.steps[0].opensCheckout).toBe(true);
  expect(direct?.steps[0].outbound).toBeNull();
  expect(direct?.steps[0].cta).toBeTruthy();
});

test("the deposit route is untouched and still goes to the broker", () => {
  // A different way in, not a cheaper one. It does not pass through payment.
  const deposit = masterySignalRoutes().find((route) => route.key === "deposit");
  expect(deposit?.steps[0].outbound).toBe("broker-standard");
  for (const s of deposit?.steps ?? []) {
    expect(s.opensCheckout).toBeUndefined();
  }
});

test("a step that opens the checkout is not treated as a dead link", () => {
  // stepIsReady decides whether to render the dashed "link coming"
  // placeholder. A step with a button is neither ready nor broken.
  expect(stepIsReady(step({ opensCheckout: true, cta: "Choose a package" }))).toBe(
    false,
  );
});

test("the guide renders an opener for a step that asks for one", () => {
  const guide = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "product-guide.tsx"),
    "utf8",
  );
  expect(guide).toMatch(/opensCheckout/);
  expect(guide).toMatch(/CheckoutOpener/);
});

test("the checkout is only offered where the server says it may run", () => {
  // Same rule as the homepage: a half-configured deployment must not open a
  // dialog that cannot finish.
  const guide = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "product-guide.tsx"),
    "utf8",
  );
  expect(guide).toMatch(/checkout/i);
  const page = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "mastery-signal", "page.tsx"),
    "utf8",
  );
  expect(page).toMatch(/checkoutEnabled/);
});

test("with the checkout off, the step still offers a way to pay", () => {
  // Spec 7.12: a half-configured deployment must not show a buyer a dead
  // end. The homepage falls back to its outbound link; this step used to
  // render no action at all, because every branch required either an
  // outbound key or the checkout being on.
  const guide = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "product-guide.tsx"),
    "utf8",
  );
  expect(guide).toMatch(/opensCheckout && !checkout|!checkout && step\.opensCheckout/);
  expect(guide).toMatch(/whatsapp/i);
});
