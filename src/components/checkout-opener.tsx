"use client";

import { useRef, useState } from "react";
import { CheckoutDialog } from "@/components/checkout-dialog";
import type { MasteryPlan } from "@/lib/commercial";

/**
 * The button that opens the checkout, and the only thing that knows whether
 * it is open.
 *
 * Whether the checkout may run at all is decided on the server — the gate
 * reads the service-role key and the Billplz credentials — so this component
 * is never rendered unless the server already said yes. It does not ask.
 *
 * `planKey` is null when the opener does not name a term, which is how
 * /mastery-signal's calls to action arrive: the dialog asks for one first.
 */
export function CheckoutOpener({
  planKey = null,
  label,
  tone = "ghost",
  className = "",
}: {
  planKey?: MasteryPlan["key"] | null;
  label: string;
  tone?: "accent" | "ghost";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  /* The same classes `ActionLink` wears, written out rather than imported:
     this is a client component and `shell.tsx` is a server one. The sweep
     and the colours both live in globals.css, so the two stay together
     without the helper crossing the boundary. */
  const style = `btn btn--${tone}`;

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold ${style} ${className}`}
      >
        {label}
      </button>

      {open ? (
        <CheckoutDialog
          planKey={planKey}
          onClose={() => {
            setOpen(false);
            // Back where they were, not at the top of the document.
            button.current?.focus();
          }}
        />
      ) : null}
    </>
  );
}
