import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { FeedItem } from "@/lib/terminal/store";
import { leadSymbol, symbolTitle } from "@/lib/terminal/headline";
import { cn } from "@/lib/utils";
import { InstrumentIcon } from "./instrument-icon";
import { ago } from "./story-badges";
import { storyTitle } from "./story-card";

/**
 * The wire's headline list: no pictures, three columns on a wide screen,
 * each story as its instrument's mark, when and who, then the headline led
 * by its symbol. Dense and quick to scan, used wherever stories are listed.
 */

export function HeadlineItem({ item, base, now }: { item: FeedItem; base: string; now: number }) {
  const symbol = leadSymbol(item);
  return (
    <Link href={`${base}/terminal/${item.id}`} className="group flex min-w-0 flex-col gap-1.5 py-1">
      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <InstrumentIcon symbol={symbol} />
        {item.impact === "high" ? (
          <span className="size-1.5 shrink-0 rounded-full bg-[#c81f30]" aria-label="High impact" />
        ) : null}
        <span className="truncate">
          {ago(item.last_update_at, now)} · {item.outlet}
        </span>
      </span>
      <span className="line-clamp-3 text-[15px] leading-snug font-medium text-foreground group-hover:underline">
        {symbolTitle(symbol, storyTitle(item))}
      </span>
    </Link>
  );
}

export function HeadlineGrid({
  items,
  base,
  now,
  className,
}: {
  items: FeedItem[];
  base: string;
  now: number;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ol className={cn("grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <HeadlineItem item={item} base={base} now={now} />
        </li>
      ))}
    </ol>
  );
}

/** "Keep reading ›", under a headline grid. */
export function KeepReading({ href, label = "Keep reading" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-0.5 text-sm font-semibold text-[#2f6fd6] hover:underline"
    >
      {label} <ChevronRight className="size-4" aria-hidden />
    </Link>
  );
}
