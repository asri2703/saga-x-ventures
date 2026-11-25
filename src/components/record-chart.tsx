"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { RecordPoint } from "@/lib/record";

/**
 * The account's balance over time.
 *
 * Ported from the chart the owner chose (shadcn registry, `@spell/chart`).
 * What came across is its geometry: the rounded path builder, the snapped
 * cursor, the tooltip that rides the active point, and the tick thinning
 * that keeps the x-axis from overlapping itself.
 *
 * What did not come across:
 *
 * - `cn` and `@/lib/utils`. This is not a shadcn project and adding the
 *   utility for one component would be the first half of a second design
 *   system.
 * - `bg-background`, `text-foreground`, `text-muted-foreground` and the
 *   `#0090FD` default. There is no blue on this site. The line is pine and
 *   the fill is sage.
 * - `reveal`, `showFill`, `showDot`, `width`, `tickCount`. Options this page
 *   does not use are options nobody has looked at, and the first person to
 *   turn one on finds out whether it still works.
 *
 * It draws nothing when there is nothing. A chart with sample data on a
 * trading page is a track record to everyone who sees it, whatever the
 * caption says — so the empty case is a stated absence, not a demo curve.
 */

const VIEW_W = 640;
const VIEW_H = 220;
const PAD_TOP = 24;
const PAD_BOTTOM = 12;
/* Carried over from the source: how hard the corners are rounded, in view
   units. Small enough that it smooths the joins without inventing a curve
   between two readings that were taken a day apart. */
const CORNER = 2.5;
const EASE = "200ms cubic-bezier(0.16, 1, 0.3, 1)";

