/**
 * Headlines led by the instrument they are about, as trading desks write
 * them: "XAUUSD: Gold reclaims $3,600 after plunging to a one-year low". Pure.
 *
 * A symbol leads only when the story is plainly about it: the headline names
 * the instrument (gold, the dollar or the Fed, the euro or the ECB, ...), or
 * the story is US data or the Fed, which is about the dollar by nature. Only
 * instruments the classifier tagged count, in its order. A war or politics
 * story the classifier tagged for a safe-haven move keeps its plain headline.
 */

type Tagged = { assets?: { symbol: string }[] | null; category?: string | null };

/** Words that tie a headline to an instrument. */
const NAMES: Record<string, RegExp> = {
  XAUUSD: /\b(gold|bullion|precious metals?|xau)\b/i,
  DXY: /\b(dollar|greenback|dxy|fed|fomc|powell|treasur(y|ies)|payrolls|nfp|cpi|pce|inflation)\b/i,
  // The big euro-area economies count too: their politics moves the euro.
  EURUSD:
    /\b(euro|eurozone|euro area|ecb|lagarde|eu|european union|germany|german|france|french|italy|italian|spain|spanish|netherlands|dutch)\b/i,
  GBPUSD: /\b(pound|sterling|boe|bank of england|uk|britain|british)\b/i,
  USDJPY: /\b(yen|boj|bank of japan|japan|japanese)\b/i,
  USDCHF: /\b(swiss franc|franc|snb|swiss national bank)\b/i,
  AUDUSD: /\b(aussie|australian dollar|rba|reserve bank of australia)\b/i,
  NZDUSD: /\b(kiwi|new zealand dollar|rbnz|reserve bank of new zealand)\b/i,
  USDCAD: /\b(loonie|canadian dollar|boc|bank of canada)\b/i,
};

/** Categories that are about the dollar whatever the headline says. */
const DOLLAR_STORIES = new Set(["fed", "us-data"]);

/** The symbol to lead the headline with, or null when none is plainly its subject. */
export function headlineSymbol(item: Tagged, text: string): string | null {
  const tagged = (item.assets ?? []).map((a) => a.symbol);
  const named = tagged.find((s) => NAMES[s]?.test(text));
  if (named) return named;
  if (DOLLAR_STORIES.has(item.category ?? "") && tagged.length) return tagged[0];
  return null;
}

/** "XAUUSD: …", unless there is no symbol or the title already starts with it. */
export function symbolTitle(symbol: string | null, title: string): string {
  const t = title.trim();
  if (!symbol) return t;
  if (t.toUpperCase().startsWith(`${symbol}:`) || t.toUpperCase().startsWith(`${symbol} `)) return t;
  return `${symbol}: ${t}`;
}
