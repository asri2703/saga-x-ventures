import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/terminal/classify";
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

export function CategoryBadge({ category }: { category: FeedItem["category"] }) {
  if (!category || !(category in CATEGORIES)) return null;
  return (
    <Badge variant="outline" className="rounded-full border-border bg-card text-foreground">
      {CATEGORIES[category]}
    </Badge>
  );
}

/**
 * The story's photo with its credit, as Unsplash's guidelines ask: the
 * photographer's name linking to their profile, and Unsplash linked.
 */
export function StoryPhoto({ item, className }: { item: FeedItem; className?: string }) {
  if (!item.image_url) return null;
  return (
    <figure className={cn("flex flex-col gap-1", className)}>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={item.image_url}
          alt=""
          fill
          sizes="(min-width: 1024px) 320px, 100vw"
          className="object-cover"
        />
      </div>
      {item.image_credit ? (
        <figcaption className="text-[11px] text-muted-foreground">
          Photo:{" "}
          <a href={item.image_link ?? "#"} target="_blank" rel="noopener noreferrer" className="underline">
            {item.image_credit}
          </a>{" "}
          on{" "}
          <a
            href="https://unsplash.com/?utm_source=saga_x_hq&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Unsplash
          </a>
        </figcaption>
      ) : null}
    </figure>
  );
}
