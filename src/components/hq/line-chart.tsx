import type { Obs } from "@/lib/macro/store";

/**
 * Charts for HQ's economic data, drawn as plain SVG on the server.
 *
 * No chart library: a line, its gridlines and five labels need no runtime,
 * and the page arrives already drawn.
 */

function scale(points: Obs[], width: number, height: number, pad: { t: number; r: number; b: number; l: number }) {
  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  min -= span * 0.08;
  max += span * 0.08;
  const t0 = Date.parse(points[0].date);
  const t1 = Date.parse(points[points.length - 1].date) || t0 + 1;
  const x = (d: string) => pad.l + ((Date.parse(d) - t0) / Math.max(1, t1 - t0)) * (width - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b);
  return { x, y, min, max };
}

function path(points: Obs[], x: (d: string) => number, y: (v: number) => number): string {
  return points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
}

export function Sparkline({ points, className }: { points: Obs[]; className?: string }) {
  if (points.length < 2) return null;
  const { x, y } = scale(points, 160, 40, { t: 3, r: 2, b: 3, l: 2 });
  return (
    <svg viewBox="0 0 160 40" className={className} aria-hidden>
      <path d={path(points, x, y)} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function label(date: string, daily: boolean): string {
  return new Date(date).toLocaleDateString("en-GB", daily ? { day: "numeric", month: "short", year: "2-digit" } : { month: "short", year: "numeric" });
}

export function LineChart({
  points,
  suffix,
  decimals,
  daily,
  title,
}: {
  points: Obs[];
  suffix: string;
  decimals: number;
  daily: boolean;
  title: string;
}) {
  const W = 800;
  const H = 280;
  const pad = { t: 16, r: 16, b: 28, l: 52 };
  if (points.length < 2) {
    return <p className="text-sm text-muted-foreground">Not enough data to draw yet.</p>;
  }
  const { x, y, min, max } = scale(points, W, H, pad);
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const dateTicks = [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]];
  const line = path(points, x, y);
  const area = `${line}L${x(points[points.length - 1].date)},${H - pad.b}L${x(points[0].date)},${H - pad.b}Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
            {t.toFixed(decimals)}
            {suffix}
          </text>
        </g>
      ))}
      <path d={area} className="fill-primary/10" />
      <path d={line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" />
      {dateTicks.map((p, i) => (
        <text
          key={`${p.date}-${i}`}
          x={x(p.date)}
          y={H - 8}
          textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
          className="fill-muted-foreground text-[11px]"
        >
          {label(p.date, daily)}
        </text>
      ))}
    </svg>
  );
}
