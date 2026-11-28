import { formatDate, formatValue } from "@/lib/macro/format";
import type { SeriesDef } from "@/lib/macro/series";

/**
 * The data an insight is written from, as HQ knows it at that moment, and
 * that data as the plain text the writer reads. Pure: compile.ts fills it.
 * Everything the article may state comes from here and nowhere else.
 */

export type SeriesFacts = {
  def: Pick<SeriesDef, "slug" | "name" | "unit" | "suffix" | "decimals" | "frequency" | "source">;
  /** Oldest first, the last few releases. */
  recent: { date: string; value: number }[];
  estimate: { period: string; value: number; method: string } | null;
  /** A month BLS could not publish (2025 shutdown), if any. */
  gap: string | null;
};

export type InsightContext = {
  topic: { slug: string; name: string };
  asOf: string;
  call: { direction: "up" | "down" | "flat"; notes: string | null };
  series: SeriesFacts[];
  next: { name: string; at: string } | null;
  fed: { lean: string; tone: string } | null;
  news: { date: string; title: string; impact: string; gold: string }[];
  /** How the wire's stories lean, by instrument: "24h: 10 up, 1 down; 1W: ...". */
  lean: { symbol: string; day: { up: number; down: number }; week: { up: number; down: number } }[];
  cot: { symbol: string; name: string; net: number; change: number | null; longShare: number; bias: string; date: string }[];
};

const KL = "Asia/Kuala_Lumpur";

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: KL,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString("en-US")}`;

const CALL = { up: "UP (bullish for gold)", down: "DOWN (bearish for gold)", flat: "SIDEWAYS (no clear direction)" };

/** The context as numbered blocks of plain facts, for the writer's prompt. */
export function contextText(ctx: InsightContext): string {
  const out: string[] = [];
  out.push(`TOPIC: ${ctx.topic.name}`);
  out.push(`AS OF: ${when(ctx.asOf)} Malaysia time`);
  out.push(`ASRI'S CALL ON GOLD: ${CALL[ctx.call.direction]}`);
  out.push(`ASRI'S NOTES: ${ctx.call.notes?.trim() || "(none)"}`);

  out.push("", "LATEST DATA:");
  if (ctx.series.length === 0) out.push("- (no series for this topic)");
  for (const s of ctx.series) {
    const fmt = (v: number) => formatValue(v, s.def);
    const releases = s.recent.map((p) => `${formatDate(p.date, s.def.frequency)} ${fmt(p.value)}`).join("; ");
    out.push(`- ${s.def.name} (${s.def.unit}, ${s.def.source}): ${releases || "no data"}`);
    if (s.estimate) {
      out.push(
        `  Saga estimate for ${formatDate(s.estimate.period, s.def.frequency)}: ${fmt(s.estimate.value)} (${s.estimate.method})`,
      );
    }
    if (s.gap) out.push(`  ${formatDate(s.gap, "Monthly")} was not published (2025 government shutdown).`);
  }

  out.push("", `NEXT RELEASE: ${ctx.next ? `${ctx.next.name}, ${when(ctx.next.at)} Malaysia time` : "(none scheduled for this topic)"}`);

  if (ctx.fed) out.push("", "FED:", `- Bonds: ${ctx.fed.lean}`, `- Tone of Fed news, last 14 days: ${ctx.fed.tone}`);

  out.push("", "NEWS FLOW (stories that point each way, from HQ's wire):");
  for (const l of ctx.lean) {
    out.push(`- ${l.symbol}: last 24h ${l.day.up} up, ${l.day.down} down; last week ${l.week.up} up, ${l.week.down} down`);
  }

  out.push("", "SMART MONEY (CFTC COT, speculators' net futures contracts):");
  if (ctx.cot.length === 0) out.push("- (no COT data)");
  for (const c of ctx.cot) {
    out.push(
      `- ${c.name} (${c.symbol}), week of ${c.date}: net ${signed(c.net)}${c.change === null ? "" : `, ${signed(c.change)} on the week`}, ${Math.round(c.longShare * 100)}% long; funds lean ${c.bias.toLowerCase()} on ${c.symbol}`,
    );
  }

  out.push("", "RECENT STORIES ON THIS TOPIC (newest first):");
  if (ctx.news.length === 0) out.push("- (none in the last 30 days)");
  for (const n of ctx.news) out.push(`- ${n.date}: ${n.title} [${n.impact} impact; gold ${n.gold}]`);

  return out.join("\n");
}
