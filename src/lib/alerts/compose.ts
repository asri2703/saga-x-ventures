import { formatDate, formatValue } from "@/lib/macro/format";
import type { SeriesDef } from "@/lib/macro/series";
import type { CotView } from "@/lib/cot/store";

/**
 * The words of each alert, built from data HQ already holds. Pure: no
 * network, no clock, so the wording is tested on its own.
 *
 * `ref` makes an alert unique within its kind; the sender refuses a kind and
 * ref it has sent before, so a job that runs twice alerts once. `path` is the
 * HQ page it opens; Mastery maps kind and ref to its own page.
 */

export const TOPICS = ["news", "cot", "macro"] as const;
export type Topic = (typeof TOPICS)[number];

export type Alert = { kind: Topic | "test"; ref: string; title: string; body: string; path: string };

const DIRECTION: Record<string, string> = { bullish: "Bullish gold", bearish: "Bearish gold" };

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

/** A high-impact story, once its brief is written. */
export function newsAlert(story: { id: string; direction: string }, brief: { title: string; what_happened: string }): Alert {
  const lean = DIRECTION[story.direction];
  return {
    kind: "news",
    ref: story.id,
    title: lean ? `High impact · ${lean}` : "High impact",
    body: clip(`${brief.title}. ${brief.what_happened}`, 180),
    path: `/terminal/${story.id}`,
  };
}

function signed(n: number): string {
  return `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toLocaleString("en-US")}`;
}

/** A new COT report, led by gold, with the majors' leans. */
export function cotAlert(views: CotView[]): Alert | null {
  const gold = views.find((v) => v.market.slug === "gold");
  if (!gold) return null;
  const change = gold.change === null ? "" : ` (${signed(gold.change)} on the week)`;
  const others = views
    .filter((v) => v.market.slug !== "gold" && v.market.slug !== "dxy" && v.date === gold.date)
    .map((v) => `${v.market.symbol} ${v.pairBias.toLowerCase()}`)
    .slice(0, 7)
    .join(", ");
  return {
    kind: "cot",
    ref: gold.date,
    title: `COT out: funds ${gold.net >= 0 ? "net long" : "net short"} gold`,
    body: clip(`Managed money ${signed(gold.net)} contracts${change}.${others ? ` ${others}.` : ""}`, 180),
    path: "/cot",
  };
}

/** A new reading of a monthly series, or a change in the Fed's target. */
export function macroAlert(
  def: Pick<SeriesDef, "slug" | "name" | "suffix" | "decimals" | "frequency">,
  latest: { date: string; value: number },
  previous: { date: string; value: number } | null,
): Alert {
  const prev = previous ? ` (previous ${formatValue(previous.value, def)})` : "";
  return {
    kind: "macro",
    ref: `${def.slug}:${latest.date}`,
    title: `${def.name}: ${formatValue(latest.value, def)}`,
    body: `${formatDate(latest.date, def.frequency)}${prev}. Straight from the source.`,
    path: `/macro/${def.slug}`,
  };
}

/** Series worth a push when a new point lands. Daily yields are not. */
export const ALERT_SERIES = ["fed-funds", "cpi-yoy", "core-cpi-yoy", "unemployment", "nfp", "earnings-yoy"] as const;
