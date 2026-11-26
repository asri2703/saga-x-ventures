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

/** Many instruments at once, and the one the scan has flagged. */
const artScan = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    {/* Five instruments, each a row of its own. */}
    {[22, 44, 66, 88, 110].map((y, n) => (
      <line
        key={y}
        x1="16"
        x2={176 - n * 6}
        y1={y}
        y2={y}
        className="why-faint-line"
      />
    ))}
    {/* The sweep across them. */}
    <line x1="150" x2="150" y1="12" y2="120" className="why-rule" />
    <path
      d="M16 66c22 0 26-26 44-26s20 34 40 34 16-18 34-18"
      className="why-line"
    />
    {/* The one it stopped on. */}
    <circle cx="190" cy="66" r="13" className="why-line" />
    <path d="M199 75l14 14" className="why-line" />
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

/** The idea run over what already happened, before it is run on money. */
const artTest = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    {/* History: what the market did, drawn solid. */}
    <path
      d="M16 96c20 0 24-22 42-22s22 26 40 26 20-34 38-34"
      className="why-line"
    />
    {/* The idea, run back over it. */}
    <path
      d="M16 104c20 0 24-16 42-16s22 20 40 20 20-26 38-26"
      className="why-faint-line"
      strokeDasharray="5 6"
    />
    {/* Where the record ends and real money would begin. */}
    <line x1="150" x2="150" y1="16" y2="118" className="why-rule" />
    <path d="M160 70h50" className="why-faint-line" strokeDasharray="4 6" />
    <line x1="16" x2="226" y1="118" y2="118" className="why-rule" />
    {/* Dates behind it, as ticks rather than numbers. */}
    {[0, 1, 2, 3, 4].map((n) => (
      <line
        key={n}
        x1={28 + n * 28}
        x2={28 + n * 28}
        y1="114"
        y2="122"
        className="why-faint-line"
      />
    ))}
  </svg>
);

const REASONS = [
  {
    key: "scan",
    title: "Scan markets faster",
    body: "It reads prices, volume and market data across many instruments at once, and flags patterns you would miss checking charts one by one.",
    art: artScan,
  },
  {
    key: "rules",
    title: "Stick to the rules",
    body: "Every setup is held against the same entry and risk rules. No chasing a move, and no trade taken because the screen was exciting.",
    art: artRules,
  },
  {
    key: "time",
    title: "Spend less time watching charts",
    body: "The routine checks run without you. You hear about a setup when the conditions are met, not by sitting in front of it all evening.",
    art: artAlert,
  },
  {
    key: "test",
    title: "Test ideas before trading live",
    body: "Rules can be run over years of history first, to see how they would have behaved in different markets, before any real money is at risk.",
    art: artTest,
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
