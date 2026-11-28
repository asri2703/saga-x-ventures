import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/terminal/classify";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/terminal/store";
import { TrendPill, trendOf } from "./trend-icon";

/**
 * Impact and direction, drawn the same way on every HQ page.
 *
 * Colour never carries the meaning alone: impact is spelled out, and the
 * gold direction is an arrow whose shape reads in greyscale.
 */

const IMPACT: Record<FeedItem["impact"], { label: string; className: string }> = {
  high: { label: "High impact", className: "border-transparent bg-primary text-primary-foreground" },
  medium: { label: "Medium impact", className: "border-transparent bg-accent text-foreground" },
  low: { label: "Low impact", className: "border-border bg-muted text-muted-foreground" },
};

export function ImpactBadge({ impact }: { impact: FeedItem["impact"] }) {
  const style = IMPACT[impact] ?? IMPACT.low;
  return <Badge className={cn("rounded-full", style.className)}>{style.label}</Badge>;
}

/** Which way the story pushes gold, as an arrow: "↑ Gold". */
export function DirectionBadge({ direction }: { direction: FeedItem["direction"] }) {
  return <TrendPill trend={trendOf(direction)} subject="Gold" />;
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
      <PhotoCredit item={item} className="text-[11px]" />
    </figure>
  );
}

const LIBRARY: Record<string, { name: string; home: string }> = {
  unsplash: { name: "Unsplash", home: "https://unsplash.com/?utm_source=saga_x_hq&utm_medium=referral" },
  pexels: { name: "Pexels", home: "https://www.pexels.com/" },
};

/**
 * The photo's credit as each library asks: the author linked to their page,
 * and the library named. A Wikimedia credit already carries the author, the
 * library and the licence, linked to the file's page.
 */
export function PhotoCredit({ item, className }: { item: FeedItem; className?: string }) {
  if (!item.image_url || !item.image_credit) return null;
  const library = LIBRARY[item.image_source ?? "unsplash"];
  return (
    <figcaption className={cn("text-muted-foreground", className)}>
      Photo:{" "}
      <a href={item.image_link ?? "#"} target="_blank" rel="noopener noreferrer" className="underline">
        {item.image_credit}
      </a>
      {library ? (
        <>
          {" "}
          on{" "}
          <a href={library.home} target="_blank" rel="noopener noreferrer" className="underline">
            {library.name}
          </a>
        </>
      ) : null}
    </figcaption>
  );
}
