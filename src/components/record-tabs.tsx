"use client";

import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";

/**
 * One account's record at a time, chosen by tab.
 *
 * Each tab shows the account's name and its trading result, so the three can
 * be compared before any is opened — including the one having a bad month,
 * which is shown like the others. The master account is first and open by
 * default: it is the one a follower copies.
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
  /** "Since Jul 2026" — when the account's record starts. */
  since?: string;
  /** A short status, e.g. which account a follower copies. */
  badge?: string;
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
            {tab.since ? <span className="record-tab-since">{tab.since}</span> : null}
            {tab.badge ? <span className="record-tab-badge">{tab.badge}</span> : null}
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
