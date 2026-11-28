import type { Category } from "@/lib/terminal/classify";

/**
 * The economic series HQ tracks, each taken straight from the agency that
 * publishes it. US government data is public domain, which is why it is
 * used directly rather than through an aggregator whose terms restrict
 * commercial display (FRED, Trading Economics).
 *
 *  - Federal Reserve Bank of New York: the fed funds target range and the
 *    effective rate (markets.newyorkfed.org).
 *  - US Bureau of Labor Statistics: CPI, jobs, unemployment, earnings
 *    (api.bls.gov).
 *  - US Treasury: daily par and real yield curves (home.treasury.gov).
 *
 * Values are stored as published, or derived in one stated way (year on
 * year, month on month change). Nothing stored here is estimated; the
 * Saga estimates for the next release are worked out in expect.ts and
 * labelled as ours on the page.
 */

export type SeriesDef = {
  slug: string;
  name: string;
  /** What one value means, for the stats table. */
  unit: string;
  /** Suffix shown after a number: "%" or "K". */
  suffix: string;
  decimals: number;
  frequency: "Daily" | "Monthly";
  source: string;
  sourceUrl: string;
  /** One or two sentences on what it is and why gold and FX watch it. */
  about: string;
  /** Wire section whose stories are shown beside it. */
  section: Category;
};

export const SERIES: SeriesDef[] = [
  {
    slug: "fed-funds",
    name: "Fed funds rate (upper target)",
    unit: "percent",
    suffix: "%",
    decimals: 2,
    frequency: "Daily",
    source: "Federal Reserve Bank of New York",
    sourceUrl: "https://www.federalreserve.gov/monetarypolicy/openmarket.htm",
    about:
      "The top of the range the FOMC sets for overnight lending between banks. Higher rates raise the cost of holding gold, which pays no interest, and tend to lift the dollar.",
    section: "fed",
  },
  {
    slug: "effr",
    name: "Effective fed funds rate",
    unit: "percent",
    suffix: "%",
    decimals: 2,
    frequency: "Daily",
    source: "Federal Reserve Bank of New York",
    sourceUrl: "https://www.newyorkfed.org/markets/reference-rates/effr",
    about: "The rate banks actually paid each other overnight, inside the Fed's target range.",
    section: "fed",
  },
  {
    slug: "cpi-yoy",
    name: "CPI inflation (year on year)",
    unit: "percent change from a year earlier",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/cpi/",
    about:
      "Consumer prices against the same month a year before. Hot inflation pushes the Fed toward higher rates; a surprise either way moves gold and the dollar within minutes.",
    section: "us-data",
  },
  {
    slug: "core-cpi-yoy",
    name: "Core CPI (year on year)",
    unit: "percent change from a year earlier",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/cpi/",
    about: "CPI without food and energy, the measure the Fed watches for underlying inflation.",
    section: "us-data",
  },
  {
    slug: "cpi-mom",
    name: "CPI inflation (month on month)",
    unit: "percent change from the month before, seasonally adjusted",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/cpi/",
    about:
      "The monthly change in consumer prices, adjusted for the usual seasonal swings. This is the CPI number headlines and traders react to first; a 0.1 point miss can move gold sharply.",
    section: "us-data",
  },
  {
    slug: "core-cpi-mom",
    name: "Core CPI (month on month)",
    unit: "percent change from the month before, seasonally adjusted",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/cpi/",
    about: "The monthly change in prices without food and energy, the Fed's read on underlying inflation.",
    section: "us-data",
  },
  {
    slug: "unemployment",
    name: "Unemployment rate",
    unit: "percent of the labour force",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/charts/employment-situation/civilian-unemployment-rate.htm",
    about:
      "Share of the labour force out of work and looking. A rising rate points to rate cuts, which tends to support gold.",
    section: "us-data",
  },
  {
    slug: "nfp",
    name: "Nonfarm payrolls (monthly change)",
    unit: "thousands of jobs added",
    suffix: "K",
    decimals: 0,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/charts/employment-situation/employment-levels-by-industry.htm",
    about:
      "Jobs added or lost outside farming in the month. The first Friday's NFP release is one of the largest scheduled moves in gold and the dollar.",
    section: "us-data",
  },
  {
    slug: "earnings-yoy",
    name: "Average hourly earnings (year on year)",
    unit: "percent change from a year earlier",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/ces/",
    about: "Wage growth for private workers. Fast wage growth keeps inflation, and rates, higher.",
    section: "us-data",
  },
  {
    slug: "us2y",
    name: "US 2-year Treasury yield",
    unit: "percent",
    suffix: "%",
    decimals: 2,
    frequency: "Daily",
    source: "U.S. Treasury",
    sourceUrl:
      "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve",
    about: "The bond market's read on where Fed policy goes over the next two years.",
    section: "dollar",
  },
  {
    slug: "us10y",
    name: "US 10-year Treasury yield",
    unit: "percent",
    suffix: "%",
    decimals: 2,
    frequency: "Daily",
    source: "U.S. Treasury",
    sourceUrl:
      "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve",
    about: "The benchmark long-term borrowing cost. Rising yields compete with gold for safe-haven money.",
    section: "dollar",
  },
  {
    slug: "us10y-real",
    name: "US 10-year real yield",
    unit: "percent, after inflation",
    suffix: "%",
    decimals: 2,
    frequency: "Daily",
    source: "U.S. Treasury",
    sourceUrl:
      "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_real_yield_curve",
    about:
      "The 10-year yield after expected inflation. Historically one of gold's strongest drivers: gold tends to rise when real yields fall.",
    section: "dollar",
  },
];

export function seriesBySlug(slug: string): SeriesDef | undefined {
  return SERIES.find((s) => s.slug === slug);
}
