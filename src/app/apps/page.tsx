import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ago } from "@/components/hq/story-badges";
import { BreakingBanner } from "@/components/hq/story-card";
import { HeadlineGrid, KeepReading } from "@/components/hq/headline-grid";
import { CotOverviewBlock } from "@/components/hq/cot-blocks";
import { ComingUp } from "@/components/hq/macro-blocks";
import { SectionHead } from "@/components/hq/page-head";
import { FrontPage } from "@/components/hq/front-page";
import { MarketDirection, type DirectionRow } from "@/components/hq/market-direction";
import { ASSETS } from "@/lib/terminal/classify";
import { leansByWindow, PLAIN_NAME } from "@/lib/terminal/direction";
import { upcoming } from "@/lib/macro/calendar";
import { nextRelease } from "@/lib/cot/schedule";
import { readCotLatest } from "@/lib/cot/store";
import { hqBase } from "@/lib/hq";
import { readBreakdown, readFeed, readStats } from "@/lib/terminal/store";

/**
 * HQ overview: what the wire saw today and where gold's news flow leans.
 *
 * Reads Saga X's Supabase on the server, per request. No key reaches the
 * browser. Numbers are for the last 24 hours unless a card says otherwise.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Overview" };

async function load() {
  const now = Date.now();
  const day = new Date(now - 24 * 60 * 60 * 1000);
  try {
    const week = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const [stats, breakdown, top, cot, recent] = await Promise.all([
      readStats(day),
      readBreakdown(day),
      readFeed({ since: day, minImpact: "medium", limit: 24 }),
      readCotLatest(new Date(now)).catch((error) => {
        console.error("hq overview: could not read COT", error);
        return [];
      }),
      // A week of stories for the direction card's three windows.
      readFeed({ since: week, minImpact: "medium", limit: 600 }),
    ]);
    const leans = leansByWindow(recent, ASSETS, now);
    const direction: DirectionRow[] = ASSETS.map((symbol) => {
      const view = cot.find((v) => v.market.symbol === symbol);
      return {
        symbol,
        name: PLAIN_NAME[symbol] ?? symbol,
        leans: leans[symbol],
        cot: view
          ? { slug: view.market.slug, history: view.history.map((h) => h.value * view.market.pairSign), bias: view.pairBias }
          : null,
      };
    });
    return {
      ok: true as const,
      now,
      stats,
      breakdown,
      top: top.filter((t) => t.category).slice(0, 16),
      recent,
      cot,
      direction,
      next: nextRelease(new Date(now)),
    };
  } catch (error) {
    console.error("hq overview: could not read", error);
    return { ok: false as const, reason: error instanceof Error ? error.message : String(error) };
  }
}

export default async function Overview() {
  const [data, base] = await Promise.all([load(), hqBase()]);

  if (!data.ok) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Could not read the wire</CardTitle>
          <CardDescription>{data.reason}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { stats, breakdown, top, now, cot, next, direction, recent } = data;
  // The lead is the first high-impact story with a picture, else the top one.
  const lead = top.slice(0, 6).find((s) => s.impact === "high" && s.image_url) ?? top[0];
  const others = top.filter((s) => s.id !== lead?.id);
  const more = others.slice(0, 3);
  const rest = others.slice(3);
  const latest = [...recent].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)).slice(0, 9);
  const today = new Date(now)
    .toLocaleDateString("en-GB", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short" })
    .toUpperCase();

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-10">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
        <h1 className="font-news text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-xs text-muted-foreground">
          {today} · {stats.seen} headlines read, {stats.relevant} kept, {breakdown.impact.high} high impact · last run{" "}
          {stats.lastFetched ? ago(stats.lastFetched, now) : "never"}
        </p>
      </header>

      <BreakingBanner items={top} base={base} now={now} />

      {lead ? (
        <FrontPage lead={lead} more={more} latest={latest} base={base} now={now} />
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">Nothing above low impact in the last 24 hours.</CardContent>
        </Card>
      )}

      <MarketDirection rows={direction} base={base} today={today} />

      <section className="flex flex-col gap-3">
        <SectionHead title="Coming up" href={`${base}/macro`} linkLabel="Economy" />
        <ComingUp events={upcoming(new Date(now), 14).slice(0, 3)} base={base} />
      </section>

      <CotOverviewBlock views={cot} next={next} base={base} />

      {rest.length ? (
        <section className="flex flex-col gap-3">
          <SectionHead title="More top stories" href={`${base}/terminal`} linkLabel="Open Feeds" />
          <HeadlineGrid items={rest} base={base} now={now} />
          <KeepReading href={`${base}/terminal`} />
        </section>
      ) : null}
    </div>
  );
}
