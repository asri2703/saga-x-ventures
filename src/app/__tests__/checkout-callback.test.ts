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

vi.mock("@/lib/checkout/orders", () => ({
  findOrderByBillId: (...a: unknown[]) => findOrderByBillId(...a),
  markPaid: (...a: unknown[]) => markPaid(...a),
  markFailed: (...a: unknown[]) => markFailed(...a),
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
