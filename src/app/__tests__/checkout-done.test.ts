import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * The page a buyer lands on coming back from Billplz.
 *
 * It reads and never writes. Everything here is about the three states it
 * can be in and what it must never claim in each — Review Focus 5.
 */

const SOURCE = fs
  .readFileSync(
    path.join(process.cwd(), "src", "app", "checkout", "done", "page.tsx"),
    "utf8",
  )
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

test("it reads the bill id Billplz sends back", () => {
  // The redirect arrives as billplz[id], which is not a plain query name.
  expect(SOURCE).toMatch(/billplz\[id\]|billplz%5Bid%5D/);
});

test("it writes nothing", () => {
  // The callback is the only thing that may mark an order paid. This page
  // can be dropped, replayed, or opened twice.
  for (const writer of [
    "markPaid",
    "markFailed",
    "markLinkSent",
    "markNotified",
    "createPendingOrder",
    "notifyBuyer",
    "notifyOwner",
  ]) {
    expect(SOURCE, writer).not.toMatch(new RegExp(writer));
  }
});

test("it looks the order up rather than trusting the query", () => {
  // billplz[paid] arrives in the URL and a browser can edit a URL.
  expect(SOURCE).toMatch(/findOrderByBillId/);
});

test("it never claims a payment it cannot see", () => {
  // No row, a foreign bill id, or an unpaid one all have to say so.
  expect(SOURCE).toMatch(/status === "paid"|order\?\.status/);
});

test("the registration link is on the page, not only in the email", () => {
  // Email is the one part of this flow that fails silently. A buyer staring
  // at a confirmation with no way forward is the anti-goal.
  expect(SOURCE).toMatch(/masterysignal\.com\/membership|mastery-membership/);
});

test("it tells them to register with the email they paid with", () => {
  expect(SOURCE).toMatch(/same email/i);
});

test("it offers a person when something is wrong", () => {
  expect(SOURCE).toMatch(/whatsapp/i);
});

test("it does not read the clock", () => {
  // freshness.test.ts asserts no page does, and a page that did would need
  // a revalidate window none of them carry any more.
  expect(SOURCE).not.toMatch(/new Date\(\s*\)|Date\.now\(\s*\)/);
});

test("it states no price of its own", () => {
  expect(SOURCE).not.toMatch(/RM\s?\d/);
});

test("it is excluded from search", () => {
  // A confirmation page has nothing to offer a search result, and it should
  // not be the first thing anyone finds.
  expect(SOURCE).toMatch(/robots/);
});

test("a failed payment is not described as one still arriving", () => {
  // A declined or abandoned FPX payment produces a verified callback with
  // paid=false, so the order is `failed`. Telling that buyer "your link is
  // emailed the instant it arrives — nothing more is needed from you" is
  // the page claiming a payment it can see did not happen.
  expect(SOURCE).toMatch(/status === "pending"/);
  expect(SOURCE).toMatch(/did not (go through|complete)|was not completed/i);
});

test("it verifies the signature Billplz sends with the redirect", () => {
  // Otherwise a bill id in a URL is enough to read a buyer's email address
  // off this page, and bill ids travel in browser history and referrers.
  expect(SOURCE).toMatch(/verifySignature/);
  expect(SOURCE).toMatch(/billplz\[x_signature\]|x_signature/);
});

test("it survives the checkout being switched off", () => {
  // serviceClient() throws by design when Supabase is absent. A page that
  // calls it unguarded answers 500 where it should answer "no payment".
  expect(SOURCE).toMatch(/checkoutConfig|checkoutEnabled/);
});
