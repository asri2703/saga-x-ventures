import type { ReactNode } from "react";

/**
 * Four reasons, each with a large drawing above it.
 *
 * The owner asked for a registry block — aceternity's features grid with
 * large skeletons. That registry wants an account this project does not
 * have, so the shape is built here instead: the drawing dominates the cell,
 * the words sit under it. Building it also kept the drawings in the same
 * hand as the server on the hero, which a pasted block would not have been.
 *
 * Cells are separated by hairlines rather than made into cards. The package
 * rows further down the page are ruled the same way, so the page has one
 * idea about how things are divided instead of two.
 *
 * Every drawing is static and decorative — the sentence beside it carries
 * the meaning, so none of them is announced. Nothing here is a chart: the
 * bars in the last one are a shape, not a reading, and no figure anywhere
 * in this file could be mistaken for a result.
 */

export type Why = {
  title: string;
  body: string;
  art: ReactNode;
};

/* One viewBox for all four, so the line weights match across the row. */
const BOX = "0 0 240 130";

/** A reader's months of learning, and the jump over them. */
export const artLearn = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    {[0, 1, 2, 3, 4, 5].map((n) => (
      <rect
        key={n}
        x={14 + n * 36}
        y={74}
        width="24"
        height="34"
        rx="4"
        className="why-faint"
      />
    ))}
    <path
      d="M24 70C60 16 180 16 216 70"
      className="why-line"
      strokeDasharray="5 6"
    />
    <path d="M206 54l12 16-19 4" className="why-line" />
    <line x1="10" x2="230" y1="112" y2="112" className="why-rule" />
  </svg>
);

/** A shut laptop, and the server that keeps going. */
export const artAwake = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    {/* Closed lid: a slab and a seam. */}
    <rect x="16" y="62" width="86" height="16" rx="5" className="why-line" />
    <line x1="24" x2="94" y1="70" y2="70" className="why-faint-line" />
    <rect x="10" y="82" width="98" height="6" rx="3" className="why-faint" />

    {/* Still talking to the server. */}
    <path d="M116 70h36" className="why-line" strokeDasharray="3 6" />
    <circle cx="134" cy="70" r="3.5" className="why-fill" />

    {/* The rack, lit. */}
    <rect x="162" y="38" width="64" height="64" rx="8" className="why-line" />
    {[54, 70, 86].map((y) => (
      <g key={y}>
        <circle cx="176" cy={y} r="3" className="why-fill" />
        <line x1="188" x2="214" y1={y} y2={y} className="why-faint-line" />
      </g>
    ))}
  </svg>
);

/** The account, in the reader's name, with the money able to leave. */
export const artOwn = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    <rect x="14" y="30" width="140" height="78" rx="9" className="why-line" />
    <line x1="14" x2="154" y1="52" y2="52" className="why-faint-line" />
    <rect x="28" y="64" width="54" height="8" rx="4" className="why-faint" />
    <rect x="28" y="82" width="86" height="8" rx="4" className="why-faint" />
    <circle cx="136" cy="41" r="5" className="why-fill" />

    {/* Out, and back to the reader. */}
    <path d="M166 69h46" className="why-line" />
    <path d="M202 60l12 9-12 9" className="why-line" />
  </svg>
);

/**
 * A flat charge against a result that moves.
 *
 * The bars rise AND fall, and the first version did not — it climbed
 * steadily, which on a trading page reads as a promise however abstract the
 * shape is. The sentence beside this drawing says "whatever the account
 * does", so the drawing has to show both directions or it is arguing
 * something the words are not.
 */
const BARS = [34, 58, 22, 70, 44, 62];

export const artFlat = (
  <svg viewBox={BOX} className="why-art" aria-hidden>
    {BARS.map((h, n) => (
      <rect
        key={n}
        x={22 + n * 36}
        y={108 - h}
        width="20"
        height={h}
        rx="4"
        className="why-faint"
      />
    ))}
    {/* The rent: the same height whatever the bars do. */}
    <line x1="10" x2="232" y1="86" y2="86" className="why-line" />
    <line x1="10" x2="232" y1="108" y2="108" className="why-rule" />
  </svg>
);

export function WhyGrid({ reasons }: { reasons: Why[] }) {
  return (
    <ul className="why">
      {reasons.map((reason) => (
        <li key={reason.title} className="why-cell" data-reveal>
          <div className="why-frame">{reason.art}</div>
          <h3 className="display why-title">{reason.title}</h3>
          <p className="why-body">{reason.body}</p>
        </li>
      ))}
    </ul>
  );
}
