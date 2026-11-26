import Image from "next/image";

/**
 * Six marks joined to the Fukyaa mark, with a pulse running along each join.
 *
 * It replaces the server drawing in the hero and sits to the right of the
 * headline rather than under it, which is where the owner asked for it. The
 * machinery is `connect-diagram.tsx`'s, reused rather than rewritten: the
 * same `.connect-*` rules in globals.css draw the dashed joins, the travelling
 * pulse, the round node tiles and the hub, so the two diagrams on this site
 * cannot drift into two different drawing styles.
 *
 * What differs is the count. Three nodes can be placed by hand; six cannot be
 * placed by hand twice without one of them ending up a degree off its line, so
 * the geometry is computed from one circle below. The container is square and
 * the viewBox is 0 0 100 100, so one unit is one per cent of the panel in both
 * directions and an HTML tile can be positioned from the same numbers the path
 * is drawn from.
 *
 * The marks belong to their owners and are shown as marks, not as a claim
 * about what the robot contains: the sentence beside them is what the page
 * says, and it should never be read as more than it says.
 */

type Mark = {
  src: string;
  alt: string;
  /** Rendered width of the source file, for next/image's sizing. */
  w: number;
  h: number;
};

const MARKS: Mark[] = [
  { src: "/ai/claude.png", alt: "Claude", w: 640, h: 640 },
  { src: "/ai/gemini.webp", alt: "Gemini", w: 500, h: 500 },
  { src: "/ai/codex.png", alt: "Codex", w: 640, h: 640 },
  { src: "/ai/qwen.webp", alt: "Qwen", w: 1280, h: 1280 },
  { src: "/ai/deepseek.png", alt: "DeepSeek", w: 654, h: 480 },
  { src: "/ai/droid.png", alt: "Droid", w: 120, h: 120 },
];

/* The circle the six sit on, and where their joins stop.

   RADIUS keeps the outermost tile inside the panel: a node is 17% across, so
   its edge reaches RADIUS + 8.5 and must stay under 50.

   STOP is the hub's reach plus a little air. The hub tile is 26% across, so it
   reaches 13 units from the centre; a join drawn all the way in would vanish
   under it and come out the other side as a stub. */
const RADIUS = 38;
const STOP = 16;
const COUNT = MARKS.length;

/** Straight up from the hub, then clockwise. */
function angleOf(index: number) {
  return (-90 + (360 / COUNT) * index) * (Math.PI / 180);
}

function point(index: number, distance: number) {
  const a = angleOf(index);
  return { x: 50 + distance * Math.cos(a), y: 50 + distance * Math.sin(a) };
}

/**
 * One join, bowed.
 *
 * A straight spoke would make the drawing a wheel. The control point is the
 * midpoint pushed sideways, perpendicular to the spoke, so every join leans
 * the same way round and the six read as one turning shape.
 */
function joinOf(index: number) {
  const from = point(index, RADIUS);
  const to = point(index, STOP);
  const a = angleOf(index);
  const mid = point(index, (RADIUS + STOP) / 2);
  const bow = 3.2;
  const cx = mid.x + bow * Math.cos(a + Math.PI / 2);
  const cy = mid.y + bow * Math.sin(a + Math.PI / 2);
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

export function AiMesh() {
  const nodes = MARKS.map((mark, index) => ({
    ...mark,
    at: point(index, RADIUS),
    join: joinOf(index),
    /* Spread over one cycle of `connect-flow`, so the six pulses arrive one
       after another rather than together. */
    delay: `${((index * 3.2) / COUNT).toFixed(2)}s`,
  }));

  return (
    <div
      /* Capped. Past about 26rem the marks stop reading as a diagram and
         start reading as seven unrelated logos a long way apart.
         `aspect-square` is what makes a viewBox unit a per cent. */
      className="relative mx-auto aspect-square w-full max-w-[26rem]"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
        focusable="false"
      >
        {nodes.map((node) => (
          <path
            key={`line-${node.src}`}
            d={node.join}
            className="connect-line"
            fill="none"
          />
        ))}
        {/* Drawn after the lines so the pulse sits on top of them, and in a
            pass of its own rather than as a second class on the same path:
            one element cannot carry two strokes. */}
        {nodes.map((node) => (
          <path
            key={`pulse-${node.src}`}
            d={node.join}
            className="connect-pulse"
            style={{ animationDelay: node.delay }}
            fill="none"
          />
        ))}
      </svg>

      {nodes.map((node) => (
        <div
          key={node.src}
          className="connect-node"
          style={{ left: `${node.at.x}%`, top: `${node.at.y}%` }}
        >
          <Image
            src={node.src}
            alt={node.alt}
            width={node.w}
            height={node.h}
            /* Per cent of the tile, which is itself a per cent of the panel,
               so the mark keeps its share of the drawing at every width. */
            className="h-[52%] w-[52%] object-contain"
          />
        </div>
      ))}

      <div className="connect-hub">
        <Image
          src="/fukyaa-mark.png"
          alt="Fukyaa"
          width={256}
          height={256}
          priority
          className="h-[66%] w-[66%] object-contain"
        />
      </div>
    </div>
  );
}
