"use client";

import { type ReactNode, useRef, useState } from "react";
import { Check } from "lucide-react";

/**
 * The package rows and the steps, sharing one choice.
 *
 * The first build had a section of steps per package, which said almost
 * everything twice. Here the rows ARE the choice: picking one sets the
 * deposit figure and the last step below, and there is no second control
 * to keep in agreement with the first.
 *
 * The two halves are not adjacent on the page — the record sits between
 * them — so the page passes that band in as `between`. It stays a server
 * component; this file only holds which package is chosen, which step is
 * open and which steps are ticked.
 *
 * The last step's action is locked until the three before it are ticked.
 * Next is never blocked: anyone may read ahead. The tick is the reader's
 * own claim, because nothing here can verify a deposit, and it is not
 * stored — a tick restored from last week would tell someone they had
 * funded an account when they had not.
 *
 * Every figure arrives as a finished string. The money lives in
 * `commercial.ts` and is formatted on the server; nothing in this file
 * knows a price.
 */

export type FlowPackage = {
  key: string;
  name: string;
  /** The deposit, formatted, with its currency. */
  deposit: string;
  /** The monthly rent, or that there is none. */
  rent: string;
  /** What `rent` is a figure of. Kept off the figure so it never wraps. */
  rentUnit: string;
  /** A year of rent, formatted. */
  year: string;
  finish: {
    title: string;
    body: string;
    cta: string;
    href: string;
  };
};

export type FlowStep = {
  key: string;
  title: string;
  /** `{deposit}` is replaced with the chosen package's figure. */
  body: string;
  href?: string;
  cta?: string;
};

export function AutoTradeFlow({
  packages,
  steps,
  heading,
  note,
  between = null,
}: {
  packages: FlowPackage[];
  steps: FlowStep[];
  heading: ReactNode;
  /** The line under the rows. */
  note: ReactNode;
  /** What the page shows between the rows and the steps, if anything. */
  between?: ReactNode;
}) {
  const [chosen, setChosen] = useState(packages[0].key);
  const [at, setAt] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const start = useRef<HTMLDivElement>(null);

  const pack = packages.find((p) => p.key === chosen) ?? packages[0];
  const total = steps.length + 1;
  const ticked = steps.filter((s) => done.has(s.key)).length;
  const unlocked = ticked === steps.length;
  const step = at < steps.length ? steps[at] : null;
  const titles = [...steps.map((s) => s.title), pack.finish.title];

  const toggle = (key: string) =>
    setDone((prior) => {
      const next = new Set(prior);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const choose = (key: string) => {
    setChosen(key);
    /* Asked for by a press, so it is the reader's own movement. `smooth`
       is ignored by browsers when the reader has asked for less motion. */
    start.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* ---------------- the packages ---------------- */}
      <section id="start" data-tone="paper" className="scroll-mt-20 bg-paper py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          {heading}

          <div className="pack" role="radiogroup" aria-label="Package">
            {packages.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={p.key === chosen}
                onClick={() => choose(p.key)}
                className="pack-row"
              >
                <span className="pack-name display">{p.name}</span>
                <span className="pack-fig">
                  <span className="pack-num tnum">{p.deposit}</span>
                  <span className="pack-unit">deposit</span>
                </span>
                <span className="pack-fig">
                  <span className="pack-num tnum">{p.rent}</span>
                  <span className="pack-unit">{p.rentUnit}</span>
                </span>
                <span className="pack-fig">
                  <span className="pack-num tnum">{p.year}</span>
                  <span className="pack-unit">rent in a year</span>
                </span>
                <span className="pack-go">Start</span>
              </button>
            ))}
          </div>

          <p className="pack-note">{note}</p>
        </div>
      </section>

      {between}

      {/* ---------------- the steps ---------------- */}
      <section data-tone="paper" className="bg-paper py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div ref={start} className="flow">
            <div className="flow-head">
              <h2 className="display text-4xl text-pine">Four steps</h2>
              <p className="flow-pack">
                {pack.name}, {pack.deposit}
              </p>
            </div>

            <div className="flow-bar" aria-hidden>
              <div
                className="flow-bar-fill"
                style={{ transform: `scaleX(${(at + 1) / total})` }}
              />
            </div>

            <div className="flow-body">
              <ol className="flow-rail">
                {titles.map((title, index) => {
                  const ok = index < steps.length && done.has(steps[index].key);
                  return (
                    <li key={title}>
                      <button
                        type="button"
                        onClick={() => setAt(index)}
                        aria-current={index === at ? "step" : undefined}
                        data-done={ok ? "" : undefined}
                        className="flow-stop"
                      >
                        <span className="flow-n tnum" aria-hidden>
                          {ok ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span className="flow-title">{title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              {/* Keyed, so each step is a fresh element and the short
                  entrance in globals.css runs on every change. */}
              <div key={`${at}-${chosen}`} className="flow-pane">
                <p className="flow-count tnum">
                  {at + 1} / {total}
                </p>

                {step ? (
                  <>
                    <h3 className="display text-3xl text-pine">{step.title}</h3>
                    <p className="flow-text">
                      {step.body.replace("{deposit}", pack.deposit)}
                    </p>

                    <div className="flow-actions">
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
                      <button
                        type="button"
                        onClick={() => toggle(step.key)}
                        aria-pressed={done.has(step.key)}
                        className="flow-tick"
                      >
                        <span aria-hidden className="flow-tick-box">
                          {done.has(step.key) ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          ) : null}
                        </span>
                        {done.has(step.key) ? "Done" : "Mark as done"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="display text-3xl text-pine">
                      {pack.finish.title}
                    </h3>
                    <p className="flow-text">{pack.finish.body}</p>

                    {unlocked ? (
                      <div className="flow-actions">
                        <a
                          href={pack.finish.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--accent inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold"
                        >
                          {pack.finish.cta}
                        </a>
                      </div>
                    ) : (
                      /* Not a greyed-out button, which reads as broken.
                         This names what is missing, and each name goes
                         back to its step. */
                      <div className="flow-locked">
                        <p>Finish these first</p>
                        <ul>
                          {steps
                            .filter((s) => !done.has(s.key))
                            .map((s) => (
                              <li key={s.key}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAt(steps.findIndex((x) => x.key === s.key))
                                  }
                                >
                                  {s.title}
                                </button>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                <div className="flow-nav">
                  <button
                    type="button"
                    onClick={() => setAt((n) => Math.max(0, n - 1))}
                    disabled={at === 0}
                    className="flow-move"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setAt((n) => Math.min(total - 1, n + 1))}
                    disabled={at === total - 1}
                    className="flow-move flow-move--on"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
