import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CircleDashed,
  ShieldCheck,
  Zap,
  Building2,
  Globe,
  Vote,
  ChartColumn,
  Coins,
  Container,
  DollarSign,
  Fuel,
  Landmark,
  Newspaper,
  Swords,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isBreaking, standing, wasUpdated } from "@/lib/terminal/breaking";
import { CATEGORIES, type Category } from "@/lib/terminal/classify";
import type { FeedItem } from "@/lib/terminal/store";
import { cn } from "@/lib/utils";
import { ago, CategoryBadge, DirectionBadge, ImpactBadge, myt } from "./story-badges";

/**
 * One card shape for every story, with or without a photo.
 *
 * The cover is always 16:9. A story with an Unsplash photo shows the photo;
 * one without gets its section's tile (tint, icon and name) in the same
 * frame, so a grid of mixed stories still lines up and nothing reads as
 * missing.
 */

const SECTION_LOOK: Record<Category, { icon: LucideIcon; tint: string }> = {
  geopolitics: { icon: Swords, tint: "bg-[#e9d9c8]" },
  fed: { icon: Landmark, tint: "bg-[#d7e3dc]" },
  "us-data": { icon: ChartColumn, tint: "bg-[#dfe4ea]" },
  trade: { icon: Container, tint: "bg-[#efe1c4]" },
  energy: { icon: Fuel, tint: "bg-[#ecd8cf]" },
  dollar: { icon: DollarSign, tint: "bg-[#d9e6d2]" },
  "gold-demand": { icon: Coins, tint: "bg-[#f0dcae]" },
  "market-stress": { icon: TrendingDown, tint: "bg-[#f3d6d9]" },
  politics: { icon: Vote, tint: "bg-[#e4dcef]" },
  "central-banks": { icon: Building2, tint: "bg-[#d5e2e6]" },
  "global-data": { icon: Globe, tint: "bg-[#e2e7d3]" },
};

/** Instrument moves as compact chips: "EURUSD ▲". Gold first. */
export function AssetChips({ item, className }: { item: FeedItem; className?: string }) {
  const assets = [...(item.assets ?? [])].sort((a, b) =>
    a.symbol === "XAUUSD" ? -1 : b.symbol === "XAUUSD" ? 1 : 0,
  );
  if (assets.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label="Likely moves">
      {assets.map((a) => (
        <li
          key={a.symbol}
          className={cn(
            "rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium",
            a.direction === "up" && "border-transparent bg-[#cfe0d4]",
            a.direction === "down" && "border-transparent bg-[#fbdcdf]",
            a.direction === "unclear" && "border-border bg-muted text-muted-foreground",
          )}
        >
          {a.symbol} {a.direction === "up" ? "▲" : a.direction === "down" ? "▼" : "•"}
          <span className="sr-only">{a.direction === "unclear" ? " direction unclear" : ` ${a.direction}`}</span>
        </li>
      ))}
    </ul>
  );
}

/** The instruments a story moves; older stories without tags show gold's direction. */
export function Moves({ item }: { item: FeedItem }) {
  return item.assets?.length ? <AssetChips item={item} /> : <DirectionBadge direction={item.direction} />;
}

export function storyTitle(item: FeedItem): string {
  return item.brief?.title ?? item.headline;
}

export function storyLede(item: FeedItem): string | null {
  return item.brief?.what_happened ?? item.summary;
}

export function StoryCover({
  item,
  priority,
  className,
}: {
  item: FeedItem;
  priority?: boolean;
  className?: string;
}) {
  const look = item.category ? SECTION_LOOK[item.category] : null;
  const Icon = look?.icon ?? Newspaper;
  return (
    <div className={cn("relative aspect-[16/9] w-full overflow-hidden rounded-lg", look?.tint ?? "bg-muted", className)}>
      {item.image_url ? (
        <Image
          src={item.image_url}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      ) : null}
      {item.image_url && item.image_credit ? (
        // Plain text here: the card is itself a link. The story page carries
        // the linked credit Unsplash asks for.
        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
          {item.image_credit} / Unsplash
        </span>
      ) : null}
      {item.image_url ? null : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground/70">
          <Icon className="size-8" strokeWidth={1.5} aria-hidden />
          <span className="text-xs font-medium">
            {item.category ? CATEGORIES[item.category] : "Markets"}
          </span>
        </div>
      )}
    </div>
  );
}

