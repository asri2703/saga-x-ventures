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
 * **One account's credentials at a time.** `BILLPLZ_SANDBOX` chooses which
 * of the two sets is read, so neither has to be pasted over the other.
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

/**
 * Whether this URL is the production site.
 *
 * Compares the registrable domain rather than the exact host, because
 * `www.` and any other subdomain of it are the same site to a buyer — and a
 * deployment at `www.` with the `.env.example` default of sandbox would
 * otherwise sail through this check.
 */
function isProductionSite(url: string): boolean {
  try {
    const host = new URL(url).host.toLowerCase();
    const live = new URL(site.url).host.toLowerCase().replace(/^www\./, "");
    return host === live || host.endsWith(`.${live}`);
  } catch {
    return false;
  }
}

/**
 * Whether the platform says this is production.
 *
 * `NEXT_PUBLIC_SITE_URL` is set by whoever deploys and cannot tell you which
 * machine is serving; a second domain, an alias, or a typo would all get
 * past a URL comparison alone. Vercel sets `VERCEL_ENV` itself.
 */
function isProductionDeployment(env: Env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV === "production";
  return false;
}

/** Narrower than `NodeJS.ProcessEnv`, which Next augments with a required
 *  NODE_ENV that a test fixture has no reason to carry. */
type Env = Record<string, string | undefined>;

export function checkoutConfig(env: Env = process.env): CheckoutConfig | null {
  // Absent means sandbox. The dangerous default is the other one: an unset
  // flag should mean "not ready", never "charge real cards".
  const sandbox = env.BILLPLZ_SANDBOX !== "false";

  /* Two sets, kept apart.
     Sandbox and live are separate Billplz accounts, and holding one set of
     variables meant pasting one account's keys over the other's every time
     the flag moved — with a 401 as the only sign you had missed one of the
     three.

     The fallback to the unprefixed names is deliberately one-directional:
     live only. Those are where live keys were already pasted before this
     split existed, so nobody has to move anything; and falling back to them
     in sandbox mode would hand a live key to the sandbox host, which is the
     failure this split exists to end. */
  const apiKey = sandbox
    ? env.BILLPLZ_SANDBOX_API_KEY
    : (env.BILLPLZ_LIVE_API_KEY ?? env.BILLPLZ_API_KEY);
  const collectionId = sandbox
    ? env.BILLPLZ_SANDBOX_COLLECTION_ID
    : (env.BILLPLZ_LIVE_COLLECTION_ID ?? env.BILLPLZ_COLLECTION_ID);
  const xSignature = sandbox
    ? env.BILLPLZ_SANDBOX_X_SIGNATURE
    : (env.BILLPLZ_LIVE_X_SIGNATURE ?? env.BILLPLZ_X_SIGNATURE);

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

  // Sandbox credentials must never be what a real buyer is handed. Two
  // independent ways of knowing this is production, because either one
  // alone has a hole: the URL is self-declared, and VERCEL_ENV is absent
  // anywhere that is not Vercel.
  if (sandbox && (isProductionSite(siteUrl) || isProductionDeployment(env))) {
    return null;
  }

  return { apiKey, collectionId, xSignature, sandbox, siteUrl };
}

export function checkoutEnabled(env: Env = process.env): boolean {
  return checkoutConfig(env) !== null;
}
