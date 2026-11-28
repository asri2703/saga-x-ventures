import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { standing } from "@/lib/terminal/breaking";
import { findPlace } from "@/lib/terminal/places";
import { groupOf } from "@/lib/terminal/sections";
import type { FeedItem } from "@/lib/terminal/store";
import { cn } from "@/lib/utils";
import type { LatestEntry } from "@/lib/terminal/wire";
import { ago } from "./story-badges";
import { AssetChips, StandingBadge, StoryCard, storyTitle } from "./story-card";

/**
 * The wire's own blocks: the latest list, the developing-issue thread, the
 * rest of the stories and the quiet tail. Story cards live in story-card.tsx.
 */

const TZ = "Asia/Kuala_Lumpur";

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

function dayKey(t: number): string {
  return new Date(t).toLocaleDateString("en-CA", { timeZone: TZ });
}

/** "08:00" today, "Yesterday 19:51", or "Wed 11:30" further back (Malaysia time). */
export function stamp(iso: string, now: number): string {
  const t = Date.parse(iso);
  const key = dayKey(t);
  if (key === dayKey(now)) return clock(iso);
  if (key === dayKey(now - 24 * 60 * 60 * 1000)) return `Yesterday ${clock(iso)}`;
  const day = new Date(t).toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short" });
  return `${day} ${clock(iso)}`;
}

const IMPACT_DOT: Record<FeedItem["impact"], string> = {
  high: "bg-[#c81f30]",
  medium: "bg-[#b9a172]",
  low: "bg-[#cdbf9f]",
};

function DevelopingTag() {
  return (
    <span className="rounded bg-[#f0dcae] px-1.5 py-px text-[11px] font-semibold text-[#6b4f12]">Developing</span>
  );
}

/**
 * Newest first, one row each: a new story, or an update to one with the
 * outlet that just filed. A row for a story that is also in Developing is
 * tagged so the reader knows its full timeline is just below.
 */
export function LatestList({
  entries,
  base,
  now,
  developing = [],
}: {
  entries: LatestEntry[];
  base: string;
  now: number;
  developing?: readonly string[];
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing new in the last 72 hours.</p>;
  }
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {entries.map((e) => {
        const isUpdate = e.kind === "update";
        return (
          <li key={`${e.kind}-${e.item.id}`}>
            <Link
              href={`${base}/terminal/${e.item.id}`}
              className="group grid grid-cols-[3.25rem_1fr] gap-x-3 px-4 py-3 hover:bg-muted/40 sm:grid-cols-[4rem_1fr_auto]"
            >
              <span className="flex flex-col pt-0.5 tabular-nums">
                <span className="text-sm font-semibold">{clock(e.at)}</span>
                <span className="text-[11px] text-muted-foreground">{ago(e.at, now)}</span>
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  {developing.includes(e.item.id) ? <DevelopingTag /> : null}
                  <span className="truncate">{isUpdate ? `Update · ${e.update.outlet}` : e.item.outlet}</span>
                </span>
                <span className="flex items-start gap-2">
                  <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", IMPACT_DOT[e.item.impact])} aria-hidden />
                  <span className="line-clamp-2 font-medium leading-snug group-hover:underline">
                    {isUpdate ? e.update.headline : storyTitle(e.item)}
                  </span>
                </span>
                {isUpdate ? (
                  <span className="hidden truncate text-xs text-muted-foreground sm:block">On: {storyTitle(e.item)}</span>
                ) : null}
                <AssetChips item={e.item} limit={2} className="sm:hidden" />
              </span>
              <span className="hidden flex-col items-end gap-1.5 sm:flex">
                <AssetChips item={e.item} limit={4} className="justify-end" />
                <span className="text-[11px] text-muted-foreground">{standing(e.item).label}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * A developing story as a thread: its brief title and standing, then the
 * newest outlets' reports on a time spine, newest at the top. Each report
 * links out to the outlet; the title opens our brief.
 */
export function IssueThread({ item, base, now }: { item: FeedItem; base: string; now: number }) {
  const reports = [...item.sources].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const shown = reports.slice(0, 4);
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <StandingBadge item={item} />
          <span className="text-xs text-muted-foreground">updated {ago(item.last_update_at, now)}</span>
        </div>
        <Link href={`${base}/terminal/${item.id}`} className="text-lg leading-snug font-semibold hover:underline">
          {storyTitle(item)}
        </Link>
        {item.brief?.gold_impact ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{item.brief.gold_impact}</p>
        ) : null}
        <AssetChips item={item} limit={4} />
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
                {stamp(r.published_at, now)} · {r.outlet}
                <ExternalLink className="ml-1 inline size-3 opacity-0 group-hover:opacity-100" aria-hidden />
              </span>
              <span className={cn("line-clamp-2 text-sm leading-snug group-hover:underline", i === 0 && "font-medium")}>
                {r.headline}
              </span>
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

const MAPPED = new Set(["geopolitics", "energy", "trade"]);

/** A story as one compact row, for phones: section and age, title, moves, small picture. */
function StoryRow({ item, base, now }: { item: FeedItem; base: string; now: number }) {
  const place =
    !item.image_url && MAPPED.has(item.category ?? "") ? findPlace(`${item.headline} ${item.brief?.title ?? ""}`) : null;
  const thumb = item.image_url ?? (place ? `/api/hq/map/${place.slug}` : null);
  return (
    <Link href={`${base}/terminal/${item.id}`} className="group flex gap-3 px-4 py-3 hover:bg-muted/40">
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-1.5 shrink-0 rounded-full", IMPACT_DOT[item.impact])} aria-hidden />
          <span className="truncate">
            {groupOf(item.category)?.label ?? "Markets"} · {ago(item.last_update_at, now)}
          </span>
        </span>
        <span className="line-clamp-3 font-medium leading-snug group-hover:underline">{storyTitle(item)}</span>
        <AssetChips item={item} limit={2} />
      </span>
      {thumb ? (
        <span className="relative mt-0.5 h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image src={thumb} alt="" fill sizes="96px" unoptimized={!item.image_url} className="object-cover" />
        </span>
      ) : null}
    </Link>
  );
}

/** How many of the remaining stories show before the rest fold away. */
export const MORE_SHOWN = 9;

function StoryGroup({ items, base, now }: { items: FeedItem[]; base: string; now: number }) {
  return (
    <>
      <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <StoryRow item={item} base={base} now={now} />
          </li>
        ))}
      </ol>
      <ol className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <StoryCard item={item} base={base} now={now} />
          </li>
        ))}
      </ol>
    </>
  );
}

/**
 * Everything else worth reading: rows on a phone, cards from tablet up.
 * The first few show; the rest fold away so the page stays short.
 */
export function MoreStories({ items, base, now }: { items: FeedItem[]; base: string; now: number }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MORE_SHOWN);
  const folded = items.slice(MORE_SHOWN);
  return (
    <div className="flex flex-col gap-3">
      <StoryGroup items={shown} base={base} now={now} />
      {folded.length ? (
        <details className="group">
          <summary className="cursor-pointer list-none rounded-xl border border-border bg-card px-4 py-3 text-center text-sm font-medium marker:hidden">
            <span className="group-open:hidden">Show {folded.length} more stories</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <div className="mt-3">
            <StoryGroup items={folded} base={base} now={now} />
          </div>
        </details>
      ) : null}
    </div>
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
