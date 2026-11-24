"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatMyr,
  masteryPlanTotalMyr,
  masteryPlans,
  type MasteryPlan,
} from "@/lib/commercial";

/**
 * The checkout pop-up.
 *
 * Shape from the Uiverse form the owner chose; its styles and the credit are
 * in `globals.css` beside the rules they belong to.
 *
 * Three things about what this does NOT do:
 *
 * It never states a price. Every figure comes from `commercial.ts`, the same
 * declaration the packages behind it read, so what a buyer was shown and what
 * they are charged cannot drift apart.
 *
 * It never posts an amount. It posts a plan **key**; the server resolves the
 * money. A price that arrives from a browser is a price a browser can change.
 *
 * It opts into no scroll reveal. Those are collected once, on mount, and
 * this mounts later — anything marked would arrive hidden with no trigger
 * left to show it.
 */

type Props = {
  /** The term already chosen, or null when the opener did not name one. */
  planKey: MasteryPlan["key"] | null;
  onClose: () => void;
};

export function CheckoutDialog({ planKey, onClose }: Props) {
  const [chosen, setChosen] = useState<MasteryPlan["key"] | null>(planKey);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const card = useRef<HTMLDivElement>(null);
  /* Whatever should hold focus when the dialog opens: the first term when
     none is chosen, the name field when one is. Typed as the element they
     have in common so one ref can serve both. */
  const first = useRef<HTMLElement>(null);

  const plan = masteryPlans.find((candidate) => candidate.key === chosen) ?? null;

  /* Escape closes, and focus starts inside rather than behind. */
  useEffect(() => {
    first.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !card.current) return;

      // Trap. Without it, tabbing walks out of the dialog and into the page
      // behind it, which is still there and still scrolled to the packages.
      const focusable = card.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const edge = event.shiftKey ? focusable[0] : focusable[focusable.length - 1];
      if (document.activeElement === edge) {
        event.preventDefault();
        (event.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plan || submitting) return;

    setSubmitting(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: plan.key,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
        }),
      });

      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) {
        setError(body.error ?? "Could not start the payment");
        setSubmitting(false);
        return;
      }
      // Billplz owns the payment screen; leaving is the point. `assign` is
      // a call rather than an assignment, which is what the immutability
      // rule is asking for — writing to window.location.href looks like
      // mutating state defined outside the component, and the rule cannot
      // tell the difference.
      window.location.assign(body.url);
    } catch {
      setError("Could not reach the payment page");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="checkout-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-heading"
        className="checkout-card"
      >
        <div className="checkout-title">
          <span id="checkout-heading">Checkout</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-base leading-none text-pine-faint hover:text-pine"
          >
            &times;
          </button>
        </div>

        <form onSubmit={submit} className="checkout-body">
          {plan === null ? (
            <div>
              <p className="checkout-label">Choose a term</p>
              <div className="mt-2 grid gap-2">
                {masteryPlans.map((candidate, index) => (
                  <button
                    key={candidate.key}
                    type="button"
                    ref={index === 0 ? (first as React.Ref<HTMLButtonElement>) : undefined}
                    onClick={() => setChosen(candidate.key)}
                    className={`checkout-term ${
                      candidate.recommended ? "checkout-term-pick" : ""
                    }`}
                  >
                    <span>
                      {candidate.name}
                      {candidate.recommended ? " · recommended" : ""}
                    </span>
                    <span className="tnum font-semibold">
                      {formatMyr(masteryPlanTotalMyr(candidate))}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="checkout-label">Your package</p>
              <p className="mt-1 font-semibold text-pine">
                Mastery Signal &mdash; {plan.name}
              </p>
              <p className="tnum mt-0.5 text-xs italic text-pine-faint">
                {formatMyr(plan.monthlyMyr)}/month equivalent
              </p>
            </div>
          )}

          <hr className="checkout-rule" />

          <div>
            <p className="checkout-label">Your details</p>
            <div className="mt-2 grid gap-2">
              <input
                ref={plan === null ? undefined : (first as React.Ref<HTMLInputElement>)}
                className="checkout-field"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Full name"
                aria-label="Full name"
              />
              <input
                className="checkout-field"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                aria-label="Email"
              />
              <input
                className="checkout-field"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="Phone (WhatsApp)"
                aria-label="Phone number"
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-pine-faint">
              Register on Mastery with this same email &mdash; it is how your
              payment is found.
            </p>
          </div>

          <hr className="checkout-rule" />

          <div className="checkout-figures">
            <span className="text-pine-faint">
              {plan ? plan.name : "No term chosen yet"}
            </span>
            <span className="tnum font-semibold">
              {plan ? formatMyr(masteryPlanTotalMyr(plan)) : "—"}
            </span>
            <span className="text-pine-faint">Pay by</span>
            <span className="font-semibold">FPX</span>
          </div>

          {error ? (
            <p className="text-sm leading-relaxed text-ruby-deep">
              {error}.{" "}
              <a
                href="/go/whatsapp?m=checkout"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Message me on WhatsApp
              </a>{" "}
              and I will sort it out.
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-pine-faint">
            Your details are used to send your registration link and to reach
            you about this purchase.{" "}
            <a href="/privacy" className="underline">
              Privacy notice
            </a>
            .
          </p>

          <div className="checkout-footer -mx-4 -mb-4 mt-1">
            <span className="checkout-price tnum">
              {plan ? formatMyr(masteryPlanTotalMyr(plan)) : "—"}
            </span>
            <button type="submit" className="checkout-pay" disabled={!plan || submitting}>
              {submitting ? "Taking you to Billplz…" : "Pay with Billplz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
