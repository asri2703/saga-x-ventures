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
  frequency: "Daily" | "Monthly" | "Quarterly";
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
    name: "CPI inflation (YoY)",
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
    name: "Core CPI (YoY)",
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
    name: "CPI inflation (MoM)",
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
    name: "Core CPI (MoM)",
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
    name: "Average hourly earnings (YoY)",
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
  {
    slug: "gdp",
    name: "GDP growth (QoQ, annualized)",
    unit: "percent change in real GDP from the quarter before, at an annual rate",
    suffix: "%",
    decimals: 1,
    frequency: "Quarterly",
    source: "U.S. Bureau of Economic Analysis",
    sourceUrl: "https://www.bea.gov/data/gdp/gross-domestic-product",
    about:
      "How fast the US economy grew, after inflation. Strong growth keeps the Fed firm and the dollar bid; a slump points to cuts, which tends to help gold.",
    section: "us-data",
  },
  {
    slug: "pce-mom",
    name: "PCE inflation (MoM)",
    unit: "percent change in the PCE price index from the month before, seasonally adjusted",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Economic Analysis",
    sourceUrl: "https://www.bea.gov/data/personal-consumption-expenditures-price-index",
    about:
      "The monthly change in prices of everything households buy, from BEA's Personal Income and Outlays report.",
    section: "us-data",
  },
  {
    slug: "pce-yoy",
    name: "PCE inflation (YoY)",
    unit: "percent change in the PCE price index from a year earlier",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Economic Analysis",
    sourceUrl: "https://www.bea.gov/data/personal-consumption-expenditures-price-index",
    about:
      "Headline PCE inflation. The Fed's 2% target is set in PCE, not CPI, so this is the measure its decisions answer to.",
    section: "us-data",
  },
  {
    slug: "core-pce-mom",
    name: "Core PCE (MoM)",
    unit: "percent change in PCE prices excluding food and energy from the month before",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Economic Analysis",
    sourceUrl: "https://www.bea.gov/data/personal-consumption-expenditures-price-index-excluding-food-and-energy",
    about: "The monthly change in PCE prices without food and energy.",
    section: "us-data",
  },
  {
    slug: "core-pce-yoy",
    name: "Core PCE (YoY)",
    unit: "percent change in PCE prices excluding food and energy from a year earlier",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Economic Analysis",
    sourceUrl: "https://www.bea.gov/data/personal-consumption-expenditures-price-index-excluding-food-and-energy",
    about:
      "The Fed's preferred read on underlying inflation. Core PCE above 2% keeps rates higher for longer, which weighs on gold.",
    section: "us-data",
  },
  {
    slug: "ppi-mom",
    name: "PPI (MoM)",
    unit: "percent change in producer prices for final demand from the month before, seasonally adjusted",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/ppi/",
    about:
      "What US producers charge for their goods and services. It moves before consumer prices, so a hot PPI often hints at a hot CPI or PCE to come.",
    section: "us-data",
  },
  {
    slug: "ppi-yoy",
    name: "PPI (YoY)",
    unit: "percent change in producer prices for final demand from a year earlier",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/ppi/",
    about: "Producer prices against the same month a year before.",
    section: "us-data",
  },
  {
    slug: "core-ppi-mom",
    name: "Core PPI (MoM)",
    unit: "percent change in final demand less foods, energy and trade services, seasonally adjusted",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/ppi/",
    about: "Producer prices without food, energy and the margins of wholesalers and retailers.",
    section: "us-data",
  },
  {
    slug: "core-ppi-yoy",
    name: "Core PPI (YoY)",
    unit: "percent change in final demand less foods, energy and trade services from a year earlier",
    suffix: "%",
    decimals: 1,
    frequency: "Monthly",
    source: "U.S. Bureau of Labor Statistics",
    sourceUrl: "https://www.bls.gov/ppi/",
    about: "Underlying producer price inflation over the past year.",
    section: "us-data",
  },
];

export function seriesBySlug(slug: string): SeriesDef | undefined {
  return SERIES.find((s) => s.slug === slug);
}
