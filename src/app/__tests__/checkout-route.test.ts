import { beforeEach, expect, test, vi } from "vitest";
import { masteryPlanTotalMyr, masteryPlans } from "@/lib/commercial";

/**
 * The handler that turns a plan key into a bill.
 *
 * The mocks here stand in for the network and the database, not for the
 * decisions under test. What is being checked is what this handler does with
 * what it is sent: which figure it charges, what it refuses, and what it
 * leaves behind when the gateway fails.
 */

const createPendingOrder = vi.fn();
const attachBillId = vi.fn();
const createBill = vi.fn();
let gate: unknown = {
  apiKey: "k",
  collectionId: "c",
  xSignature: "s",
  sandbox: true,
  siteUrl: "http://localhost:3000",
};

vi.mock("@/lib/checkout/orders", () => ({
  createPendingOrder: (...a: unknown[]) => createPendingOrder(...a),
  attachBillId: (...a: unknown[]) => attachBillId(...a),
}));
vi.mock("@/lib/billplz", () => ({
  createBill: (...a: unknown[]) => createBill(...a),
}));
vi.mock("@/lib/checkout/config", () => ({
  checkoutConfig: () => gate,
}));

const { POST } = await import("@/app/api/checkout/route");

const ORDER = { id: "order-1", planKey: "year" };

const req = (body: unknown) =>
  new Request("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const GOOD = {
  planKey: "year",
  name: "Aminah",
  email: "aminah@example.com",
  phone: "0123456789",
};

beforeEach(() => {
  vi.clearAllMocks();
  gate = {
    apiKey: "k",
    collectionId: "c",
    xSignature: "s",
    sandbox: true,
    siteUrl: "http://localhost:3000",
  };
  createPendingOrder.mockResolvedValue(ORDER);
  createBill.mockResolvedValue({ id: "bill-1", url: "https://pay.example/bill-1" });
});

test("an unknown plan key is refused and nothing is created", async () => {
  // Review Focus 1. A browser can send anything at all.
  const res = await POST(req({ ...GOOD, planKey: "lifetime" }));
  expect(res.status).toBe(400);
  expect(createPendingOrder).not.toHaveBeenCalled();
  expect(createBill).not.toHaveBeenCalled();
});

test("a price in the body is ignored", async () => {
  // The amount is resolved from commercial.ts by key. A price that arrives
  // from a browser is a price a browser can change.
  await POST(req({ ...GOOD, amountSen: 1, amount: 1 }));
  const plan = masteryPlans.find((p) => p.key === "year");
  expect(createBill).toHaveBeenCalledWith(
    expect.objectContaining({ amountSen: masteryPlanTotalMyr(plan!) * 100 }),
  );
});

test("the order is written with the same figure the bill charges", async () => {
  await POST(req(GOOD));
  const plan = masteryPlans.find((p) => p.key === "year");
  const expected = masteryPlanTotalMyr(plan!) * 100;
  expect(createPendingOrder).toHaveBeenCalledWith(
    expect.objectContaining({ amountSen: expected, planKey: "year" }),
  );
  expect(createBill).toHaveBeenCalledWith(
    expect.objectContaining({ amountSen: expected }),
  );
});

test("a missing name, email or phone is refused", async () => {
  for (const field of ["name", "email", "phone"]) {
    const res = await POST(req({ ...GOOD, [field]: "" }));
    expect(res.status, field).toBe(400);
  }
  expect(createBill).not.toHaveBeenCalled();
});

test("something that is not an email address is refused", async () => {
  // It is the only way the registration link reaches them.
  const res = await POST(req({ ...GOOD, email: "aminah" }));
  expect(res.status).toBe(400);
});

test("it returns the bill url and stores the bill id on the order", async () => {
  const res = await POST(req(GOOD));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ url: "https://pay.example/bill-1" });
  expect(attachBillId).toHaveBeenCalledWith("order-1", "bill-1");
});

test("the bill carries the order id, so a callback can be matched", async () => {
  await POST(req(GOOD));
  expect(createBill).toHaveBeenCalledWith(
    expect.objectContaining({ reference1: "order-1" }),
  );
});

test("the callback and redirect urls are built from the configured site", async () => {
  await POST(req(GOOD));
  const [input] = createBill.mock.calls[0] as [{ callbackUrl: string; redirectUrl: string }];
  expect(input.callbackUrl).toBe("http://localhost:3000/api/checkout/callback");
  expect(input.redirectUrl).toBe("http://localhost:3000/checkout/done");
});

test("a gateway failure answers 502 and leaves the pending row behind", async () => {
  // The row is the only evidence that somebody tried.
  createBill.mockRejectedValue(new Error("Billplz 401"));
  const res = await POST(req(GOOD));
  expect(res.status).toBe(502);
  expect(createPendingOrder).toHaveBeenCalled();
});

test("it answers 503 when the gate is closed", async () => {
  gate = null;
  const res = await POST(req(GOOD));
  expect(res.status).toBe(503);
  expect(createPendingOrder).not.toHaveBeenCalled();
});

test("a body that is not json is refused rather than throwing", async () => {
  const res = await POST(
    new Request("http://localhost:3000/api/checkout", {
      method: "POST",
      body: "not json",
    }),
  );
  expect(res.status).toBe(400);
});

test("the response never carries a Billplz error back to the browser", async () => {
  // It can name which credential is wrong.
  createBill.mockRejectedValue(new Error("Billplz 401: invalid api key abc123"));
  const res = await POST(req(GOOD));
  expect(JSON.stringify(await res.json())).not.toMatch(/abc123|api key/i);
});

test("a database outage answers json, not a generic 500", async () => {
  // The dialog reads { error } and shows the WhatsApp fallback. An
  // unhandled throw gives the browser Next's own 500 page and the buyer
  // nothing to do next.
  createPendingOrder.mockRejectedValue(new Error("connection refused"));
  const res = await POST(req(GOOD));
  expect([502, 503]).toContain(res.status);
  expect(await res.json()).toHaveProperty("error");
});
