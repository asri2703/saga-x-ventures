import { beforeEach, expect, test, vi } from "vitest";

/**
 * These run without a database.
 *
 * What is under test is ours: the mapping from the table's columns to the
 * shape the rest of the code uses, and the guards that decide whether a
 * transition already happened. PostgREST is not under test — asserting that
 * we called `.neq()` would be asserting on the fake, and the fake always
 * agrees with us.
 *
 * So the fake answers with rows or with nothing, and every assertion is on
 * what our own functions return in each case.
 */

/** The next response every terminal query will resolve to. */
let response: { data: unknown; error: unknown } = { data: null, error: null };

/** Every column name any update was asked to set, for the guard tests. */
let lastFilters: string[] = [];

function builder(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  for (const method of ["insert", "update", "select", "eq", "neq", "is", "limit"]) {
    chain[method] = (...args: unknown[]) => {
      if (method === "neq" || method === "is" || method === "eq") {
        lastFilters.push(`${method}:${String(args[0])}`);
      }
      return chain;
    };
  }
  chain.maybeSingle = () => Promise.resolve(response);
  chain.then = (resolve: (v: unknown) => unknown) => resolve(response);
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  serviceClient: () => ({ from: () => builder() }),
}));

const { createPendingOrder, findOrderByBillId, markPaid, markLinkSent, toOrder } =
  await import("@/lib/checkout/orders");

const ROW = {
  id: "11111111-1111-1111-1111-111111111111",
  product: "mastery-signal",
  plan_key: "year",
  amount_sen: 87600,
  paid_amount_sen: null,
  currency: "MYR",
  method: "billplz",
  status: "pending",
  billplz_bill_id: null,
  buyer_name: "Aminah",
  buyer_email: "aminah@example.com",
  buyer_phone: "0123456789",
  paid_at: null,
  link_sent_at: null,
  notified_at: null,
  access_granted_at: null,
  created_at: "2026-11-24T00:00:00Z",
};

beforeEach(() => {
  response = { data: null, error: null };
  lastFilters = [];
});

test("snake_case columns map to camelCase fields", () => {
  // Every column this mapping forgets is a field that silently reads
  // undefined at the point it matters — in an email, or in a comparison.
  const order = toOrder({ ...ROW, paid_amount_sen: 9900, link_sent_at: "x" });
  expect(order.planKey).toBe("year");
  expect(order.amountSen).toBe(87600);
  expect(order.paidAmountSen).toBe(9900);
  expect(order.billplzBillId).toBeNull();
  expect(order.buyerPhone).toBe("0123456789");
  expect(order.linkSentAt).toBe("x");
  expect(order.accessGrantedAt).toBeNull();
});

test("a new order starts pending, with no bill and nothing sent", async () => {
  response = { data: ROW, error: null };
  const order = await createPendingOrder({
    planKey: "year",
    amountSen: 87600,
    buyerName: "Aminah",
    buyerEmail: "aminah@example.com",
    buyerPhone: "0123456789",
  });
  expect(order.status).toBe("pending");
  expect(order.billplzBillId).toBeNull();
  expect(order.linkSentAt).toBeNull();
  expect(order.notifiedAt).toBeNull();
  expect(order.paidAt).toBeNull();
});

test("a bill id that matches nothing is null, not a throw", async () => {
  response = { data: null, error: null };
  expect(await findOrderByBillId("nope")).toBeNull();
});

test("markPaid returns the order the first time and null on a repeat", async () => {
  // Billplz retries until it gets a 200. The second call matches no row
  // because the first one already moved it, and null is how the caller
  // knows not to send a second email.
  response = { data: { ...ROW, status: "paid", paid_amount_sen: 87600 }, error: null };
  const first = await markPaid("bill_1", 87600, new Date("2026-11-24T10:00:00Z"));
  expect(first?.status).toBe("paid");
  expect(first?.paidAmountSen).toBe(87600);

  response = { data: null, error: null };
  expect(await markPaid("bill_1", 87600, new Date())).toBeNull();
});

test("markPaid will not move a row that is already paid, but will move a failed one", async () => {
  // The spec: `failed` is not terminal — a bill reported unpaid can be paid
  // later. Filtering on status = 'pending' would strand those for ever.
  response = { data: ROW, error: null };
  await markPaid("bill_1", 87600, new Date());
  expect(lastFilters).toContain("neq:status");
  expect(lastFilters).not.toContain("eq:status");
});

test("markLinkSent is true once and false afterwards", async () => {
  response = { data: ROW, error: null };
  expect(await markLinkSent(ROW.id)).toBe(true);
  response = { data: null, error: null };
  expect(await markLinkSent(ROW.id)).toBe(false);
});

test("markLinkSent only claims a row whose timestamp is still null", async () => {
  // Two callbacks arriving together would both read null and both send if
  // this were a read followed by a write.
  response = { data: ROW, error: null };
  await markLinkSent(ROW.id);
  expect(lastFilters).toContain("is:link_sent_at");
});

test("a database error is raised rather than returned as no row", async () => {
  // Silently treating an outage as "already done" would skip the buyer's
  // email and leave no trace of why.
  response = { data: null, error: { message: "connection refused" } };
  await expect(findOrderByBillId("bill_1")).rejects.toThrow(/connection refused/);
});
