import { Resend } from "resend";
import type { Order } from "@/lib/checkout/orders";
import { formatMyr, masteryPlans, sellableFor } from "@/lib/commercial";
import { outbound } from "@/lib/products";
import { site } from "@/lib/site";
import { button, escape as esc, facts, layout } from "@/lib/email";

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

/**
 * Which product was bought.
 *
 * Both land in the same callback, and what the buyer needs next is not the
 * same thing twice: a Mastery buyer is sent to a membership page on another
 * site, and a server rental has nowhere to be sent — the owner connects the
 * account by hand. A rental buyer given the membership link would be holding
 * a link to something they did not buy and cannot use.
 */
function isServerRental(order: Order): boolean {
  return sellableFor(order.planKey)?.product === "fukyaa";
}

function label(order: Order): string {
  return sellableFor(order.planKey)?.label ?? order.planKey;
}

function resend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send, and raise if it did not.
 *
 * The Resend SDK does not throw on an API error — it resolves with
 * `{ data: null, error }`. Reading that result is the difference between
 * "the buyer was emailed" and "we called a function". What to do about a
 * failure is the caller's business; the one thing that must not happen is it
 * going unnoticed, because the money has already moved.
 */
async function send(
  message: Parameters<Resend["emails"]["send"]>[0],
): Promise<void> {
  if (!message.from) throw new Error("notify: RESEND_FROM is not set");
  if (!message.to || (Array.isArray(message.to) && message.to.length === 0)) {
    throw new Error("notify: no recipient");
  }
  const { error } = await resend().emails.send(message);
  if (error) throw new Error(`notify: resend refused it — ${error.message}`);
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
  if (isServerRental(order)) {
    const paid = sen(order.paidAmountSen ?? order.amountSen);
    await send({
      from: process.env.RESEND_FROM ?? "",
      to: order.buyerEmail,
      replyTo: process.env.RESEND_REPLY_TO ?? "",
      subject: `Receipt — ${label(order)}`,
      html: layout({
        kind: "Receipt",
        preheader: `${paid} received for ${label(order)}.`,
        body: `
          <p>Hi ${esc(order.buyerName)},</p>
          <p>I&rsquo;ve received your payment of ${esc(paid)}. That covers one
             month of the server.</p>
          ${facts([
            { label: "Package", value: label(order) },
            { label: "MT5 account", value: order.mt5Login ?? "not given" },
            { label: "Reference", value: order.id },
            { label: "Paid", value: paid, strong: true },
          ])}
          <p>I&rsquo;ll set up Fukyaa on that account. If the number is wrong,
             reply to this email so I can correct it. I&rsquo;ll email you
             again once Fukyaa is running.</p>
          <p>Nothing renews by itself. I&rsquo;ll remind you before the month
             is out.</p>
          <p>${esc(site.founder.name)}</p>
        `,
      }),
    });
    return;
  }

  const paid = sen(order.paidAmountSen ?? order.amountSen);
  await send({
    from: process.env.RESEND_FROM ?? "",
    to: order.buyerEmail,
    replyTo: process.env.RESEND_REPLY_TO ?? "",
    subject: `Receipt — Mastery Signal ${planName(order)}`,
    html: layout({
      kind: "Receipt",
      preheader: `${paid} received. Your registration link is inside.`,
      body: `
        <p>Hi ${esc(order.buyerName)},</p>
        <p>I&rsquo;ve received your payment of ${esc(paid)} for Mastery
           Signal &mdash; ${esc(planName(order))}. Thank you.</p>
        ${facts([
          { label: "Package", value: `Mastery Signal — ${planName(order)}` },
          { label: "Reference", value: order.id },
          { label: "Paid", value: paid, strong: true },
        ])}
        <p>Register here to set up your account:</p>
        ${button(REGISTER_URL, "Open the registration page")}
        <p><strong>Register with this same email address</strong> &mdash;
           ${esc(order.buyerEmail)}. That is how your payment is found and
           your access approved. Approval is by hand, so it is not
           instant.</p>
        <p>If anything looks wrong, reply to this email.</p>
      `,
    }),
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

  const rental = isServerRental(order);

  const lines = [
    `${order.buyerName}`,
    `${order.buyerEmail}`,
    `${order.buyerPhone}`,
    "",
    `Package: ${rental ? label(order) : `Mastery Signal — ${planName(order)}`}`,
    /* The instruction, on the product that has one: which account to attach
       to the server. Without it the message says somebody paid and not what
       to do about it. */
    ...(rental ? [`MT5 account: ${order.mt5Login ?? "not given"}`] : []),
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
  } else if (rental) {
    lines.push("", "Connect the account to the server and tell them when it is running.");
  } else {
    lines.push("", "They have been sent the registration link.");
  }

  const text = lines.join("\n");
  const what = rental ? label(order) : `Mastery Signal ${planName(order)}`;
  const subject = mismatch
    ? `AMOUNT MISMATCH — ${order.buyerName}, ${what}`
    : `Paid: ${order.buyerName} — ${what}`;

  const admin = process.env.ADMIN_EMAIL;
  if (!admin) throw new Error("notify: ADMIN_EMAIL is not set");

  /* Telegram first, and independently.
     Two channels exist so that one failing is not silence. Awaiting the
     email first made the second conditional on the first: a Resend outage
     meant the owner heard nothing at all about money that had already been
     taken. Telegram swallows its own failures, so this ordering costs
     nothing and the email's failure is still raised to the caller. */
  await sendTelegram(`${subject}

${text}`);

  await send({
    from: process.env.RESEND_FROM ?? "",
    to: admin,
    subject,
    text,
  });
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

/* ------------------------------------------------------------------ *
 * A registration with nothing to pay
 * ------------------------------------------------------------------ */

/**
 * The package that includes the server, the moment somebody asks for it.
 *
 * There is no payment here and so no callback to hang this on: the request
 * itself is the event. Two messages go out — the owner gets the instruction
 * (who, how to reach them, which account to connect) and the client gets the
 * same thing back so they can see what was sent and correct a wrong digit
 * before anybody wires anything up.
 *
 * Neither message mentions a payment, because none was taken. An email
 * thanking somebody for a purchase they did not make is the site's own words
 * contradicting their bank statement.
 *
 * The owner's copy goes out first. If Resend refuses the client's copy, the
 * instruction has still arrived at the only inbox that has to act on it.
 */
export async function notifyRegistration(order: Order): Promise<void> {
  const label = sellableFor(order.planKey)?.label ?? order.planKey;
  const account = order.mt5Login ?? "not given";

  const admin = process.env.ADMIN_EMAIL;
  if (!admin) throw new Error("notify: ADMIN_EMAIL is not set");

  const text = [
    `${order.buyerName}`,
    `${order.buyerEmail}`,
    `${order.buyerPhone}`,
    "",
    `${label}`,
    `MT5 ${account}`,
    "Nothing owed.",
    "",
    "Put the account on the server, then tell them it is running.",
    "",
    `Order ${order.id}`,
  ].join("\n");

  const subject = `Registered: ${order.buyerName} — ${label}`;

  /* Telegram first and independently, as the paid flow does: two channels
     exist so that one failing is not silence. */
  await sendTelegram(`${subject}

${text}`);

  await send({
    from: process.env.RESEND_FROM ?? "",
    to: admin,
    replyTo: order.buyerEmail,
    subject,
    text,
  });

  await send({
    from: process.env.RESEND_FROM ?? "",
    to: order.buyerEmail,
    replyTo: process.env.RESEND_REPLY_TO ?? "",
    subject: `Registration received — ${label}`,
    html: layout({
      kind: "Registration",
      preheader: `Your details are with me. Nothing to pay on ${label}.`,
      body: `
        <p>Hi ${esc(order.buyerName)},</p>
        <p>I&rsquo;ve received your details. Your server is included with this
           package, so there&rsquo;s no monthly server fee.</p>
        ${facts([
          { label: "Package", value: label },
          { label: "MT5 account", value: account, strong: true },
          { label: "Reference", value: order.id },
          { label: "Monthly server fee", value: "None" },
        ])}
        <p>I&rsquo;ll set up Fukyaa on that account. If the number is wrong,
           reply to this email so I can correct it. I&rsquo;ll email you again
           once Fukyaa is running.</p>
        <p>${esc(site.founder.name)}</p>
      `,
    }),
  });
}

/* ------------------------------------------------------------------ *
 * A bill that has not been paid yet
 * ------------------------------------------------------------------ */

/**
 * The invoice, sent the moment the bill exists.
 *
 * Billplz's own page is a tab, and a tab is closed by a phone call. Without
 * this, somebody who gets as far as the payment screen and steps away has
 * nothing: no figure, no reference, and no way back to the bill. It is also
 * the document a company needs before it will release RM100.
 *
 * It states what is owed and never that anything arrived. The receipt is a
 * different email with a different word in its corner, and the gap between
 * them is the whole point of sending two.
 */
export async function notifyInvoice(
  order: Order,
  billUrl: string,
): Promise<void> {
  const due = sen(order.amountSen);

  await send({
    from: process.env.RESEND_FROM ?? "",
    to: order.buyerEmail,
    replyTo: process.env.RESEND_REPLY_TO ?? "",
    subject: `Invoice — ${label(order)}, ${due}`,
    html: layout({
      kind: "Invoice",
      preheader: `${due} due for ${label(order)}.`,
      body: `
        <p>Hi ${esc(order.buyerName)},</p>
        <p>Here is your invoice for one month of the server. It is not
           settled yet &mdash; the link below is the bill itself.</p>
        ${facts([
          { label: "Package", value: label(order) },
          { label: "MT5 account", value: order.mt5Login ?? "not given" },
          { label: "Reference", value: order.id },
          { label: "Amount due", value: due, strong: true },
        ])}
        ${button(billUrl, `Pay ${due}`)}
        <p>Nothing starts until it is settled, and nothing is taken from you
           before then. If you have changed your mind, ignore this &mdash;
           there is nothing to cancel.</p>
        <p>${esc(site.founder.name)}</p>
      `,
    }),
  });
}
