"use client";

import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";

/**
 * One account's record at a time, chosen by tab.
 *
 * Each tab shows the account's name, its trading result and its return, so
 * the three can be compared before any is opened — including the one having
 * a bad month, which is shown like the others.
 *
 * The return is on the tab and not only in the panel because the dollar
 * figures cannot be compared: these accounts were funded a hundredfold
 * apart, so +317 and +29,499 say more about the deposit than the trading.
 * The percentage is the only line here that means the same thing on all
 * three.
 *
 * The panels are rendered on the server and passed in, so switching is a swap
 * of built markup (the `plan-switch.tsx` pattern). This holds only which tab
 * is open. Keyboard: arrow keys move between tabs, as in any tab list.
 */

export type RecordTab = {
  key: string;
  label: string;
  /** The account's trading result, signed and with its unit. */
  result: string;
  tone: "up" | "down" | "flat";
  /** The account's return over its whole record, signed. */
  returnPct?: string;
  returnTone?: "up" | "down" | "flat";
  /** "Since Jul 2026" — when the account's record starts. */
  since?: string;
  panel: ReactNode;
};

export function RecordTabs({ tabs }: { tabs: RecordTab[] }) {
  const [open, setOpen] = useState(0);
  const base = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (open + step + tabs.length) % tabs.length;
    setOpen(next);
    buttons.current[next]?.focus();
  }

  const current = tabs[open];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Accounts"
        className="record-tabs"
        /* The column count, stated rather than discovered. See
           `.record-tabs` in globals.css: an auto-fit grid fitted two
           columns at this card's real width and orphaned the third. */
        style={{ "--record-tab-count": tabs.length } as React.CSSProperties}
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            ref={(node) => {
              buttons.current[i] = node;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${tab.key}`}
            aria-selected={i === open}
            aria-controls={`${base}-panel`}
            tabIndex={i === open ? 0 : -1}
            onClick={() => setOpen(i)}
            className="record-tab"
          >
            <span className="record-tab-label">{tab.label}</span>
            <span className={`record-tab-result tnum record-tab-result--${tab.tone}`}>
              {tab.result}
            </span>
            {tab.returnPct ? (
              <span
                className={`record-tab-return tnum record-tab-result--${tab.returnTone ?? "flat"}`}
              >
                {tab.returnPct}
              </span>
            ) : null}
            {tab.since ? (
              <span className="record-tab-since">{tab.since}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Keyed on the account so the panel is replaced, not reconciled: the
          chart's own state (its cursor) belongs to one account. */}
      <div
        key={current.key}
        id={`${base}-panel`}
        role="tabpanel"
        aria-labelledby={`${base}-tab-${current.key}`}
        className="plan-panel mt-6"
      >
        {current.panel}
      </div>
    </div>
  );
}
