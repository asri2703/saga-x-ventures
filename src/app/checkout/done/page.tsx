import type { Metadata } from "next";
import Link from "next/link";
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
  const raw = params["billplz[id]"];
  const billId = Array.isArray(raw) ? raw[0] : raw;

  const order = billId ? await findOrderByBillId(billId) : null;
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
                Check your email: the registration link is in it. It is also
                here, in case that email takes its time.
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
          ) : order ? (
            <>
              <h1 className="display text-3xl text-pine">
                Waiting on the bank
              </h1>
              <p className="mt-4 leading-relaxed text-pine-soft">
                We have not had confirmation from Billplz yet. That usually
                takes a moment. Your registration link is emailed the instant
                it arrives &mdash; nothing more is needed from you.
              </p>
              <p className="mt-4 leading-relaxed text-pine-soft">
                If nothing reaches you in a few minutes, message me and I will
                look it up.
              </p>
            </>
          ) : (
            <>
              <h1 className="display text-3xl text-pine">
                No payment to show
              </h1>
              <p className="mt-4 leading-relaxed text-pine-soft">
                This page could not find a payment to match. Either it did not
                go through, or the link was opened without one. Nothing has
                been charged that this site can see.
              </p>
              <div className="mt-7">
                <Link
                  href="/#fork"
                  className="inline-flex items-center justify-center rounded-full border border-pine px-7 py-3.5 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper"
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
