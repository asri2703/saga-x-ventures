import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { groupOf } from "@/lib/terminal/sections";
import type { FeedItem } from "@/lib/terminal/store";
import { headlineSymbol, symbolTitle } from "@/lib/terminal/headline";
import { ago } from "./story-badges";
import { AssetChips, StoryCover, storyLede, storyTitle } from "./story-card";

/**
 * The top of the overview, laid out like a financial news front page: the
 * lead story large with its picture, the newest headlines in a timed rail
 * beside it, and three more stories under the lead. Our own palette, type
 * and words throughout; only the arrangement is the familiar one.
 */

const KL = "Asia/Kuala_Lumpur";
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { timeZone: KL, hour: "2-digit", minute: "2-digit" });

function Kicker({ item, now }: { item: FeedItem; now: number }) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-link">
      {item.impact === "high" ? <span className="size-1.5 rounded-full bg-down" aria-label="High impact" /> : null}
      {groupOf(item.category)?.label ?? "Markets"}
      <span className="font-normal text-muted-foreground">· {ago(item.last_update_at, now)}</span>
    </p>
  );
}

export function FrontPage({
  lead,
  more,
  latest,
  base,
  now,
}: {
  lead: FeedItem;
  more: FeedItem[];
  latest: FeedItem[];
  base: string;
  now: number;
}) {
  const leadTitle = storyTitle(lead);
  const lede = storyLede(lead);
  return (
    <section aria-label="Top story" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
      <div className="flex min-w-0 flex-col gap-6">
        <Link href={`${base}/terminal/${lead.id}`} className="group flex flex-col gap-3">
          <StoryCover item={lead} priority className="rounded-2xl" />
          <Kicker item={lead} now={now} />
          <h2 className="font-news text-3xl leading-[1.12] font-semibold tracking-tight group-hover:underline sm:text-4xl">
            {leadTitle}
          </h2>
          {lede ? <p className="line-clamp-3 max-w-[65ch] text-[15px] leading-relaxed text-muted-foreground">{lede}</p> : null}
          <AssetChips item={lead} limit={5} />
        </Link>

        {more.length ? (
          <ol className="grid gap-5 border-t border-border pt-5 sm:grid-cols-3">
            {more.map((item) => (
              <li key={item.id} className="min-w-0">
                <Link href={`${base}/terminal/${item.id}`} className="group flex flex-col gap-2">
                  <StoryCover item={item} className="rounded-xl" />
                  <Kicker item={item} now={now} />
                  <span className="line-clamp-3 font-news text-lg leading-snug font-semibold group-hover:underline">
                    {storyTitle(item)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <aside aria-labelledby="latest-rail" className="flex min-w-0 flex-col lg:border-l lg:border-border lg:pl-6">
        <h2 id="latest-rail" className="border-b-2 border-foreground pb-2 font-news text-xl font-semibold">
          Latest
        </h2>
        <ol className="divide-y divide-border">
          {latest.map((item) => {
            const title = storyTitle(item);
            const symbol = headlineSymbol(item, `${title} ${item.headline}`);
            return (
              <li key={item.id}>
                <Link href={`${base}/terminal/${item.id}`} className="group grid grid-cols-[3rem_1fr] gap-2 py-3">
                  <span className="pt-0.5 text-xs font-semibold text-muted-foreground tabular-nums">{clock(item.published_at)}</span>
                  <span className="line-clamp-3 text-sm leading-snug font-medium group-hover:underline">
                    {symbolTitle(symbol, title)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <Link
          href={`${base}/terminal`}
          className="mt-1 inline-flex w-fit items-center gap-0.5 text-sm font-semibold text-link hover:underline"
        >
          All of Feeds <ChevronRight className="size-4" aria-hidden />
        </Link>
      </aside>
    </section>
  );
}
