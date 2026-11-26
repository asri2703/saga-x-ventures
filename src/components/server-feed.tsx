/**
 * The server, sending.
 *
 * A line drawing on the hero's graph paper: a rack, an MT5 window, and
 * three rails between them with packets moving along. Two rails carry
 * instructions out; the middle one carries prices back, drawn hollow so
 * the direction is told by shape as well as by movement.
 *
 * No panel behind it and no caption under it. The first build had both and
 * the owner asked for them to go: the card made it a widget, and the
 * sentence explained a picture that did not need it.
 *
 * TWO COMPOSITIONS, not one scaled down. A 720-wide drawing inside a
 * 280-wide phone renders the rack about forty pixels across, which is a
 * smudge rather than a picture — the owner saw exactly that. So the wide
 * version lies down and the narrow one stands up: rack above, terminal
 * below, rails running down between them. The parts are shared, so the two
 * cannot drift apart; only the arrangement differs. Both are hidden from
 * assistive technology except for one label, so a screen reader meets the
 * drawing once however wide the window is.
 *
 * It shows no money, and that is not a style choice. A balance climbing on
 * its own is a performance claim in the one form nobody reads small print
 * under. The real figures are further down, dated, in the account's record.
 *
 * Server-rendered, no state. Everything that moves does so on `transform`
 * or `opacity` from keyframes in globals.css, all inside
 * `prefers-reduced-motion: no-preference`. Without motion the drawing is
 * still whole: `--feed-rest` parks each packet along its rail.
 */

/* The rails' ends, in each composition's own viewBox units. The keyframes
   in globals.css travel exactly these distances, so the two files have to
   change together. */
const WIDE_FROM = 118;
const WIDE_TO = 594;
const TALL_FROM = 152;
const TALL_TO = 276;

const PER_RAIL = 4;

/** Which way a rail runs, and when its packets set off. */
const RAILS = [
  { back: false, delay: 0 },
  { back: true, delay: 1.4 },
  { back: false, delay: 0.7 },
];

/* ------------------------------------------------------------------ *
 * The parts, drawn once and placed by each composition.
 * ------------------------------------------------------------------ */

/** The rack. `rows` are the slot centres, in the caller's coordinates. */
function Rack({
  x,
  y,
  w,
  h,
  rows,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rows: number[];
}) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="12" className="feed-box" />
      {rows.map((cy, index) => (
        <g key={cy}>
          <rect
            x={x + 12}
            y={cy - 15}
            width={w - 24}
            height="30"
            rx="7"
            className="feed-slot"
          />
          <circle
            cx={x + 26}
            cy={cy}
            r="4"
            className="feed-light"
            style={{ animationDelay: `${index * 0.5}s` }}
          />
          {[0, 1, 2, 3].map((n) => (
            <line
              key={n}
              x1={x + 46 + n * 11}
              x2={x + 46 + n * 11}
              y1={cy - 6}
              y2={cy + 6}
              className="feed-vent"
            />
          ))}
        </g>
      ))}
    </>
  );
}

/** The MT5 window: a title bar, and rows that fill as instructions land. */
function Terminal({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const rows = [0, 1, 2];
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="12" className="feed-box" />
      <line x1={x} x2={x + w} y1={y + 26} y2={y + 26} className="feed-vent" />
      {[0, 1, 2].map((n) => (
        <circle key={n} cx={x + 16 + n * 13} cy={y + 13} r="3" className="feed-dot" />
      ))}
      {rows.map((n) => {
        const cy = y + 52 + n * 26;
        return (
          <g key={n}>
            <rect x={x + 14} y={cy - 5} width="26" height="10" rx="5" className="feed-row" />
            <rect
              x={x + 46}
              y={cy - 5}
              width={w - 60}
              height="10"
              rx="5"
              className="feed-row feed-row--live"
              style={{ animationDelay: `${n * 0.9}s` }}
            />
          </g>
        );
      })}
    </>
  );
}

/**
 * One rail and the packets on it.
 *
 * Every packet is authored at the rail's start and carried its full
 * length; the negative delay is what spreads them out, so the rail is
 * populated from the first frame rather than filling over the first few
 * seconds. `--feed-rest` is where each one sits when nothing moves.
 */
function Rail({
  vertical,
  at,
  from,
  to,
  back,
  delay,
}: {
  vertical: boolean;
  /** The rail's position on the other axis. */
  at: number;
  from: number;
  to: number;
  back: boolean;
  delay: number;
}) {
  const spacing = (to - from) / PER_RAIL;
  const head = back ? to : from;
  return (
    <>
      <line
        x1={vertical ? at : from}
        x2={vertical ? at : to}
        y1={vertical ? from : at}
        y2={vertical ? to : at}
        className="feed-rail"
      />
      {Array.from({ length: PER_RAIL }, (_, n) => (
        <circle
          key={n}
          cx={vertical ? at : head}
          cy={vertical ? head : at}
          r="4"
          className={[
            "feed-packet",
            vertical ? "feed-packet--v" : "",
            back ? "feed-packet--back" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            animationDelay: `${-(delay + n * 1.5)}s`,
            ["--feed-rest" as string]: `${(back ? -1 : 1) * (n + 0.5) * spacing}px`,
          }}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The two compositions.
 * ------------------------------------------------------------------ */

const LABEL =
  "A server sending trade instructions to an MT5 terminal and receiving prices back.";

export function ServerFeed() {
  return (
    <>
      {/* Lying down, from 40rem up. */}
      <svg
        viewBox="0 0 720 190"
        className="feed feed--wide"
        role="img"
        aria-label={LABEL}
      >
        <Rack x={6} y={20} w={106} h={150} rows={[52, 95, 138]} />
        {RAILS.map((rail, index) => (
          <Rail
            key={index}
            vertical={false}
            at={52 + index * 43}
            from={WIDE_FROM}
            to={WIDE_TO}
            back={rail.back}
            delay={rail.delay}
          />
        ))}
        <Terminal x={600} y={26} w={114} h={138} />
      </svg>

      {/* Standing up, below it. Announced once, on the wide one. */}
      <svg viewBox="0 0 300 430" className="feed feed--tall" aria-hidden>
        <Rack x={100} y={8} w={100} h={130} rows={[38, 73, 108]} />
        {RAILS.map((rail, index) => (
          <Rail
            key={index}
            vertical
            at={125 + index * 25}
            from={TALL_FROM}
            to={TALL_TO}
            back={rail.back}
            delay={rail.delay}
          />
        ))}
        <Terminal x={95} y={290} w={110} h={130} />
      </svg>
    </>
  );
}
