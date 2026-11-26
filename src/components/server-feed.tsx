import { fukyaa, formatMyr } from "@/lib/commercial";

/**
 * The server, sending.
 *
 * What a rental actually buys is a machine that stays awake, so the picture
 * on this page is that machine working — a rack with its lights on, pushing
 * packets down three rails into an MT5 terminal, and taking prices back up
 * the middle one.
 *
 * It deliberately shows no money. An animation of a balance climbing is a
 * performance claim in a form nobody reads a disclaimer under, and a moving
 * number is more persuasive and less honest than any sentence this page
 * could print. The real figures are further down the page, dated, in the
 * account's own record.
 *
 * Server-rendered with no state: every bit of movement is a CSS keyframe on
 * `transform` or `opacity`, so there is no JavaScript behind it and nothing
 * to hydrate. The whole animation block sits inside
 * `prefers-reduced-motion: no-preference`, so a visitor who asked for less
 * gets the same drawing, still — lights on, packets parked on the rails,
 * which reads as a diagram rather than a broken animation.
 *
 * On a dark pane rather than the cream paper: the packets are neon, and neon
 * on paper is barely visible.
 */

/* The three rails. `up` is the terminal answering, which is the half people
   forget: the server is not shouting into the dark, it is in a conversation
   with the broker. */
const RAILS = [
  { y: 46, up: false, delay: 0 },
  { y: 80, up: true, delay: 1.1 },
  { y: 114, up: false, delay: 2.2 },
];

/* Packets per rail, spread across the run so the rail is never empty. */
const PER_RAIL = 3;

export function ServerFeed() {
  return (
    <figure className="feed">
      <svg
        viewBox="0 0 420 180"
        className="feed-plot"
        role="img"
        aria-label="A server sending trade instructions to an MT5 terminal and receiving prices back."
      >
        {/* ---- the rack ---- */}
        <rect x="14" y="30" width="86" height="120" rx="10" className="feed-rack" />
        {[46, 80, 114].map((y, index) => (
          <g key={y}>
            <rect
              x="26"
              y={y - 11}
              width="62"
              height="22"
              rx="5"
              className="feed-slot"
            />
            {/* The light. One per unit, blinking in sequence, so the rack
                reads as three machines rather than one box. */}
            <circle
              cx="36"
              cy={y}
              r="3.4"
              className="feed-light"
              style={{ animationDelay: `${index * 0.45}s` }}
            />
            {/* Vents: four short strokes, static. They are what makes the
                slot read as hardware at this size. */}
            {[0, 1, 2, 3].map((n) => (
              <line
                key={n}
                x1={50 + n * 8}
                x2={50 + n * 8}
                y1={y - 5}
                y2={y + 5}
                className="feed-vent"
              />
            ))}
          </g>
        ))}

        {/* ---- the rails ---- */}
        {RAILS.map((rail) => (
          <g key={rail.y}>
            <line
              x1="104"
              x2="300"
              y1={rail.y}
              y2={rail.y}
              className="feed-rail"
            />
            {Array.from({ length: PER_RAIL }, (_, n) => (
              <circle
                key={n}
                /* Parked at the rail's start; the keyframe carries it
                   across. A reduced-motion visitor sees them here, which is
                   why they are spaced rather than stacked. */
                cx={rail.up ? 300 - n * 26 : 104 + n * 26}
                cy={rail.y}
                r="3.6"
                className={`feed-packet ${rail.up ? "feed-packet--back" : ""}`}
                style={{ animationDelay: `${rail.delay + n * 0.8}s` }}
              />
            ))}
          </g>
        ))}

        {/* ---- the terminal ---- */}
        <rect x="302" y="38" width="104" height="104" rx="10" className="feed-term" />
        <rect x="302" y="38" width="104" height="22" rx="10" className="feed-term-bar" />
        {/* Three window dots, the universal shorthand for an application
            window. Static: nothing about them is a state. */}
        {[316, 328, 340].map((cx) => (
          <circle key={cx} cx={cx} cy="49" r="2.6" className="feed-term-dot" />
        ))}
        {/* Rows of a position list, filling in and clearing as instructions
            land. No figures: bars, not balances. */}
        {[76, 95, 114].map((y, index) => (
          <g key={y}>
            <rect x="316" y={y - 4} width="24" height="7" rx="3.5" className="feed-row" />
            <rect
              x="346"
              y={y - 4}
              width="46"
              height="7"
              rx="3.5"
              className="feed-row feed-row--live"
              style={{ animationDelay: `${0.6 + index * 0.9}s` }}
            />
          </g>
        ))}
      </svg>

      <figcaption className="feed-caption">
        The server stays on when your laptop does not.{" "}
        {formatMyr(fukyaa.vpsMonthlyMyr)} a month, or included with the larger
        deposit.
      </figcaption>
    </figure>
  );
}
