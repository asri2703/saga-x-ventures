import { createHmac } from "node:crypto";
import { beforeEach, expect, test, vi } from "vitest";
import { signatureSource } from "@/lib/billplz";

/**
 * The callback is the only thing that marks an order paid.
 *
 * Not the redirect: that is a page a browser lands on, and it can be
 * dropped, replayed or opened twice. This endpoint is reached server to
 * server and carries a signature, which is the only reason it can be
 * trusted with that decision.
 *
 * The signatures in these tests are computed, not pasted. A fixture
 * signature would go stale the moment a field changed and the test would
 * start proving nothing.
 */

const KEY = "test-x-signature-key";

const findOrderByBillId = vi.fn();
const markPaid = vi.fn();
const markFailed = vi.fn();
const markLinkSent = vi.fn();
const markNotified = vi.fn();
const notifyBuyer = vi.fn();
const notifyOwner = vi.fn();

vi.mock("@/lib/checkout/orders", () => ({
  findOrderByBillId: (...a: unknown[]) => findOrderByBillId(...a),
  markPaid: (...a: unknown[]) => markPaid(...a),
  markFailed: (...a: unknown[]) => markFailed(...a),
  markLinkSent: (...a: unknown[]) => markLinkSent(...a),
  markNotified: (...a: unknown[]) => markNotified(...a),
}));
vi.mock("@/lib/notify", () => ({
  notifyBuyer: (...a: unknown[]) => notifyBuyer(...a),
  notifyOwner: (...a: unknown[]) => notifyOwner(...a),
}));
vi.mock("@/lib/checkout/config", () => ({
  checkoutConfig: () => ({
    apiKey: "k",
    collectionId: "c",
    xSignature: KEY,
    sandbox: true,
    siteUrl: "http://localhost:3000",
  }),
}));

const { POST } = await import("@/app/api/checkout/callback/route");

const ORDER = {
  id: "order-1",
  planKey: "year",
  amountSen: 87600,
  paidAmountSen: null,
  status: "pending",
  billplzBillId: "bill-1",
  buyerName: "Aminah",
  buyerEmail: "aminah@example.com",
  buyerPhone: "0123456789",
  paidAt: null,
  linkSentAt: null,
  notifiedAt: null,
  accessGrantedAt: null,
};

const PAID: Record<string, string> = {
  id: "bill-1",
  collection_id: "c",
  paid: "true",
  state: "paid",
  amount: "87600",
  paid_amount: "87600",
  due_at: "2026-11-24",
  email: "aminah@example.com",
  mobile: "",
  name: "Aminah",
  url: "https://www.billplz-sandbox.com/bills/bill-1",
  paid_at: "2026-11-24 10:00:00 +0800",
};

/** Sign a payload the way Billplz does, so the handler sees a real one. */
function signed(payload: Record<string, string>): Record<string, string> {
  const x_signature = createHmac("sha256", KEY)
    .update(signatureSource(payload), "utf8")
    .digest("hex");
  return { ...payload, x_signature };
}

const formReq = (payload: Record<string, string>) =>
  new Request("http://localhost:3000/api/checkout/callback", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload),
  });

beforeEach(() => {
  vi.clearAllMocks();
  findOrderByBillId.mockResolvedValue(ORDER);
  markPaid.mockResolvedValue({ ...ORDER, status: "paid", paidAmountSen: 87600 });
  markLinkSent.mockResolvedValue(true);
  markNotified.mockResolvedValue(true);
  notifyBuyer.mockResolvedValue(undefined);
  notifyOwner.mockResolvedValue(undefined);
});

test("an unsigned or wrongly signed callback writes nothing", async () => {
  // Without this check, anyone who learns the URL can mark an order paid.
  const res = await POST(formReq({ ...PAID, x_signature: "nope" }));
  expect(res.status).toBe(401);
  expect(markPaid).not.toHaveBeenCalled();
  expect(markFailed).not.toHaveBeenCalled();
});

test("a callback with no signature at all is refused", async () => {
  const res = await POST(formReq(PAID));
  expect(res.status).toBe(401);
  expect(markPaid).not.toHaveBeenCalled();
});

test("a tampered amount fails verification", async () => {
  const real = signed(PAID);
  const res = await POST(formReq({ ...real, paid_amount: "1" }));
  expect(res.status).toBe(401);
  expect(markPaid).not.toHaveBeenCalled();
});

test("a verified callback for a bill we do not know writes nothing", async () => {
  // Review Focus 2. It must not invent an order out of the callback's own
  // fields — that would be a signed stranger creating rows.
  findOrderByBillId.mockResolvedValue(null);
  const res = await POST(formReq(signed(PAID)));
  expect(res.status).toBe(200);
  expect(markPaid).not.toHaveBeenCalled();
  expect(markFailed).not.toHaveBeenCalled();
});

test("a verified paid callback marks the order paid", async () => {
  const res = await POST(formReq(signed(PAID)));
  expect(res.status).toBe(200);
  expect(markPaid).toHaveBeenCalledWith("bill-1", 87600, expect.any(Date));
});

test("the amount that arrived is what gets recorded", async () => {
  await POST(formReq(signed({ ...PAID, paid_amount: "9900" })));
  expect(markPaid).toHaveBeenCalledWith("bill-1", 9900, expect.any(Date));
});

test("a verified unpaid callback marks it failed", async () => {
  await POST(formReq(signed({ ...PAID, paid: "false", state: "due", paid_amount: "0" })));
  expect(markFailed).toHaveBeenCalledWith("bill-1");
  expect(markPaid).not.toHaveBeenCalled();
});

