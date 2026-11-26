"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * AI Auto Trade's checkout, in three steps.
 *
 * It wears `checkout-dialog.tsx`'s clothes — the same `.checkout-*` rules,
 * which are the Uiverse form the owner chose — and it is a separate
 * component on purpose. Mastery's dialog sells a membership on another site
 * and asks for three fields; this one has to name a trading account, and it
 * runs a package whose price is sometimes nothing at all. Teaching one
 * component both jobs would have meant a conditional on every line of it,
 * and the live Mastery checkout is not a thing to risk for tidiness.
 *
 * Why three steps rather than one long form: the middle step asks for an MT5
 * login, which the buyer has to go and find. A field for it buried between a
 * phone number and a pay button is the field people guess at, and a guessed
 * account number is a server connected to nobody.
 *
 * Nothing here knows a price. The figure shown arrives as a finished string
 * from the server, and what is posted is a plan **key** — the amount is
 * resolved in `commercial.ts`, so what a buyer was shown and what they are
 * charged cannot drift apart. A package with nothing to pay posts the same
 * way and comes back with a page rather than a bill.
 */

/** One of the steps that happen at the broker, before anything is paid. */
export type CheckoutStep = {
  key: string;
  title: string;
  body: string;
  /** An external page this step sends them to, if it has one. */
  href?: string;
  cta?: string;
};

export type CheckoutPackage = {
  key: string;
  name: string;
  /** The rent, formatted, or null when there is nothing to pay. */
  price: string | null;
  /** What to do at the broker first, in order. */
  steps: CheckoutStep[];
};

type Props = {
  pack: CheckoutPackage;
  onClose: () => void;
};

/* Never fires: whether a document exists cannot change for the life of the
   page. Defined outside the component so it is not a new function on every
   render, which would re-subscribe on every render. */
const subscribeToNothing = () => () => {};

/** The three this component owns. The broker's come before them. */
const OWN = ["Your details", "Your account", "Confirm"];

