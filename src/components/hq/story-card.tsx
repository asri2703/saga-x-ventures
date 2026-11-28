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
import type { Category } from "@/lib/terminal/classify";
import { creditLine } from "@/lib/terminal/images";
import { findPlace } from "@/lib/terminal/places";
import { groupOf } from "@/lib/terminal/sections";
import type { FeedItem } from "@/lib/terminal/store";
import { cn } from "@/lib/utils";
import { ago, CategoryBadge, DirectionBadge, ImpactBadge, myt } from "./story-badges";
import { TrendIcon, trendOf } from "./trend-icon";

/**
 * One card shape for every story, with or without a photo.
 *
 * The cover is always 16:9. A story with a library photo (Unsplash, Pexels
 * or Wikimedia Commons) shows it with its credit. A geopolitics, energy or
 * trade story about a known place gets a map of it. Anything else gets a
 * type card: its section and the market move it caused, so a grid of mixed
 * stories still lines up and nothing reads as missing.
 */

const SECTION_LOOK: Record<Category, { icon: LucideIcon; tint: string }> = {
  geopolitics: { icon: Swords, tint: "bg-[#b4793f]/20" },
  fed: { icon: Landmark, tint: "bg-[#2f7d5b]/20" },
  "us-data": { icon: ChartColumn, tint: "bg-[#4a6a90]/20" },
  trade: { icon: Container, tint: "bg-[#b8862e]/20" },
  energy: { icon: Fuel, tint: "bg-[#b0583a]/20" },
  dollar: { icon: DollarSign, tint: "bg-[#4f8a3c]/20" },
  "gold-demand": { icon: Coins, tint: "bg-[#d4a537]/25" },
  "market-stress": { icon: TrendingDown, tint: "bg-[#c8323b]/20" },
  politics: { icon: Vote, tint: "bg-[#7656b0]/20" },
  "central-banks": { icon: Building2, tint: "bg-[#2d6f86]/20" },
  "global-data": { icon: Globe, tint: "bg-[#6f7f3a]/20" },
};

/** Instrument moves as compact chips, each with its animated arrow. Gold first. */
export function AssetChips({ item, className, limit }: { item: FeedItem; className?: string; limit?: number }) {
  const all = [...(item.assets ?? [])].sort((a, b) =>
    a.symbol === "XAUUSD" ? -1 : b.symbol === "XAUUSD" ? 1 : 0,
  );
  if (all.length === 0) return null;
  const assets = limit ? all.slice(0, limit) : all;
  const hidden = all.length - assets.length;
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label="Likely moves">
      {assets.map((a) => (
        <li
          key={a.symbol}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium",
            a.direction === "up" && "border-transparent bg-up-soft",
            a.direction === "down" && "border-transparent bg-down-soft",
            a.direction === "unclear" && "border-border bg-muted text-muted-foreground",
          )}
        >
          {a.symbol}
          <TrendIcon
            trend={trendOf(a.direction)}
            className="size-3"
            label={a.direction === "unclear" ? "direction unclear" : a.direction}
          />
        </li>
      ))}
      {hidden > 0 ? (
        <li className="px-1 py-0.5 font-mono text-[11px] text-muted-foreground">
          +{hidden}
          <span className="sr-only"> more</span>
        </li>
      ) : null}
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

/**
 * The cover, in order of what we have: a licensed photo; a locator map when
 * the story names a place the gazetteer knows (Hormuz, the Red Sea, Kyiv);
 * otherwise a type card that sets the story's own title on its section's
 * tint, with the pairs it moves.
 */
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
  const group = groupOf(item.category);
  const frame = cn("relative aspect-[16/9] w-full overflow-hidden rounded-lg", className);

  if (item.image_url) {
    return (
      <div className={cn(frame, "bg-muted")}>
        <Image src={item.image_url} alt="" fill priority={priority} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        {item.image_credit ? (
          // Plain text here: the card is itself a link. The story page
          // carries the linked credit each library asks for.
          <span className="absolute right-1.5 bottom-1.5 max-w-[90%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
            {creditLine(item.image_credit, item.image_source)}
          </span>
        ) : null}
      </div>
    );
  }

  const place = findPlace(`${item.headline} ${item.brief?.title ?? ""}`);
  if (place && (item.category === "geopolitics" || item.category === "energy" || item.category === "trade")) {
    return (
      <div className={cn(frame, "bg-muted")}>
        <Image src={`/api/hq/map/${place.slug}`} alt={`Map of ${place.name}`} fill unoptimized priority={priority} className="object-cover" />
      </div>
    );
  }

  // The type card leads with the move, not the headline (the card prints
  // that below): gold first, then the other pairs the story moves.
  const moves = [...(item.assets ?? [])].sort((a, b) => (a.symbol === "XAUUSD" ? -1 : b.symbol === "XAUUSD" ? 1 : 0));
  const lead = moves[0];
  return (
    <div className={cn(frame, look?.tint ?? "bg-muted")} aria-hidden>
      <Icon className="absolute -right-4 -bottom-6 size-40 text-foreground/[0.07]" strokeWidth={1.25} />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70">
          <Icon className="size-3.5" /> {group?.label ?? "Markets"}
        </span>
        {lead ? (
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 font-mono text-3xl font-semibold tracking-tight text-foreground/85 sm:text-4xl">
              {lead.symbol}
              <TrendIcon trend={trendOf(lead.direction)} className="size-7 sm:size-8" />
            </span>
            {moves.length > 1 ? (
              <span className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-foreground/65">
                {moves.slice(1).map((m) => (
                  <span key={m.symbol} className="inline-flex items-center gap-1">
                    {m.symbol}
                    <TrendIcon trend={trendOf(m.direction)} className="size-3" />
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-2xl font-semibold tracking-tight text-foreground/80">{group?.label ?? "Markets"}</span>
        )}
      </div>
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
    <Badge className="rounded-full border-transparent bg-down text-white">
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
        s.kind === "official" && "border-transparent bg-up-soft text-foreground",
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
      className="group flex items-center gap-3 rounded-xl border border-down/40 bg-down-soft px-4 py-3"
    >
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-down px-2.5 py-1 text-xs font-semibold text-white">
        <Zap className="size-3.5" aria-hidden /> Breaking
      </span>
      <span className="line-clamp-2 flex-1 font-news text-[17px] font-semibold group-hover:underline">{storyTitle(item)}</span>
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
        <h3 className="line-clamp-3 font-news text-lg font-semibold leading-snug group-hover:underline">{storyTitle(item)}</h3>
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
        <h2 className="font-news text-2xl font-semibold leading-tight tracking-tight group-hover:underline md:text-3xl">
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
