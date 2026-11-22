/**
 * The hero diagram — the one bold moment on the site.
 *
 * On load it draws once, in about 1.2 seconds: the price path strokes itself
 * in Pine, two zones fade in, then a single Ruby level lands. Then it stops.
 * No loop, no scroll replay. Pure CSS on an inline SVG; no animation library
 * and no client JavaScript, so it costs nothing and runs on the server.
 *
 * What it deliberately is NOT: a track record. There are no prices, no
 * account screenshots and no performance figures of any kind here — partly
 * because such claims are forbidden across this site, mostly because a
 * diagram showing how a level is chosen is more persuasive than a screenshot
 * asserting a result. It shows judgement, which is the thing being sold.
 *
 * Motion lives behind `prefers-reduced-motion: no-preference` in globals.css,
 * so a visitor who asked for less movement is handed the finished diagram
 * rather than a faster animation of it.
 */
export function MarkedChart({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <div className="bg-chart-grid border border-rule bg-paper-raised p-4 sm:p-6">
        <svg
          viewBox="0 0 520 320"
          className="h-auto w-full"
          role="img"
          aria-labelledby="marked-chart-title marked-chart-desc"
        >
          <title id="marked-chart-title">
            A price chart with two zones boxed and one level marked
          </title>
          <desc id="marked-chart-desc">
            An illustration of how a level is chosen: the market returns to the
            same area twice, and the level is drawn where it was rejected, not
            where the candle closed.
          </desc>

          {/* Zones — where price turned before. Dashed, because a zone is an
              area you are watching, not a line you are certain of. */}
          <g className="draw-zone">
            <rect
              x="96"
              y="186"
              width="104"
              height="46"
              fill="#163A30"
              fillOpacity="0.07"
              stroke="#163A30"
              strokeOpacity="0.35"
              strokeDasharray="4 4"
            />
            <rect
              x="300"
              y="96"
              width="118"
              height="44"
              fill="#163A30"
              fillOpacity="0.07"
              stroke="#163A30"
              strokeOpacity="0.35"
              strokeDasharray="4 4"
            />
          </g>

          {/* The path. stroke-dasharray is set from --draw-length, which only
              has to be at least the path's real length for the reveal to
              work; a generous value is safer than a measured one that drifts
              when the path is edited. */}
          <path
            className="draw-path"
            style={{ ["--draw-length" as string]: "1600" }}
            d="M16 268 L58 246 L96 272 L134 206 L172 230 L210 178 L248 202 L286 128 L324 158 L362 104 L400 140 L438 108 L476 132 L504 86"
            fill="none"
            stroke="#163A30"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* The mark. One ruby element on the page, and this is it. */}
          <g className="draw-level">
            <line
              x1="16"
              y1="104"
              x2="504"
              y2="104"
              stroke="#F0283C"
              strokeWidth="2"
            />
            <rect x="396" y="78" width="108" height="22" fill="#F0283C" />
            <text
              x="450"
              y="93"
              textAnchor="middle"
              fill="#EFE6D3"
              fontSize="12"
              fontWeight="700"
            >
              the level
            </text>
          </g>
        </svg>
      </div>

      <figcaption className="mt-3 text-sm text-pine-faint">
        Where a level comes from — illustration, not a trade.
      </figcaption>
    </figure>
  );
}
