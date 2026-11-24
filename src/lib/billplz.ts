import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Billplz v3.
 *
 * Server only. The API key is HTTP Basic auth against Billplz and the X
 * Signature key verifies that a callback came from them; either one in a
 * browser bundle is the whole thing given away.
 *
 * Sandbox and live are two accounts on two hosts with two sets of keys, not
 * two modes of one. A live key against the sandbox host is rejected exactly
 * like a wrong key, so there is nothing in a 401 to tell you which mistake
 * you made.
 */

const LIVE = "https://www.billplz.com";
const SANDBOX = "https://www.billplz-sandbox.com";

export function billplzHost(sandbox: boolean): string {
  return sandbox ? SANDBOX : LIVE;
}

/**
 * The string Billplz signs.
 *
 * Every key and value except `x_signature`, each pair written as the key
 * immediately followed by its value with no separator between them, the
 * pairs sorted ascending as whole strings, and joined with `|`.
 *
 * Three things here are easy to get plausibly wrong, and a plausible
 * mistake passes its own tests and fails against Billplz:
 *
 * 1. **The sort is over the whole pair, not the key.** `paid_amount100`,
 *    `paid_at…` and `paidtrue` sort in that order; sorting by key alone
 *    puts `paid` first.
 * 2. **An empty value contributes its bare key.** The documented callback
 *    has no mobile and its source string still contains `mobile`. Dropping
 *    empty keys would break every bill created without one.
 * 3. **`x_signature` is excluded.** Including it cannot verify, because the
 *    value being signed would have to contain its own signature.
 *
 * The rules above were confirmed by reproducing all three of Billplz's
 * documented worked examples, which is what `billplz.test.ts` pins.
 */
export function signatureSource(payload: Record<string, string>): string {
  return Object.entries(payload)
    .filter(([key]) => key !== "x_signature")
    .map(([key, value]) => `${key}${value ?? ""}`)
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
    .join("|");
}

/**
 * Whether this payload really came from Billplz.
 *
 * `signature` is for the redirect, where it arrives as `billplz[x_signature]`
 * rather than inside the payload. A callback carries its own, so it is
 * optional.
 */
export function verifySignature(
  payload: Record<string, string>,
  key: string,
  signature?: string,
): boolean {
  const claimed = signature ?? payload.x_signature ?? "";
  const computed = createHmac("sha256", key)
    .update(signatureSource(payload), "utf8")
    .digest("hex");

  const a = Buffer.from(claimed, "utf8");
  const b = Buffer.from(computed, "utf8");
  // A length mismatch is a wrong signature, not a crash — and comparing with
  // `===` would leak how much of it was right through how long it took.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type CreateBillInput = {
  apiKey: string;
  collectionId: string;
  sandbox: boolean;
  name: string;
  email: string;
  /** The smallest currency unit. RM99 is 9900. */
  amountSen: number;
  /** Shown on the bill. Billplz caps it at 200 characters. */
  description: string;
  /** Our order id, so a callback can be matched even if nothing else is. */
  reference1: string;
  callbackUrl: string;
  redirectUrl: string;
};

export async function createBill(
  input: CreateBillInput,
): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    collection_id: input.collectionId,
    email: input.email,
    name: input.name.slice(0, 255),
    amount: String(input.amountSen),
    callback_url: input.callbackUrl,
    redirect_url: input.redirectUrl,
    description: input.description.slice(0, 200),
    reference_1_label: "Order",
    reference_1: input.reference1.slice(0, 120),
  });

  const response = await fetch(`${billplzHost(input.sandbox)}/api/v3/bills`, {
    method: "POST",
    headers: {
      // Basic auth, the API key as the username and no password.
      Authorization: `Basic ${Buffer.from(`${input.apiKey}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    // The status alone does not say which of the three credentials is wrong,
    // and Billplz's body usually does.
    throw new Error(`Billplz ${response.status}: ${text}`);
  }

  const bill = JSON.parse(text) as { id?: string; url?: string };
  if (!bill.id || !bill.url) {
    throw new Error(`Billplz returned no bill id or url: ${text}`);
  }
  return { id: bill.id, url: bill.url };
}
