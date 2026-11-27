import { verifySignature } from "@/lib/billplz";
import { checkoutConfig } from "@/lib/checkout/config";
import {
  findOrderByBillId,
  markFailed,
  markLinkSent,
  markNotified,
  markPaid,
  startRentalMonth,
} from "@/lib/checkout/orders";
import { rentalMonthEnds, sellableFor } from "@/lib/commercial";
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

  const payload: Record<string, string> = {};
  try {
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") payload[key] = value;
    }
  } catch {
    // Not reachable from Billplz, trivially reachable by anyone poking the
    // URL. An unhandled throw here is a 500 for a request that was simply
    // malformed.
    return new Response(null, { status: 400 });
  }

  if (!verifySignature(payload, config.xSignature)) {
    console.warn("checkout callback: signature did not verify", {
      bill: payload.id,
    });
    return new Response(null, { status: 401 });
  }

  const billId = payload.id;
  if (!billId) return new Response(null, { status: 400 });

  /* The signature is per Billplz **account**, not per collection. A bill
     created by any other collection on the same account verifies here
     perfectly. Only the collection this site bills through may move an
     order, so a foreign one is acknowledged and dropped — 200, because a
     4xx makes Billplz retry something that can never succeed. */
  if (payload.collection_id && payload.collection_id !== config.collectionId) {
    console.warn("checkout callback: foreign collection", {
      bill: billId,
      collection: payload.collection_id,
    });
    return new Response(null, { status: 200 });
  }

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
    if (paid) {
      /* The month starts now, not at checkout: a bill nobody paid must not
         reserve one. Only the rental has a month — a Mastery order has no
         server to switch off — and a failure here must not fail the
         callback, because the money has already moved. What it costs is a
         reminder that never goes out, and that is visible: a paid row with
         no `paid_until`. */
      if (sellableFor(paid.planKey)?.product === "fukyaa") {
        try {
          await startRentalMonth(
            paid.id,
            rentalMonthEnds(paid.paidAt ? new Date(paid.paidAt) : new Date()),
          );
        } catch (error) {
          console.error("checkout callback: could not start the rental month", {
            order: paid.id,
            error,
          });
        }
      }

      await tell(paid);
    }

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
 * Each timestamp is set **after** its send, not before. `markPaid` is a
 * conditional update, so only one callback can ever reach this function for
 * a given bill — there is no second sender to fence out, and claiming the
 * flag first only ever meant a failed send looked like a successful one.
 * Spec 7.10: the flag staying null is exactly what tells an admin to
 * re-send.
 */
async function tell(order: Awaited<ReturnType<typeof markPaid>>): Promise<void> {
  if (!order) return;

  const quoted = order.amountSen;
  const arrived = order.paidAmountSen ?? 0;
  const mismatch = arrived !== quoted;

  if (!mismatch) {
    try {
      await notifyBuyer(order);
      // Recorded after the send, not before it. Claiming the flag first
      // meant a failure set "we told them" and nothing could ever tell that
      // it had not — no admin list would show it and nothing would retry.
      // Spec 7.10 is explicit that this flag staying null is the signal.
      await markLinkSent(order.id);
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
    await notifyOwner(order, mismatch ? { amountMismatch: true } : undefined);
    await markNotified(order.id);
  } catch (error) {
    console.error("checkout callback: owner notification failed", error);
  }
}
