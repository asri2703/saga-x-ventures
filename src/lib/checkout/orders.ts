import type { MasteryPlan } from "@/lib/commercial";
import { serviceClient } from "@/lib/supabase";

/**
 * Every read and write of the `orders` table.
 *
 * Nothing else touches it. The table has RLS on and no policy, so the only
 * way in is the service role this module holds, and keeping that in one file
 * is what makes "who can read a buyer's phone number" a question with a
 * short answer.
 *
 * The three transitions — paid, link sent, owner notified — are **conditional
 * updates**, not read-then-write. Billplz retries a callback until it gets a
 * 200, so two can be in flight at once; both would read the same row and both
 * would send. An update that filters on the state it expects to find either
 * matches a row or does not, and the database decides which one won.
 */

const TABLE = "orders";

type Row = {
  id: string;
  product: string;
  plan_key: string;
  amount_sen: number;
  paid_amount_sen: number | null;
  currency: string;
  method: string;
  status: string;
  billplz_bill_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  paid_at: string | null;
  link_sent_at: string | null;
  notified_at: string | null;
  access_granted_at: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  planKey: string;
  amountSen: number;
  paidAmountSen: number | null;
  status: "pending" | "paid" | "failed";
  billplzBillId: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  paidAt: string | null;
  linkSentAt: string | null;
  notifiedAt: string | null;
  accessGrantedAt: string | null;
};

/** Exported so the mapping can be tested without a database. */
export function toOrder(row: Row): Order {
  return {
    id: row.id,
    planKey: row.plan_key,
    amountSen: row.amount_sen,
    paidAmountSen: row.paid_amount_sen,
    status: row.status as Order["status"],
    billplzBillId: row.billplz_bill_id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    paidAt: row.paid_at,
    linkSentAt: row.link_sent_at,
    notifiedAt: row.notified_at,
    accessGrantedAt: row.access_granted_at,
  };
}

/** A database error is raised. Treating an outage as "no row" would read as
 *  "already done" and skip the buyer's email with nothing to show for it. */
function unwrap<T>(result: { data: T; error: unknown }): T {
  if (result.error) {
    const message =
      typeof result.error === "object" && result.error && "message" in result.error
        ? String((result.error as { message: unknown }).message)
        : String(result.error);
    throw new Error(`orders: ${message}`);
  }
  return result.data;
}

export async function createPendingOrder(input: {
  planKey: MasteryPlan["key"];
  amountSen: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}): Promise<Order> {
  const row = unwrap(
    await serviceClient()
      .from(TABLE)
      .insert({
        plan_key: input.planKey,
        amount_sen: input.amountSen,
        buyer_name: input.buyerName,
        buyer_email: input.buyerEmail,
        buyer_phone: input.buyerPhone,
      })
      .select()
      .maybeSingle(),
  );
  if (!row) throw new Error("orders: the insert returned no row");
  return toOrder(row as Row);
}

export async function attachBillId(
  orderId: string,
  billId: string,
): Promise<void> {
  const row = unwrap(
    await serviceClient()
      .from(TABLE)
      .update({ billplz_bill_id: billId })
      .eq("id", orderId)
      .select()
      .maybeSingle(),
  );

  /* No row matched, and nothing above said so. This is the one write in the
     flow whose silent failure costs a buyer money: the bill already exists
     at Billplz and can be paid, and the callback finds an order by its bill
     id — which, without this write, is still null. The route answers on
     this throwing, and the buyer never gets the payment url. */
  if (!row) throw new Error(`orders: no row ${orderId} to attach a bill to`);
}

export async function findOrderByBillId(billId: string): Promise<Order | null> {
  const row = unwrap(
    await serviceClient()
      .from(TABLE)
      .select()
      .eq("billplz_bill_id", billId)
      .maybeSingle(),
  );
  return row ? toOrder(row as Row) : null;
}

/**
 * The first verified paid callback wins; a retry gets null.
 *
 * The filter is `status <> 'paid'`, not `status = 'pending'`. A bill can be
 * reported unpaid and paid later, and filtering on pending would strand
 * every one of those as `failed` for ever.
 */
export async function markPaid(
  billId: string,
  paidAmountSen: number,
  paidAt: Date,
): Promise<Order | null> {
  const row = unwrap(
    await serviceClient()
      .from(TABLE)
      .update({
        status: "paid",
        paid_amount_sen: paidAmountSen,
        paid_at: paidAt.toISOString(),
      })
      .eq("billplz_bill_id", billId)
      .neq("status", "paid")
      .select()
      .maybeSingle(),
  );
  return row ? toOrder(row as Row) : null;
}

export async function markFailed(billId: string): Promise<void> {
  unwrap(
    await serviceClient()
      .from(TABLE)
      .update({ status: "failed" })
      .eq("billplz_bill_id", billId)
      .neq("status", "paid")
      .select()
      .maybeSingle(),
  );
}

/** True only for the call that set it. The guard on the buyer's email. */
export async function markLinkSent(orderId: string): Promise<boolean> {
  const row = unwrap(
    await serviceClient()
      .from(TABLE)
      .update({ link_sent_at: new Date().toISOString() })
      .eq("id", orderId)
      .is("link_sent_at", null)
      .select()
      .maybeSingle(),
  );
  return row !== null;
}

/** The same, for the owner's email and Telegram message. */
export async function markNotified(orderId: string): Promise<boolean> {
  const row = unwrap(
    await serviceClient()
      .from(TABLE)
      .update({ notified_at: new Date().toISOString() })
      .eq("id", orderId)
      .is("notified_at", null)
      .select()
      .maybeSingle(),
  );
  return row !== null;
}
