/**
 * The Mastery Brief: our own write-up of a story, and whether a new headline
 * is a story we already have.
 *
 * One request per story does both. The model sees the new headline (with the
 * outlet's teaser, when the feed gave one) and the stories already on the
 * wire from the last day and a half. If the headline is one of those events,
 * it answers with that story's number and writes nothing; the headline is
 * filed under it as another source. Otherwise it writes the brief.
 *
 * The brief may use only what the headline and teaser say. It explains;
 * it does not report facts it was not given, and it gives no trade calls.
 */

export const BRIEF_MODEL = "claude-sonnet-5-5";

export type Brief = {
  title: string;
  what_happened: string;
  why_it_matters: string;
  gold_impact: string;
  what_to_watch: string;
};

export type BriefInput = {
  headline: string;
  outlet: string;
  publishedAt: string;
  snippet: string | null;
  impact: string;
  direction: string;
};

export type Candidate = { id: string; headline: string };

export const BRIEF_PROMPT = `You write short briefs for gold (XAUUSD) traders on Mastery Signal, in plain English.

You get one NEW headline, sometimes with the outlet's teaser, plus a numbered list of EXISTING stories already published today.

Step 1. If the new headline reports the same event as one of the existing stories (the same strike, the same data release, the same statement, even from a different outlet or angle), answer only:
{"same_as": <that story's number>}

Step 2. Otherwise write a brief and answer:
{"same_as": null, "brief": {
  "title": "a clear headline in your own words, under 90 characters",
  "what_happened": "two or three sentences of fact",
  "why_it_matters": "two or three sentences on why it matters for markets",
  "gold_impact": "two sentences on the likely effect on gold, its direction and how strong",
  "what_to_watch": "one or two sentences on what would confirm or change the picture"
}}

Rules:
- Use only facts in the headline and teaser. Never invent numbers, names, quotes or events.
- Where the headline is thin, say less rather than guess.
- Explain the mechanism (risk, rates, the dollar, oil, safe-haven demand), not a forecast.
- No trading instructions: no buy, sell, entry, stop or target.
- Do not copy the outlet's sentences; write your own.
- Reply with the JSON object only.`;

export function buildBriefMessage(input: BriefInput, candidates: Candidate[]): string {
  const existing = candidates.length
    ? candidates.map((c, i) => `${i + 1}. ${c.headline}`).join("\n")
    : "(none)";
  return [
    "EXISTING STORIES:",
    existing,
    "",
    "NEW HEADLINE:",
    `${input.headline} (${input.outlet}, ${input.publishedAt})`,
    input.snippet ? `Teaser: ${input.snippet}` : "Teaser: (none)",
    `Screen said: ${input.impact} impact, ${input.direction} for gold.`,
  ].join("\n");
}

export type BriefResult =
  | { kind: "duplicate"; parentId: string }
  | { kind: "brief"; brief: Brief }
  | { kind: "unusable" };

const FIELDS = ["title", "what_happened", "why_it_matters", "gold_impact", "what_to_watch"] as const;

/** Reads the model's answer. Anything malformed is "unusable" and retried later. */
export function parseBriefReply(text: string, candidates: Candidate[]): BriefResult {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return { kind: "unusable" };
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return { kind: "unusable" };
  }

  const same = body.same_as;
  if (typeof same === "number" && Number.isInteger(same) && same >= 1 && same <= candidates.length) {
    return { kind: "duplicate", parentId: candidates[same - 1].id };
  }

  const raw = body.brief as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== "object") return { kind: "unusable" };
  const brief = {} as Brief;
  for (const field of FIELDS) {
    const value = raw[field];
    if (typeof value !== "string" || !value.trim()) return { kind: "unusable" };
    brief[field] = value.trim().slice(0, field === "title" ? 120 : 700);
  }
  return { kind: "brief", brief };
}

export async function writeBrief(
  input: BriefInput,
  candidates: Candidate[],
  apiKey: string,
  model = BRIEF_MODEL,
): Promise<BriefResult> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      system: [{ type: "text", text: BRIEF_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildBriefMessage(input, candidates) }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) {
    throw new Error(`Anthropic answered ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
  const body = (await r.json()) as { content?: { type: string; text?: string }[] };
  const text = (body.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("");
  return parseBriefReply(text, candidates);
}
