import type { Sellable } from "@/lib/commercial";
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
  mt5_login: string | null;
  paid_at: string | null;
  paid_until: string | null;
  reminded_at: string | null;
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
  status: "pending" | "paid" | "failed" | "registered";
  billplzBillId: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  mt5Login: string | null;
  paidAt: string | null;
  /** When the month this payment bought runs out. Rentals only. */
  paidUntil: string | null;
  remindedAt: string | null;
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
    mt5Login: row.mt5_login,
    paidAt: row.paid_at,
    paidUntil: row.paid_until,
    remindedAt: row.reminded_at,
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

/**
 * The row before anything else happens.
 *
 * `status` is the caller's, because the two products reach this point for
 * different reasons: a payment is 'pending' until Billplz says otherwise,
 * and a package with nothing to pay is 'registered' the moment it is asked
 * for. A free registration left 'pending' would sit in the owner's list
 * beside people who walked away from a payment page.
 */
export async function createPendingOrder(input: {
  product?: Sellable["product"];
  planKey: string;
  amountSen: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  /** The account to connect, on the products that run one. */
  mt5Login?: string | null;
  status?: Order["status"];
}): Promise<Order> {
  const row = unwrap(
    await serviceClient()
      .from(TABLE)
      .insert({
        /* Omitted rather than defaulted here: the column's own default is
           'mastery-signal', and two declarations of one default are two
           things to keep in agreement. */
        ...(input.product ? { product: input.product } : {}),
        plan_key: input.planKey,
        amount_sen: input.amountSen,
        buyer_name: input.buyerName,
        buyer_email: input.buyerEmail,
        buyer_phone: input.buyerPhone,
        ...(input.mt5Login ? { mt5_login: input.mt5Login } : {}),
        ...(input.status ? { status: input.status } : {}),
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

/* ------------------------------------------------------------------ *
 * The rental month
 * ------------------------------------------------------------------ */

/**
 * Start the month this payment bought.
 *
 * Written when the money settles and never at checkout: a bill nobody pays
 * must not reserve a month. Separate from `markPaid` because only one
 * product has a month at all — a Mastery order has no server to switch off,
 * and giving every row a `paid_until` would put them all in the reminder's
 * query.
 */
export async function startRentalMonth(
  orderId: string,
  endsAt: Date,
): Promise<void> {
  unwrap(
    await serviceClient()
      .from(TABLE)
      .update({ paid_until: endsAt.toISOString() })
      .eq("id", orderId)
      .select()
      .maybeSingle(),
  );
}

/**
 * The rentals whose month is nearly over and who have not been told.
 *
 * Three conditions, and each one is a bug if it is dropped. Paid, because a
 * bill that was never settled bought nothing. Inside the window, because a
 * reminder two weeks early is noise and one sent afterwards is an apology.
 * Not yet reminded, because this runs daily and the window is days wide:
 * without that fence the same person hears from us every morning.
 */
export async function dueForReminder(before: Date): Promise<Order[]> {
  const rows = unwrap(
    await serviceClient()
      .from(TABLE)
      .select()
      .eq("status", "paid")
      .is("reminded_at", null)
      .not("paid_until", "is", null)
      .lte("paid_until", before.toISOString())
      .limit(200),
  );
  return ((rows ?? []) as Row[]).map(toOrder);
}

/** Said once. The same conditional update the other three flags use. */
export async function markReminded(orderId: string): Promise<boolean> {
  const row = unwrap(
    await serviceClient()
      .from(TABLE)
      .update({ reminded_at: new Date().toISOString() })
      .eq("id", orderId)
      .is("reminded_at", null)
      .select()
      .maybeSingle(),
  );
  return row !== null;
}
