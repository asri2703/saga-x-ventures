import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/terminal/store";

/**
 * Impact and direction, drawn the same way on every HQ page.
 *
 * Colour carries the meaning only alongside the word: "High impact" and
 * "Bullish gold" are spelled out, so the badges still read in greyscale.
 */

const IMPACT: Record<FeedItem["impact"], { label: string; className: string }> = {
  high: { label: "High impact", className: "border-transparent bg-primary text-primary-foreground" },
  medium: { label: "Medium impact", className: "border-transparent bg-accent text-foreground" },
  low: { label: "Low impact", className: "border-border bg-muted text-muted-foreground" },
};

const DIRECTION: Record<FeedItem["direction"], { label: string; className: string }> = {
  bullish: { label: "Bullish gold", className: "border-transparent bg-[#cfe0d4] text-foreground" },
  bearish: { label: "Bearish gold", className: "border-transparent bg-[#fbdcdf] text-foreground" },
  neutral: { label: "Neutral", className: "border-border bg-muted text-muted-foreground" },
};

export function ImpactBadge({ impact }: { impact: FeedItem["impact"] }) {
  const style = IMPACT[impact] ?? IMPACT.low;
  return <Badge className={cn("rounded-full", style.className)}>{style.label}</Badge>;
}

export function DirectionBadge({ direction }: { direction: FeedItem["direction"] }) {
  const style = DIRECTION[direction] ?? DIRECTION.neutral;
  return <Badge className={cn("rounded-full", style.className)}>{style.label}</Badge>;
}

export function myt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ago(iso: string, now: number): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
