import { expect, test } from "vitest";
import { checkoutConfig, checkoutEnabled } from "@/lib/checkout/config";
import { site } from "@/lib/site";

const FULL = {
  BILLPLZ_API_KEY: "k",
  BILLPLZ_COLLECTION_ID: "c",
  BILLPLZ_X_SIGNATURE: "s",
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "r",
  RESEND_API_KEY: "re",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  BILLPLZ_SANDBOX: "true",
};

test("all six present enables it", () => {
  expect(checkoutEnabled(FULL)).toBe(true);
});

test("each of the six turns it off by itself", () => {
  // A half-configured deployment must not open a pop-up that cannot finish.
  for (const key of [
    "BILLPLZ_API_KEY",
    "BILLPLZ_COLLECTION_ID",
    "BILLPLZ_X_SIGNATURE",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
  ]) {
    expect(checkoutEnabled({ ...FULL, [key]: "" }), key).toBe(false);
    expect(checkoutEnabled({ ...FULL, [key]: undefined }), key).toBe(false);
  }
});

test("supabase and resend are in the gate, not just billplz", () => {
  // Without Supabase the pop-up 500s at submit — the order row is written
  // before the bill. Without Resend the money is taken and nothing reaches
  // the buyer.
  expect(checkoutEnabled({ ...FULL, SUPABASE_SERVICE_ROLE_KEY: "" })).toBe(false);
  expect(checkoutEnabled({ ...FULL, RESEND_API_KEY: "" })).toBe(false);
});

test("telegram is not in the gate", () => {
  // A missing notification channel is a nuisance. It is not a reason to
  // refuse a sale.
  expect(
    checkoutEnabled({ ...FULL, TELEGRAM_BOT_TOKEN: "", TELEGRAM_CHAT_ID: "" }),
  ).toBe(true);
});

test("sandbox credentials cannot be served from the live domain", () => {
  // A real buyer would get a sandbox payment page, a correctly signed
  // sandbox callback, a paid row and a "Payment received" email for money
  // that never moved — every test green, every anti-goal at once.
  expect(checkoutEnabled({ ...FULL, NEXT_PUBLIC_SITE_URL: site.url })).toBe(false);
  expect(
    checkoutEnabled({
      ...FULL,
      NEXT_PUBLIC_SITE_URL: site.url,
      BILLPLZ_SANDBOX: "false",
    }),
  ).toBe(true);
});

test("the live-domain check compares hosts, not whole URLs", () => {
  // A trailing slash, a path, or http against https must not be a way past
  // it. The rule is about which machine is serving, not how it was typed.
  const host = new URL(site.url).host;
  for (const url of [`https://${host}/`, `http://${host}`, `https://${host}/checkout`]) {
    expect(checkoutEnabled({ ...FULL, NEXT_PUBLIC_SITE_URL: url }), url).toBe(false);
  }
});

test("a preview deployment may run sandbox", () => {
  // Testing against sandbox has to happen somewhere that is not localhost.
  expect(
    checkoutEnabled({ ...FULL, NEXT_PUBLIC_SITE_URL: "https://preview-abc.vercel.app" }),
  ).toBe(true);
});

test("BILLPLZ_SANDBOX defaults to sandbox when unset", () => {
  // The dangerous direction is defaulting to live. An absent flag should
  // mean "not ready", not "charge real cards".
  const config = checkoutConfig({ ...FULL, BILLPLZ_SANDBOX: undefined });
  expect(config?.sandbox).toBe(true);
});

test("the config carries what creating a bill needs", () => {
  const config = checkoutConfig(FULL);
  expect(config).toEqual({
    apiKey: "k",
    collectionId: "c",
    xSignature: "s",
    sandbox: true,
    siteUrl: "http://localhost:3000",
  });
});

test("a closed gate returns null rather than a half-built config", () => {
  expect(checkoutConfig({ ...FULL, BILLPLZ_API_KEY: "" })).toBeNull();
});
