"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { RecordPoint } from "@/lib/record";

/**
 * The account's balance over time, as a card.
 *
 * The geometry started from the chart the owner chose (shadcn registry,
 * `@spell/chart`): the rounded path builder, the snapped cursor, the tooltip
 * that rides the active point, the tick thinning that keeps the axis from
 * overlapping itself.
 *
 * The rest is this site's. The first pass put that chart on the page as the
 * source draws it — a hairline on bare paper — and it read as a sketch
 * dropped into a finished page. Four things fixed that:
 *
 * - A frame. Everything else on this site that holds content is a card with
 *   a radius, a rule and a lift. A chart floating on the paper is the only
 *   element that isn't.
 * - A figure. The latest reading, set large, above the line. A chart is a
 *   shape; a reader wants the number, and reads the shape second.
 * - Gridlines with their values. Without them a line has no scale and the
 *   eye cannot tell a 2% move from a 40% one — which is exactly the
 *   ambiguity a trading chart must not have.
 * - Weight. A 2.2px line across 640 units is a thread. The line is the
 *   subject of the card and is drawn like it.
 *
 * What it does NOT do is dress up an absence. With no readings it draws the
 * frame at the size the chart will occupy and says why it is empty.
 */

const VIEW_W = 640;
const VIEW_H = 240;
const PAD_TOP = 18;
const PAD_BOTTOM = 18;
/* How hard the corners are rounded, in view units. Small: enough to soften
   a join, not enough to invent a curve between two readings taken days
   apart. */
const CORNER = 2.5;
const EASE = "200ms cubic-bezier(0.16, 1, 0.3, 1)";
/* Three lines: the low, the middle and the high. A fourth adds ink and no
   information at this height. */
