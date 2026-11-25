import Image from "next/image";

/**
 * Three marks joined to Mastery Signal, with a pulse running along each join.
 *
 * It sits beside "Find what works for you", where the heading used to run to
 * a two-column measure and leave the right half of a wide window empty. A
 * picture of the thing being sold is a better use of that half than more air.
 *
 * The geometry is declared once, below, in the SVG's own units. The container
 * is square and the viewBox is 0 0 100 100, so one unit is one per cent of
 * the panel in both directions: the HTML tiles can be positioned from the
 * same numbers the paths are drawn from, and a node cannot drift away from
 * the line that reaches it.
 *
 * The lines are SVG and the marks are not. A logo is a photograph as far as
 * this page is concerned — it wants `next/image`'s sizing and lazy loading —
 * and an <image> inside the SVG would give up both.
 */

type Node = {
  /** Centre, in viewBox units, which are per cent of the panel. */
  x: number;
  y: number;
  src: string;
  alt: string;
  /** The join, from this node to the hub's edge. */
  path: string;
  /** Staggered so the three pulses never arrive together. */
  delay: string;
};

/* Three points on a circle of radius 36 about the hub, 120 degrees apart:
   two up, one straight below. Scattered placement left the top-right of the
   panel empty and pulled the hub off the centre it is supposed to be at.

   The hub is 26 units across, so every path stops about 16 units out. A line
   that ran to the centre would disappear under the tile and come out the
   other side as a stub. */
const NODES: Node[] = [
  {
    x: 19,
    y: 32,
    src: "/connect/tradingview.png",
    alt: "TradingView",
    path: "M 19 32 Q 26 40 36 42",
    delay: "0s",
  },
  {
    x: 81,
    y: 32,
    src: "/connect/node-b.png",
    alt: "Trading platform",
    // Mirrors the first, so the pair reads as one shape rather than two
    // lines that happen to arrive from above.
    path: "M 81 32 Q 74 40 64 42",
    delay: "1.1s",
  },
  {
    x: 50,
    y: 86,
    src: "/connect/node-c.png",
    alt: "AI analysis",
    path: "M 50 86 Q 47 75 50 66",
    delay: "2.2s",
  },
];

export function ConnectDiagram() {
  return (
    <div
      /* Capped rather than fluid. Past about 28rem the marks stop reading as
         a diagram and start reading as four unrelated logos a long way
         apart. `aspect-square` is what makes a viewBox unit a per cent. */
      className="relative mx-auto aspect-square w-full max-w-[28rem]"
      data-reveal
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
        focusable="false"
      >
        {NODES.map((node) => (
          <path
            key={`line-${node.src}`}
            d={node.path}
            className="connect-line"
            fill="none"
          />
        ))}
        {/* Drawn after the lines so the pulse sits on top of them, and in a
            pass of its own rather than as a second class on the same path:
            one element cannot carry two strokes. */}
        {NODES.map((node) => (
          <path
            key={`pulse-${node.src}`}
            d={node.path}
            className="connect-pulse"
            style={{ animationDelay: node.delay }}
            fill="none"
          />
        ))}
      </svg>

      {NODES.map((node) => (
        <div
          key={node.src}
          className="connect-node"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <Image
            src={node.src}
            alt={node.alt}
            width={120}
            height={120}
            /* Per cent of the tile, which is itself a per cent of the panel, so
               the mark keeps its share of the drawing at every width. */
            className="h-[52%] w-[52%] object-contain"
          />
        </div>
      ))}

      <div className="connect-hub">
        <Image
          src="/connect/mastery.png"
          alt="Mastery Signal"
          width={240}
          height={180}
          className="h-[46%] w-auto object-contain"
        />
      </div>
    </div>
  );
}