export function FukyaaCheckout({ pack, onClose }: Props) {
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const [step, setStep] = useState(0);

  /* One list, the broker's steps first. The whole journey is in one dialog
     because it is one intention: a page-length section of steps with a
     button at the end of it asked the reader to start again in a second
     place. */
  const steps = [...pack.steps.map((s) => s.title), ...OWN];
  const last = steps.length - 1;
  const own = step - pack.steps.length;
  const brokerStep = own < 0 ? pack.steps[step] : null;
  const [details, setDetails] = useState({ name: "", email: "", phone: "" });
  const [login, setLogin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const card = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLInputElement>(null);

  const free = pack.price === null;

  /* The page behind holds still while this covers it. On a phone the
     backdrop is most of what a thumb lands on. */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /* Focus follows the step. Without this it stays on the Next button that
     has just been replaced, which drops focus to <body> and sends the next
     Tab to the top of the page behind the dialog. */
  useEffect(() => {
    first.current?.focus();
  }, [step]);

  /* Escape closes, and Tab stays in. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !card.current) return;

      const focusable = card.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const edge = event.shiftKey
        ? focusable[0]
        : focusable[focusable.length - 1];
      if (document.activeElement === edge) {
        event.preventDefault();
        (event.shiftKey
          ? focusable[focusable.length - 1]
          : focusable[0]
        ).focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* The same shallow checks the server runs, so the reader hears about a
     typo on the step that holds it rather than after the last button. The
     server's copy is the one that counts: this is a convenience, not a
     guard. */
  const detailsOk =
    details.name.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()) &&
    details.phone.trim().length >= 7;
  const loginOk = /^\d{4,12}$/.test(login.trim());

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: pack.key,
          name: details.name,
          email: details.email,
          phone: details.phone,
          mt5Login: login,
        }),
      });

      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) {
        setError(body.error ?? "Could not start the payment");
        setSubmitting(false);
        return;
      }
      // Billplz owns the payment screen, and the free package goes to the
      // page that confirms the registration. Either way, leaving is the
      // point. `assign` is a call rather than a write to `location.href`,
      // which reads as mutating state defined outside the component.
      window.location.assign(body.url);
    } catch {
      setError("Could not reach the payment page");
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
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
        aria-labelledby="fukyaa-checkout-heading"
        className="checkout-card"
      >
        <div className="checkout-title">
          <span id="fukyaa-checkout-heading">
            AI Auto Trade &mdash; {pack.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-base leading-none text-pine-faint hover:text-pine"
          >
            &times;
          </button>
        </div>

        {/* Where they are, and how far there is to go. Six dots and six
            words do not fit across a dialog, so it is a bar and a sentence:
            the sentence is what a screen reader needs anyway. */}
        <div className="checkout-prog">
          <div className="checkout-prog-bar" aria-hidden>
            <span style={{ transform: `scaleX(${(step + 1) / steps.length})` }} />
          </div>
          <p className="checkout-prog-text" aria-live="polite">
            Step {step + 1} of {steps.length} &middot; {steps[step]}
          </p>
        </div>

        <form
          className="checkout-body"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === last) void submit();
            else setStep(step + 1);
          }}
        >
          {brokerStep ? (
            <div>
              <p className="checkout-label">{brokerStep.title}</p>
              <p className="mt-2 leading-relaxed text-pine-soft">
                {brokerStep.body}
              </p>
              {brokerStep.href && brokerStep.cta ? (
                /* It opens in its own tab on purpose: the broker's pages are
                   where the next ten minutes happen, and this dialog still
                   holds what has been typed into it. */
                <a
                  href={brokerStep.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="checkout-out btn btn--ghost"
                >
                  {brokerStep.cta}
                </a>
              ) : null}
            </div>
          ) : own === 0 ? (
            <div>
              <p className="checkout-label">Your details</p>
              <div className="mt-2 grid gap-2">
                <input
                  ref={first}
                  className="checkout-field"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Full name"
                  aria-label="Full name"
                  value={details.name}
                  onChange={(event) =>
                    setDetails({ ...details, name: event.target.value })
                  }
                />
                <input
                  className="checkout-field"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email"
                  aria-label="Email"
                  value={details.email}
                  onChange={(event) =>
                    setDetails({ ...details, email: event.target.value })
                  }
                />
                <input
                  className="checkout-field"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="Phone (WhatsApp)"
                  aria-label="Phone number"
                  value={details.phone}
                  onChange={(event) =>
                    setDetails({ ...details, phone: event.target.value })
                  }
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-pine-faint">
                The email is where the confirmation goes, and the reminder
                before the month ends.
              </p>
            </div>
          ) : own === 1 ? (
            <div>
              <p className="checkout-label">Your MT5 account</p>
              <div className="mt-2 grid gap-2">
                <input
                  ref={first}
                  className="checkout-field tnum"
                  name="mt5Login"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="MT5 account number"
                  aria-label="MT5 account number"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-pine-faint">
                The login number of the account the robot will trade. It is
                in your broker&rsquo;s email and at the top of MT5. Never
                send me the password &mdash; I do not need it and I will not
                ask for it.
              </p>
            </div>
          ) : (
            <div>
              <p className="checkout-label">What happens next</p>
              <p className="mt-2 leading-relaxed text-pine-soft">
                {free
                  ? "Nothing to pay: the server comes with this deposit. I connect your account to it by hand and email you when it is running."
                  : "This pays for one month of the server. I connect your account to it by hand and email you when it is running."}
              </p>
              {free ? null : (
                <p className="mt-3 text-xs leading-relaxed text-pine-faint">
                  One month, not a subscription. Nothing renews on its own:
                  a reminder reaches you before it ends and renewing is this
                  same step again. The rent is the same in a losing month as
                  in a good one &mdash; it buys the server, not a result.
                </p>
              )}
            </div>
          )}

          <hr className="checkout-rule" />

          <div className="checkout-figures">
            <span className="text-pine-faint">Package</span>
            <span className="font-semibold">{pack.name}</span>
            <span className="text-pine-faint">
              {free ? "Server" : "Server rent"}
            </span>
            <span className="tnum font-semibold">
              {pack.price ?? "Included"}
            </span>
          </div>

          {error ? (
            <p className="text-sm leading-relaxed text-ruby-deep">
              {error}.{" "}
              <a
                href="/go/whatsapp?m=server"
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
            Your details are used to set the server up and to reach you about
            it.{" "}
            <a href="/privacy" className="underline">
              Privacy notice
            </a>
            .
          </p>

          <div className="checkout-footer -mx-4 -mb-4 mt-1">
            {step === 0 ? (
              <span className="checkout-price tnum">
                {pack.price ?? "Included"}
              </span>
            ) : (
              <button
                type="button"
                className="checkout-back"
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}

            <button
              type="submit"
              className="btn btn--accent checkout-pay"
              disabled={
                submitting || (own === 0 && !detailsOk) || (own === 1 && !loginOk)
              }
            >
              {step < last
                ? "Next"
                : submitting
                  ? free
                    ? "Recording…"
                    : "Taking you to Billplz…"
                  : free
                    ? "Register"
                    : "Pay with Billplz"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
