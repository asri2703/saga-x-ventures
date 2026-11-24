import { createBill } from "@/lib/billplz";
import { checkoutConfig } from "@/lib/checkout/config";
import { attachBillId, createPendingOrder } from "@/lib/checkout/orders";
import { masteryPlanTotalMyr, masteryPlans } from "@/lib/commercial";

/**
 * Turn a plan key into a Billplz bill.
 *
 * This runs on the server for one reason above all others: the Billplz API
 * key is HTTP Basic auth against Billplz, and a browser that holds it can
 * create bills in the owner's name.
 *
 * The browser sends a **key**, never a price. The amount is resolved here,
 * from `commercial.ts`, which is also the only place the homepage reads it
 * from — so the figure a buyer was shown and the figure they are charged
 * cannot drift apart. A price that arrives in a request body is a price the
 * sender chose.
 */

/** The order the row is written in matters: see the comment at the bottom. */
export async function POST(request: Request): Promise<Response> {
  const config = checkoutConfig();
  if (!config) {
    // The gate is closed, so the buttons should never have opened a dialog.
    // Answer plainly rather than failing somewhere deeper.
    return Response.json({ error: "Checkout is not available" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }

  const { planKey, name, email, phone } = (body ?? {}) as Record<string, unknown>;

  const plan = masteryPlans.find((candidate) => candidate.key === planKey);
  if (!plan) {
    return Response.json({ error: "Unknown package" }, { status: 400 });
  }

  const buyerName = typeof name === "string" ? name.trim() : "";
  const buyerEmail = typeof email === "string" ? email.trim() : "";
  const buyerPhone = typeof phone === "string" ? phone.trim() : "";

  // Deliberately shallow. The address has to be deliverable, which only
  // sending can prove; what this rejects is the typo that is obvious from
  // the string alone, because the registration link is the only thing the
  // buyer gets and the address is where it goes.
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail);

  if (!buyerName || !looksLikeEmail || buyerPhone.length < 7) {
    return Response.json({ error: "Please check your details" }, { status: 400 });
  }

  const amountSen = masteryPlanTotalMyr(plan) * 100;

  /* The row before the bill.
     A row with no bill is a person who opened the dialog and got no further,
     which is worth knowing. A bill with no row is money moving with nothing
     here to match the callback against. */
  let order;
  try {
    order = await createPendingOrder({
      planKey: plan.key,
      amountSen,
      buyerName,
      buyerEmail,
      buyerPhone,
    });
  } catch (error) {
    // The dialog reads `error` and offers WhatsApp. An unhandled throw here
    // gives the browser Next's own 500 and the buyer nothing to do next.
    console.error("checkout: could not record the order", error);
    return Response.json(
      { error: "Could not start the payment" },
      { status: 503 },
    );
  }

  try {
    const bill = await createBill({
      apiKey: config.apiKey,
      collectionId: config.collectionId,
      sandbox: config.sandbox,
      name: buyerName,
      email: buyerEmail,
      amountSen,
      description: `Mastery Signal — ${plan.name}`,
      reference1: order.id,
      callbackUrl: `${config.siteUrl}/api/checkout/callback`,
      redirectUrl: `${config.siteUrl}/checkout/done`,
    });

    await attachBillId(order.id, bill.id);
    return Response.json({ url: bill.url });
  } catch (error) {
    // Logged in full, answered in general. A Billplz error names which
    // credential is wrong, and that is not for the browser.
    console.error("checkout: bill creation failed", error);
    return Response.json(
      { error: "Could not start the payment" },
      { status: 502 },
    );
  }
}