function SourcesLine({ item, now }: { item: FeedItem; now: number }) {
  const others = item.sources.length - 1;
  return (
    <p className="text-xs text-muted-foreground">
      {item.outlet || "Unknown outlet"}
      {others > 0 ? ` + ${others} more` : ""} · {ago(item.published_at, now)}
      {wasUpdated(item) ? ` · updated ${ago(item.last_update_at, now)}` : ""}
    </p>
  );
}

/** "Breaking" while a high-impact story is under half an hour old. */
export function BreakingBadge({ item, now }: { item: FeedItem; now: number }) {
  if (!isBreaking(item, now)) return null;
  return (
    <Badge className="rounded-full border-transparent bg-[#c24d5a] text-white">
      <Zap aria-hidden /> Breaking
    </Badge>
  );
}

/** Who stands behind the story: an official publisher, several outlets, or one. */
export function StandingBadge({ item }: { item: FeedItem }) {
  const s = standing(item);
  const Icon = s.kind === "official" ? ShieldCheck : s.kind === "confirmed" ? BadgeCheck : CircleDashed;
  return (
    <Badge
      className={cn(
        "rounded-full",
        s.kind === "official" && "border-transparent bg-[#cfe0d4] text-foreground",
        s.kind === "confirmed" && "border-transparent bg-accent text-foreground",
        s.kind === "single" && "border-border bg-muted text-muted-foreground",
      )}
    >
      <Icon aria-hidden /> {s.label}
    </Badge>
  );
}

/** A strip for the newest breaking story, above the wire and the overview. */
export function BreakingBanner({ items, base, now }: { items: FeedItem[]; base: string; now: number }) {
  const item = items.find((i) => isBreaking(i, now));
  if (!item) return null;
  return (
    <Link
      href={`${base}/terminal/${item.id}`}
      className="group flex items-center gap-3 rounded-xl border border-[#c24d5a]/40 bg-[#fbdcdf] px-4 py-3"
    >
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#c24d5a] px-2.5 py-1 text-xs font-semibold text-white">
        <Zap className="size-3.5" aria-hidden /> Breaking
      </span>
      <span className="line-clamp-2 flex-1 font-medium group-hover:underline">{storyTitle(item)}</span>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
        {standing(item).label} · {ago(item.published_at, now)}
      </span>
    </Link>
  );
}

/** The grid card. The whole card opens the story's page. */
export function StoryCard({ item, base, now }: { item: FeedItem; base: string; now: number }) {
  const lede = storyLede(item);
  return (
    <Link
      href={`${base}/terminal/${item.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <StoryCover item={item} className="rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <BreakingBadge item={item} now={now} />
          <ImpactBadge impact={item.impact} />
          <StandingBadge item={item} />
          <Moves item={item} />
        </div>
        <h3 className="line-clamp-3 font-semibold leading-snug group-hover:underline">{storyTitle(item)}</h3>
        {lede ? <p className="line-clamp-3 text-sm text-muted-foreground">{lede}</p> : null}
        <div className="mt-auto pt-2">
          <SourcesLine item={item} now={now} />
        </div>
      </div>
    </Link>
  );
}

/** The lead story: the same parts, laid out wide. */
export function LeadStory({ item, base, now }: { item: FeedItem; base: string; now: number }) {
  const lede = storyLede(item);
  return (
    <Link
      href={`${base}/terminal/${item.id}`}
      className="group grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-2"
    >
      <StoryCover item={item} priority className="rounded-none md:aspect-auto md:h-full" />
      <div className="flex flex-col gap-3 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <BreakingBadge item={item} now={now} />
          <CategoryBadge category={item.category} />
          <ImpactBadge impact={item.impact} />
          <StandingBadge item={item} />
          <Moves item={item} />
        </div>
        <h2 className="text-xl font-semibold leading-snug tracking-tight group-hover:underline md:text-2xl">
          {storyTitle(item)}
        </h2>
        {lede ? <p className="text-muted-foreground">{lede}</p> : null}
        {item.brief ? (
          <p className="text-sm">
            <span className="font-medium">Market impact: </span>
            <span className="text-muted-foreground">{item.brief.gold_impact}</span>
          </p>
        ) : null}
        <div className="mt-auto flex flex-col gap-0.5 pt-2">
          <SourcesLine item={item} now={now} />
          <p className="text-xs text-muted-foreground">{myt(item.published_at)} MYT</p>
        </div>
      </div>
    </Link>
  );
}