const GRID = [0, 0.5, 1];

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
  unit,
  divisor = 1,
  secondaryUnit,
  note,
  empty,
}: {
  points: RecordPoint[];
  /** The series name, in the card's head and in the tooltip. */
  name: string;
  /** What the headline figure is counted in, set small beside it. */
  unit: string;
  /**
   * How many feed units make one of `unit`. The copy account is a cent
   * account, so the feed counts in hundredths and this is 100.
   *
   * A number rather than a formatter: this is a server component's page
   * talking to a client component, and a function cannot cross that
   * boundary — the first attempt passed one and the route returned 500.
   */
  divisor?: number;
  /**
   * The feed's own unit. When set, every reading is printed a second time
   * in it, small, under the headline figure and under the tooltip's.
   *
   * A cent balance reads a hundred times the money deposited. Showing only
   * the standard figure asks a reader to trust a number their terminal will
   * not show them; showing only the cent figure asks them to do the
   * arithmetic. The card does both, in that order.
   */
  secondaryUnit?: string;
  /** A standing caveat, shown inside the frame so a screenshot carries it. */
  note?: ReactNode;
  /** What stands in the frame while the feed is unwired. */
  empty: ReactNode;
}) {
  /* Two decimals at most on the headline: a cent balance divides into
     dollars evenly only by luck, and three decimals read as an error. The
     second line is the feed's own integer and takes none. */
  const formatValue = (value: number) =>
    new Intl.NumberFormat("en-MY", { maximumFractionDigits: 2 }).format(
      value / divisor,
    );
  /* The gridlines sit at a padded tenth above and below the range, so their
     values are arbitrary to begin with. Rounded to whole units: three
     labels reading 561.6 / 528 / 494.4 spend their width on precision the
     scale does not have. */
  const formatAxis = (value: number) =>
    new Intl.NumberFormat("en-MY").format(Math.round(value / divisor));
  const formatSecondary = (value: number) =>
    `${new Intl.NumberFormat("en-MY").format(value)} ${secondaryUnit}`;

  const plot = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(Math.max(0, points.length - 1));
  const [boxWidth, setBoxWidth] = useState(VIEW_W);
  const ids = useId();

  useEffect(() => {
    const node = plot.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setBoxWidth(w);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((p) => p.value);
    const low = Math.min(...values);
    const high = Math.max(...values);
    /* A tenth of the range above and below, so the high and the low are not
       drawn flat against the frame's edges. */
    const pad = (high - low || 1) * 0.1;
    return { low: low - pad, high: high + pad };
  }, [points]);

  const plotted = useMemo(() => {
    if (!scale) return [];
    const n = points.length;
    const span = scale.high - scale.low || 1;
    const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
    return points.map((point, i) => ({
      ...point,
      index: i,
      x: n === 1 ? VIEW_W / 2 : (i / (n - 1)) * VIEW_W,
      y: PAD_TOP + (1 - (point.value - scale.low) / span) * innerH,
    }));
  }, [points, scale]);

  const { stroke, fill } = useMemo(() => {
    if (plotted.length === 0) return { stroke: "", fill: "" };
    const line = roundedPath(plotted);
    const base = VIEW_H;
    const first = plotted[0];
    const last = plotted[plotted.length - 1];
    return {
      stroke: line,
      fill: `${line} L${last.x.toFixed(3)} ${base} L${first.x.toFixed(3)} ${base} Z`,
    };
  }, [plotted]);

  /* Thinned to what fits: a date label is about 72px wide, and ticks that
     overlap are worse than ticks that are missing. */
  const ticks = useMemo(() => {
    const n = plotted.length;
    if (n === 0) return [];
    const count = Math.min(5, Math.max(2, Math.floor(boxWidth / 72)), n);
    if (count <= 1) return [0];
    return Array.from({ length: count }, (_, i) =>
      Math.round((i * (n - 1)) / (count - 1)),
    );
  }, [plotted.length, boxWidth]);

  if (plotted.length === 0 || !scale) {
    return (
      <figure className="record">
        <div className="record-empty">
          <span aria-hidden className="record-empty-rule" />
          <p className="relative max-w-sm text-sm leading-relaxed text-pine-soft">
            {empty}
          </p>
        </div>
      </figure>
    );
  }

  const active = plotted[Math.min(at, plotted.length - 1)];
  const latest = plotted[plotted.length - 1];
  const xPct = active.x / VIEW_W;
  const cursorX = xPct * boxWidth;
  const cursorY = (active.y / VIEW_H) * ((boxWidth * VIEW_H) / VIEW_W);
  const leftward = xPct > 0.55;

  function onMove(event: MouseEvent<HTMLDivElement>) {
    const node = plot.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const t = (event.clientX - box.left) / box.width;
    const i = Math.round(t * (plotted.length - 1));
    setAt(Math.max(0, Math.min(plotted.length - 1, i)));
  }

  return (
    <figure className="record">
      <div className="record-head">
        <div>
          <p className="text-sm text-pine-soft">{name}</p>
          <p className="display mt-1 flex items-baseline gap-2 text-3xl text-pine">
            <span className="tnum">{formatValue(latest.value)}</span>
            <span className="text-base font-normal text-pine-faint">
              {unit}
            </span>
          </p>
          {secondaryUnit ? (
            <p className="record-sub tnum">{formatSecondary(latest.value)}</p>
          ) : null}
        </div>
        <p className="text-sm text-pine-faint">
          {plotted[0].label} &ndash; {latest.label}
        </p>
      </div>

      <div
        ref={plot}
        onMouseMove={onMove}
        onMouseLeave={() => setAt(plotted.length - 1)}
        className="record-plot"
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          height="100%"
          fill="none"
          preserveAspectRatio="none"
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
              <stop stopColor="var(--color-sage)" stopOpacity="0.9" />
              <stop offset="1" stopColor="var(--color-sage)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {GRID.map((g) => (
            <line
              key={g}
              x1="0"
              x2={VIEW_W}
              y1={PAD_TOP + (1 - g) * (VIEW_H - PAD_TOP - PAD_BOTTOM)}
              y2={PAD_TOP + (1 - g) * (VIEW_H - PAD_TOP - PAD_BOTTOM)}
              stroke="var(--color-rule)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={fill} fill={`url(#${ids}-fill)`} />
          <path
            d={stroke}
            /* Named so the dark band can light it; see globals.css. */
            className="record-line"
            stroke="var(--color-pine)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* The scale. Written over the gridlines rather than in a gutter:
            a chart this wide does not need a column of its own for three
            numbers, and the gutter would be the widest thing in the card. */}
        <div aria-hidden className="record-scale">
          {GRID.map((g) => (
            <span
              key={g}
              style={{
                top: `${((PAD_TOP + (1 - g) * (VIEW_H - PAD_TOP - PAD_BOTTOM)) / VIEW_H) * 100}%`,
              }}
            >
              {formatAxis(scale.low + g * (scale.high - scale.low))}
            </span>
          ))}
        </div>

        <span
          aria-hidden
          className="record-cursor"
          style={{ transform: `translate3d(${cursorX - 1}px, 0, 0)` }}
        />
        <span
          aria-hidden
          className="record-dot"
          style={{
            transform: `translate3d(${cursorX - 7}px, ${cursorY - 7}px, 0)`,
          }}
        />
        <div
          aria-hidden
          className="record-tip"
          style={
            {
              transform: leftward
                ? `translate3d(calc(${cursorX}px - 100% - 14px), calc(${cursorY}px - 50%), 0)`
                : `translate3d(${cursorX + 14}px, calc(${cursorY}px - 50%), 0)`,
              transition: `transform ${EASE}`,
            } as CSSProperties
          }
        >
          <p className="font-semibold text-pine">{active.label}</p>
          <p className="mt-0.5 tnum text-pine-soft">
            {formatValue(active.value)} {unit}
          </p>
          {secondaryUnit ? (
            <p className="record-sub tnum">{formatSecondary(active.value)}</p>
          ) : null}
        </div>
      </div>

      <div aria-hidden className="record-axis">
        {ticks.map((i) => (
          <span
            key={plotted[i].label}
            style={{ left: `${(plotted[i].x / VIEW_W) * 100}%` }}
          >
            {plotted[i].label}
          </span>
        ))}
      </div>

      {note ? <p className="record-note">{note}</p> : null}

      {/* The readings themselves. A chart is a picture of numbers, a picture
          is not readable by everyone, and find-in-page cannot search a path. */}
      <details className="record-table">
        <summary>The readings</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">
                {name} ({unit})
              </th>
              {secondaryUnit ? <th scope="col">In the account</th> : null}
            </tr>
          </thead>
          <tbody>
            {plotted.map((point) => (
              <tr key={point.label}>
                <th scope="row">{point.label}</th>
                <td className="tnum">{formatValue(point.value)}</td>
                {secondaryUnit ? (
                  <td className="tnum">{formatSecondary(point.value)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
