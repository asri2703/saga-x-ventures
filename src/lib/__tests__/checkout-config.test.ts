import { expect, test } from "vitest";
import { checkoutConfig, checkoutEnabled } from "@/lib/checkout/config";
import { site } from "@/lib/site";

/** A valid sandbox configuration. Sandbox mode reads the sandbox set; the
 *  unprefixed names are live-only and deliberately do not apply here. */
const FULL = {
  BILLPLZ_SANDBOX_API_KEY: "k",
  BILLPLZ_SANDBOX_COLLECTION_ID: "c",
  BILLPLZ_SANDBOX_X_SIGNATURE: "s",
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "r",
  RESEND_API_KEY: "re",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  BILLPLZ_SANDBOX: "true",
  RESEND_FROM: "Saga X Ventures <no-reply@example.com>",
  ADMIN_EMAIL: "owner@example.com",
};

test("all six present enables it", () => {
  expect(checkoutEnabled(FULL)).toBe(true);
});

test("each of the six turns it off by itself", () => {
  // A half-configured deployment must not open a pop-up that cannot finish.
  for (const key of [
    "BILLPLZ_SANDBOX_API_KEY",
    "BILLPLZ_SANDBOX_COLLECTION_ID",
    "BILLPLZ_SANDBOX_X_SIGNATURE",
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
      BILLPLZ_LIVE_API_KEY: "k",
      BILLPLZ_LIVE_COLLECTION_ID: "c",
      BILLPLZ_LIVE_X_SIGNATURE: "s",
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
  expect(checkoutConfig({ ...FULL, BILLPLZ_SANDBOX_API_KEY: "" })).toBeNull();
});

test("a www or alias host does not get past the sandbox rule", () => {
  // The apex is one spelling of the production site. A deployment at
  // www.sagaxventures.com with the .env.example default of sandbox=true
  // would otherwise open the gate and sell a real buyer a sandbox page.
  const host = new URL(site.url).host;
  expect(checkoutEnabled({ ...FULL, NEXT_PUBLIC_SITE_URL: `https://www.${host}` })).toBe(
    false,
  );
});

test("sandbox is refused in a production deployment whatever the url says", () => {
  // NEXT_PUBLIC_SITE_URL is set by whoever deploys. It cannot tell you which
  // machine is serving; the platform can.
  expect(
    checkoutEnabled({
      ...FULL,
      NEXT_PUBLIC_SITE_URL: "https://anything.example.com",
      VERCEL_ENV: "production",
    }),
  ).toBe(false);
  expect(
    checkoutEnabled({
      ...FULL,
      NEXT_PUBLIC_SITE_URL: "https://anything.example.com",
      VERCEL_ENV: "production",
      BILLPLZ_SANDBOX: "false",
      BILLPLZ_LIVE_API_KEY: "k",
      BILLPLZ_LIVE_COLLECTION_ID: "c",
      BILLPLZ_LIVE_X_SIGNATURE: "s",
    }),
  ).toBe(true);
});

test("a preview deployment may still run sandbox", () => {
  expect(
    checkoutEnabled({
      ...FULL,
      NEXT_PUBLIC_SITE_URL: "https://preview-abc.vercel.app",
      VERCEL_ENV: "preview",
    }),
  ).toBe(true);
});

/* ------------------------------------------------------------------ *
 * Two sets of credentials, so neither has to be pasted over the other.
 * ------------------------------------------------------------------ */

const BASE = {
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "r",
  RESEND_API_KEY: "re",
  RESEND_FROM: "Saga X Ventures <no-reply@example.com>",
  ADMIN_EMAIL: "owner@example.com",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

test("sandbox mode reads the sandbox credentials", () => {
  const config = checkoutConfig({
    ...BASE,
    BILLPLZ_SANDBOX: "true",
    BILLPLZ_SANDBOX_API_KEY: "sand-key",
    BILLPLZ_SANDBOX_COLLECTION_ID: "sand-col",
    BILLPLZ_SANDBOX_X_SIGNATURE: "sand-sig",
    BILLPLZ_LIVE_API_KEY: "live-key",
    BILLPLZ_LIVE_COLLECTION_ID: "live-col",
    BILLPLZ_LIVE_X_SIGNATURE: "live-sig",
  });
  expect(config?.apiKey).toBe("sand-key");
  expect(config?.collectionId).toBe("sand-col");
  expect(config?.xSignature).toBe("sand-sig");
});

test("live mode reads the live credentials", () => {
  const config = checkoutConfig({
    ...BASE,
    NEXT_PUBLIC_SITE_URL: "https://staging.example.com",
    BILLPLZ_SANDBOX: "false",
    BILLPLZ_SANDBOX_API_KEY: "sand-key",
    BILLPLZ_SANDBOX_COLLECTION_ID: "sand-col",
    BILLPLZ_SANDBOX_X_SIGNATURE: "sand-sig",
    BILLPLZ_LIVE_API_KEY: "live-key",
    BILLPLZ_LIVE_COLLECTION_ID: "live-col",
    BILLPLZ_LIVE_X_SIGNATURE: "live-sig",
  });
  expect(config?.apiKey).toBe("live-key");
});

test("sandbox mode never falls back to the unprefixed keys", () => {
  // Those are where live keys already live. Falling back to them would hand
  // a live key to the sandbox host — the exact 401 that looks like a broken
  // key and is really the wrong account — or worse, the other way round.
  expect(
    checkoutEnabled({
      ...BASE,
      BILLPLZ_SANDBOX: "true",
      BILLPLZ_API_KEY: "k",
      BILLPLZ_COLLECTION_ID: "c",
      BILLPLZ_X_SIGNATURE: "s",
    }),
  ).toBe(false);
});

test("live mode still accepts the unprefixed keys that are already set", () => {
  // Nobody has to move anything they have already pasted.
  const config = checkoutConfig({
    ...BASE,
    NEXT_PUBLIC_SITE_URL: "https://staging.example.com",
    BILLPLZ_SANDBOX: "false",
    BILLPLZ_API_KEY: "old-key",
    BILLPLZ_COLLECTION_ID: "old-col",
    BILLPLZ_X_SIGNATURE: "old-sig",
  });
  expect(config?.apiKey).toBe("old-key");
});

test("a live-prefixed key wins over an unprefixed one", () => {
  const config = checkoutConfig({
    ...BASE,
    NEXT_PUBLIC_SITE_URL: "https://staging.example.com",
    BILLPLZ_SANDBOX: "false",
    BILLPLZ_API_KEY: "old-key",
    BILLPLZ_COLLECTION_ID: "old-col",
    BILLPLZ_X_SIGNATURE: "old-sig",
    BILLPLZ_LIVE_API_KEY: "live-key",
    BILLPLZ_LIVE_COLLECTION_ID: "live-col",
    BILLPLZ_LIVE_X_SIGNATURE: "live-sig",
  });
  expect(config?.apiKey).toBe("live-key");
});

test("half a set is not a set", () => {
  // Two of three is the state that produces a 401 nobody can explain.
  expect(
    checkoutEnabled({
      ...BASE,
      BILLPLZ_SANDBOX: "true",
      BILLPLZ_SANDBOX_API_KEY: "sand-key",
      BILLPLZ_SANDBOX_COLLECTION_ID: "sand-col",
    }),
  ).toBe(false);
});

test("a sender address and an admin address are in the gate too", () => {
  // Learned the hard way on the first live sandbox payment: the money was
  // taken, the order was marked paid, and both emails were refused because
  // RESEND_FROM was malformed. An address that cannot send fails exactly
  // like an outage, and the gate is where that belongs — refusing the sale
  // beats taking it and going quiet.
  expect(checkoutEnabled({ ...FULL, RESEND_FROM: "" })).toBe(false);
  expect(checkoutEnabled({ ...FULL, ADMIN_EMAIL: "" })).toBe(false);
});

test("a sender that is not an address at all is refused", () => {
  // Quotes left around the value in a .env file produce exactly this.
  expect(checkoutEnabled({ ...FULL, RESEND_FROM: '"Name <a@b.com>"' })).toBe(false);
  expect(checkoutEnabled({ ...FULL, RESEND_FROM: "Name <a@b.com>" })).toBe(true);
  expect(checkoutEnabled({ ...FULL, RESEND_FROM: "a@b.com" })).toBe(true);
});
