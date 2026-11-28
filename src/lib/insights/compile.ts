import { nextEvent } from "@/lib/macro/calendar";
import { estimateFor, rateLean, toneOf, unpublishedYoy, YOY_INDEX } from "@/lib/macro/expect";
import { NEEDS } from "@/lib/macro/needs";
import { relatedStories } from "@/lib/macro/related";
import { seriesBySlug } from "@/lib/macro/series";
import { readSeries, type Obs } from "@/lib/macro/store";
import { readCotLatest } from "@/lib/cot/store";
import { leansByWindow } from "@/lib/terminal/direction";
import { readFeed, type FeedItem } from "@/lib/terminal/store";
import type { InsightContext, SeriesFacts } from "./context";
import type { Direction, Topic } from "./topics";

/**
 * Gathers everything HQ knows about a topic right now: the series and their
 * last releases with Saga's estimates, the next release, the Fed's lean when
 * it matters, the wire's stories and how they lean, and the COT positions.
 */

const DAY = 86_400_000;
const RECENT = 6;
const SYMBOLS = ["XAUUSD", "DXY"] as const;

const goldMove = (s: FeedItem) => s.assets?.find((a) => a.symbol === "XAUUSD")?.direction ?? "not tagged";

export async function compileContext(
  topic: Topic,
  call: { direction: Direction; notes: string | null },
  now = Date.now(),
): Promise<InsightContext> {
  const since = new Date(now - 3 * 365 * DAY).toISOString().slice(0, 10);
  const wanted = [...new Set(topic.series.flatMap((s) => [s, ...(NEEDS[s] ?? []), YOY_INDEX[s]].filter(Boolean)))];

  const [seriesData, month, week, fedNews, cot] = await Promise.all([
    Promise.all(wanted.map(async (s) => [s, await readSeries(s, since).catch(() => [] as Obs[])] as const)),
    readFeed({ since: new Date(now - 30 * DAY), minImpact: "low", limit: 400 }).catch(() => [] as FeedItem[]),
    readFeed({ since: new Date(now - 7 * DAY), minImpact: "medium", limit: 600 }).catch(() => [] as FeedItem[]),
    topic.slug === "fomc"
      ? readFeed({ since: new Date(now - 14 * DAY), minImpact: "medium", limit: 100, category: "fed" }).catch(
          () => [] as FeedItem[],
        )
      : Promise.resolve([] as FeedItem[]),
    readCotLatest(new Date(now)).catch(() => []),
  ]);
  const data: Record<string, Obs[]> = Object.fromEntries(seriesData);

  const series: SeriesFacts[] = [];
  for (const slug of topic.series) {
    const def = seriesBySlug(slug);
    if (!def) continue;
    const all = data[slug] ?? [];
    const estimate = estimateFor(slug, data);
    const index = YOY_INDEX[slug] ? data[YOY_INDEX[slug]] : undefined;
    series.push({
      def,
      recent: all.slice(-RECENT),
      estimate: estimate ? { period: estimate.period, value: estimate.value, method: estimate.method } : null,
      gap: index ? unpublishedYoy(all, index) : null,
    });
  }

  const next = topic.event ? nextEvent(topic.event, new Date(now)) : null;

  let fed: InsightContext["fed"] = null;
  if (topic.slug === "fomc") {
    const upper = data["fed-funds"]?.at(-1)?.value;
    const twoYear = data.us2y?.at(-1)?.value;
    const tone = toneOf(fedNews);
    fed = {
      lean: upper !== undefined && twoYear !== undefined ? rateLean(upper, twoYear).sentence : "not enough data",
      tone: `${tone.label} (${tone.hawkish} hawkish, ${tone.dovish} dovish stories)`,
    };
  }

  const stories = topic.newsFrom
    ? relatedStories(topic.newsFrom, month, 12)
    : week.filter((s) => s.impact === "high").slice(0, 12);
  const news = stories.map((s) => ({
    date: s.published_at.slice(0, 10),
    title: s.brief?.title ?? s.headline,
    impact: s.impact,
    gold: goldMove(s),
  }));

  const leans = leansByWindow(week, SYMBOLS, now);
  const lean = SYMBOLS.map((symbol) => ({ symbol, day: leans[symbol]["1d"], week: leans[symbol]["1w"] }));

  const cotRows = cot
    .filter((v) => (SYMBOLS as readonly string[]).includes(v.market.symbol))
    .map((v) => ({
      symbol: v.market.symbol,
      name: v.market.name,
      net: v.net,
      change: v.change,
      longShare: v.longShare,
      bias: v.pairBias,
      date: v.date,
    }));

  return {
    topic: { slug: topic.slug, name: topic.name },
    asOf: new Date(now).toISOString(),
    call: { direction: call.direction, notes: call.notes },
    series,
    next: next ? { name: next.name, at: next.at.toISOString() } : null,
    fed,
    news,
    lean,
    cot: cotRows,
  };
}
