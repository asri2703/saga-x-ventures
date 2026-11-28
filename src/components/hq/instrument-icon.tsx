import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small round marks for the instruments the wire covers: simplified
 * national flags for currencies, a gold disc for XAUUSD, a dollar mark for
 * DXY. Drawn here (flags are public designs; these are simplified, not
 * copied artwork). A pair shows its two currencies overlapping, base first.
 */

const F = 20; // every mark is drawn on a 20×20 square, clipped round by CSS

const MARKS: Record<string, ReactNode> = {
  USD: (
    <>
      <rect width={F} height={F} fill="#fff" />
      {[0, 3, 6, 9, 12, 15, 18].map((y) => (
        <rect key={y} y={y} width={F} height={1.6} fill="#b22234" />
      ))}
      <rect width={10} height={10.6} fill="#3c3b6e" />
    </>
  ),
  EUR: (
    <>
      <rect width={F} height={F} fill="#003399" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={10 + Math.cos(a) * 5.6} cy={10 + Math.sin(a) * 5.6} r={0.9} fill="#ffcc00" />;
      })}
    </>
  ),
  JPY: (
    <>
      <rect width={F} height={F} fill="#fff" />
      <circle cx={10} cy={10} r={5} fill="#bc002d" />
    </>
  ),
  GBP: (
    <>
      <rect width={F} height={F} fill="#012169" />
      <path d="M0 0L20 20M20 0L0 20" stroke="#fff" strokeWidth={4} />
      <path d="M0 0L20 20M20 0L0 20" stroke="#c8102e" strokeWidth={1.4} />
      <path d="M10 0V20M0 10H20" stroke="#fff" strokeWidth={6} />
      <path d="M10 0V20M0 10H20" stroke="#c8102e" strokeWidth={3.4} />
    </>
  ),
  CHF: (
    <>
      <rect width={F} height={F} fill="#d52b1e" />
      <rect x={8} y={4} width={4} height={12} fill="#fff" />
      <rect x={4} y={8} width={12} height={4} fill="#fff" />
    </>
  ),
  AUD: (
    <>
      <rect width={F} height={F} fill="#012169" />
      <path d="M0 0L10 10M10 0L0 10" stroke="#fff" strokeWidth={2} />
      <path d="M5 0V10M0 5H10" stroke="#fff" strokeWidth={3} />
      <path d="M5 0V10M0 5H10" stroke="#e4002b" strokeWidth={1.4} />
      {[
        [5, 15, 1.6],
        [15, 6, 1],
        [12.5, 11, 1],
        [17, 12, 1],
        [15, 16.5, 1],
      ].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" />
      ))}
    </>
  ),
  NZD: (
    <>
      <rect width={F} height={F} fill="#012169" />
      <path d="M0 0L10 10M10 0L0 10" stroke="#fff" strokeWidth={2} />
      <path d="M5 0V10M0 5H10" stroke="#fff" strokeWidth={3} />
      <path d="M5 0V10M0 5H10" stroke="#c8102e" strokeWidth={1.4} />
      {[
        [15, 5],
        [12.5, 10],
        [17, 9.5],
        [15, 15.5],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} fill="#c8102e" stroke="#fff" strokeWidth={0.4} />
      ))}
    </>
  ),
  CAD: (
    <>
      <rect width={F} height={F} fill="#fff" />
      <rect width={5} height={F} fill="#d52b1e" />
      <rect x={15} width={5} height={F} fill="#d52b1e" />
      <path d="M10 5L11.4 8.2L13.6 7.6L12.6 10.6L14 11.4L10.6 13V15.5H9.4V13L6 11.4L7.4 10.6L6.4 7.6L8.6 8.2Z" fill="#d52b1e" />
    </>
  ),
  XAU: (
    <>
      <rect width={F} height={F} fill="#d4a63a" />
      <circle cx={10} cy={10} r={7.2} fill="none" stroke="#f3d27a" strokeWidth={1.2} />
      <text x={10} y={13.2} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#5c4310" fontFamily="system-ui, sans-serif">
        Au
      </text>
    </>
  ),
  DXY: (
    <>
      <rect width={F} height={F} fill="#2f6b4f" />
      <text x={10} y={14.2} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff" fontFamily="system-ui, sans-serif">
        $
      </text>
    </>
  ),
};

function Mark({ code, className }: { code: string; className?: string }) {
  const mark = MARKS[code];
  if (!mark) return null;
  return (
    <span className={cn("inline-block size-4 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10", className)}>
      <svg viewBox={`0 0 ${F} ${F}`} className="block size-full" aria-hidden>
        {mark}
      </svg>
    </span>
  );
}

/** "USDJPY" → ["USD", "JPY"]; "XAUUSD" → ["XAU"]; "DXY" → ["DXY"]. */
export function marksFor(symbol: string): string[] {
  if (symbol === "DXY") return ["DXY"];
  if (symbol.startsWith("XAU")) return ["XAU"];
  if (symbol.length === 6) return [symbol.slice(0, 3), symbol.slice(3)];
  return [];
}

/** The instrument's mark: one disc, or two overlapping for a currency pair. */
export function InstrumentIcon({ symbol, className }: { symbol: string; className?: string }) {
  const codes = marksFor(symbol).filter((c) => MARKS[c]);
  if (codes.length === 0) return null;
  return (
    <span className={cn("inline-flex shrink-0 items-center", className)} aria-hidden>
      {codes.map((c, i) => (
        <Mark key={c} code={c} className={i > 0 ? "-ml-1.5 ring-2 ring-background" : undefined} />
      ))}
    </span>
  );
}
