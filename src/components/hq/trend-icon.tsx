import { cn } from "@/lib/utils";

/**
 * Direction as an arrow instead of a word ("bullish", "bearish"): green up,
 * red down, a dash for no clear lean. The shape carries the meaning on its
 * own (not only the colour), and screen readers hear "up" or "down".
 * The arrow itself is drawn in CSS: see TrendIcon.
 */

export type Trend = "up" | "down" | "flat";

/** From the wire's gold direction or a COT pair bias. */
export function trendOf(value: string | null | undefined): Trend {
  const v = (value ?? "").toLowerCase();
  if (v === "bullish" || v === "up") return "up";
  if (v === "bearish" || v === "down") return "down";
  return "flat";
}

/**
 * A solid arrow with depth that lifts (up) or drops (down) as it pulses.
 * Drawn in CSS (.trend3d in globals.css) so it costs no SVG ids or JS, and
 * sized like any icon: pass size-3.5, size-8 and so on.
 */
export function TrendIcon({ trend, className, label }: { trend: Trend; className?: string; label?: string }) {
  const spoken = label ?? (trend === "flat" ? "no clear direction" : trend);
  return (
    <>
      <span data-trend={trend} className={cn("trend3d size-4", className)} aria-hidden />
      <span className="sr-only">{spoken}</span>
    </>
  );
}

/** A pill with an arrow and what it applies to: "↑ XAUUSD", "↓ Gold". */
export function TrendPill({ trend, subject, className }: { trend: Trend; subject: string; className?: string }) {
  const tint =
    trend === "up" ? "bg-[#cfe0d4]" : trend === "down" ? "bg-[#fbdcdf]" : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tint,
        className,
      )}
    >
      <TrendIcon trend={trend} className="size-3.5" label={`${subject} ${trend === "flat" ? "no clear direction" : trend}`} />
      <span aria-hidden>{subject}</span>
    </span>
  );
}
