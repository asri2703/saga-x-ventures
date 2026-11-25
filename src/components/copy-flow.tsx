import Image from "next/image";

/**
 * The order leaving the master account and arriving in three followers.
 *
 * Shape asked for by the owner, after the MCP animation on swishy.ai and
 * deliberately the other way round: there, three clients converge on one
 * server. Here one account emits and three receive, because that is the
 * direction copytrading runs and the direction is the whole claim.
 *
 * One route lights at a time, in turn. Three at once would say the orders
 * are three different things; one at a time says it is the same order
 * reaching each follower.
 *
 * The geometry is in the SVG's own units against a square panel with a
 * 0-100 viewBox, so one unit is one per cent of the panel and the HTML
 * tiles are placed from the same numbers the paths are drawn between.
 */

type Follower = {
  /** Centre, in viewBox units, which are per cent of the panel. */
  x: number;
  y: number;
  /** The route out of the master, from its edge to this follower's. */
  path: string;
  /** Which turn this one takes. */
  delay: string;
  label: string;
};

/* One cycle covers all three, so a route is lit for a third of it. */
const CYCLE = 9;

const FOLLOWERS: Follower[] = [
  {
    x: 78,
    y: 20,
    path: "M 39 46 C 54 43 58 22 70 21",
    delay: "0s",
    label: "Follower",
  },
  {
    x: 82,
    y: 50,
    path: "M 39 50 C 54 50 60 50 74 50",
    delay: `${CYCLE / 3}s`,
    label: "Your account",
  },
  {
    x: 78,
    y: 80,
    path: "M 39 54 C 54 57 58 78 70 79",
    delay: `${(CYCLE / 3) * 2}s`,
    label: "Follower",
  },
];

export function CopyFlow() {
  return (
    <div data-reveal>
      <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          aria-hidden
          focusable="false"
        >
          {FOLLOWERS.map((f) => (
            <path key={`base-${f.y}`} d={f.path} className="flow-line" fill="none" />
          ))}
          {/* A second pass rather than a second class on the same path: one
              element carries one stroke, and the lit route is a different
              stroke, not a brighter version of this one. */}
          {FOLLOWERS.map((f) => (
            <path
              key={`live-${f.y}`}
              d={f.path}
              className="flow-live"
              style={{
                animationDuration: `1.1s, ${CYCLE}s`,
                animationDelay: `0s, ${f.delay}`,
              }}
              fill="none"
            />
          ))}
        </svg>

        <div className="flow-hub">
          <Image
            src="/fukyaa-mark.png"
            alt="The master account, Fuky AA"
            width={256}
            height={256}
            className="h-[52%] w-[52%] object-contain"
          />
        </div>

        {FOLLOWERS.map((f) => (
          <div
            key={`${f.x}-${f.y}`}
            className="flow-node"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              animationDuration: `${CYCLE}s`,
              animationDelay: f.delay,
            }}
          >
            <span className="sr-only">{f.label}</span>
            {/* Drawn, not an icon font: a glyph would bring its own
                baseline and sit off centre in a circle. */}
            <svg viewBox="0 0 24 24" aria-hidden className="h-[42%] w-[42%]">
              <circle cx="12" cy="8.5" r="3.75" fill="currentColor" />
              <path
                d="M3.75 20.25a8.25 8.25 0 0 1 16.5 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-pine-faint">
        One order leaves the master account and lands in every account
        following it. A drawing of the route, with no trades and no results
        in it.
      </p>
    </div>
  );
}
