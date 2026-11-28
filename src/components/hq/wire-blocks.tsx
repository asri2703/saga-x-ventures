import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { standing } from "@/lib/terminal/breaking";
import type { FeedItem } from "@/lib/terminal/store";
import { cn } from "@/lib/utils";
import type { LatestEntry } from "@/lib/terminal/wire";
import { ago } from "./story-badges";
import { AssetChips, StandingBadge, storyTitle } from "./story-card";

/**
 * The wire's own blocks: the latest list, the developing-issue thread and
 * the quiet tail. Story cards live in story-card.tsx.
 */

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit" });
}

const IMPACT_DOT: Record<FeedItem["impact"], string> = {
  high: "bg-[#c81f30]",
  medium: "bg-[#b9a172]",
  low: "bg-[#cdbf9f]",
};

/**
 * Newest first, one line each: a new story, or an update to one with the
 * outlet that just filed. The time column is Malaysia time.
 */
export function LatestList({ entries, base, now }: { entries: LatestEntry[]; base: string; now: number }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing new in the last 72 hours.</p>;
  }
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {entries.map((e) => (
        <li key={`${e.kind}-${e.item.id}`}>
          <Link
            href={`${base}/terminal/${e.item.id}`}
            className="group grid grid-cols-[3.5rem_1fr] gap-x-3 px-4 py-3 hover:bg-muted/40 sm:grid-cols-[4rem_1fr_auto]"
          >
            <span className="flex flex-col pt-0.5 tabular-nums">
              <span className="text-sm font-semibold">{clock(e.at)}</span>
              <span className="text-[11px] text-muted-foreground">{ago(e.at, now)}</span>
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              {e.kind === "update" ? (
                <span className="text-xs font-medium text-[#8a6d2f]">Update on a developing story · {e.update.outlet}</span>
              ) : null}
              <span className="flex items-start gap-2">
                <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", IMPACT_DOT[e.item.impact])} aria-hidden />
                <span className="line-clamp-2 font-medium leading-snug group-hover:underline">
                  {e.kind === "update" ? e.update.headline : storyTitle(e.item)}
                </span>
              </span>
              {e.kind === "update" ? (
                <span className="truncate text-xs text-muted-foreground">On: {storyTitle(e.item)}</span>
              ) : null}
              <AssetChips item={e.item} className="sm:hidden" />
            </span>
            <span className="hidden flex-col items-end gap-1.5 sm:flex">
              <AssetChips item={e.item} className="justify-end" />
              <span className="text-[11px] text-muted-foreground">{standing(e.item).label}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/**
 * A developing story as a thread: its brief title and standing, then every
 * outlet's report on a time spine, newest at the top. Each report links out
 * to the outlet; the title opens our brief.
 */
export function IssueThread({ item, base, now }: { item: FeedItem; base: string; now: number }) {
  const reports = [...item.sources].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const shown = reports.slice(0, 5);
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <StandingBadge item={item} />
          <span className="text-xs text-muted-foreground">
            {item.sources.length} reports · updated {ago(item.last_update_at, now)}
          </span>
        </div>
        <Link href={`${base}/terminal/${item.id}`} className="text-lg leading-snug font-semibold hover:underline">
          {storyTitle(item)}
        </Link>
        {item.brief?.gold_impact ? <p className="text-sm text-muted-foreground">{item.brief.gold_impact}</p> : null}
        <AssetChips item={item} />
      </header>
      <ol className="relative ml-1.5 flex flex-col gap-3 border-l-2 border-[#163a30]/15 pl-5">
        {shown.map((r, i) => (
          <li key={r.url} className="relative">
            <span
              className={cn(
                "absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-card",
                i === 0 ? "bg-[#163a30]" : "bg-[#cdbf9f]",
              )}
              aria-hidden
            />
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground tabular-nums">
                {clock(r.published_at)} · {r.outlet}
                <ExternalLink className="ml-1 inline size-3 opacity-0 group-hover:opacity-100" aria-hidden />
              </span>
              <span className={cn("text-sm leading-snug group-hover:underline", i === 0 && "font-medium")}>{r.headline}</span>
            </a>
          </li>
        ))}
      </ol>
      {reports.length > shown.length ? (
        <Link href={`${base}/terminal/${item.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
          All {reports.length} reports
        </Link>
      ) : null}
    </article>
  );
}

/** Low-impact background, folded away so it never pushes news down. */
export function QuietList({ items, base, now }: { items: FeedItem[]; base: string; now: number }) {
  if (items.length === 0) return null;
  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium marker:hidden">
        <span className="group-open:hidden">Show {items.length} background stories</span>
        <span className="hidden group-open:inline">Hide background stories</span>
      </summary>
      <ul className="divide-y divide-border border-t border-border">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`${base}/terminal/${item.id}`} className="flex items-baseline gap-3 px-4 py-2.5 text-sm hover:bg-muted/40">
              <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">{clock(item.published_at)}</span>
              <span className="line-clamp-1 flex-1">{storyTitle(item)}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{ago(item.published_at, now)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
