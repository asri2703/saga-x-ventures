import { Resend } from "resend";
import type { Order } from "@/lib/checkout/orders";
import { formatMyr, masteryPlans } from "@/lib/commercial";
import { outbound } from "@/lib/products";

/**
 * Who gets told what, when money arrives.
 *
 * Two messages to the buyer's one: they get the registration link, and the
 * owner gets the buyer's details. Billplz emails him its own receipt as
 * well, which is why the owner's message here leads with the contact details
 * rather than with the money — the money is already in the other two.
 *
 * Neither of these decides whether to send. The callback does that, through
 * `markLinkSent` and `markNotified`, so a Billplz retry cannot produce a
 * second email.
 */

/** The membership page. The same URL the site's outbound map already holds,
 *  read from there so there is one place it is written down. */
const REGISTER_URL = outbound["mastery-membership"];

function planName(order: Order): string {
  return masteryPlans.find((p) => p.key === order.planKey)?.name ?? order.planKey;
}

function resend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

function sen(amount: number): string {
  return formatMyr(amount / 100);
}

/**
 * The registration link, and the one instruction that makes it work.
 *
 * Every package registers for the same membership and the owner raises the
 * tier by hand, so this link is not per-buyer. What ties the payment to the
 * account is the email address, which is why the sentence about using the
 * same one is not a pleasantry.
 */
export async function notifyBuyer(order: Order): Promise<void> {
  await resend().emails.send({
    from: process.env.RESEND_FROM ?? "",
    to: order.buyerEmail,
    replyTo: process.env.RESEND_REPLY_TO ?? "",
    subject: `Your Mastery Signal access — ${planName(order)}`,
    html: `
      <p>Hi ${order.buyerName},</p>
      <p>Your payment for <strong>Mastery Signal &mdash; ${planName(order)}</strong>
         (${sen(order.paidAmountSen ?? order.amountSen)}) has gone through. Thank you.</p>
      <p>Register here to set up your account:</p>
      <p><a href="${REGISTER_URL}">${REGISTER_URL}</a></p>
      <p><strong>Register with this same email address</strong> &mdash;
         ${order.buyerEmail}. That is how your payment is found and your
         access approved. Approval is by hand, so it is not instant.</p>
      <p>If anything looks wrong, reply to this email.</p>
    `.trim(),
  });
}

/**
 * The owner, by email and by Telegram.
 *
 * Telegram failing must not fail anything. It is not in the checkout gate
 * for the same reason: a notification channel being down is a nuisance, not
 * a reason to refuse a sale or to tell Billplz the callback failed.
 */
export async function notifyOwner(
  order: Order,
  note?: { amountMismatch: true },
): Promise<void> {
  const mismatch = note?.amountMismatch === true;

  const lines = [
    `${order.buyerName}`,
    `${order.buyerEmail}`,
    `${order.buyerPhone}`,
    "",
    `Package: Mastery Signal — ${planName(order)}`,
    `Quoted:  ${sen(order.amountSen)}`,
    `Paid:    ${sen(order.paidAmountSen ?? 0)}`,
    `Order:   ${order.id}`,
  ];

  if (mismatch) {
    lines.push(
      "",
      "The amount paid is not the amount quoted. No registration link was",
      "sent to the buyer — check this before granting anything.",
    );
  } else {
    lines.push("", "They have been sent the registration link.");
  }

  const text = lines.join("\n");
  const subject = mismatch
    ? `AMOUNT MISMATCH — ${order.buyerName}, ${planName(order)}`
    : `Paid: ${order.buyerName} — Mastery Signal ${planName(order)}`;

  await resend().emails.send({
    from: process.env.RESEND_FROM ?? "",
    to: process.env.ADMIN_EMAIL ?? "",
    subject,
    text,
  });

  await sendTelegram(`${subject}\n\n${text}`);
}

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (error) {
    // The money has already moved. A chat API being unreachable is not a
    // reason to make any caller think otherwise.
    console.error("notify: telegram failed", error);
  }
}
