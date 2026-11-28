/**
 * Headlines led by the instrument they move, as trading desks write them:
 * "XAUUSD: Gold reclaims $3,600 after plunging to a one-year low". Pure.
 *
 * The symbol is the first instrument the classifier tagged (its own order of
 * importance), or gold for an older story with no tags, since the wire is
 * about gold first. The words after it are ours (the brief's title) or the
 * outlet's headline, unchanged.
 */

type Tagged = { assets?: { symbol: string }[] | null };

export function leadSymbol(item: Tagged): string {
  return item.assets?.[0]?.symbol ?? "XAUUSD";
}

/** "XAUUSD: …", unless the title already starts with that symbol. */
export function symbolTitle(symbol: string, title: string): string {
  const t = title.trim();
  if (t.toUpperCase().startsWith(`${symbol}:`) || t.toUpperCase().startsWith(`${symbol} `)) return t;
  return `${symbol}: ${t}`;
}
