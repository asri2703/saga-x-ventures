"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * One product's packages at a time.
 *
 * The owner asked for a switch rather than both products stacked. Six cards
 * down a phone is a long scroll for a decision that starts with "which
 * product", and the switch asks that question first.
 *
 * Both groups are rendered on the server and handed in as props, so flipping
 * the switch is a swap of already-built markup — no fetch, no spinner, and
 * the server keeps the figures. This component holds nothing but which one is
 * showing.
 *
 * Note that nothing inside either group carries `data-reveal`. The scroll
 * reveals are collected once, on mount, by `motion-root.tsx`; the group that
 * is not showing then is not in the DOM to be collected, and would arrive
 * later already hidden by the CSS and with no trigger to un-hide it. The
 * panel's own animation covers the entrance instead.
 */
export function PlanSwitch({
  firstLabel,
  secondLabel,
  first,
  second,
}: {
  firstLabel: string;
  secondLabel: string;
  first: ReactNode;
  second: ReactNode;
}) {
  const [showSecond, setShowSecond] = useState(false);
  const panelId = useId();

  return (
    <div className="mt-10">
      <div className="flex items-center justify-center gap-4">
        {/* The labels are not clickable. A label either side of a switch that
            both toggle it means the left one turns the right one on, which is
            the opposite of what it says. */}
        <span
          className={`text-sm ${
            showSecond ? "text-pine-faint" : "font-semibold text-pine"
          }`}
        >
          {firstLabel}
        </span>

        <input
          type="checkbox"
          role="switch"
          className="plan-switch"
          checked={showSecond}
          onChange={(event) => setShowSecond(event.target.checked)}
          aria-controls={panelId}
          /* The switch is the only control here, and its two states are two
             product names rather than on and off, so it is named for what
             flipping it does rather than for the state it is in. */
          aria-label={`Show ${secondLabel} packages instead of ${firstLabel}`}
        />

        <span
          className={`text-sm ${
            showSecond ? "font-semibold text-pine" : "text-pine-faint"
          }`}
        >
          {secondLabel}
        </span>
      </div>

      {/* Keyed on the product, so React replaces the subtree rather than
          reconciling one set of cards into the other. Without the key the
          animation never restarts, because the element is never new. */}
      <div
        id={panelId}
        key={showSecond ? "second" : "first"}
        className="plan-panel mt-12"
      >
        {showSecond ? second : first}
      </div>
    </div>
  );
}
