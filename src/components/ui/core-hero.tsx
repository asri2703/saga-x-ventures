"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  CSSProperties,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  SVGProps,
} from "react";
import {
  LazyMotion,
  animate,
  domAnimation,
  m,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { MotionValue } from "motion/react";
import { MousePointer2, ShieldCheck, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An isometric core that comes apart when you reach for it.
 *
 * Adapted from a published hero block. What was kept is the machinery — the
 * projected geometry, the explode spring, the orbits, the pointer parallax and
 * the floor spotlight. What was replaced is everything that described another
 * company: its palette, its typeface, its copy, the five stages of an AI
 * workflow, and the row of third-party app logos.
 *
 * Those logos and the "10K+ teams / 4.9 rating / 99.9% uptime" strip are gone
 * rather than restyled. Saga X Ventures has no integration with those products
 * and no customers yet, so either would be a claim the business cannot stand
 * behind — in a category where that is exactly what everyone else does.
 */

const BLOCK_CSS = `
:root {
  --color-n3-page: #060d1c;
  --color-n3-ink: #f2f6fc;
  --color-n3-grey: #a9bbd6;
  --color-n3-line: #1c3059;
  --color-n3-accent: #ff3d9a;
  --color-n3-sky: #65b9f2;
}

.n3-root {
  --n3-gutter: 16px;
}

@media (min-width: 640px) {
  .n3-root { --n3-gutter: 24px; }
}

@media (min-width: 1024px) {
  .n3-root { --n3-gutter: 24px; }
}

.n3-frame {
  padding-left: var(--n3-gutter);
  padding-right: var(--n3-gutter);
}

.n3-h1 {
  font-size: clamp(2.5rem, 1.1rem + 3.6vw, 4.35rem);
  line-height: 0.98;
  letter-spacing: -0.035em;
}

/* Two brand lights on the deep base, where the original had warm paper. */
.n3-bg {
  background:
    radial-gradient(ellipse 55% 65% at 76% 50%, rgb(101 185 242 / 0.10) 0%, rgb(101 185 242 / 0) 70%),
    radial-gradient(ellipse 40% 45% at 72% 62%, rgb(255 61 154 / 0.09) 0%, rgb(255 61 154 / 0) 70%),
    radial-gradient(ellipse 50% 40% at 0% 0%, rgb(17 42 85 / 0.55) 0%, rgb(17 42 85 / 0) 70%),
    var(--color-n3-page);
}

.n3-halo {
  border-radius: 9999px;
  background: radial-gradient(closest-side, rgb(101 185 242 / 0.12), rgb(101 185 242 / 0));
}

.n3-floor,
.n3-floor-lit {
  --n3-floor-area: radial-gradient(ellipse 75% 80% at 72% 70%, #000 20%, transparent 100%);
  --n3-floor-edges:
    linear-gradient(to left, transparent 0%, #000 22%), linear-gradient(to top, transparent 0%, #000 28%);
  -webkit-mask-image: var(--n3-floor-area), var(--n3-floor-edges);
  mask-image: var(--n3-floor-area), var(--n3-floor-edges);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
}

.n3-floor { opacity: 0.55; }

/* The spotlight: a round window onto a pink copy of the grid. Window and grid
   move by opposite transforms only, so following the cursor costs no repaints. */
.n3-floor-spot {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 400ms ease;
  will-change: transform, opacity;
  -webkit-mask-image: radial-gradient(closest-side, #000 0%, transparent 100%);
  mask-image: radial-gradient(closest-side, #000 0%, transparent 100%);
}

.n3-floor-lit {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

[data-spot='on'] > .n3-floor-spot { opacity: 0.75; }

@media (max-width: 1023px) {
  .n3-floor,
  .n3-floor-lit {
    --n3-floor-area: radial-gradient(ellipse 90% 60% at 50% 75%, #000 20%, transparent 100%);
  }
}

.n3-fade-edge {
  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 14%);
  mask-image: linear-gradient(to right, transparent 0%, #000 14%);
}

@media (max-width: 1023px) {
  .n3-fade-edge { -webkit-mask-image: none; mask-image: none; }
}

.n3-dot { box-shadow: 0 0 0 4px rgb(255 61 154 / 0.18); }

/* Intro plays from first paint in CSS, not after hydration, so the largest
   text is painted without waiting for JavaScript. */
.n3-rise { animation: n3-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
.n3-enter { animation: n3-enter 1100ms cubic-bezier(0.22, 1, 0.36, 1) 250ms backwards; }

@keyframes n3-rise { from { opacity: 0; translate: 0 18px; } }
@keyframes n3-enter { from { opacity: 0; scale: 0.97; } }

@media (prefers-reduced-motion: reduce) {
  .n3-rise, .n3-enter { animation: none; }
}

@keyframes n3-float {
  from { transform: translateY(0); }
  to { transform: translateY(calc(var(--n3-float, 6) * -1px)); }
}

.n3-float { animation: n3-float var(--n3-float-seconds, 6.5s) ease-in-out infinite alternate; }

@keyframes n3-seam {
  from { opacity: 0.78; }
  to { opacity: 1; }
}

.n3-seam-pulse { animation: n3-seam 4.8s ease-in-out infinite alternate; }

@media (prefers-reduced-motion: reduce) {
  .n3-float, .n3-seam-pulse { animation: none; }
}

/* Stage cards: dark glass, so the lines behind never muddy the type. */
.n3-stage-card {
  border: 1px solid rgb(28 48 89 / 0.9);
  border-radius: 1.3em;
  background: rgb(11 31 68 / 0.82);
  box-shadow: 0 14px 34px -18px rgb(0 0 0 / 0.7);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transition: border-color 300ms ease, box-shadow 300ms ease;
}

.n3-stage-card-lit {
  border-color: rgb(255 61 154 / 0.5);
  box-shadow: 0 18px 38px -18px rgb(255 61 154 / 0.35);
}
`;

/* ── Shared isometric geometry ───────────────────────────────────────────── */

const ISO_X = 0.866;
const ISO_Y = 0.5;
const CX = 500;
const CY = 500;
const RING_FLATTEN = 0.57;
const RING_RX = [400, 530] as const;

type SlabType = { half: number; radius: number; top: number; depth: number };

const BASE: SlabType = { half: 168, radius: 40, top: 475, depth: 34 };
const SEAM_GAP = 9;
const MID: SlabType = { half: 151, radius: 36, top: BASE.top - SEAM_GAP - 28, depth: 28 };
const CAP: SlabType = { half: 101, radius: 28, top: MID.top - 14, depth: 14 };

type Point = [number, number];

// Server and browser can disagree in the last float digit, which React reports
// as a hydration mismatch.
const round = (n: number) => Math.round(n * 100) / 100;

const project = (x: number, y: number, cx = CX, cy = CY): Point => [
  cx + (x - y) * ISO_X,
  cy + (x + y) * ISO_Y,
];

const footprint = (half: number, radius: number, steps = 14): Point[] => {
  const r = Math.min(radius, half);
  const c = half - r;
  const corners: [number, number, number][] = [
    [c, c, 0],
    [-c, c, 90],
    [-c, -c, 180],
    [c, -c, 270],
  ];
  const pts: Point[] = [];
  for (const [ox, oy, start] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = ((start + (90 * i) / steps) * Math.PI) / 180;
      pts.push([ox + r * Math.cos(a), oy + r * Math.sin(a)]);
    }
  }
  return pts;
};

const toPath = (pts: Point[]) =>
  `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`;

const topPath = (slab: SlabType, inset = 0, cx = CX, dy = 0) =>
  toPath(
    footprint(slab.half - inset, Math.max(slab.radius - inset, 1)).map(([x, y]) =>
      project(x, y, cx, slab.top + dy),
    ),
  );

// A vertically extruded convex shape is the convex hull of its top and bottom outlines.
const hull = (points: Point[]): Point[] => {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Point, a: Point, b: Point) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (list: Point[]) => {
    const out: Point[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...build(pts), ...build([...pts].reverse())];
};

const bodyPath = (slab: SlabType, inset = 0) => {
  const outline = footprint(slab.half - inset, Math.max(slab.radius - inset, 1));
  const upper = outline.map(([x, y]) => project(x, y, CX, slab.top));
  const lower = outline.map(([x, y]) => project(x, y, CX, slab.top + slab.depth));
  return toPath(hull([...upper, ...lower]));
};

const facePoint = (slab: SlabType, side: "left" | "right", u: number, v: number): Point => {
  const { half, top, depth } = slab;
  if (side === "left") {
    const [x, y] = project(-half + 2 * half * u, half, CX, top);
    return [x, y + depth * v];
  }
  const [x, y] = project(half, half - 2 * half * u, CX, top);
  return [x, y + depth * v];
};

const FACE_MATRIX = {
  left: `${ISO_X} ${ISO_Y} 0 1`,
  right: `${ISO_X} ${-ISO_Y} 0 1`,
  top: `${ISO_X} ${ISO_Y} ${-ISO_X} ${ISO_Y}`,
};

const ringPoint = (rx: number, angleDeg: number): Point => {
  const a = (angleDeg * Math.PI) / 180;
  return [round(CX + rx * Math.cos(a)), round(CY + rx * RING_FLATTEN * Math.sin(a))];
};

const ringPath = (rx: number) => {
  const ry = rx * RING_FLATTEN;
  return `M${CX + rx} ${CY}A${rx} ${ry} 0 1 1 ${CX - rx} ${CY}A${rx} ${ry} 0 1 1 ${CX + rx} ${CY}Z`;
};

/* ── Core parts ──────────────────────────────────────────────────────────── */

// Hot Pink, the brand's action colour, where the original used its orange.
const PINK = "#FF3D9A";

type FaceProps = { slab: SlabType; side: "left" | "right"; u: number; v: number };

const FaceMark = ({
  slab, side, u, v, w, h, fill, glow,
}: FaceProps & { w: number; h: number; fill: string; glow?: boolean }) => {
  const [x, y] = facePoint(slab, side, u, v);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) matrix(${FACE_MATRIX[side]} 0 0)`}>
      {glow && (
        <rect x={-w / 2 - 2} y={-h / 2 - 3} width={w + 4} height={h + 6} rx={h} fill={fill} filter="url(#n3-blur-sm)" opacity="0.75" />
      )}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} />
    </g>
  );
};

const PanelLine = ({
  slab, side, v, from = 0.14, to = 0.86,
}: { slab: SlabType; side: "left" | "right"; v: number; from?: number; to?: number }) => {
  const [x1, y1] = facePoint(slab, side, from, v);
  const [x2, y2] = facePoint(slab, side, to, v);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8FA3C4" strokeWidth="0.9" opacity="0.5" />;
};

const Fastener = ({ slab, x, y }: { slab: SlabType; x: number; y: number }) => {
  const [px, py] = project(x, y, CX, slab.top);
  return (
    <g transform={`translate(${px.toFixed(2)} ${py.toFixed(2)}) matrix(${FACE_MATRIX.top} 0 0)`}>
      <circle r="6.5" fill="url(#n3-hole)" stroke="#BCC9DD" strokeWidth="1" />
    </g>
  );
};

const SlabBody = ({ slab }: { slab: SlabType }) => (
  <g>
    <path d={bodyPath(slab)} fill="url(#n3-side)" />
    <path d={bodyPath(slab)} fill="url(#n3-side-shade)" />
    <path d={bodyPath(slab)} fill="none" stroke="#C2CFE2" strokeWidth="1" opacity="0.8" />
  </g>
);

const SlabTop = ({ slab, groove }: { slab: SlabType; groove?: number }) => (
  <g>
    <path d={topPath(slab)} fill="url(#n3-bevel)" stroke="#CBD6E6" strokeWidth="1" />
    <path d={topPath(slab, 4.5)} fill="url(#n3-top)" stroke="#fff" strokeWidth="1" />
    {groove !== undefined && <path d={topPath(slab, groove)} fill="none" stroke="#CDD8E8" strokeWidth="1.2" />}
  </g>
);

/**
 * The brand mark standing on a top face: the two parallelograms of the logo,
 * extruded in steps so the object has real thickness, lit from the upper left.
 */
const MARK_SIDE = ["#8E1F55", "#A62664", "#BE2C72", "#D63381", "#EE3A90", "#FF3D9A"];
const MARK_SCALE = 0.17;

const MarkSolid = ({ x, y }: { x: number; y: number }) => {
  const plane = (lift: number) =>
    `translate(${x} ${y - lift}) matrix(${FACE_MATRIX.top} 0 0) scale(${MARK_SCALE}) translate(-133 -136)`;
  const shapes = (sky: string, pink: string) => (
    <>
      <polygon points="157,0 263,0 100,188 0,188" fill={sky} />
      <polygon points="172,133 265,133 148,273 55,273" fill={pink} />
    </>
  );
  return (
    <g>
      <g transform={`${plane(0)} translate(14 14)`} opacity="0.3" filter="url(#n3-blur-sm)">
        {shapes("#02060F", "#02060F")}
      </g>
      {MARK_SIDE.map((fill, k) => (
        <g key={fill} transform={plane(k)}>{shapes("#2F6EA8", fill)}</g>
      ))}
      <g transform={plane(MARK_SIDE.length)}>{shapes("#65B9F2", "#FF3D9A")}</g>
    </g>
  );
};

const CoreDefs = () => (
  <defs>
    <linearGradient id="n3-side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#EDF2FA" />
      <stop offset="0.46" stopColor="#DDE5F2" />
      <stop offset="0.5" stopColor="#C6D2E6" />
      <stop offset="1" stopColor="#D4DDEC" />
    </linearGradient>
    <linearGradient id="n3-side-shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stopColor="#12223F" stopOpacity="0" />
      <stop offset="1" stopColor="#12223F" stopOpacity="0.2" />
    </linearGradient>
    <linearGradient id="n3-bevel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="1" stopColor="#DCE4F1" />
    </linearGradient>
    <linearGradient id="n3-top" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="1" stopColor="#E9EFF8" />
    </linearGradient>
    <linearGradient id="n3-inlay" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#E4EBF6" />
      <stop offset="1" stopColor="#FFFFFF" />
    </linearGradient>
    <linearGradient id="n3-seam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFA8D1" />
      <stop offset="0.5" stopColor={PINK} />
      <stop offset="1" stopColor="#FF7DB8" />
    </linearGradient>
    <linearGradient id="n3-slot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#4A5A75" />
      <stop offset="1" stopColor="#7A89A3" />
    </linearGradient>
    <radialGradient id="n3-hole" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0" stopColor="#C8D3E4" />
      <stop offset="1" stopColor="#EDF2FA" />
    </radialGradient>
    <filter id="n3-blur-sm" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.5" /></filter>
    <filter id="n3-blur-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9" /></filter>
    <filter id="n3-blur-spill" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="18" /></filter>
  </defs>
);

/* ── The core at rest ────────────────────────────────────────────────────── */

const SyntraCoreObject = (props: SVGProps<SVGSVGElement>) => {
  const seam: SlabType = {
    half: MID.half - 2, radius: MID.radius - 2, top: MID.top + MID.depth - 1, depth: SEAM_GAP + 1,
  };
  const spillDy = BASE.top - MID.top;
  return (
    <svg viewBox="0 0 1000 1000" role="img" aria-label="Sistem Saga X Ventures" {...props}>
      <CoreDefs />
      <SlabBody slab={BASE} />
      <SlabTop slab={BASE} groove={10} />
      <PanelLine slab={BASE} side="left" v={0.3} />
      <PanelLine slab={BASE} side="right" v={0.3} />
      {[0.5, 0.58, 0.66].map((u) => (
        <FaceMark key={`r${u}`} slab={BASE} side="right" u={u} v={0.62} w={4.5} h={4.5} fill="url(#n3-slot)" />
      ))}
      {[0.32, 0.4].map((u) => (
        <FaceMark key={`l${u}`} slab={BASE} side="left" u={u} v={0.62} w={4.5} h={4.5} fill="url(#n3-slot)" />
      ))}
      <g className="n3-seam-pulse">
        <path d={topPath(MID, 4, CX, spillDy)} fill={PINK} opacity="0.24" filter="url(#n3-blur-spill)" />
        <path d={bodyPath(seam)} fill={PINK} opacity="0.6" filter="url(#n3-blur-glow)" />
      </g>
      <path d={bodyPath(seam)} fill="url(#n3-seam)" />
      <SlabBody slab={MID} />
      <SlabTop slab={MID} groove={11} />
      <PanelLine slab={MID} side="left" v={0.78} />
      <PanelLine slab={MID} side="right" v={0.78} />
      <FaceMark slab={MID} side="left" u={0.62} v={0.42} w={34} h={7.5} fill="url(#n3-slot)" />
      <FaceMark slab={MID} side="right" u={0.68} v={0.42} w={22} h={4.5} fill="url(#n3-slot)" />
      <g className="n3-seam-pulse">
        <FaceMark slab={MID} side="left" u={0.2} v={0.42} w={7} h={2.6} fill={PINK} glow />
      </g>
      <Fastener slab={MID} x={0} y={-MID.half + 28} />
      <Fastener slab={MID} x={-MID.half + 28} y={0} />
      <Fastener slab={MID} x={MID.half - 28} y={0} />
      <Fastener slab={MID} x={0} y={MID.half - 28} />
      <SlabBody slab={CAP} />
      <SlabTop slab={CAP} />
      <path d={topPath(CAP, 19)} fill="url(#n3-inlay)" stroke="#D2DCEB" strokeWidth="1.2" />
      <MarkSolid x={CX} y={CAP.top} />
    </svg>
  );
};

const SyntraCoreShadow = (props: SVGProps<SVGSVGElement>) => {
  const floor = { ...BASE, top: BASE.top + BASE.depth + 30 };
  return (
    <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
      <defs>
        <filter id="n3-blur-lg" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26" /></filter>
        <filter id="n3-blur-md" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <path d={topPath(floor, -14)} fill="#000510" opacity="0.5" filter="url(#n3-blur-lg)" />
      <path d={topPath(floor, 6)} fill="#000510" opacity="0.45" filter="url(#n3-blur-md)" />
    </svg>
  );
};

/* ── Backdrops and orbits ────────────────────────────────────────────────── */

const NODES: [number, number][] = [
  [118, 132], [318, 82], [690, 96], [884, 188],
  [936, 470], [70, 512], [150, 858], [850, 846],
];

const SyntraDepthBackdrop = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
    <defs>
      <linearGradient id="n3-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#65B9F2" stopOpacity="0.14" />
        <stop offset="1" stopColor="#65B9F2" stopOpacity="0.02" />
      </linearGradient>
    </defs>
    <g fill="url(#n3-glass)" stroke="#20365F" strokeWidth="1" opacity="0.7">
      <rect width="290" height="250" rx="22" transform="matrix(0.866 -0.5 0 1 232 300)" />
      <rect width="290" height="250" rx="22" transform="matrix(0.866 0.5 0 1 520 150)" />
    </g>
    <g fill="#0B1F44" stroke="#2A4575" strokeWidth="1">
      {NODES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4 : 3} opacity="0.9" />
      ))}
    </g>
  </svg>
);

// Deterministic scatter, so server and client render the same dots.
const DOTS = Array.from({ length: 26 }, (_, i) => {
  const a = (i * 137.5 * Math.PI) / 180;
  const r = 160 + ((i * 53) % 340);
  return [round(CX + r * Math.cos(a) * 1.02), round(CY + r * Math.sin(a) * RING_FLATTEN * 1.6), 0.8 + (i % 3) * 0.5] as const;
});

const SyntraTechnicalBackdrop = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
    <defs>
      <linearGradient id="n3-axis-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2A4575" stopOpacity="0" />
        <stop offset="0.5" stopColor="#2A4575" stopOpacity="0.8" />
        <stop offset="1" stopColor="#2A4575" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="n3-axis-h" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2A4575" stopOpacity="0" />
        <stop offset="0.5" stopColor="#2A4575" stopOpacity="0.9" />
        <stop offset="1" stopColor="#2A4575" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x={CX - 0.5} y="110" width="1" height="780" fill="url(#n3-axis-v)" />
    <rect x="70" y={CY - 0.5} width="860" height="1" fill="url(#n3-axis-h)" />
    <g fill="#2A4575">
      {DOTS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} opacity={0.45 + (i % 4) * 0.14} />)}
    </g>
  </svg>
);

const SyntraOrbitalSystem = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
    <g fill="none" stroke="#2A4575" strokeWidth="1">
      <ellipse cx={CX} cy={CY} rx={RING_RX[0]} ry={RING_RX[0] * RING_FLATTEN} opacity="0.9" />
      <ellipse cx={CX} cy={CY} rx={RING_RX[1]} ry={RING_RX[1] * RING_FLATTEN} opacity="0.7" />
    </g>
  </svg>
);

type NodeType = { ring: 0 | 1; angle: number; size: number };

const BEADS: NodeType[] = [
  { ring: 0, angle: 20, size: 7 }, { ring: 0, angle: 110, size: 5.5 },
  { ring: 0, angle: 200, size: 8 }, { ring: 0, angle: 290, size: 6 },
  { ring: 1, angle: 60, size: 6 }, { ring: 1, angle: 132, size: 8 },
  { ring: 1, angle: 204, size: 5.5 }, { ring: 1, angle: 276, size: 7 },
  { ring: 1, angle: 348, size: 6.5 },
];

const Crystal = ({ size }: { size: number }) => (
  <g filter="url(#n3-crystal-shadow)">
    <circle r={size * 1.55} fill="url(#n3-crystal-halo)" />
    <circle r={size} fill="url(#n3-crystal-body)" />
    <circle r={size} fill="url(#n3-crystal-refract)" />
    <circle r={size - 0.5} fill="none" stroke="url(#n3-crystal-rim)" strokeWidth="1" />
    <ellipse
      cx={-size * 0.32} cy={-size * 0.4} rx={size * 0.36} ry={size * 0.2}
      transform={`rotate(-30 ${-size * 0.32} ${-size * 0.4})`} fill="#FFFFFF" opacity="0.95"
    />
  </g>
);

/**
 * Beads are drawn twice, each clipped to its half of the artboard, so one
 * passing the back of an orbit slips behind the core instead of over it.
 */
type ParticlesProps = SVGProps<SVGSVGElement> & { half: "back" | "front"; animate: boolean; paused?: boolean };

const SyntraParticles = ({ half, animate: run, paused = false, ...props }: ParticlesProps) => {
  const ref = useRef<SVGSVGElement>(null);
  const clipId = `n3-clip-${half}`;

  // The beads run on this SVG's own animation clock, so pausing it stops them together.
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [paused]);

  return (
    <svg ref={ref} viewBox="0 0 1000 1000" aria-hidden {...props}>
      <defs>
        <clipPath id={clipId}>
          {half === "back"
            ? <rect x="-200" y="-200" width="1400" height={CY + 200} />
            : <rect x="-200" y={CY} width="1400" height="700" />}
        </clipPath>
        <linearGradient id="n3-crystal-body" x1="0.15" y1="0.1" x2="0.85" y2="0.95">
          <stop offset="0" stopColor="#FFE2F0" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#FF8FC2" stopOpacity="0.88" />
          <stop offset="1" stopColor="#E02078" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="n3-crystal-refract" cx="0.6" cy="0.78" r="0.45">
          <stop offset="0" stopColor="#FFF0F7" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFF0F7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="n3-crystal-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#B01560" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="n3-crystal-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.5" stopColor={PINK} stopOpacity="0.18" />
          <stop offset="1" stopColor={PINK} stopOpacity="0" />
        </radialGradient>
        <filter id="n3-crystal-shadow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#2A0A18" floodOpacity="0.4" />
        </filter>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {BEADS.map((node, i) => {
          const rx = RING_RX[node.ring];
          const [x, y] = ringPoint(rx, node.angle);
          const dur = MOTION.orbitSeconds[node.ring];
          const reverse = node.ring === 1;
          const start = node.angle / 360;
          const begin = -dur * (reverse ? 1 - start : start);
          return (
            <g key={i} transform={run ? undefined : `translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
              <Crystal size={node.size} />
              {run && (
                <animateMotion
                  dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={ringPath(rx)}
                  {...(reverse && { keyPoints: "1;0", keyTimes: "0;1", calcMode: "linear" })}
                />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/* ── Content and dials ───────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

const COPY = {
  eyebrow: "Markets · Technology · Innovation",
  headline: ["Beyond Trading"],
  accentWord: ".",
  body: "Belajar trade sendiri, atau biar sistem yang jalan. Dua jalan, satu tempat — dan tiga soalan untuk tahu yang mana awak.",
  primaryCta: "Mula — tiga soalan",
  primaryHref: "/mula",
  secondaryCta: "Lihat dua jalan",
  secondaryHref: "/#jalan",
};

/**
 * What the original called metrics. Those were customer counts and a rating;
 * this business has neither yet, so the strip states things that are true
 * instead — and which happen to be the real difference in this category.
 */
const PROMISES = [
  { label: "Akaun atas nama awak", icon: "shield" },
  { label: "Kami tak pegang wang awak", icon: "lock" },
  { label: "Risiko dinyatakan, bukan disembunyi", icon: "eye" },
] as const;

const MOTION = {
  floatDistance: 10,
  floatSeconds: 6.5,
  tiltDegrees: 3.5,
  ringParallax: 12,
  backdropParallax: 5,
  orbitSeconds: [70, 95],
  orbitOpenOpacity: 0.15,
};

const ARTBOARD = 1000;

/** The five layers, bottom to top: where a person starts, and where it leads. */
const STAGES = [
  { title: "Akaun broker", items: ["Buka", "Deposit", "Milik awak"], side: "right" },
  { title: "Asas yang betul", items: ["Risiko", "Saiz lot", "Disiplin"], side: "left" },
  { title: "Pilih jalan awak", items: ["Belajar", "Automatik", "Signal"], side: "right", main: true },
  { title: "Jalankan", items: ["Posisi", "Sistem", "VPS"], side: "left" },
  { title: "Semak dan perbaiki", items: ["Rekod", "Semakan", "Pelarasan"], side: "right" },
] as const;

type Stage = (typeof STAGES)[number];

const isMain = (stage: Stage) => "main" in stage && stage.main;

const EXPLODE = {
  spring: { stiffness: 105, damping: 25, mass: 1 },
  gap: 94,
  aiLift: 12,
  topPlateY: 230,
  stagger: 0.05,
  scales: [0.63, 0.62, 0.7, 1.07, 1.06],
};

const STAGE_CARDS = {
  left: { edge: -2, width: 31 },
  right: { edge: 0, width: 29 },
  restInset: 10,
  outward: 2,
  beadSeconds: 1.6,
};

/* ── Explode layout ──────────────────────────────────────────────────────── */

const PLATE_SLABS: SlabType[] = [
  { ...BASE, top: BASE.top + 17, depth: 17 },
  { ...BASE, top: BASE.top, depth: 17 },
  MID,
  { ...CAP, top: CAP.top + 7, depth: 7 },
  { ...CAP, top: CAP.top, depth: 7 },
];

const MAIN_PLATE = 2;

const TARGET_TOPS = PLATE_SLABS.map(
  (_, i) => EXPLODE.topPlateY + (PLATE_SLABS.length - 1 - i) * EXPLODE.gap - (i === MAIN_PLATE ? EXPLODE.aiLift : 0),
);

const TRAVEL = PLATE_SLABS.map((slab, i) => TARGET_TOPS[i] - slab.top);

const clamp = (v: number) => Math.min(1, Math.max(0, v));

const plateProgress = (i: number, p: number) => {
  const delay = Math.abs(i - MAIN_PLATE) * EXPLODE.stagger;
  return clamp((p - delay) / (1 - delay));
};

const plateY = (i: number, p: number) => TRAVEL[i] * plateProgress(i, p);
const plateScale = (i: number, p: number) => 1 + (EXPLODE.scales[i] - 1) * plateProgress(i, p);

const tipOffset = (i: number) => {
  const { half, radius } = PLATE_SLABS[i];
  return 0.866 * (2 * half - 0.586 * radius) * EXPLODE.scales[i];
};

const tipX = (i: number, side: "left" | "right") => CX + (side === "right" ? 1 : -1) * tipOffset(i);
const cornerY = (i: number) => TARGET_TOPS[i] + PLATE_SLABS[i].depth / 2;

/* ── The core taken apart ────────────────────────────────────────────────── */

// Extra side thickness each plate grows once apart; zero at rest, so the stack
// still matches the resting object exactly.
const SKIRT = [0, 4, 0, 10, 10];

const Plate = ({
  index, progress, children,
}: { index: number; progress: MotionValue<number>; children: ReactNode }) => {
  const y = useTransform(progress, (v) => plateY(index, v));
  const scale = useTransform(progress, (v) => plateScale(index, v));
  const apart = useTransform(progress, (v) => plateProgress(index, v));
  const shadow = useTransform(apart, (v) => v * 0.3);
  const slab = PLATE_SLABS[index];
  const skirt = SKIRT[index];

  return (
    <m.g style={{ y, scale }}>
      {index > 0 && (
        <m.path
          d={topPath(slab, -6, CX, slab.depth + 34)}
          fill="#000510" filter="url(#n3-blur-spill)" style={{ opacity: shadow }}
        />
      )}
      {skirt > 0 && (
        <m.g style={{ opacity: apart }}>
          <SlabBody slab={{ ...slab, top: slab.top + slab.depth - 1, depth: skirt + 1 }} />
        </m.g>
      )}
      {children}
    </m.g>
  );
};

/** The stage number engraved into a plate's top face, laid flat in the surface. */
const PlateNumber = ({ slab, n, main = false }: { slab: SlabType; n: number; main?: boolean }) => {
  const k = slab.half * 0.56;
  const [x, y] = project(k, k, CX, slab.top);
  const plane = `matrix(${FACE_MATRIX.top} 0 0) rotate(-45)`;
  const label = String(n).padStart(2, "0");
  const text = {
    textAnchor: "middle" as const, dominantBaseline: "central" as const,
    fontSize: 25, fontWeight: 600, letterSpacing: 2.5,
  };
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`} aria-hidden>
      <text {...text} transform={`translate(0 0.9) ${plane}`} fill="#FFFFFF" opacity="0.95">{label}</text>
      <text {...text} transform={plane} fill={main ? PINK : "#9FB0CB"}>{label}</text>
    </g>
  );
};

const MainEmphasis = ({ progress }: { progress: MotionValue<number> }) => {
  const on = useTransform(progress, (v) => clamp((v - 0.5) / 0.4));
  const rim = useTransform(on, (v) => v * 0.9);
  const halo = useTransform(on, (v) => v * 0.55);
  const spill = useTransform(halo, (v) => v * 0.35);
  return (
    <g transform={`translate(${CX} ${MID.top}) matrix(${FACE_MATRIX.top} 0 0)`}>
      <m.circle r="86" fill={PINK} filter="url(#n3-blur-spill)" style={{ opacity: spill }} />
      <m.circle r="56" fill="none" stroke={PINK} strokeWidth="1.4" style={{ opacity: rim }} />
      <m.circle r="38" fill="none" stroke={PINK} strokeWidth="1" strokeDasharray="3 6" style={{ opacity: halo }} />
      <m.circle r="9" fill={PINK} style={{ opacity: rim }} />
    </g>
  );
};

const SyntraExplodedCore = ({
  progress, ...props
}: SVGProps<SVGSVGElement> & { progress: MotionValue<number> }) => {
  const strongGlow = useTransform(progress, (v) => clamp((v - 0.4) / 0.5) * 0.6);
  const seam = { half: MID.half - 2, radius: MID.radius - 2, top: MID.top + MID.depth - 1, depth: SEAM_GAP + 1 };

  return (
    <svg viewBox="0 0 1000 1000" aria-hidden {...props}>
      <CoreDefs />
      <Plate index={0} progress={progress}>
        <SlabBody slab={PLATE_SLABS[0]} />
        <SlabTop slab={PLATE_SLABS[0]} groove={10} />
        <PlateNumber slab={PLATE_SLABS[0]} n={1} />
      </Plate>
      <Plate index={1} progress={progress}>
        <SlabBody slab={PLATE_SLABS[1]} />
        <SlabTop slab={PLATE_SLABS[1]} groove={10} />
        <PlateNumber slab={PLATE_SLABS[1]} n={2} />
      </Plate>
      <Plate index={MAIN_PLATE} progress={progress}>
        <g className="n3-seam-pulse">
          <path d={topPath(MID, 4, CX, BASE.top - MID.top)} fill={PINK} opacity="0.24" filter="url(#n3-blur-spill)" />
          <path d={bodyPath(seam)} fill={PINK} opacity="0.6" filter="url(#n3-blur-glow)" />
        </g>
        <m.path d={bodyPath(seam)} fill={PINK} filter="url(#n3-blur-glow)" style={{ opacity: strongGlow }} />
        <path d={bodyPath(seam)} fill="url(#n3-seam)" />
        <SlabBody slab={MID} />
        <SlabTop slab={MID} groove={11} />
        <PlateNumber slab={MID} n={3} main />
        <PanelLine slab={MID} side="left" v={0.78} />
        <PanelLine slab={MID} side="right" v={0.78} />
        <Fastener slab={MID} x={0} y={-MID.half + 28} />
        <Fastener slab={MID} x={-MID.half + 28} y={0} />
        <Fastener slab={MID} x={MID.half - 28} y={0} />
        <Fastener slab={MID} x={0} y={MID.half - 28} />
        <MainEmphasis progress={progress} />
      </Plate>
      <Plate index={3} progress={progress}>
        <SlabBody slab={PLATE_SLABS[3]} />
        <SlabTop slab={PLATE_SLABS[3]} />
        <PlateNumber slab={PLATE_SLABS[3]} n={4} />
      </Plate>
      <Plate index={4} progress={progress}>
        <SlabBody slab={PLATE_SLABS[4]} />
        <SlabTop slab={PLATE_SLABS[4]} />
        <path d={topPath(CAP, 19)} fill="url(#n3-inlay)" stroke="#D2DCEB" strokeWidth="1.2" />
        <MarkSolid x={CX} y={CAP.top} />
      </Plate>
    </svg>
  );
};

/* ── Stage cards ─────────────────────────────────────────────────────────── */

const StageCardBody = ({ index }: { index: number }) => {
  const stage = STAGES[index];
  const main = isMain(stage);
  return (
    <div className="grid grid-cols-[1.35em_minmax(0,1fr)] items-start gap-x-[0.5em]">
      <span className="col-start-1 row-start-1 flex h-[1.64em] items-center text-[0.8em] font-semibold tabular-nums text-(color:--color-n3-grey)">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="col-start-2 row-start-1 flex flex-wrap items-baseline justify-between gap-x-[0.6em]">
        <p className="text-[1.05em] leading-[1.25] font-semibold tracking-[-0.015em] text-(color:--color-n3-ink) md:whitespace-nowrap">
          {stage.title}
        </p>
        {main && (
          <span className="shrink-0 text-[0.72em] font-semibold tracking-[0.12em] uppercase text-(color:--color-n3-accent)">
            Di sini awak pilih
          </span>
        )}
      </div>
      <div className="col-start-2 row-start-2 mt-[0.4em]">
        <p className="text-[0.88em] leading-[1.45] text-(color:--color-n3-grey)">{stage.items.join(" · ")}</p>
      </div>
    </div>
  );
};

const pct = (n: number) => `${(n / ARTBOARD) * 100}%`;
const cardDirection = (index: number) => (STAGES[index].side === "left" ? -1 : 1);

const StageCard = ({
  index, progress, open, lit, onHover,
}: {
  index: number; progress: MotionValue<number>; open: boolean; lit: boolean;
  onHover: (index: number | null) => void;
}) => {
  const opacity = useTransform(progress, [0.35, 0.9], [0, 1]);
  const x = useTransform(
    progress, [0, 1],
    [-cardDirection(index) * STAGE_CARDS.restInset, cardDirection(index) * STAGE_CARDS.outward],
  );
  const stage = STAGES[index];
  const { edge, width } = STAGE_CARDS[stage.side];
  const left = stage.side === "left" ? edge : 100 - edge - width;

  return (
    <li style={{ top: pct(cornerY(index)), left: `${left}%`, width: `${width}%` }} className="absolute -translate-y-1/2">
      <m.div
        style={{ opacity, x }}
        onPointerEnter={(e: ReactPointerEvent) => { if (e.pointerType === "mouse") onHover(index); }}
        onPointerLeave={() => onHover(null)}
        className={cn("n3-stage-card px-[0.9em] py-[0.85em]", open && "pointer-events-auto", lit && "n3-stage-card-lit")}
      >
        <StageCardBody index={index} />
      </m.div>
    </li>
  );
};

const StageCards = ({
  progress, open, hovered, onHover,
}: {
  progress: MotionValue<number>; open: boolean; hovered: number | null;
  onHover: (index: number | null) => void;
}) => (
  <ul
    aria-label="Bagaimana ia berfungsi"
    aria-hidden={!open}
    className="pointer-events-none absolute inset-0 m-0 hidden list-none p-0 text-[clamp(10px,1.7cqw,15px)] md:block"
  >
    {STAGES.map((stage, i) => (
      <StageCard key={stage.title} index={i} progress={progress} open={open} lit={hovered === i} onHover={onHover} />
    ))}
  </ul>
);

const lineEnds = (plate: number, card: number, side: "left" | "right") => {
  const dir = side === "right" ? 1 : -1;
  return { plateX: plate + dir * 7, nodeX: card - dir * 10 };
};

const StageConnector = ({
  plate, card, y, side, index, main, lit, active, progress, className,
}: {
  className?: string; plate: number; card: number; y: number; side: "left" | "right";
  index: number; main: boolean; lit: boolean; active: boolean; progress: MotionValue<number>;
}) => {
  const show = useTransform(progress, [0.55, 0.9], [0, 1]);
  const t = useMotionValue(0);
  const beadX = useTransform(t, (k) => {
    const ends = lineEnds(plate, card, side);
    return ends.nodeX + (ends.plateX - ends.nodeX) * k;
  });
  const beadOpacity = useTransform([t, show], ([k, s]: number[]) => s * Math.sin(Math.PI * k));
  const { plateX, nodeX } = lineEnds(plate, card, side);

  useEffect(() => {
    if (!active) return;
    const controls = animate(t, [0, 1], {
      duration: STAGE_CARDS.beadSeconds, ease: "easeInOut",
      repeat: Infinity, repeatDelay: 1.4, delay: 0.5 + index * 0.25,
    });
    return () => { controls.stop(); t.set(0); };
  }, [active, index, t]);

  return (
    <m.svg aria-hidden viewBox={`0 0 ${ARTBOARD} ${ARTBOARD}`} style={{ opacity: show }} className={className}>
      <line x1={plateX} x2={nodeX} y1={y} y2={y} stroke="#2A4575" strokeWidth="1" />
      <m.line
        x1={plateX} x2={nodeX} y1={y} y2={y} stroke={PINK} strokeWidth="1.2"
        initial={false} animate={{ opacity: lit ? 0.9 : 0 }} transition={{ duration: 0.25 }}
      />
      <circle cx={plateX} cy={y} r="2.6" fill="#7E8FAD" />
      <m.circle
        cx={nodeX} cy={y} r={main ? 10 : 8} fill={PINK}
        initial={false} animate={{ opacity: lit || main ? 0.26 : 0.14 }} transition={{ duration: 0.25 }}
      />
      <circle cx={nodeX} cy={y} r="3.6" fill={PINK} />
      <m.circle cx={beadX} cy={y} r="2.6" fill={PINK} style={{ opacity: beadOpacity }} />
    </m.svg>
  );
};

const StageConnectors = ({
  progress, active, hovered,
}: { progress: MotionValue<number>; active: boolean; hovered: number | null }) => (
  <div className="pointer-events-none absolute inset-0 hidden md:block">
    {STAGES.map((stage, i) => {
      const { edge, width } = STAGE_CARDS[stage.side];
      const cardEdge = stage.side === "left" ? (edge + width) * 10 : (100 - edge - width) * 10;
      return (
        <StageConnector
          key={stage.title} plate={tipX(i, stage.side)} card={cardEdge} y={cornerY(i)}
          side={stage.side} index={i} main={isMain(stage)} lit={hovered === i} active={active} progress={progress}
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        />
      );
    })}
  </div>
);

// On a phone the visual is too narrow for cards beside it, so they sit below.
const StageList = ({ reduce }: { reduce: boolean }) => (
  <m.ul
    initial={reduce ? false : { opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
    aria-label="Bagaimana ia berfungsi"
    className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 text-[13px] sm:grid-cols-2 md:hidden"
  >
    {STAGES.map((stage, i) => (
      <li key={stage.title} className="n3-stage-card px-[1.05em] py-[0.95em]">
        <StageCardBody index={i} />
      </li>
    ))}
  </m.ul>
);

/* ── The floor ───────────────────────────────────────────────────────────── */

const CELL = { w: 84, h: 48 };

const FloorGrid = ({
  id, stroke = "#1C3059", strokeWidth = 0.8, ...props
}: SVGProps<SVGSVGElement> & { id: string; stroke?: string; strokeWidth?: number }) => (
  <svg aria-hidden width="100%" height="100%" {...props}>
    <defs>
      <pattern id={id} width={CELL.w} height={CELL.h} patternUnits="userSpaceOnUse">
        <path
          d={`M0 ${CELL.h / 2}L${CELL.w / 2} 0L${CELL.w} ${CELL.h / 2}M0 ${CELL.h / 2}L${CELL.w / 2} ${CELL.h}L${CELL.w} ${CELL.h / 2}`}
          fill="none" stroke={stroke} strokeWidth={strokeWidth}
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
);

const SPOT = 340;

/**
 * The grid, plus a pink copy seen through a round window that follows the
 * cursor. Window and grid move by opposite transforms only, so nothing
 * repaints and the orbits stay smooth. It listens on the section, since the
 * grid sits behind the content and never receives the pointer itself.
 */
const HeroFloor = () => {
  const ref = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const litRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const spot = spotRef.current;
    const lit = litRef.current;
    const section = el?.parentElement;
    if (!el || !spot || !lit || !section) return;

    const resize = new ResizeObserver(([entry]) => {
      lit.style.width = `${entry.contentRect.width}px`;
      lit.style.height = `${entry.contentRect.height}px`;
    });
    resize.observe(section);

    let frame = 0;
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = section.getBoundingClientRect();
        const x = e.clientX - box.left - SPOT / 2;
        const y = e.clientY - box.top - SPOT / 2;
        spot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        lit.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
        el.dataset.spot = "on";
      });
    };
    const handlePointerLeave = () => {
      cancelAnimationFrame(frame);
      el.dataset.spot = "off";
    };

    section.addEventListener("pointermove", handlePointerMove);
    section.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden data-spot="off" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <FloorGrid id="n3-floor-cell" className="n3-floor absolute inset-0" />
      <div ref={spotRef} style={{ width: SPOT, height: SPOT }} className="n3-floor-spot">
        <div ref={litRef} className="n3-floor-lit">
          <FloorGrid id="n3-floor-cell-lit" stroke={PINK} strokeWidth={1} className="block size-full" />
        </div>
      </div>
    </div>
  );
};

/* ── The visual ──────────────────────────────────────────────────────────── */

const subscribeToVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};
const isPageVisible = () => !document.hidden;
const isPageVisibleOnServer = () => true;

// Hydration-safe "has this mounted yet": false while rendering on the server,
// true once in the browser, with no state set from an effect.
const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

const ParallaxLayer = ({
  x, y, reach, children,
}: { x: MotionValue<number>; y: MotionValue<number>; reach: number; children: ReactNode }) => {
  const tx = useTransform(x, (v) => v * reach);
  const ty = useTransform(y, (v) => v * reach);
  return <m.div style={{ x: tx, y: ty }} className="pointer-events-none absolute inset-0">{children}</m.div>;
};

const Tilted = ({
  rotateX, rotateY, children,
}: { rotateX: MotionValue<number>; rotateY: MotionValue<number>; children: ReactNode }) => (
  <div className="pointer-events-none absolute inset-0 [perspective:1400px]">
    <m.div style={{ rotateX, rotateY }} className="absolute inset-0">
      <div className="n3-float absolute inset-0">{children}</div>
    </m.div>
  </div>
);

const CoreVisual = () => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const pointerType = useRef("mouse");
  const visualRef = useRef<HTMLDivElement>(null);

  /**
   * Treat the first render as reduced, whatever the system says.
   *
   * useReducedMotion reports false on the server and the real preference in
   * the browser, so branching on it directly makes the server HTML and the
   * first client render disagree — React then throws the whole tree away and
   * rebuilds it, for exactly the visitors who asked for less work. Rendering
   * the still version on both sides and enabling motion after mount keeps
   * them identical, and a reduced-motion visitor never sees a frame of the
   * animation that was meant to be spared them.
   */
  const systemReduce = useReducedMotion() ?? false;
  const mounted = useSyncExternalStore(neverChanges, onClient, onServer);
  const reduce = !mounted || systemReduce;

  // The margin covers the outer orbit running a little past the visual's box.
  const onScreen = useInView(visualRef, { initial: true, margin: "40px" });
  const pageVisible = useSyncExternalStore(subscribeToVisibility, isPageVisible, isPageVisibleOnServer);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 55, damping: 18, mass: 0.9 });
  const y = useSpring(py, { stiffness: 55, damping: 18, mass: 0.9 });
  const rotateY = useTransform(x, (v) => v * MOTION.tiltDegrees);

  // 0 stacked, 1 apart. One spring drives plates, connectors, cards and shadow.
  const target = useMotionValue(0);
  const progress = useSpring(target, reduce ? { duration: 0.01 } : EXPLODE.spring);

  const rotateX = useTransform([y, progress], ([v, p]: number[]) => v * -MOTION.tiltDegrees + p * 4);
  const restOpacity = useTransform(progress, [0, 0.04], [1, 0]);
  const explodedOpacity = useTransform(progress, [0, 0.03], [0, 1]);
  const shadowOpacity = useTransform(progress, [0, 1], [1, 0.55]);
  const orbitOpacity = useTransform(progress, [0, 0.6], [1, MOTION.orbitOpenOpacity]);
  const hintOpacity = useTransform(progress, [0, 0.25], [1, 0]);

  // Beads hold still while open, off screen, or in a hidden tab; both halves
  // share the flag so they stay in step.
  const beadsPaused = open || !onScreen || !pageVisible;

  useEffect(() => { target.set(open ? 1 : 0); }, [open, target]);

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - box.left) / box.width - 0.5) * 2);
    py.set(((e.clientY - box.top) / box.height - 0.5) * 2);
  };

  const handlePointerLeave = () => { px.set(0); py.set(0); setOpen(false); };

  const handleCardHover = (index: number | null) => {
    setHovered(index);
    if (index !== null && !reduce) setOpen(true);
  };

  // A mouse opens it on hover. Touch and keyboard have no hover, so they toggle.
  const handleCoreClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0 || pointerType.current !== "mouse") setOpen((v) => !v);
  };

  return (
    <LazyMotion features={domAnimation}>
      <>
        <div
          ref={visualRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="n3-enter @container relative -my-[6%] -ml-[12.5%] aspect-square w-[125%] max-w-none md:mx-auto md:my-0 md:w-full md:max-w-[760px] lg:mx-0 lg:w-[104%] lg:max-w-none"
        >
          <div className="absolute inset-0">
            <div aria-hidden className="n3-halo pointer-events-none absolute inset-[6%]" />
            <div className="n3-fade-edge absolute inset-0">
              <ParallaxLayer x={x} y={y} reach={-MOTION.backdropParallax}>
                <SyntraDepthBackdrop className="absolute inset-0 size-full overflow-visible" />
                <SyntraTechnicalBackdrop className="absolute inset-0 size-full overflow-visible" />
              </ParallaxLayer>
            </div>

            <ParallaxLayer x={x} y={y} reach={MOTION.ringParallax}>
              <m.div style={{ opacity: orbitOpacity }} className="absolute inset-0">
                <SyntraOrbitalSystem className="absolute inset-0 size-full overflow-visible" />
                <SyntraParticles half="back" animate={!reduce} paused={beadsPaused} className="absolute inset-0 size-full overflow-visible" />
              </m.div>
            </ParallaxLayer>

            <m.div style={{ opacity: shadowOpacity }} className="absolute inset-0">
              <SyntraCoreShadow className="pointer-events-none absolute inset-0 size-full overflow-visible" />
            </m.div>

            <Tilted rotateX={rotateX} rotateY={rotateY}>
              <m.div style={{ opacity: restOpacity }} className="absolute inset-0">
                <SyntraCoreObject className="absolute inset-0 size-full overflow-visible" />
              </m.div>
              <m.div style={{ opacity: explodedOpacity }} className="absolute inset-0">
                <SyntraExplodedCore progress={progress} className="absolute inset-0 size-full overflow-visible" />
              </m.div>
              <StageConnectors progress={progress} active={open && !reduce} hovered={hovered} />
            </Tilted>

            <ParallaxLayer x={x} y={y} reach={MOTION.ringParallax}>
              <m.div style={{ opacity: orbitOpacity }} className="absolute inset-0">
                <SyntraParticles half="front" animate={!reduce} paused={beadsPaused} className="absolute inset-0 size-full overflow-visible" />
              </m.div>
            </ParallaxLayer>

            <Tilted rotateX={rotateX} rotateY={rotateY}>
              <StageCards progress={progress} open={open} hovered={hovered} onHover={handleCardHover} />
            </Tilted>
          </div>

          <m.p
            aria-hidden
            style={{ opacity: hintOpacity }}
            className="pointer-events-none absolute top-[84%] left-1/2 m-0 flex -translate-x-1/2 items-center gap-1.5 text-[12.5px] whitespace-nowrap text-(color:--color-n3-grey)"
          >
            <MousePointer2 className="size-3.5 text-(color:--color-n3-accent)" strokeWidth={1.8} />
            <span className="[@media(hover:none)]:hidden">Hover untuk lihat di dalamnya</span>
            <span className="hidden [@media(hover:none)]:inline">Tap untuk lihat di dalamnya</span>
          </m.p>

          <button
            type="button"
            aria-expanded={open}
            aria-label="Tunjuk apa yang ada di dalam"
            onPointerDown={(e: ReactPointerEvent<HTMLButtonElement>) => { pointerType.current = e.pointerType; }}
            onPointerEnter={(e: ReactPointerEvent<HTMLButtonElement>) => { if (e.pointerType === "mouse" && !reduce) setOpen(true); }}
            onClick={handleCoreClick}
            onBlur={() => setOpen(false)}
            className="absolute top-[30%] left-[22%] h-[44%] w-[56%] cursor-default rounded-[3rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(color:--color-n3-accent)"
          />
        </div>
        <StageList reduce={reduce} />
      </>
    </LazyMotion>
  );
};

/* ── Copy ────────────────────────────────────────────────────────────────── */

const PROMISE_ICONS = { shield: ShieldCheck, lock: Lock, eye: Eye };

const rise = (delay: number) => ({ style: { animationDelay: `${delay}s` } });

const HeroCopy = () => (
  <div className="flex flex-col justify-center">
    <p {...rise(0.1)} className="n3-rise flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-(color:--color-n3-sky)">
      <span aria-hidden className="n3-dot size-2 rounded-full bg-(color:--color-n3-accent)" />
      {COPY.eyebrow}
    </p>

    <h1 id="n3-title" {...rise(0.18)} className="n3-rise n3-h1 mt-6 font-display font-extrabold text-(color:--color-n3-ink)">
      {COPY.headline.map((line, i) => (
        <span key={line} className="block">
          {line}
          {i === COPY.headline.length - 1 && <span className="text-(color:--color-n3-accent)">{COPY.accentWord}</span>}
        </span>
      ))}
    </h1>

    <p {...rise(0.3)} className="n3-rise mt-6 max-w-[30rem] text-[17px] leading-[1.6] text-(color:--color-n3-grey)">
      {COPY.body}
    </p>

    <div {...rise(0.4)} className="n3-rise mt-8 flex flex-wrap items-center gap-3">
      <Link
        href={COPY.primaryHref}
        className="inline-flex h-12 items-center rounded-xl bg-(color:--color-n3-accent) px-6 text-[15px] font-semibold text-navy transition-colors hover:bg-pink-600 hover:text-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--color-n3-sky)"
      >
        {COPY.primaryCta}
      </Link>
      <Link
        href={COPY.secondaryHref}
        className="inline-flex h-12 items-center rounded-xl px-5 text-[15px] font-semibold text-(color:--color-n3-ink) ring-1 ring-(color:--color-n3-line) transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(color:--color-n3-sky)"
      >
        {COPY.secondaryCta}
      </Link>
    </div>

    {/* What the block called metrics. These are claims the business can keep. */}
    <ul {...rise(0.58)} className="n3-rise mt-10 flex list-none flex-col gap-3 p-0">
      {PROMISES.map(({ label, icon }) => {
        const Icon = PROMISE_ICONS[icon];
        return (
          <li key={label} className="flex items-center gap-3 text-[14px] text-(color:--color-n3-grey)">
            <Icon className="size-5 shrink-0 text-(color:--color-n3-sky)" strokeWidth={1.6} aria-hidden />
            {label}
          </li>
        );
      })}
    </ul>
  </div>
);

/* ── Export ──────────────────────────────────────────────────────────────── */

const motionVars = {
  "--n3-float": MOTION.floatDistance,
  "--n3-float-seconds": `${MOTION.floatSeconds}s`,
} as CSSProperties;

export default function CoreHero() {
  return (
    <>
      <style>{BLOCK_CSS}</style>
      <div style={motionVars} className="n3-root n3-bg w-full antialiased">
        <section id="top" aria-labelledby="n3-title" className="relative isolate overflow-x-clip">
          <HeroFloor />
          <div className="n3-frame mx-auto grid max-w-5xl items-center gap-6 pt-8 pb-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:py-12">
            <HeroCopy />
            <CoreVisual />
          </div>
        </section>
      </div>
    </>
  );
}
