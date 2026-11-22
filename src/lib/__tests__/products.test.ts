import { expect, test } from "vitest";
import { products, getProduct, outbound } from "@/lib/products";

test("the two broker invite codes are distinct and correctly assigned", () => {
  expect(outbound["mastery-broker"]).toContain("invitid=1AA974-WAVJR35865");
  expect(outbound["fukyaa-broker"]).toContain("invitid=004VL9-TRMRV13456");
  expect(outbound["mastery-broker"]).not.toEqual(outbound["fukyaa-broker"]);
});

test("every outbound destination is an absolute https URL", () => {
  for (const url of Object.values(outbound)) expect(url).toMatch(/^https:\/\//);
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
  expect(getProduct("fukyaa")!.href).toBe("/go/fukyaa-broker");
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
