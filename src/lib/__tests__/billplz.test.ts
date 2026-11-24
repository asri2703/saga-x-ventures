import { expect, test } from "vitest";
import {
  billplzHost,
  signatureSource,
  verifySignature,
} from "@/lib/billplz";

/**
 * The fixtures are Billplz's own worked examples, not ours.
 *
 * The documentation's prose about how the source string is built could not be
 * read verbatim — the page truncates — so the algorithm here was settled the
 * only other way it could be: by computing HMAC-SHA256 over each documented
 * source string with its documented key and confirming all three reproduce
 * the documented signature exactly.
 *
 * That is why these payloads and signatures are copied rather than invented.
 * A fixture we made up would prove our implementation agrees with itself,
 * which is the one thing that cannot fail and the one thing that does not
 * matter. These prove it agrees with Billplz.
 */

/* The generic example: a bill being created. Key `abc123cde456`. */
const BILL_KEY = "abc123cde456";

const BILL_PAYLOAD: Record<string, string> = {
  collection_id: "inbmmepb",
  description: "testing",
  email: "api@billplz.com",
  name: "Michael",
  amount: "200",
  callback_url: "https://example.com/webhook",
};

const BILL_SOURCE =
  "amount200|callback_urlhttps://example.com/webhook|collection_idinbmmepb|descriptiontesting|emailapi@billplz.com|nameMichael";

const BILL_SIGNATURE =
  "ef5e54a22af0925cba88fab467119742e90262e3646eea1dee3949938daf3a38";

/* The callback example — the one this site actually has to verify. */
const CALLBACK_KEY = "S-s7b4yWpp9h7rrkNM1i3Z_g";

const CALLBACK_PAYLOAD: Record<string, string> = {
  id: "zq0tm2wc",
  collection_id: "yhx5t1pp",
  paid: "true",
  state: "paid",
  amount: "100",
  paid_amount: "100",
  due_at: "2018-9-27",
  email: "tester@test.com",
  mobile: "",
  name: "TESTER",
  url: "http://www.billplz-sandbox.com/bills/zq0tm2wc",
  paid_at: "2018-09-27 15:15:09 +0800",
  x_signature:
    "0fe0a20b8d557eeae570377783d062a3816a9ea80f368860bacfa7ec3ca4d00e",
};

const CALLBACK_SOURCE =
  "amount100|collection_idyhx5t1pp|due_at2018-9-27|emailtester@test.com|idzq0tm2wc|mobile|nameTESTER|paid_amount100|paid_at2018-09-27 15:15:09 +0800|paidtrue|statepaid|urlhttp://www.billplz-sandbox.com/bills/zq0tm2wc";

const CALLBACK_SIGNATURE =
  "0fe0a20b8d557eeae570377783d062a3816a9ea80f368860bacfa7ec3ca4d00e";

test("the signature source is built the way Billplz documents", () => {
  expect(signatureSource(BILL_PAYLOAD)).toBe(BILL_SOURCE);
  expect(signatureSource(CALLBACK_PAYLOAD)).toBe(CALLBACK_SOURCE);
});

test("an empty value contributes its bare key", () => {
  // `mobile` is empty in the documented callback and appears as "mobile".
  // Dropping empty keys instead would produce a different source string and
  // every callback for a bill created without a mobile would fail to verify.
  expect(signatureSource(CALLBACK_PAYLOAD)).toContain("|mobile|");
});

test("the elements sort by the whole pair, not by the key", () => {
  // paid_amount, paid_at and paid: a key-only sort puts `paid` first, and
  // the documented order puts it last. This is the ordering rule that is
  // easiest to get plausibly wrong.
  const source = signatureSource(CALLBACK_PAYLOAD);
  expect(source.indexOf("paid_amount")).toBeLessThan(source.indexOf("paid_at"));
  expect(source.indexOf("paid_at")).toBeLessThan(source.indexOf("paidtrue"));
});

test("a correct signature verifies and a tampered payload does not", () => {
  expect(verifySignature(BILL_PAYLOAD, BILL_KEY, BILL_SIGNATURE)).toBe(true);
  expect(verifySignature(CALLBACK_PAYLOAD, CALLBACK_KEY, CALLBACK_SIGNATURE)).toBe(
    true,
  );
  expect(
    verifySignature(
      { ...CALLBACK_PAYLOAD, paid_amount: "1" },
      CALLBACK_KEY,
      CALLBACK_SIGNATURE,
    ),
  ).toBe(false);
  expect(
    verifySignature(CALLBACK_PAYLOAD, "wrong-key", CALLBACK_SIGNATURE),
  ).toBe(false);
});

test("the payload's own x_signature is used when none is passed", () => {
  // A callback carries it in the body. Reading it from there is the normal
  // path; passing it separately is for the redirect, where it arrives under
  // a different name.
  expect(verifySignature(CALLBACK_PAYLOAD, CALLBACK_KEY)).toBe(true);
  expect(
    verifySignature({ ...CALLBACK_PAYLOAD, amount: "999" }, CALLBACK_KEY),
  ).toBe(false);
});

test("x_signature is not part of what is signed", () => {
  const rest = { ...CALLBACK_PAYLOAD };
  delete rest.x_signature;
  expect(signatureSource(CALLBACK_PAYLOAD)).toBe(signatureSource(rest));
});

test("a signature of the wrong length is refused rather than throwing", () => {
  // timingSafeEqual throws on unequal lengths. A truncated signature is an
  // attacker's input, not a crash.
  expect(verifySignature(CALLBACK_PAYLOAD, CALLBACK_KEY, "abc")).toBe(false);
  expect(verifySignature(CALLBACK_PAYLOAD, CALLBACK_KEY, "")).toBe(false);
});

test("the host follows the flag", () => {
  expect(billplzHost(true)).toContain("sandbox");
  expect(billplzHost(false)).not.toContain("sandbox");
  expect(billplzHost(false)).toBe("https://www.billplz.com");
});
