import type { Metadata } from "next";
import Link from "next/link";
import { verifySignature } from "@/lib/billplz";
import { checkoutConfig } from "@/lib/checkout/config";
import { findOrderByBillId } from "@/lib/checkout/orders";
import { formatMyr, masteryPlans } from "@/lib/commercial";
import { outbound } from "@/lib/products";
import { Container, Section } from "@/components/ui";
import { ActionOut, Panel } from "@/components/shell";

/**
 * Where Billplz sends the buyer back to.
 *
 * It reads and never writes. The callback is the only thing that may mark an
 * order paid; this is a page a browser lands on, and it can be dropped by a
 * closed laptop, replayed from history, or opened twice. `billplz[paid]`
 * arrives in the URL and a browser can edit a URL, so the answer comes from
 * the order row rather than from the query.
 *
 * Three states, and the only thing that matters about them is that none of
 * them claims more than it knows.
 */

export const metadata: Metadata = {
  title: "Payment",
  // Nothing here is useful in a search result, and a confirmation page is
  // not something anyone should arrive at from one.
  robots: { index: false, follow: false },
};

const REGISTER_URL = outbound["mastery-membership"];

export default async function CheckoutDonePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const billId = one("billplz[id]");
  const config = checkoutConfig();

  /* The redirect is signed, and this verifies it.
     Without that, a bill id in a URL is enough to read a buyer's email
     address off this page — and bill ids travel in browser history, in
     referrers, and across shared screens. `verifySignature` takes the
     signature separately for exactly this case, because here it arrives as
     `billplz[x_signature]` rather than inside the payload.

     `checkoutConfig()` is also how this page survives the checkout being
     switched off: `serviceClient()` throws by design when Supabase is
     absent, and a page that called it unguarded would answer 500 where it
     should answer "no payment to show". */
  const signed =
    config !== undefined &&
    config !== null &&
    billId !== undefined &&
    verifySignature(
      {
        billplzid: billId,
        billplzpaid: one("billplz[paid]") ?? "",
        billplzpaid_at: one("billplz[paid_at]") ?? "",
      },
      config.xSignature,
      one("billplz[x_signature]"),
    );

  const order = signed && billId ? await findOrderByBillId(billId) : null;
  const plan = masteryPlans.find((candidate) => candidate.key === order?.planKey);

  return (
    <Section pad="pt-16 pb-20 sm:pt-24 sm:pb-28">
      <Container>
        <Panel className="mx-auto max-w-xl" reveal={false}>
          {order?.status === "paid" ? (
            <>
              <h1 className="display text-3xl text-pine">Payment received</h1>
              <p className="mt-4 leading-relaxed text-pine-soft">
                Thank you. You paid{" "}
                <span className="tnum font-semibold text-pine">
                  {formatMyr((order.paidAmountSen ?? order.amountSen) / 100)}
                </span>{" "}
                for Mastery Signal &mdash; {plan?.name ?? order.planKey}.
              </p>
              <p className="mt-4 leading-relaxed text-pine-soft">
                The registration link is in your email. It is also here,
                in case that takes its time.
              </p>

              <div className="mt-7">
                <ActionOut href={REGISTER_URL} tone="ink">
                  Open the registration page
                </ActionOut>
              </div>

              <p className="mt-6 rounded-[var(--radius-float)] bg-sage px-4 py-3 text-sm leading-relaxed text-pine">
                Register with <strong>{order.buyerEmail}</strong> &mdash; the
                same email you paid with. That is how your payment is found.
                Approval is by hand, so it is not instant.
              </p>
            </>
          ) : order?.status === "pending" ? (
            <>
              <h1 className="display text-3xl text-pine">
                Waiting on the bank
              </h1>
              <p className="mt-4 leading-relaxed text-pine-soft">
                No confirmation from Billplz yet. That usually takes a
                moment. Your registration link is emailed the instant it
                arrives &mdash; nothing more is needed from you.
              </p>
              <p className="mt-4 leading-relaxed text-pine-soft">
                If nothing reaches you in a few minutes, message me and I will
                look it up.
              </p>
            </>
          ) : (
            <>
              <h1 className="display text-3xl text-pine">
                That payment did not go through
              </h1>
              <p className="mt-4 leading-relaxed text-pine-soft">
                Either it was not completed, or this page was opened
                without a payment to look up. Nothing has been charged &mdash; you are welcome to try again.
              </p>
              <div className="mt-7">
                <Link
                  href="/#fork"
                  className="btn btn--ghost inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold"
                >
                  Back to the packages
                </Link>
              </div>
            </>
          )}

          <p className="mt-7 border-t border-rule pt-5 text-sm leading-relaxed text-pine-faint">
            Something not right?{" "}
            <a
              href="/go/whatsapp?m=checkout"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-pine underline decoration-ruby decoration-2 underline-offset-4"
            >
              Message me on WhatsApp
            </a>
            .
          </p>
        </Panel>
      </Container>
    </Section>
  );
}
