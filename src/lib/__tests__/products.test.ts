import { expect, test } from "vitest";
import { products, getProduct, outbound } from "@/lib/products";

test("the invite codes are per account type, not per product", () => {
  expect(outbound["broker-cent"]).toContain("invitid=004VL9-TRMRV13456");
  expect(outbound["broker-standard"]).toContain("invitid=1AA974-WAVJR35865");
  expect(outbound["broker-cent"]).not.toEqual(outbound["broker-standard"]);
});

test("each existing product names its account type", () => {
  // Copytrade does not exist until Task 2; its assertion lives there.
  expect(getProduct("fukyaa")!.account).toBe("cent");
  expect(getProduct("mastery-signal")!.account).toBe("standard");
});

test("a destination that is not set yet is empty, not a broken URL", () => {
  expect(outbound["copytrade-join"]).toBe("");
});

test("every non-empty destination is an absolute https URL", () => {
  for (const [key, url] of Object.entries(outbound)) {
    if (url === "") continue;
    expect(url, key).toMatch(/^https:\/\//);
  }
});

test("fukyaa states its deposit minimum", () => {
  expect(getProduct("fukyaa")!.requirement).toMatch(/500\s*USD/);
});

test("getProduct returns undefined for an unknown key", () => {
  expect(getProduct("nope")).toBeUndefined();
});

test("there are exactly three products and coaching is the internal one", () => {
  expect(products).toHaveLength(3);
  expect(getProduct("coaching")!.external).toBe(false);
  expect(getProduct("coaching")!.href).toBe("/coaching");
});

test("each external product's first action points at a real outbound key", () => {
  for (const p of products.filter((p) => p.external)) {
    const key = p.href.replace("/go/", "");
    expect(Object.keys(outbound), `${p.key} href`).toContain(key);
  }
  expect(getProduct("fukyaa")!.href).toBe("/go/broker-cent");
});

test("a product with a page on this site links to the page, not past it", () => {
  // Both external products need a funded broker account before the product
  // itself does anything. Dropping someone on a signup form without saying
  // so produces registrations that go nowhere.
  const mastery = getProduct("mastery-signal")!;
  expect(mastery.external).toBe(false);
  expect(mastery.href).toBe("/mastery-signal");
  expect(mastery.steps.length).toBeGreaterThan(1);
});

test("every step that links out names a real outbound key", () => {
  for (const p of products) {
    for (const s of p.steps) {
      if (s.outbound) expect(Object.keys(outbound)).toContain(s.outbound);
    }
  }
});

test("every product opens in the visitor's own voice, not the product name", () => {
  for (const p of products) {
    expect(p.forWho.length, p.key).toBeGreaterThan(0);
    expect(p.forWho.toLowerCase()).not.toContain(p.name.toLowerCase());
  }
});

test("every product says what its button does, rather than guessing from a flag", () => {
  // The label used to be derived from `external`, so the moment Mastery
  // Signal got a page of its own its button read "See the classes" on a
  // product with no classes.
  for (const p of products) {
    expect(p.cta, p.key).toBeTruthy();
    expect(p.cta.length, p.key).toBeLessThan(24);
  }
  expect(getProduct("mastery-signal")!.cta).not.toMatch(/class/i);
});