test("an unknown bill answers 200, not an error", async () => {
  // A 4xx makes Billplz retry something that can never succeed.
  findOrderByBillId.mockResolvedValue(null);
  expect((await POST(formReq(signed(PAID)))).status).toBe(200);
});

test("a database failure answers 500 so Billplz retries", async () => {
  // The opposite case: this one CAN succeed later, and a retry is how it
  // does. Swallowing it would lose the payment silently.
  markPaid.mockRejectedValue(new Error("connection refused"));
  const res = await POST(formReq(signed(PAID)));
  expect(res.status).toBe(500);
});

/* ------------------------------------------------------------------ *
 * Telling people, exactly once.
 * ------------------------------------------------------------------ */

test("a paid callback tells the buyer and the owner", async () => {
  await POST(formReq(signed(PAID)));
  expect(notifyBuyer).toHaveBeenCalledTimes(1);
  expect(notifyOwner).toHaveBeenCalledTimes(1);
});

test("the same callback twice sends one email and one telegram", async () => {
  // Review Focus 3. Billplz retries until it gets a 200, so this happens as
  // a matter of course, not as an edge case.
  await POST(formReq(signed(PAID)));
  markPaid.mockResolvedValue(null);
  await POST(formReq(signed(PAID)));
  expect(notifyBuyer).toHaveBeenCalledTimes(1);
  expect(notifyOwner).toHaveBeenCalledTimes(1);
});

test("markPaid is the fence, so nothing reaches the sends twice", async () => {
  // This used to assert the opposite: that the timestamps were claimed
  // before sending and refused a second caller. That arrangement was the
  // bug — a failed send set "we told them" and nothing could tell it had
  // not. `markPaid` is a conditional update, so exactly one callback per
  // bill ever gets a row back, and there is no second sender to fence out.
  markPaid.mockResolvedValue(null);
  await POST(formReq(signed(PAID)));
  expect(notifyBuyer).not.toHaveBeenCalled();
  expect(notifyOwner).not.toHaveBeenCalled();
  expect(markLinkSent).not.toHaveBeenCalled();
});

test("a notification that throws still answers 200", async () => {
  // Review Focus 4. The money has moved; a retry cannot un-take it, and
  // Billplz would retry for ever.
  notifyBuyer.mockRejectedValue(new Error("resend down"));
  const res = await POST(formReq(signed(PAID)));
  expect(res.status).toBe(200);
});

test("the owner is still told when the buyer's email fails", async () => {
  notifyBuyer.mockRejectedValue(new Error("resend down"));
  await POST(formReq(signed(PAID)));
  expect(notifyOwner).toHaveBeenCalled();
});

test("a wrong amount notifies the owner and does not email the buyer", async () => {
  // Sending a registration link for an amount nobody agreed to is worse
  // than making him look.
  markPaid.mockResolvedValue({ ...ORDER, status: "paid", amountSen: 87600, paidAmountSen: 9900 });
  await POST(formReq(signed({ ...PAID, paid_amount: "9900" })));
  expect(notifyBuyer).not.toHaveBeenCalled();
  expect(notifyOwner).toHaveBeenCalledWith(
    expect.objectContaining({ paidAmountSen: 9900 }),
    { amountMismatch: true },
  );
});

test("an unpaid callback tells nobody", async () => {
  await POST(formReq(signed({ ...PAID, paid: "false", state: "due", paid_amount: "0" })));
  expect(notifyBuyer).not.toHaveBeenCalled();
  expect(notifyOwner).not.toHaveBeenCalled();
});

test("a failed send leaves the flag null, so it can be re-sent", async () => {
  // Spec 7.10: link_sent_at staying null is exactly the flag a later admin
  // needs. Claiming it before the send meant every failure was invisible
  // for ever and nothing retried.
  notifyBuyer.mockRejectedValue(new Error("resend refused it"));
  await POST(formReq(signed(PAID)));
  expect(markLinkSent).not.toHaveBeenCalled();
});

test("a successful send records that it was sent", async () => {
  await POST(formReq(signed(PAID)));
  expect(markLinkSent).toHaveBeenCalledWith("order-1");
  expect(markNotified).toHaveBeenCalledWith("order-1");
});

test("a failed owner notification leaves its flag null too", async () => {
  notifyOwner.mockRejectedValue(new Error("telegram and resend both down"));
  await POST(formReq(signed(PAID)));
  expect(markNotified).not.toHaveBeenCalled();
});

test("a body that is not a form is refused rather than throwing", async () => {
  const res = await POST(
    new Request("http://localhost:3000/api/checkout/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
  );
  expect([400, 401]).toContain(res.status);
});

test("a signed callback for another collection writes nothing", async () => {
  // The signature is per account, not per collection, so a bill created by
  // another collection on the same Billplz account verifies here. Only the
  // collection this site bills through may move an order.
  const res = await POST(formReq(signed({ ...PAID, collection_id: "other" })));
  expect(res.status).toBe(200);
  expect(markPaid).not.toHaveBeenCalled();
  expect(markFailed).not.toHaveBeenCalled();
  expect(notifyBuyer).not.toHaveBeenCalled();
});

test("the collection check does not reject our own collection", async () => {
  // Anti-vacuity: PAID carries collection_id "c", which is what the mocked
  // config says. If this ever fails the check above is rejecting everything.
  const res = await POST(formReq(signed(PAID)));
  expect(res.status).toBe(200);
  expect(markPaid).toHaveBeenCalled();
});
