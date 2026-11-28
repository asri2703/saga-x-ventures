import { describe, expect, it } from "vitest";
import { contextText, type InsightContext } from "../insights/context";
import { HEADINGS, insightPrompt, parseInsightReply } from "../insights/write";
import { TOPICS, topicBySlug } from "../insights/topics";

const CTX: InsightContext = {
  topic: { slug: "nfp", name: "Jobs report (NFP)" },
  asOf: "2026-11-28T11:00:00Z",
  call: { direction: "down", notes: "Sell rallies 3680, risk is a weak print" },
  series: [
    {
      def: { slug: "nfp", name: "Nonfarm payrolls", unit: "Change in jobs, thousands", suffix: "K", decimals: 0, frequency: "Monthly", source: "BLS" },
      recent: [
        { date: "2026-09-01", value: 119 },
        { date: "2026-10-01", value: 64 },
      ],
      estimate: { period: "2026-11-01", value: 88, method: "Average of the last three months" },
      gap: null,
    },
  ],
  next: { name: "Jobs report (NFP)", at: "2026-12-04T13:30:00Z" },
  fed: null,
  news: [{ date: "2026-11-27", title: "Hiring slows at US firms", impact: "medium", gold: "up" }],
  lean: [{ symbol: "XAUUSD", day: { up: 10, down: 1 }, week: { up: 28, down: 4 } }],
  cot: [
    { symbol: "XAUUSD", name: "Gold (COMEX)", net: 102942, change: -9399, longShare: 0.86, bias: "Bullish", date: "2026-11-17" },
  ],
};

describe("contextText", () => {
  const text = contextText(CTX);
  it("states the call and the notes as Asri gave them", () => {
    expect(text).toContain("ASRI'S CALL ON GOLD: DOWN (bearish for gold)");
    expect(text).toContain("Sell rallies 3680, risk is a weak print");
  });
  it("lists releases with units, Saga's estimate and the next release in Malaysia time", () => {
    expect(text).toContain("Nonfarm payrolls (Change in jobs, thousands, BLS): September 2026 119K; October 2026 64K");
    expect(text).toContain("Saga estimate for November 2026: 88K");
    expect(text).toMatch(/NEXT RELEASE: Jobs report \(NFP\), Fri 4 Dec, 21:30 Malaysia time/);
  });
  it("carries news flow, COT and stories", () => {
    expect(text).toContain("XAUUSD: last 24h 10 up, 1 down; last week 28 up, 4 down");
    expect(text).toContain("net +102,942, -9,399 on the week, 86% long");
    expect(text).toContain("2026-11-27: Hiring slows at US firms [medium impact; gold up]");
  });
  it("says so when there are no notes or stories", () => {
    const empty = contextText({ ...CTX, call: { direction: "flat", notes: null }, news: [], cot: [] });
    expect(empty).toContain("ASRI'S NOTES: (none)");
    expect(empty).toContain("(none in the last 30 days)");
    expect(empty).toContain("(no COT data)");
  });
});

describe("insightPrompt", () => {
  it("asks for the language's own headings", () => {
    expect(insightPrompt("en")).toContain('"Our call"');
    expect(insightPrompt("ms")).toContain('"Pandangan kami"');
    expect(insightPrompt("ms")).toContain("Bahasa Melayu");
  });
});

describe("parseInsightReply", () => {
  const sections = HEADINGS.en.map((heading) => ({ heading, text: `Text for ${heading}.` }));
  const good = JSON.stringify({ title: "Gold to ease into NFP", summary: "We see gold lower. Hiring is slowing.", sections });

  it("reads a full article, even with words around the JSON", () => {
    const parsed = parseInsightReply(`Here it is:\n${good}\nDone.`, "en");
    expect(parsed?.title).toBe("Gold to ease into NFP");
    expect(parsed?.body.sections).toHaveLength(7);
  });
  it("refuses an article without the call", () => {
    const noCall = JSON.stringify({ title: "x", summary: "y", sections: sections.filter((s) => s.heading !== "Our call") });
    expect(parseInsightReply(noCall, "en")).toBeNull();
  });
  it("refuses broken or empty answers", () => {
    expect(parseInsightReply("not json", "en")).toBeNull();
    expect(parseInsightReply('{"title": "", "summary": "y", "sections": []}', "en")).toBeNull();
  });
  it("drops empty sections", () => {
    const withBlank = JSON.stringify({ title: "t", summary: "s", sections: [...sections, { heading: "Extra", text: "" }] });
    expect(parseInsightReply(withBlank, "en")?.body.sections).toHaveLength(7);
  });
});

describe("topics", () => {
  it("each topic has a unique slug and can be found", () => {
    expect(new Set(TOPICS.map((t) => t.slug)).size).toBe(TOPICS.length);
    expect(topicBySlug("nfp")?.event).toBe("jobs");
    expect(topicBySlug("nope")).toBeUndefined();
  });
});
