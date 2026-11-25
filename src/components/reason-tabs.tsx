"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/**
 * The reasons, one at a time.
 *
 * Real tabs, not four buttons that look like tabs. `role="tablist"` with
 * arrow keys is what screen readers and keyboards already know how to
 * drive, and the roving tabindex is what keeps Tab moving past the whole
 * group rather than through four stops inside it.
 *
 * Every panel is rendered and the inactive ones are hidden, so the words are
 * in the document for a crawler and for find-in-page whichever tab is open.
 *
 * The marker slides between tabs rather than cutting. Its job is spatial
 * consistency: a filled pill that disappears and reappears somewhere else
 * leaves the reader to work out that it is the same marker, and the
 * movement is what says so. It is a 2px rule moved with `translate` and
 * `scaleX` — the one shape scaling does not visibly distort, because a pill
 * stretched on its x axis drags its corner radius with it and bulges.
 */

export type Reason = { title: string; body: string };

/* The marker is laid out 100px wide and scaled to the tab it sits under, so
   its width never animates. Width is layout, and layout is what keeps an
   animation off the compositor. */
const MARKER_BASE = 100;

export function ReasonTabs({ reasons }: { reasons: Reason[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const [marker, setMarker] = useState<{ x: number; y: number; w: number }>();

  const measure = useCallback(() => {
    const tab = tabs.current[active];
    const rail = list.current;
    if (!tab || !rail) return;
    const a = tab.getBoundingClientRect();
    const b = rail.getBoundingClientRect();
    /* Relative to the list, so scrolling the page does not move it. */
    setMarker({ x: a.left - b.left, y: a.bottom - b.top, w: a.width });
  }, [active]);

  /* Before paint, so the marker is never drawn in the wrong place first. */
  useLayoutEffect(measure, [measure]);

  /* The labels wrap at narrow widths, which moves every tab. A resize
     listener alone misses the case where the font loads late and the tabs
     reflow without the window having changed size. */
  useEffect(() => {
    const rail = list.current;
    if (!rail || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [measure]);

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
        ref={list}
        role="tablist"
        aria-label="Reasons people copy this account"
        onKeyDown={onKeyDown}
        className="relative flex flex-wrap gap-x-8 gap-y-1 border-b border-rule"
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

        {/* Hidden until measured, so it does not flash at the origin on the
            first paint of a page whose tabs are not laid out yet. */}
        <span
          aria-hidden
          className="reason-marker"
          style={
            marker
              ? {
                  transform: `translate(${marker.x}px, ${marker.y - 2}px) scaleX(${
                    marker.w / MARKER_BASE
                  })`,
                }
              : { opacity: 0 }
          }
        />
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
          className="reason-panel"
        >
          {/* No heading inside. The tab above it says the same words, and
              `aria-labelledby` already names the panel from that tab, so a
              visible copy is the sentence twice on one screen. */}
          <p className="max-w-2xl text-lg leading-relaxed text-pine-soft">
            {reason.body}
          </p>
        </div>
      ))}
    </div>
  );
}
