import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { readFeed, readStats, type FeedItem } from "@/lib/terminal/store";

/**
 * Mastery Terminal, as stored: the preview of what Mastery's members will see.
 *
 * Served at apps.sagaxventures.com/terminal (see the host rewrite in
 * next.config.ts) and at /apps/terminal on the main domain. It reads Saga X's
 * Supabase directly on the server, so no key reaches the browser.
 *
 * This is the data view the design is built up from, one piece at a time.
 * It is not linked from the site and asks not to be indexed.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mastery Terminal",
  robots: { index: false, follow: false },
};

const MIN_OPTIONS = ["low", "medium", "high"] as const;
type Min = (typeof MIN_OPTIONS)[number];

const IMPACT_STYLE: Record<FeedItem["impact"], string> = {
  high: "bg-pine text-paper",
  medium: "bg-sand text-pine",
  low: "bg-paper-sunk text-pine-soft",
};

const DIRECTION_STYLE: Record<FeedItem["direction"], { label: string; className: string }> = {
  bullish: { label: "Bullish gold", className: "bg-sage text-pine" },
  bearish: { label: "Bearish gold", className: "bg-blush text-pine" },
  neutral: { label: "Neutral", className: "bg-paper-sunk text-pine-soft" },
};

function myt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ago(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

type Loaded =
  | { ok: true; items: FeedItem[]; stats: Awaited<ReturnType<typeof readStats>> }
  | { ok: false; reason: string };

async function load(min: Min): Promise<Loaded> {
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
  try {
    const [items, stats] = await Promise.all([
      readFeed({ since, minImpact: min, limit: 100 }),
      readStats(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ]);
    return { ok: true, items, stats };
  } catch (error) {
    console.error("terminal preview: could not read", error);
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export default async function TerminalPreview(props: PageProps<"/apps/terminal">) {
  const params = await props.searchParams;
  const requested = typeof params.min === "string" ? params.min : "";
  const min: Min = (MIN_OPTIONS as readonly string[]).includes(requested) ? (requested as Min) : "low";
  const data = await load(min);

  return (
    <Container className="py-12 sm:py-16">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-pine-faint">Mastery Terminal · preview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Gold news wire</h1>
          <p className="mt-2 max-w-xl text-pine-soft">
            Headlines that can move XAUUSD, screened and summarised by Claude. Last 72 hours, newest first.
          </p>
        </div>

        <nav aria-label="Minimum impact" className="flex gap-2">
          {MIN_OPTIONS.map((option) => (
            <a
              key={option}
              href={`?min=${option}`}
              aria-current={option === min ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                option === min ? "bg-pine text-paper" : "bg-paper-raised text-pine ring-1 ring-rule"
              }`}
            >
              {option === "low" ? "All" : option === "medium" ? "Medium +" : "High only"}
            </a>
          ))}
        </nav>
      </header>

      {data.ok ? (
        <>
          <dl className="mt-8 grid grid-cols-3 gap-3">
            <Stat label="Headlines seen, 24h" value={String(data.stats.seen)} />
            <Stat label="Relevant to gold, 24h" value={String(data.stats.relevant)} />
            <Stat
              label="Last run"
              value={data.stats.lastFetched ? ago(data.stats.lastFetched) : "Never"}
            />
          </dl>

          {data.items.length === 0 ? (
            <div className="mt-8 rounded-[var(--radius-panel)] bg-paper-raised p-8 text-pine-soft ring-1 ring-rule">
              Nothing at this level in the last 72 hours. If “Last run” says Never, the wire has not
              been run yet.
            </div>
          ) : (
            <ol className="mt-8 flex flex-col gap-3">
              {data.items.map((item) => (
                <li key={item.id}>
                  <NewsCard item={item} />
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-[var(--radius-panel)] bg-blush p-8 text-pine">
          <p className="font-semibold">Could not read the wire.</p>
          <p className="mt-2 text-sm text-pine-soft">{data.reason}</p>
        </div>
      )}
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-float)] bg-paper-raised p-4 ring-1 ring-rule">
      <dt className="text-xs font-medium text-pine-faint">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function NewsCard({ item }: { item: FeedItem }) {
  const direction = DIRECTION_STYLE[item.direction] ?? DIRECTION_STYLE.neutral;
  return (
    <article className="rounded-[var(--radius-float)] bg-paper-raised p-5 ring-1 ring-rule sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className={`rounded-full px-2.5 py-1 ${IMPACT_STYLE[item.impact]}`}>
          {item.impact === "high" ? "High impact" : item.impact === "medium" ? "Medium impact" : "Low impact"}
        </span>
        <span className={`rounded-full px-2.5 py-1 ${direction.className}`}>{direction.label}</span>
        <span className="font-medium text-pine-faint">
          {item.outlet || "Unknown outlet"} · {myt(item.published_at)} MYT · {ago(item.published_at)}
        </span>
      </div>
      <h2 className="mt-3 text-lg font-semibold leading-snug">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {item.headline}
        </a>
      </h2>
      {item.summary ? <p className="mt-2 text-pine-soft">{item.summary}</p> : null}
    </article>
  );
}
