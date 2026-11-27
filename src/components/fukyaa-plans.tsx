"use client";

import { type ReactNode, useState } from "react";
import { Check } from "lucide-react";
import {
  FukyaaCheckout,
  type CheckoutPackage,
} from "@/components/fukyaa-checkout";

/**
 * The plan cards, and the one button each.
 *
 * The arrangement is watermelon's `pricing-3`: the figure and its button on
 * one side of a card, what you get on the other, the recommended one ringed
 * and tabbed. Its code is shadcn and react-icons over `bg-card` and
 * `text-muted-foreground`; what is kept is the shape, in this site's own
 * colours and with the tick the rest of the page uses.
 *
 * What this replaced is worth writing down, because it was built on purpose
 * and taken out on purpose. The page used to carry the four steps in full —
 * a section of its own, a rail of stops, a tick per step — and the card's
 * button only scrolled down to it. Two controls for one intention, and the
 * steps were read by people who had not chosen anything yet. The steps now
 * live inside the dialog the button opens, in order, with the payment at the
 * end of them, so pressing a card starts the thing the card is for.
 *
 * Nothing here knows a price. Every figure arrives as a finished string from
 * the server, and the dialog posts a plan key rather than an amount.
 */

export type PlanCard = {
  key: string;
  name: string;
  /** The deposit, formatted. It is the card's headline. */
  deposit: string;
  /** The line under the figure. */
  blurb: string;
  features: string[];
  cta: string;
  recommended: boolean;
  /**
   * The checkout this card opens, or null to use `href` instead.
   *
   * Whether a payment can be taken at all is a server question — it reads
   * the Billplz credentials — so it arrives already answered. When the
   * answer is no, the card falls back to the arrangement that still works.
   */
  checkout: CheckoutPackage | null;
  href: string;
};

export function FukyaaPlans({
  heading,
  plans,
  note = null,
}: {
  heading: ReactNode;
  plans: PlanCard[];
  /** The line under the cards, when there is one. */
  note?: ReactNode;
}) {
  const [open, setOpen] = useState<CheckoutPackage | null>(null);

  return (
    <section
      id="start"
      data-tone="paper"
      className="scroll-mt-20 bg-paper py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="plan-head">{heading}</div>

        <div className="plan-grid">
          {plans.map((plan) => (
            <article
              key={plan.key}
              className="plan"
              data-pick={plan.recommended ? "" : undefined}
            >
              {plan.recommended ? (
                <p className="plan-flag">Recommended</p>
              ) : null}

              <div className="plan-main">
                <p className="plan-name">{plan.name}</p>
                <p className="plan-price display tnum">{plan.deposit}</p>
                <p className="plan-blurb">{plan.blurb}</p>

                {plan.checkout ? (
                  <button
                    type="button"
                    onClick={() => setOpen(plan.checkout)}
                    className="plan-go btn btn--ink"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <a
                    href={plan.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="plan-go btn btn--ink"
                  >
                    {plan.cta}
                  </a>
                )}
              </div>

              <ul className="plan-list">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check className="plan-check" strokeWidth={3} aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {note ? <p className="plan-note">{note}</p> : null}
      </div>

      {open ? (
        <FukyaaCheckout pack={open} onClose={() => setOpen(null)} />
      ) : null}
    </section>
  );
}
