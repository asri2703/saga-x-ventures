"use client";

import { useState } from "react";
import { Check } from "lucide-react";

/**
 * The four steps, one at a time, with the finish locked until the first
 * three are ticked.
 *
 * /copytrade lays its four steps out side by side on a track, deliberately:
 * a reader there is deciding whether to start and wants to see the whole
 * commitment at once. This page is the other half of that job. The owner
 * asked for one step at a time with a progress bar, because the sequence
 * here has a payment at the end of it and the broker's own screens sit in
 * the middle — a reader who reaches the last step having skipped the
 * account or the deposit cannot complete it, and finds that out after
 * paying.
 *
 * So the lock is not friction for its own sake. Next is never blocked:
 * anyone may read ahead, and most people will read all four before doing
 * any of them. What is gated is the last step's ACTION, which stays out of
 * reach until the three before it are ticked. The tick is the reader's own
 * claim that they did it; nothing here can verify a deposit, and a page
 * that pretended to would be lying about what it knows.
 *
 * The state is per visit and goes nowhere. It is deliberately not written
 * to storage: a tick restored from last week would tell a reader they had
 * funded an account when they had not, which is the one thing this
 * component must never do.
 */

export type RentStep = {
  key: string;
  title: string;
  /** Short enough to read on a phone without scrolling the card. */
  short: string;
  body: string;
  /** The two or three things worth knowing before doing this one. */
  points: string[];
  /** Where this step hands over, if it leaves the site. */
  href?: string;
  cta?: string;
};

export type RentFinish = {
  title: string;
  short: string;
  body: string;
  /** What the reader does here, once the steps above are ticked. */
  cta: string;
  href: string;
  /** Why this is the action, when the action is not the obvious one. */
  note?: string;
};

export function RentSteps({
  steps,
  finish,
}: {
  steps: RentStep[];
  finish: RentFinish;
}) {
  const [at, setAt] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());

  const total = steps.length + 1;
  /* The finish sits on the bar but is not a step a reader ticks, so the
     count measures the ticks against the steps that have one. */
  const ticked = steps.filter((step) => done.has(step.key)).length;
  const unlocked = ticked === steps.length;
  const left = steps.length - ticked;

  const step = at < steps.length ? steps[at] : null;

  const toggle = (key: string) =>
    setDone((prior) => {
      const next = new Set(prior);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="rent">
      {/* ---- the bar ---- */}
      <div className="rent-bar">
        <div className="rent-bar-track">
          <div
            /* Scaled, not widened: a width animation lays the bar out again
               on every frame. The origin is the left edge, set in the
               stylesheet beside the transition. */
            className="rent-bar-fill"
            style={{ transform: `scaleX(${(at + 1) / total})` }}
          />
        </div>
        <p className="rent-bar-read tnum">
          Step {at + 1} of {total}
          {ticked > 0 ? ` · ${ticked} done` : ""}
        </p>
      </div>

      {/* ---- the step markers ----
          Buttons, not decoration: a reader who wants step two goes straight
          to it. The numbered marker is information here because the order
          is required — the account exists before it is funded. */}
      <ol className="rent-dots">
        {[...steps, finish].map((entry, index) => {
          const isStep = index < steps.length;
          const ok = isStep && done.has(steps[index].key);
          return (
            <li key={entry.short}>
              <button
                type="button"
                onClick={() => setAt(index)}
                aria-current={index === at ? "step" : undefined}
                className="rent-dot"
                data-at={index === at ? "" : undefined}
                data-done={ok ? "" : undefined}
              >
                <span className="rent-dot-n tnum" aria-hidden>
                  {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                </span>
                <span className="rent-dot-label">{entry.short}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* ---- the step itself ---- */}
      <div className="rent-card">
        {step ? (
          <>
            <h3 className="display text-2xl text-pine">{step.title}</h3>
            <p className="mt-3 leading-relaxed text-pine-soft">{step.body}</p>

            <ul className="rent-points">
              {step.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <div className="rent-actions">
              {step.href && step.cta ? (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--ink inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold"
                >
                  {step.cta}
                </a>
              ) : null}

              {/* The tick. A button rather than a checkbox: it is an
                  assertion the reader makes about the world, not a field
                  they fill in, and its pressed state is what the lock
                  below reads. */}
              <button
                type="button"
                onClick={() => toggle(step.key)}
                aria-pressed={done.has(step.key)}
                className="rent-tick"
              >
                <span aria-hidden className="rent-tick-box">
                  {done.has(step.key) ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : null}
                </span>
                {done.has(step.key) ? "Done" : "Mark this done"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="display text-2xl text-pine">{finish.title}</h3>
            <p className="mt-3 leading-relaxed text-pine-soft">{finish.body}</p>

            {unlocked ? (
              <div className="rent-actions">
                <a
                  href={finish.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--accent inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold"
                >
                  {finish.cta}
                </a>
                {finish.note ? (
                  <p className="max-w-sm text-sm leading-relaxed text-pine-faint">
                    {finish.note}
                  </p>
                ) : null}
              </div>
            ) : (
              /* Not a disabled button. A greyed-out action reads as broken;
                 this says what is missing, and names it — "three steps" is
                 not an instruction, "fund the account" is. Each one is a
                 button back to the step it names. */
              <div className="rent-locked">
                <p className="font-semibold text-pine">
                  {left === 1 ? "One step left to mark" : `${left} steps left to mark`}
                </p>
                <ul>
                  {steps
                    .filter((s) => !done.has(s.key))
                    .map((s) => (
                      <li key={s.key}>
                        <button
                          type="button"
                          onClick={() => setAt(steps.findIndex((x) => x.key === s.key))}
                        >
                          {s.title}
                        </button>
                      </li>
                    ))}
                </ul>
                <p className="text-sm leading-relaxed text-pine-soft">
                  They are in the order the broker requires. Renting the
                  server before the account is funded leaves it running with
                  nothing to trade.
                </p>
              </div>
            )}
          </>
        )}

        {/* ---- back and next ---- */}
        <div className="rent-nav">
          <button
            type="button"
            onClick={() => setAt((n) => Math.max(0, n - 1))}
            disabled={at === 0}
            className="rent-move"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setAt((n) => Math.min(total - 1, n + 1))}
            disabled={at === total - 1}
            className="rent-move rent-move--on"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
