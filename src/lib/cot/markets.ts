/**
 * The futures markets HQ follows in the CFTC's Commitments of Traders.
 *
 * Gold comes from the Disaggregated report (managed money against producers
 * and merchants); the currencies and the dollar index from Traders in
 * Financial Futures (leveraged funds against dealers). Both are the
 * futures-only versions, published on the CFTC's public reporting API.
 *
 * `pairSign` turns a futures position into the pair a Mastery member trades:
 * long yen futures is short USDJPY, so the yen's sign is -1.
 */

export type CotReport = "disaggregated" | "tff";

export type CotMarket = {
  slug: string;
  symbol: string;
  name: string;
  code: string;
  report: CotReport;
  pairSign: 1 | -1;
  specLabel: string;
  hedgeLabel: string;
};

const GOLD = { specLabel: "Managed money", hedgeLabel: "Producers and merchants" } as const;
const FX = { specLabel: "Leveraged funds", hedgeLabel: "Dealers" } as const;

export const COT_MARKETS: CotMarket[] = [
  { slug: "gold", symbol: "XAUUSD", name: "Gold (COMEX)", code: "088691", report: "disaggregated", pairSign: 1, ...GOLD },
  { slug: "dxy", symbol: "DXY", name: "US dollar index (ICE)", code: "098662", report: "tff", pairSign: 1, ...FX },
  { slug: "eur", symbol: "EURUSD", name: "Euro (CME)", code: "099741", report: "tff", pairSign: 1, ...FX },
  { slug: "gbp", symbol: "GBPUSD", name: "British pound (CME)", code: "096742", report: "tff", pairSign: 1, ...FX },
  { slug: "jpy", symbol: "USDJPY", name: "Japanese yen (CME)", code: "097741", report: "tff", pairSign: -1, ...FX },
  { slug: "chf", symbol: "USDCHF", name: "Swiss franc (CME)", code: "092741", report: "tff", pairSign: -1, ...FX },
  { slug: "aud", symbol: "AUDUSD", name: "Australian dollar (CME)", code: "232741", report: "tff", pairSign: 1, ...FX },
  { slug: "cad", symbol: "USDCAD", name: "Canadian dollar (CME)", code: "090741", report: "tff", pairSign: -1, ...FX },
  { slug: "nzd", symbol: "NZDUSD", name: "New Zealand dollar (CME)", code: "112741", report: "tff", pairSign: 1, ...FX },
];

export function cotMarket(slug: string): CotMarket | undefined {
  return COT_MARKETS.find((m) => m.slug === slug);
}

export const COT_DATASETS: Record<CotReport, string> = {
  disaggregated: "72hh-3qpy",
  tff: "gpe5-46if",
};

export const COT_SOURCE_URL = "https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm";
