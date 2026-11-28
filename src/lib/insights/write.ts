import { contextText, type InsightContext } from "./context";
import type { InsightBody, Language } from "./topics";

/**
 * Writes an insight: Asri gives the topic and his call on gold, Sonnet writes
 * the article around it from HQ's data. The call is his and stays his; the
 * writer explains it and names what could prove it wrong, and may state only
 * numbers that are in the data it was given.
 */

export const INSIGHT_MODEL = "claude-sonnet-5-5";

export const HEADINGS = {
  en: ["What the data says", "What the market expects", "What the news is saying", "Smart money", "Our call", "Risks to the call", "What to watch"],
  ms: ["Apa kata data", "Jangkaan pasaran", "Apa kata berita", "Smart money", "Pandangan kami", "Risiko pandangan ini", "Apa perlu diperhati"],
} as const;

export function insightPrompt(language: Language): string {
  const lang = language === "ms" ? "Bahasa Melayu (Malaysian, natural and clear; keep market terms like NFP, CPI, Fed, yield in English)" : "plain English";
  const headings = HEADINGS[language].map((h, i) => `${i + 1}. "${h}"`).join("\n");
  return `You write market insights for Mastery Signal members, who trade gold (XAUUSD) and the major forex pairs. Write in ${lang}.

You get a block of DATA from HQ (official releases, Saga's own estimates, the next release time, the Fed's lean, the news wire and CFTC positioning) and ASRI'S CALL on gold. Asri is the analyst; the call is his.

Write one article with these sections, in this order and with exactly these headings:
${headings}

Rules:
- Every number, date and fact must come from DATA. Never invent figures, forecasts, consensus numbers, prices, quotes or events. If something is not in DATA, do not mention it.
- "Saga estimate" is our own estimate, not the market consensus; call it that.
- Keep Asri's call exactly as given in "Our call", and explain it with the data. Never change or soften it.
- Where the data points the other way, say so plainly in "Risks to the call". Do not hide it.
- Price levels, entries or targets appear only if Asri's notes give them; repeat them exactly, never add new ones.
- Times are Malaysia time.
- Short paragraphs, two to four sentences each section. No bullet lists, no emojis, no hype.

Reply with JSON only:
{"title": "under 90 characters", "summary": "two sentences: the call and the main reason", "sections": [{"heading": "...", "text": "..."}]}`;
}

export function insightMessage(ctx: InsightContext): string {
  return `DATA:\n${contextText(ctx)}`;
}

export type ParsedInsight = { title: string; body: InsightBody } | null;

/** Reads the model's answer; null when it is not usable as an article. */
export function parseInsightReply(text: string, language: Language): ParsedInsight {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 140) : "";
  const summary = typeof raw.summary === "string" ? raw.summary.trim().slice(0, 600) : "";
  if (!title || !summary || !Array.isArray(raw.sections)) return null;
  const sections = (raw.sections as Record<string, unknown>[])
    .map((s) => ({
      heading: typeof s?.heading === "string" ? s.heading.trim().slice(0, 80) : "",
      text: typeof s?.text === "string" ? s.text.trim().slice(0, 2000) : "",
    }))
    .filter((s) => s.heading && s.text);
  // The call must be there, under its own heading.
  if (!sections.some((s) => s.heading === HEADINGS[language][4])) return null;
  return { title, body: { summary, sections } };
}

export async function writeInsight(
  ctx: InsightContext,
  language: Language,
  apiKey: string,
  model = INSIGHT_MODEL,
): Promise<ParsedInsight> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 3000,
      system: [{ type: "text", text: insightPrompt(language), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: insightMessage(ctx) }],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!r.ok) throw new Error(`Anthropic answered ${r.status}`);
  const body = (await r.json()) as { content?: { type: string; text?: string }[] };
  const text = (body.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("");
  return parseInsightReply(text, language);
}