function roundedPath(pts: { x: number; y: number }[]): string {
  const f = (n: number) => n.toFixed(3);
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${f(pts[0].x)} ${f(pts[0].y)}`;

  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const inX = curr.x - prev.x;
    const inY = curr.y - prev.y;
    const inLen = Math.hypot(inX, inY) || 1;
    const outX = next.x - curr.x;
    const outY = next.y - curr.y;
    const outLen = Math.hypot(outX, outY) || 1;
    const r = Math.min(CORNER, inLen / 2, outLen / 2);
    d += ` L${f(curr.x - (inX / inLen) * r)} ${f(curr.y - (inY / inLen) * r)}`;
    d += ` Q${f(curr.x)} ${f(curr.y)} ${f(curr.x + (outX / outLen) * r)} ${f(
      curr.y + (outY / outLen) * r,
    )}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${f(last.x)} ${f(last.y)}`;
}

export function RecordChart({
  points,
  name,
  empty,
  formatValue = (v) => new Intl.NumberFormat("en-MY").format(v),
}: {
  points: RecordPoint[];
  /** The series name, beside the swatch in the tooltip. */
  name: string;
  /** What stands in the frame while the feed is unwired. */
  empty: ReactNode;
  formatValue?: (value: number) => string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(Math.max(0, points.length - 1));
  const [boxWidth, setBoxWidth] = useState(VIEW_W);
  const ids = useId();

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setBoxWidth(w);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const plotted = useMemo(() => {
    const n = points.length;
    if (n === 0) return [];
    const values = points.map((p) => p.value);
    const low = Math.min(...values);
    const span = Math.max(...values) - low || 1;
    const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
    return points.map((point, i) => ({
      ...point,
      index: i,
      x: n === 1 ? VIEW_W / 2 : (i / (n - 1)) * VIEW_W,
      y: PAD_TOP + (1 - (point.value - low) / span) * innerH,
    }));
  }, [points]);

  const { stroke, fill } = useMemo(() => {
    if (plotted.length === 0) return { stroke: "", fill: "" };
    const line = roundedPath(plotted);
    const base = VIEW_H - PAD_BOTTOM;
    const first = plotted[0];
    const last = plotted[plotted.length - 1];
    return {
      stroke: line,
      fill: `${line} L${last.x.toFixed(3)} ${base} L${first.x.toFixed(3)} ${base} Z`,
    };
  }, [plotted]);

  /* Thinned to what fits: a label is about 80px wide, and ticks that overlap
     are worse than ticks that are missing. */
  const ticks = useMemo(() => {
    const n = plotted.length;
    if (n === 0) return [];
    const count = Math.min(6, Math.max(2, Math.floor(boxWidth / 80)), n);
    if (count <= 1) return [0];
    return Array.from({ length: count }, (_, i) =>
      Math.round((i * (n - 1)) / (count - 1)),
    );
  }, [plotted.length, boxWidth]);

  if (plotted.length === 0) {
    return (
      <div className="chart-empty">
        {/* The frame the line will arrive in, with the reason it is not here
            yet written inside it rather than under it. */}
        <span aria-hidden className="chart-baseline" />
        <p className="relative text-sm leading-relaxed text-pine-soft">
          {empty}
        </p>
      </div>
    );
  }

  const active = plotted[Math.min(at, plotted.length - 1)];
  const xPct = active.x / VIEW_W;
  const cursorX = xPct * boxWidth;
  const cursorY = (active.y / VIEW_H) * ((boxWidth * VIEW_H) / VIEW_W);
  const leftward = xPct > 0.5;

  function onMove(event: MouseEvent<HTMLDivElement>) {
    const node = root.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const t = (event.clientX - box.left) / box.width;
    const i = Math.round(t * (plotted.length - 1));
    setAt(Math.max(0, Math.min(plotted.length - 1, i)));
  }

  return (
    <div className="chart">
      <div
        ref={root}
        onMouseMove={onMove}
        className="relative aspect-[640/220] w-full touch-none select-none"
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          height="100%"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          /* Decorative: every reading is in the table below it. */
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${ids}-fill`}
              x1="0"
              y1={PAD_TOP}
              x2="0"
              y2={VIEW_H}
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="var(--color-sage)" />
              <stop offset="1" stopColor="var(--color-sage)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={fill} fill={`url(#${ids}-fill)`} />
          <path
            d={stroke}
            stroke="var(--color-pine)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span
          aria-hidden
          className="chart-cursor"
          style={{
            transform: `translate3d(${cursorX - 1}px, 0, 0)`,
            transition: `transform ${EASE}`,
          }}
        />
        <span
          aria-hidden
          className="chart-dot"
          style={{
            transform: `translate3d(${cursorX - 6}px, ${cursorY - 6}px, 0)`,
            transition: `transform ${EASE}`,
          }}
        />
        <div
          aria-hidden
          className="chart-tip"
          style={
            {
              transform: leftward
                ? `translate3d(calc(${cursorX}px - 100% - 12px), calc(${cursorY}px - 50%), 0)`
                : `translate3d(${cursorX + 12}px, calc(${cursorY}px - 50%), 0)`,
              transition: `transform ${EASE}`,
            } as CSSProperties
          }
        >
          <p className="font-semibold text-pine">{active.label}</p>
          <p className="mt-1 flex items-center justify-between gap-4 text-pine-soft">
            <span>{name}</span>
            <span className="tnum font-semibold text-pine">
              {formatValue(active.value)}
            </span>
          </p>
        </div>
      </div>

      <div aria-hidden className="chart-axis">
        {ticks.map((i) => (
          <span
            key={plotted[i].label}
            style={{ left: `${(plotted[i].x / VIEW_W) * 100}%` }}
          >
            {plotted[i].label}
          </span>
        ))}
      </div>

      {/* The readings themselves. A chart is a picture of numbers and a
          picture is not readable by everyone; this is the same series as a
          table, which is also what find-in-page searches. */}
      <details className="chart-table">
        <summary>The readings</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">{name}</th>
            </tr>
          </thead>
          <tbody>
            {plotted.map((point) => (
              <tr key={point.label}>
                <th scope="row">{point.label}</th>
                <td className="tnum">{formatValue(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
