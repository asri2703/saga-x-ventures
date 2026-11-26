/**
 * The server, sending.
 *
 * A line drawing on the hero's graph paper: a rack on the left, an MT5
 * window on the right, and three rails between them with packets moving
 * along. Two rails carry instructions out; the middle one carries prices
 * back, drawn hollow so the direction is told by shape as well as by
 * movement.
 *
 * It has no panel behind it and no caption under it. The first build put it
 * on a dark card with a sentence beneath, and the owner asked for both to
 * go: the card made it a widget, and the sentence explained a picture that
 * did not need it. Drawn straight onto the paper it reads as part of the
 * page's own drafting.
 *
 * It shows no money, and that is not a style choice. A balance climbing on
 * its own is a performance claim in the one form nobody reads small print
 * under. The real figures are further down, dated, in the account's record.
 *
 * Server-rendered, no state. Everything that moves does so on `transform`
 * or `opacity` from keyframes in globals.css, all inside
 * `prefers-reduced-motion: no-preference`. Without motion the drawing is
 * still whole: lights on, packets spaced along the rails.
 */

/* x1 and x2 of every rail, in viewBox units. The keyframes in globals.css
   travel RAIL_END - RAIL_START, so the two have to change together. */
const RAIL_START = 118;
const RAIL_END = 594;

const RAILS = [
  { y: 52, back: false, delay: 0 },
  { y: 95, back: true, delay: 1.4 },
  { y: 138, back: false, delay: 0.7 },
];

const PER_RAIL = 4;
const SPACING = (RAIL_END - RAIL_START) / PER_RAIL;

export function ServerFeed() {
  return (
    <svg
      viewBox="0 0 720 190"
      className="feed"
      role="img"
      aria-label="A server sending trade instructions to an MT5 terminal and receiving prices back."
    >
      {/* ---- the rack ---- */}
      <rect x="6" y="20" width="106" height="150" rx="12" className="feed-box" />
      {RAILS.map((rail, index) => (
        <g key={rail.y}>
          <rect
            x="18"
            y={rail.y - 15}
            width="82"
            height="30"
            rx="7"
            className="feed-slot"
          />
          <circle
            cx="32"
            cy={rail.y}
            r="4"
            className="feed-light"
            style={{ animationDelay: `${index * 0.5}s` }}
          />
          {[0, 1, 2, 3].map((n) => (
            <line
              key={n}
              x1={52 + n * 11}
              x2={52 + n * 11}
              y1={rail.y - 6}
              y2={rail.y + 6}
              className="feed-vent"
            />
          ))}
        </g>
      ))}

      {/* ---- the rails ---- */}
      {RAILS.map((rail) => (
        <g key={rail.y}>
          <line
            x1={RAIL_START}
            x2={RAIL_END}
            y1={rail.y}
            y2={rail.y}
            className="feed-rail"
          />
          {Array.from({ length: PER_RAIL }, (_, n) => (
            <circle
              key={n}
              /* Every packet is authored at the rail's start and carried the
                 full length; the negative delay is what spreads them out, so
                 the rail is populated from the first frame instead of
                 filling up over the first few seconds. */
              cx={rail.back ? RAIL_END : RAIL_START}
              cy={rail.y}
              r="4"
              className={`feed-packet ${rail.back ? "feed-packet--back" : ""}`}
              style={{
                animationDelay: `${-(rail.delay + n * 1.5)}s`,
                /* Where it rests when nothing moves. */
                ["--feed-rest" as string]: `${(rail.back ? -1 : 1) * (n + 0.5) * SPACING}px`,
              }}
            />
          ))}
        </g>
      ))}

      {/* ---- the terminal ---- */}
      <rect x="600" y="26" width="114" height="138" rx="12" className="feed-box" />
      <line x1="600" x2="714" y1="52" y2="52" className="feed-vent" />
      {[616, 629, 642].map((cx) => (
        <circle key={cx} cx={cx} cy="39" r="3" className="feed-dot" />
      ))}
      {[78, 104, 130].map((y, index) => (
        <g key={y}>
          <rect x="614" y={y - 5} width="26" height="10" rx="5" className="feed-row" />
          <rect
            x="646"
            y={y - 5}
            width="54"
            height="10"
            rx="5"
            className="feed-row feed-row--live"
            style={{ animationDelay: `${index * 0.9}s` }}
          />
        </g>
      ))}
    </svg>
  );
}
