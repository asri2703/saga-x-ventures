"use client";

import { useId, useRef, useState } from "react";

/**
 * The reasons, one at a time.
 *
 * Asked for by the owner in place of four ruled rows. A tab list puts the
 * four headlines in view together and the detail of one beside them, which
 * is a different reading job from four stacked rows: the headlines become a
 * menu rather than a list to get through.
 *
 * Real tabs, not four buttons that look like tabs. `role="tablist"` with
 * arrow keys is what screen readers and keyboards already know how to
 * drive, and the roving tabindex is what keeps Tab moving past the whole
 * group rather than through four stops inside it.
 *
 * Every panel is rendered and the inactive ones are hidden, so the words are
 * in the document for a crawler and for find-in-page whichever tab is open.
 */

export type Reason = { title: string; body: string };

export function ReasonTabs({ reasons }: { reasons: Reason[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Left and right move along the list and wrap; Home and End jump. Moving
     selection moves focus with it, which is the pattern for tabs whose
     panels are already in the document and cost nothing to show. */
  function onKeyDown(event: React.KeyboardEvent) {
    const last = reasons.length - 1;
    const next = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowDown: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      ArrowUp: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    }[event.key];

    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label="Reasons people copy this account"
        onKeyDown={onKeyDown}
        /* A row that wraps, not a strip that scrolls. The labels are two
           or three words now, so all four fit across a desktop and fall to
           two lines on a phone — nothing hidden, and no scrollbar to steer.
           They were whole sentences until the owner cut them, and a rail
           down the side was the only thing that worked at that length. */
        className="flex flex-wrap gap-2"
      >
        {reasons.map((reason, index) => (
          <button
            key={reason.title}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${base}-panel-${index}`}
            /* Roving: only the selected tab is in the tab order, and the
               arrow keys reach the rest. Four tabbable buttons would put
               four stops between the heading and the next link. */
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            className={`reason-tab ${active === index ? "reason-tab-on" : ""}`}
          >
            {reason.title}
          </button>
        ))}
      </div>

      {reasons.map((reason, index) => (
        <div
          key={reason.title}
          role="tabpanel"
          id={`${base}-panel-${index}`}
          aria-labelledby={`${base}-tab-${index}`}
          hidden={active !== index}
          /* Focusable, because the panel is what a tab's content is and a
             keyboard user arriving from the tab list needs somewhere to go
             that is not back out of the component. */
          tabIndex={0}
          className="reason-panel mt-4"
        >
          {/* No heading inside. The tab beside it says the same words, and
              `aria-labelledby` already names the panel from that tab, so a
              visible copy is the sentence twice on one screen. */}
          <p className="text-lg leading-relaxed text-pine-soft">
            {reason.body}
          </p>
        </div>
      ))}
    </div>
  );
}
