import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ago } from "@/components/hq/story-badges";
import { BreakingBanner, StoryCard } from "@/components/hq/story-card";
import { CotOverviewBlock } from "@/components/hq/cot-blocks";
import { ComingUp } from "@/components/hq/macro-blocks";
import { PageHead, SectionHead } from "@/components/hq/page-head";
import { TrendIcon } from "@/components/hq/trend-icon";
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
    const [stats, breakdown, top, cot] = await Promise.all([
      readStats(day),
      readBreakdown(day),
      readFeed({ since: day, minImpact: "medium", limit: 12 }),
      readCotLatest(new Date(now)).catch((error) => {
        console.error("hq overview: could not read COT", error);
        return [];
      }),
    ]);
    return {
      ok: true as const,
      now,
      stats,
      breakdown,
      top: top.filter((t) => t.category).slice(0, 6),
      cot,
      next: nextRelease(new Date(now)),
    };
  } catch (error) {
    console.error("hq overview: could not read", error);
    return { ok: false as const, reason: error instanceof Error ? error.message : String(error) };
  }
}

/** The day's lean of gold stories, as an arrow; "Mixed" when neither side leads. */
function biasLabel(up: number, down: number): { value: ReactNode; note: string } {
  const total = up + down;
  if (total === 0) return { value: "Flat", note: "No directional stories yet" };
  const lean = (up - down) / total;
  const note = `${up} stories up, ${down} down`;
  if (lean > -0.2 && lean < 0.2) return { value: "Mixed", note };
  const trend = lean > 0 ? "up" : "down";
  return {
    value: (
      <span className="inline-flex items-center gap-1.5">
        <TrendIcon trend={trend} className="size-8" label={`gold ${trend}`} />
        <span aria-hidden>Gold</span>
      </span>
    ),
    note,
  };
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

  const { stats, breakdown, top, now, cot, next } = data;
  const bias = biasLabel(breakdown.direction.bullish, breakdown.direction.bearish);
  const metrics = [
    { label: "Headlines seen", value: String(stats.seen), note: "All sources, 24h" },
    { label: "Relevant to gold", value: String(stats.relevant), note: "Kept by the screen" },
    { label: "High impact", value: String(breakdown.impact.high), note: `${breakdown.impact.medium} medium · ${breakdown.impact.low} low` },
    { label: "News bias for gold", value: bias.value, note: bias.note },
  ];

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-8">
      <PageHead
        title="Overview"
        dek={`Mastery Terminal, last 24 hours. Last run ${stats.lastFetched ? ago(stats.lastFetched, now) : "never"}.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="gap-2 border-border py-5 shadow-none">
            <CardHeader className="px-5">
              <CardDescription>{m.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">{m.value}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 text-xs text-muted-foreground">{m.note}</CardContent>
          </Card>
        ))}
      </div>

      <BreakingBanner items={top} base={base} now={now} />

      <section className="flex flex-col gap-3">
        <SectionHead title="Coming up" href={`${base}/macro`} linkLabel="Macro data" />
        <ComingUp events={upcoming(new Date(now), 14).slice(0, 3)} base={base} />
      </section>

      <CotOverviewBlock views={cot} next={next} base={base} />

      <section className="flex flex-col gap-3">
        <SectionHead title="Top stories" href={`${base}/terminal`} linkLabel="Open the wire" />
        {top.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              Nothing above low impact in the last 24 hours.
            </CardContent>
          </Card>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((item) => (
              <li key={item.id}>
                <StoryCard item={item} base={base} now={now} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
