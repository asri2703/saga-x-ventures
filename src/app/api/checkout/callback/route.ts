import { verifySignature } from "@/lib/billplz";
import { checkoutConfig } from "@/lib/checkout/config";
import {
  findOrderByBillId,
  markFailed,
  markLinkSent,
  markNotified,
  markPaid,
} from "@/lib/checkout/orders";
import { notifyBuyer, notifyOwner } from "@/lib/notify";

/**
 * The only thing that marks an order paid.
 *
 * Billplz posts here server to server when a bill settles. The buyer's
 * redirect to /checkout/done is **not** this: it is a page a browser lands
 * on, and it can be dropped by a closed laptop, opened twice, or replayed
 * from history. This endpoint carries a signature, and that is the whole
 * reason it is trusted with the decision.
 *
 * Verification happens before anything is read as a decision. A callback
 * that fails it is logged and refused, and nothing is written — without
 * that, anyone who learns this URL can mark an order paid.
 *
 * On status codes: a verified callback for a bill we have never heard of
 * answers 200, because a 4xx makes Billplz retry something that can never
 * succeed. A database failure answers 500, because that one *can* succeed
 * later and the retry is how it does.
 */

export async function POST(request: Request): Promise<Response> {
  const config = checkoutConfig();
  if (!config) return new Response(null, { status: 503 });

  const form = await request.formData();
  const payload: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") payload[key] = value;
  }

  if (!verifySignature(payload, config.xSignature)) {
    console.warn("checkout callback: signature did not verify", {
      bill: payload.id,
    });
    return new Response(null, { status: 401 });
  }

  const billId = payload.id;
  if (!billId) return new Response(null, { status: 400 });

  try {
    const order = await findOrderByBillId(billId);
    if (!order) {
      // Signed, so it is from Billplz — but for a bill this site did not
      // create. Recording it would mean inventing an order out of a
      // stranger's fields.
      console.warn("checkout callback: no order for bill", { bill: billId });
      return new Response(null, { status: 200 });
    }

    // Billplz sends the string "true" only when the bill is settled.
    const isPaid = payload.paid === "true";

    if (!isPaid) {
      // Not terminal. A bill reported due can be paid later, and the next
      // verified callback moves it.
      await markFailed(billId);
      return new Response(null, { status: 200 });
    }

    const paidAmountSen = Number.parseInt(payload.paid_amount ?? "0", 10);
    const paidAt = payload.paid_at ? new Date(payload.paid_at) : new Date();

    const paid = await markPaid(
      billId,
      Number.isFinite(paidAmountSen) ? paidAmountSen : 0,
      Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
    );

    // Null means this callback was a retry and the first one already did
    // the work. Everything below sends something, so it happens once.
    if (paid) await tell(paid);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("checkout callback: failed to record", error);
    return new Response(null, { status: 500 });
  }
}

/**
 * The two notifications, each at most once, neither able to fail the
 * callback.
 *
 * The money has already moved by the time this runs. A mail provider being
 * down is not a reason to answer anything other than 200 — Billplz would
 * retry for ever, and the payment it is retrying already succeeded.
 *
 * The timestamp guards are the second line: `markPaid` returning a row
 * already means this is the first transition, but two retries arriving in
 * the same instant can both see it, and only one of them can claim the
 * timestamp.
 */
async function tell(order: Awaited<ReturnType<typeof markPaid>>): Promise<void> {
  if (!order) return;

  const quoted = order.amountSen;
  const arrived = order.paidAmountSen ?? 0;
  const mismatch = arrived !== quoted;

  if (!mismatch) {
    try {
      if (await markLinkSent(order.id)) await notifyBuyer(order);
    } catch (error) {
      console.error("checkout callback: buyer email failed", error);
    }
  } else {
    // Deliberately not sent. A registration link for an amount nobody
    // agreed to is worse than making the owner look at it.
    console.warn("checkout callback: amount mismatch", {
      order: order.id,
      quoted,
      arrived,
    });
  }

  try {
    if (await markNotified(order.id)) {
      await notifyOwner(order, mismatch ? { amountMismatch: true } : undefined);
    }
  } catch (error) {
    console.error("checkout callback: owner notification failed", error);
  }
}
