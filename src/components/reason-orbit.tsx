"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Clock, Eye, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";

/**
 * The reasons, orbiting.
 *
 * Shape from the orbiting-circles component the owner chose. Four marks go
 * round a ring, one is lit, and the lit one's reason reads in the middle.
 *
 * Three things about this that the source component does not do, each of
 * which it would have been broken without.
 *
 * It is still a tab list. The marks are buttons with `role="tab"` and the
 * middle is their panel, so the whole thing is reachable from a keyboard
 * and announced as a group of four choices. Decoration that happens to
 * carry the only copy in a section is not decoration.
 *
 * It stops when you reach for it. The marks are moving targets: a ring
 * turning under the cursor is a click you have to time. Hovering or
 * focusing anywhere in the component freezes the ring and holds whichever
 * reason is open, which is also what stops the text changing out from under
 * somebody halfway through reading it.
 *
 * It does not move at all when the reader has asked for less. No orbit and
 * no rotation on its own; the marks sit where they are and clicking still
 * works. An automatic carousel is the worst thing on a page for someone who
 * needs motion to stop, because the content itself is what moves.
 */

export type Reason = { title: string; body: string };

const ICONS: LucideIcon[] = [Clock, ShieldCheck, Wallet, Eye];

/* Half the ring, in px. The marks sit on it and the panel sits inside it,
   so this is also what decides how much room the copy has. */
const RADIUS = 164;
/* One turn. Slow enough to read as drift rather than as a thing spinning. */
const ORBIT_SECONDS = 48;
/* How long each reason holds before the next takes over. */
const DWELL_MS = 4200;

export function ReasonOrbit({ reasons }: { reasons: Reason[] }) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();

  /* Advances on its own, and stops while the component is being used.
     `held` covers hover, focus and touch alike: all three mean somebody is
     reading this rather than watching it. */
  useEffect(() => {
    if (held) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % reasons.length),
      DWELL_MS,
    );
    return () => clearInterval(timer);
  }, [held, reasons.length]);

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
    <div
      className="orbit"
      style={{ "--orbit-radius": `${RADIUS}px` } as CSSProperties}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
      data-held={held || undefined}
    >
      {/* The ring the marks travel on. Decorative: the marks themselves say
          where they are, and a reader of the markup gains nothing from a
          circle. */}
      <span aria-hidden className="orbit-ring" />

      {reasons.map((reason, index) => (
        <div
          key={`panel-${reason.title}`}
          role="tabpanel"
          id={`${base}-panel-${index}`}
          aria-labelledby={`${base}-tab-${index}`}
          hidden={active !== index}
          tabIndex={0}
          className="orbit-panel"
        >
          <h3 className="display text-xl text-pine sm:text-2xl">
            {reason.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-pine-soft">
            {reason.body}
          </p>
        </div>
      ))}

      <div
        role="tablist"
        aria-label="Reasons people copy this account"
        onKeyDown={onKeyDown}
        className="contents"
      >
        {reasons.map((reason, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
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
              /* Roving, so Tab moves past the group rather than stopping
                 four times inside it. */
              tabIndex={active === index ? 0 : -1}
              onClick={() => setActive(index)}
              className="orbit-seat"
              style={
                {
                  "--orbit-angle": `${(360 / reasons.length) * index}deg`,
                  animationDuration: `${ORBIT_SECONDS}s`,
                } as CSSProperties
              }
            >
              <span
                className={`orbit-mark ${
                  active === index ? "orbit-mark-on" : ""
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              {/* The mark is the control; its name is the reason it opens. */}
              <span className="sr-only">{reason.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
