"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ActionOut } from "@/components/shell";

/**
 * The four steps, one at a time.
 *
 * Asked for by the owner, to buy back the height four stacked panels were
 * spending. What it costs is that the reader cannot see the whole process
 * before starting it, so the count is stated plainly — "Step 2 of 4" — and
 * every step is reachable by pressing its own dot, not only by walking the
 * sequence.
 *
 * It renders as a plain list until it has mounted.
 *
 * That is not a nicety. A wizard is state, and state needs JavaScript; a
 * component that hides three of four steps in its markup and then relies on
 * a script to reveal them shows a visitor without that script the first
 * instruction and no way to reach the rest. These are the instructions for
 * funding a real account. So the server sends all four, and the wizard is
 * what the browser builds on top. The same rule the reveals follow in
 * `motion-root.tsx`: content is never hostage to a script.
 */

export type WizardStep = {
  n: number;
  title: string;
  body: ReactNode;
  action?: { label: string; href: string; tone?: "ink" | "accent" };
};

export function StepWizard({ steps }: { steps: WizardStep[] }) {
  const [at, setAt] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();

  /* `data-ready` is written to the DOM rather than held in state. The whole
     wizard hangs off it in CSS, and state for it would mean a second render
     of the same markup on every mount for an attribute nothing in React
     reads. Writing an attribute to a node is what an effect is for. */
  useEffect(() => {
    root.current?.setAttribute("data-ready", "true");
  }, []);

  const last = steps.length - 1;

  function go(next: number, focusDot = false) {
    const i = Math.max(0, Math.min(last, next));
    setAt(i);
    if (focusDot) dots.current[i]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const next = {
      ArrowRight: at === last ? 0 : at + 1,
      ArrowDown: at === last ? 0 : at + 1,
      ArrowLeft: at === 0 ? last : at - 1,
      ArrowUp: at === 0 ? last : at - 1,
      Home: 0,
      End: last,
    }[event.key];

    if (next === undefined) return;
    event.preventDefault();
    go(next, true);
  }

  return (
    <div className="wizard" ref={root}>
      {/* ---------------------------------------------------------------
          Where you are. The dots are controls, not decoration: each one
          names its step, so the sequence can be entered anywhere and a
          reader who has already opened the account is not made to press
          Next past it.
      --------------------------------------------------------------- */}
      <div className="wizard-rail">
        <div
          role="tablist"
          aria-label="The four steps"
          onKeyDown={onKeyDown}
          className="wizard-dots"
        >
          {steps.map((step, index) => (
            <button
              key={step.n}
              ref={(node) => {
                dots.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${base}-dot-${index}`}
              aria-selected={at === index}
              aria-controls={`${base}-step-${index}`}
              tabIndex={at === index ? 0 : -1}
              onClick={() => go(index)}
              className="wizard-dot"
              data-on={at === index || undefined}
              data-done={index < at || undefined}
            >
              <span className="sr-only">
                Step {step.n}: {step.title}
              </span>
            </button>
          ))}
        </div>
        <p className="wizard-count tnum" aria-hidden>
          Step {at + 1} of {steps.length}
        </p>
      </div>

      {steps.map((step, index) => (
        <div
          key={step.n}
          role="tabpanel"
          id={`${base}-step-${index}`}
          aria-labelledby={`${base}-dot-${index}`}
          /* Which one is open. The hiding is in CSS and conditional on
             `data-ready`, so before the wizard exists every step is on the
             page — which is what a reader without JavaScript gets. */
          data-on={at === index || undefined}
          className="wizard-step"
        >
          <h3 className="display flex items-baseline gap-4 text-2xl text-pine">
            <span className="tnum text-pine-faint">{step.n}</span>
            {step.title}
          </h3>
          <p className="mt-3 leading-relaxed text-pine-soft">{step.body}</p>
          {step.action ? (
            <div className="mt-5">
              <ActionOut href={step.action.href} tone={step.action.tone ?? "ink"}>
                {step.action.label}
              </ActionOut>
            </div>
          ) : null}
        </div>
      ))}

      {/* Back is always there and disabled on the first step, rather than
          appearing on the second: a control that materialises moves the one
          beside it, and the reader's cursor is already over that one. */}
      <div className="wizard-nav">
        <button
          type="button"
          onClick={() => go(at - 1)}
          disabled={at === 0}
          className="wizard-move"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => go(at + 1)}
          disabled={at === last}
          className="wizard-move wizard-next"
        >
          Next step
        </button>
      </div>
    </div>
  );
}
