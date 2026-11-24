import { site } from "@/lib/site";

/**
 * Whether the checkout may run, and with what.
 *
 * Server only — it reads `SUPABASE_SERVICE_ROLE_KEY` and the Billplz keys. A
 * client component asks the server for the answer and receives a boolean;
 * it never calls this.
 *
 * Two rules, and the second is the one that matters most:
 *
 * **Everything the whole flow needs, or nothing.** Not just the Billplz
 * three. The order row is written before the bill, so without Supabase the
 * pop-up fails at submit; without Resend the money is taken and nothing
 * reaches the buyer. A half-configured deployment must not show somebody a
 * dead end. Telegram is deliberately out: a missing notification channel is
 * a nuisance, not a reason to refuse a sale.
 *
 * **Sandbox credentials may not be served from the live domain.** Sandbox
 * and live are separate Billplz accounts, and sandbox keys on the real site
 * would give a buyer a sandbox payment page, a correctly signed sandbox
 * callback, a `paid` row and a "Payment received" email — for money that
 * never moved. Every test green, every anti-goal hit at once. Testing
 * against sandbox happens on localhost or a preview deployment, each with
 * its own `NEXT_PUBLIC_SITE_URL`.
 */

export type CheckoutConfig = {
  apiKey: string;
  collectionId: string;
  xSignature: string;
  sandbox: boolean;
  siteUrl: string;
};

/** Same machine, however the URL was typed. */
function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

/** Narrower than `NodeJS.ProcessEnv`, which Next augments with a required
 *  NODE_ENV that a test fixture has no reason to carry. */
type Env = Record<string, string | undefined>;

export function checkoutConfig(env: Env = process.env): CheckoutConfig | null {
  const apiKey = env.BILLPLZ_API_KEY;
  const collectionId = env.BILLPLZ_COLLECTION_ID;
  const xSignature = env.BILLPLZ_X_SIGNATURE;
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = env.RESEND_API_KEY;

  // Checked one at a time rather than through a list, so TypeScript narrows
  // each to a string and the config below needs no assertions.
  if (!apiKey) return null;
  if (!collectionId) return null;
  if (!xSignature) return null;
  if (!siteUrl) return null;
  if (!supabaseUrl) return null;
  if (!serviceKey) return null;
  if (!resendKey) return null;

  // Absent means sandbox. The dangerous default is the other one: an unset
  // flag should mean "not ready", never "charge real cards".
  const sandbox = env.BILLPLZ_SANDBOX !== "false";

  if (sandbox && sameHost(siteUrl, site.url)) return null;

  return { apiKey, collectionId, xSignature, sandbox, siteUrl };
}

export function checkoutEnabled(env: Env = process.env): boolean {
  return checkoutConfig(env) !== null;
}
