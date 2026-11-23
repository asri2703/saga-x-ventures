import { expect, test } from "vitest";
import {
  products,
  retailProducts,
  ibProducts,
  getProduct,
  outbound,
} from "@/lib/products";
import { copytrade, fukyaa as fukyaaTerms } from "@/lib/commercial";

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

test("fukyaa's deposit minimum follows the promotion rather than a typed-in figure", () => {
  // The figure changes on a known date. Written down here it would contradict
  // commercial.ts the moment the promotion lapsed, and this string renders on
  // /coaching where nobody would think to look for it.
  const fukyaa = getProduct("fukyaa")!;
  expect(fukyaa.requirement(new Date("2026-06-01T00:00:00+08:00"))).toMatch(
    /500\s*USD/,
  );
  expect(fukyaa.requirement(new Date("2027-06-01T00:00:00+08:00"))).toMatch(
    /1,?000\s*USD/,
  );
});

test("getProduct returns undefined for an unknown key", () => {
  expect(getProduct("nope")).toBeUndefined();
});

test("there are six products across two lanes", () => {
  expect(products).toHaveLength(6);
  expect(retailProducts).toHaveLength(4);
  expect(ibProducts).toHaveLength(2);
});

test("no product without a page reaches navigation", () => {
  // The header dropdown and the homepage fork render retailProducts only.
  for (const p of retailProducts) {
    expect(p.href, p.key).toMatch(
      /^\/(mastery-signal|copytrade|fukyaa|coaching)$/,
    );
  }
});

test("no product states a deposit figure that is not in commercial.ts", () => {
  const allowed = [
    copytrade.minimumUsd,
    fukyaaTerms.depositPromoUsd,
    fukyaaTerms.depositStandardUsd,
  ].map(String);
  for (const p of products) {
    const text = p.requirement(new Date()) ?? "";
    for (const figure of text.match(/[\d,]+/g) ?? []) {
      expect(allowed, `${p.key}: ${text}`).toContain(figure.replace(/,/g, ""));
    }
  }
});

test("every product declares its lane, cta and account", () => {
  for (const p of products) {
    expect(["retail", "ib"], p.key).toContain(p.lane);
    expect(p.cta, p.key).toBeTruthy();
    expect(["cent", "standard", null], p.key).toContain(p.account);
  }
});

test("copytrade and fukyaa share the cent account", () => {
  expect(getProduct("copytrade")!.account).toBe("cent");
  expect(getProduct("fukyaa")!.account).toBe("cent");
});

test("copytrade's minimum comes from the terms, not from prose", () => {
  expect(getProduct("copytrade")!.requirement(new Date())).toContain(
    String(copytrade.minimumUsd),
  );
});

test("coaching is still the internal one", () => {
  expect(getProduct("coaching")!.external).toBe(false);
  expect(getProduct("coaching")!.href).toBe("/coaching");
});

test("each external product's first action points at a real outbound key", () => {
  for (const p of products.filter((p) => p.external)) {
    // A prefilled WhatsApp link carries ?m=<key>; the key is the path part.
    const key = p.href.replace("/go/", "").split("?")[0];
    expect(Object.keys(outbound), `${p.key} href`).toContain(key);
  }
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
