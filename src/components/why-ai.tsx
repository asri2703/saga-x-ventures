"use client";

import { useId, useState } from "react";

/**
 * Why use AI Auto Trade: four reasons, one open at a time, each with a
 * drawing in the panel beside it.
 *
 * The owner chose watermelon's `feature-2` block: words on the left — a
 * pill, a heading, a paragraph, an accordion — and a recessed panel on the
 * right. The shape is kept and the code is not. That block is built on
 * shadcn's card, button and accordion, which would have pulled a second
 * design system into a site that already has one: `bg-background`,
 * `text-muted-foreground` and a Radix accordion describe colours and
 * behaviour this project defines for itself. What arrived instead is the
 * same arrangement in this site's own vocabulary.
 *
 * Two things in the original are deliberately gone. Its panel holds floating
 * cards reading "72%", "Tasks Completed: 124", "Efficiency: +12%" — invented
 * figures, which on a page whose other numbers come from a live MT5 feed
 * would be the only made-up ones on it. And its accordion lays two items
 * side by side; four reasons in that arrangement is a row of slivers. So the
 * panel holds a drawing that changes with the open reason, and the accordion
 * is a column.
 *
 * The drawings are the hand from the old reasons grid this replaces, down to
 * the viewBox, so the line weights still match the rest of the page. None of
 * them is a chart and none carries a figure.
 *
 * One reason is always open: the panel has to show something, and a closed
 * accordion beside an empty panel is a section that looks broken.
 */

/* One viewBox for all four, so the line weights match across the set. */
const BOX = "0 0 240 130";

/** The order placed by the machine, with nobody's hand on it. */
const artOrder = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    {/* The server, where the rules run. */}
    <rect x="14" y="36" width="56" height="60" rx="8" className="why-line" />
    {[52, 66, 80].map((y) => (
      <g key={y}>
        <circle cx="26" cy={y} r="3" className="why-fill" />
        <line x1="36" x2="58" y1={y} y2={y} className="why-faint-line" />
      </g>
    ))}

    {/* It reaches the ticket itself. No cursor, because nobody moves one. */}
    <path d="M78 66h30" className="why-line" strokeDasharray="4 6" />
    <path d="M100 59l9 7-9 7" className="why-line" />

    {/* The order ticket: a size, and the two sides of a trade. */}
    <rect x="118" y="24" width="108" height="84" rx="9" className="why-line" />
    <line x1="118" x2="226" y1="44" y2="44" className="why-faint-line" />
    <rect x="130" y="56" width="44" height="10" rx="5" className="why-faint" />
    <rect x="130" y="80" width="40" height="16" rx="8" className="why-fill" />
    <rect x="178" y="80" width="36" height="16" rx="8" className="why-faint" />
  </svg>
);

/** Four setups put to the same list, and the one that does not pass it. */
const artRules = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    {/* The list itself. */}
    <rect x="30" y="10" width="180" height="110" rx="10" className="why-line" />
    {/* Checked, or held back. One of the four does not pass, because a rule
       that never refuses anything is not a rule. */}
    <g key={32}>
      <rect x="78" y={27} width="96" height="10" rx="5" className="why-faint" />
      <path d="M48 32l6 7 12-14" className="why-line" />
    </g>
    <g key={58}>
      <rect x="78" y={53} width="74" height="10" rx="5" className="why-faint" />
      <path d="M48 58l6 7 12-14" className="why-line" />
    </g>
    <g key={84}>
      <rect x="78" y={79} width="96" height="10" rx="5" className="why-faint" />
      <path d="M50 77l14 14M64 77l-14 14" className="why-line" />
    </g>
    <g key={110}>
      <rect x="78" y={105} width="74" height="10" rx="5" className="why-faint" />
      <path d="M48 110l6 7 12-14" className="why-line" />
    </g>
  </svg>
);

