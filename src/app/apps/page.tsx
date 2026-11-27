import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ago } from "@/components/hq/story-badges";
import { StoryCard } from "@/components/hq/story-card";
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
    const [stats, breakdown, top] = await Promise.all([
      readStats(day),
      readBreakdown(day),
      readFeed({ since: day, minImpact: "medium", limit: 12 }),
    ]);
    return { ok: true as const, now, stats, breakdown, top: top.filter((t) => t.category).slice(0, 6) };
  } catch (error) {
    console.error("hq overview: could not read", error);
    return { ok: false as const, reason: error instanceof Error ? error.message : String(error) };
  }
}

function biasLabel(bullish: number, bearish: number): { value: string; note: string } {
  const total = bullish + bearish;
  if (total === 0) return { value: "Flat", note: "No directional stories yet" };
  const lean = (bullish - bearish) / total;
  const value = lean > 0.2 ? "Bullish" : lean < -0.2 ? "Bearish" : "Mixed";
  return { value, note: `${bullish} bullish · ${bearish} bearish` };
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

  const { stats, breakdown, top, now } = data;
  const bias = biasLabel(breakdown.direction.bullish, breakdown.direction.bearish);
  const metrics = [
    { label: "Headlines seen", value: String(stats.seen), note: "All sources, 24h" },
    { label: "Relevant to gold", value: String(stats.relevant), note: "Kept by the screen" },
    { label: "High impact", value: String(breakdown.impact.high), note: `${breakdown.impact.medium} medium · ${breakdown.impact.low} low` },
    { label: "News bias for gold", value: bias.value, note: bias.note },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Mastery Terminal, last 24 hours. Last run{" "}
          {stats.lastFetched ? ago(stats.lastFetched, now) : "never"}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="gap-2 py-5">
            <CardHeader className="px-5">
              <CardDescription>{m.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">{m.value}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 text-xs text-muted-foreground">{m.note}</CardContent>
          </Card>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold">Top stories</h2>
            <p className="text-sm text-muted-foreground">Medium and high impact, newest first</p>
          </div>
          <Link href={`${base}/terminal`} className="text-sm font-medium underline-offset-4 hover:underline">
            Open the wire
          </Link>
        </div>
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
