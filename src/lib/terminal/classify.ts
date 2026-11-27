import type { Headline } from "./sources";

/**
 * Asks Claude which headlines matter to gold, and how.
 *
 * Headlines go in batches, one request per batch, so a run of fifty stories
 * is two calls rather than fifty. The model answers in JSON; anything it
 * returns that does not parse, or names a headline it was not given, is
 * dropped rather than guessed at.
 *
 * Calls the Messages API with fetch. No SDK: one endpoint does not justify a
 * dependency.
 */

export const DEFAULT_MODEL = "claude-haiku-5-5";
export const BATCH_SIZE = 25;

export type Verdict = {
  relevant: boolean;
  impact: "high" | "medium" | "low" | null;
  direction: "bullish" | "bearish" | "neutral" | null;
  summaryMs: string | null;
};

export const SYSTEM_PROMPT = `You screen news headlines for a gold (XAUUSD) trading service in Malaysia.

For each numbered headline decide:
- relevant: true only if the story can plausibly move the gold price within days. That includes US monetary policy and Fed speakers, US inflation, jobs and growth data, US tariffs and trade measures, the US dollar and Treasury yields, wars, military strikes and ceasefires, sanctions, threats to shipping lanes such as the Strait of Hormuz, oil supply shocks, central bank gold buying, and major financial stress. Celebrity, sport, local crime and company news without a macro angle are not relevant.
- impact: "high" for events traders react to immediately (Fed rate decisions, CPI or NFP surprises, new tariffs, military escalation, a shipping lane closed), "medium" for developments that shift expectations, "low" for background.
- direction for gold: "bullish" when it raises fear, cuts expected US rates or weakens the dollar; "bearish" when it eases tension, raises expected US rates or strengthens the dollar; "neutral" when it is unclear.
- summary_ms: two short sentences in Bahasa Melayu (Malaysia) saying what happened and why it matters for gold. Use only facts in the headline. Do not invent figures. Do not give trading instructions.

For irrelevant headlines set impact, direction and summary_ms to null.

Reply with a JSON array only, one object per headline, in this shape:
[{"i": 1, "relevant": true, "impact": "high", "direction": "bullish", "summary_ms": "..."}]`;

export function buildUserMessage(batch: Headline[]): string {
  return batch
    .map(
      (h, idx) =>
        `${idx + 1}. ${h.headline.replace(/\s+/g, " ")} (${h.outlet || h.source}, ${h.publishedAt.toISOString()})`,
    )
    .join("\n");
}

const IMPACTS = new Set(["high", "medium", "low"]);
const DIRECTIONS = new Set(["bullish", "bearish", "neutral"]);

/**
 * Turns the model's text into one verdict per headline position. A position
 * the model skipped or garbled comes back undefined, and the caller leaves
 * that headline for the next run.
 */
export function parseVerdicts(text: string, count: number): (Verdict | undefined)[] {
  const out: (Verdict | undefined)[] = new Array(count).fill(undefined);
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return out;

  let rows: unknown;
  try {
    rows = JSON.parse(text.slice(start, end + 1));
  } catch {
    return out;
  }
  if (!Array.isArray(rows)) return out;

  for (const row of rows as Record<string, unknown>[]) {
    const i = typeof row?.i === "number" ? row.i - 1 : -1;
    if (!Number.isInteger(i) || i < 0 || i >= count) continue;
    if (row.relevant !== true) {
      out[i] = { relevant: false, impact: null, direction: null, summaryMs: null };
      continue;
    }
    const impact = typeof row.impact === "string" && IMPACTS.has(row.impact) ? row.impact : null;
    const direction =
      typeof row.direction === "string" && DIRECTIONS.has(row.direction) ? row.direction : null;
    const summary =
      typeof row.summary_ms === "string" && row.summary_ms.trim()
        ? row.summary_ms.trim().slice(0, 600)
        : null;
    // A relevant story with no impact or no summary is not something we can
    // show a member. Treat it as skipped so the next run asks again.
    if (!impact || !summary) continue;
    out[i] = {
      relevant: true,
      impact: impact as Verdict["impact"],
      direction: (direction ?? "neutral") as Verdict["direction"],
      summaryMs: summary,
    };
  }
  return out;
}

export async function classifyBatch(
  batch: Headline[],
  apiKey: string,
  model = DEFAULT_MODEL,
): Promise<(Verdict | undefined)[]> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserMessage(batch) }],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!r.ok) {
    // The body names the problem (bad key, spend limit reached, overloaded).
    // It never contains the key, so it is safe to log.
    const detail = (await r.text()).slice(0, 300);
    throw new Error(`Anthropic answered ${r.status}: ${detail}`);
  }

  const body = (await r.json()) as { content?: { type: string; text?: string }[] };
  const text = (body.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("");
  return parseVerdicts(text, batch.length);
}