/** Nobody at the screen, and the alert that arrives instead. */
const artAlert = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    {/* A chart left to itself. */}
    <rect x="14" y="22" width="132" height="86" rx="9" className="why-line" />
    <line x1="14" x2="146" y1="44" y2="44" className="why-faint-line" />
    <path d="M30 92c16 0 18-28 34-28s18 18 32 18 14-16 32-16" className="why-faint-line" />
    {/* The condition it was waiting for. */}
    <circle cx="128" cy="66" r="4" className="why-fill" />
    {/* The bell, which is what reaches the reader. */}
    <path
      d="M190 46a16 16 0 0 1 16 16v14l6 8h-44l6-8V62a16 16 0 0 1 16-16Z"
      className="why-line"
    />
    <path d="M190 40v6" className="why-line" />
    <path d="M184 90a7 7 0 0 0 13 0" className="why-line" />
  </svg>
);

/** The account: in the reader's name, and open to them to look at. */
const artOwn = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    {/* The terminal, with the account's own name on it. */}
    <rect x="14" y="26" width="132" height="82" rx="9" className="why-line" />
    <line x1="14" x2="146" y1="48" y2="48" className="why-faint-line" />
    <circle cx="130" cy="37" r="5" className="why-fill" />
    <rect x="28" y="62" width="54" height="8" rx="4" className="why-faint" />
    <rect x="28" y="80" width="80" height="8" rx="4" className="why-faint" />

    {/* The owner, watching it. The drawing ends on a person rather than on
        an arrow into empty space: what this reason says is whose account it
        is, and an account belongs to somebody. */}
    <circle cx="196" cy="48" r="13" className="why-line" />
    <path d="M172 100a24 24 0 0 1 48 0" className="why-line" />

    {/* Looking at it, from their own side. */}
    <path d="M176 62h-22" className="why-faint-line" strokeDasharray="4 5" />
    <path d="M161 57l-7 5 7 5" className="why-faint-line" />
  </svg>
);

const REASONS = [
  {
    key: "time",
    title: "Less time on the chart",
    body: "Fukyaa handles the trading through the system, so you are not sitting in front of the screen all day.",
    art: artAlert,
  },
  {
    key: "rules",
    title: "Trades follow the system",
    body: "It follows the rules built into the system, not a decision made in a hurry at the moment the chart moves.",
    art: artRules,
  },
  {
    key: "orders",
    title: "No orders to place yourself",
    body: "Once it is connected to your broker account, Fukyaa places and closes the trades. There is nothing for you to click.",
    art: artOrder,
  },
  {
    key: "yours",
    title: "The account stays yours",
    body: "It trades on your own broker account, opened in your name. You can watch everything it does from your side, and the money is never mine to touch.",
    art: artOwn,
  },
];

export function WhyAi() {
  const id = useId();
  const [open, setOpen] = useState(REASONS[0].key);
  const shown = REASONS.find((reason) => reason.key === open) ?? REASONS[0];

  return (
    <div className="whyai">
      <div data-reveal>
        <p className="whyai-pill">
          <span className="whyai-dot" aria-hidden />
          Why use AI Auto Trade
        </p>
        <h2 className="display mt-5 text-4xl leading-tight text-pine">
          Four reasons I would not go back to trading by hand.
        </h2>
        <p className="mt-5 max-w-lg leading-relaxed text-pine-soft">
          The world has changed. AI helps with almost everything we do now,
          and trading is one more of them.
        </p>

        <div className="whyai-list">
          {REASONS.map((reason) => {
            const isOpen = reason.key === open;
            return (
              <div key={reason.key} className="whyai-item" data-open={isOpen}>
                <h3>
                  <button
                    type="button"
                    className="whyai-trigger"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-${reason.key}`}
                    /* Clicking the open one leaves it open. Closing it would
                       empty the panel beside it. */
                    onClick={() => setOpen(reason.key)}
                  >
                    <span>{reason.title}</span>
                    <span className="whyai-chevron" aria-hidden />
                  </button>
                </h3>
                <div
                  id={`${id}-${reason.key}`}
                  className="whyai-body"
                  hidden={!isOpen}
                >
                  <p>{reason.body}</p>
                  {/* On a narrow window the panel is not beside this, so the
                      drawing travels with the words it belongs to. */}
                  <div className="whyai-inline-art">{reason.art}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Announced by the open reason's own words, so it is decoration. */}
      <div className="whyai-panel" aria-hidden data-reveal>
        <div className="whyai-stage" key={shown.key}>
          {shown.art}
        </div>
      </div>
    </div>
  );
}
