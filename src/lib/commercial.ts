/**
 * Commercial terms.
 *
 * Every figure a client pays, or is asked to deposit, lives here. Nothing is
 * typed into a page: `claims.test.ts` fails the build on a money literal in a
 * page or component, because a figure written into prose goes stale silently
 * and then two pages disagree about the same number.
 *
 * What is deliberately absent: anything about what the business earns in
 * return. No rebate, no commission, no revenue share — not here, not in copy.
 */

/* ------------------------------------------------------------------ *
 * Copytrade
 * ------------------------------------------------------------------ */

export const copytrade = {
  minimumUsd: 500,
} as const;

/**
 * The same minimum, as the broker's own screen states it.
 *
 * The copy account is a cent account: the broker counts it in cents and
 * writes the minimum as 50,000, not 500. Somebody who deposits 500 sees a
 * balance a hundred times larger than the money they put in, and that is the
 * single most alarming thing about the first screen they land on. The page
 * says so — and derives the figure, because two descriptions of one deposit
 * is how they come to disagree.
 */
export function copytradeMinimumCents(): number {
  return copytrade.minimumUsd * CENTS_PER_USD;
}

/** Not a rate anyone sets. A cent account's unit is a hundredth of a dollar. */
export const CENTS_PER_USD = 100;

export function formatCents(cents: number): string {
  return `${new Intl.NumberFormat("en-MY").format(cents)} cent`;
}

/*
 * What used to be here, and why it is gone.
 *
 * Until 25 November 2026 this modelled a weekly profit share — `masterShare`
 * 30, `investorShare` 70, a worked `example` of 500 growing to 600, and
 * `exampleSplit()` to divide it. /copytrade rendered the whole arithmetic.
 *
 * The broker's own join screen says "There are no fees", and the owner
 * confirmed nothing is charged today; the share begins later. A page telling
 * a buyer that 30% of their gain is taken, one click before a screen telling
 * them nothing is, is a false statement about their money — and the buyer is
 * the one who finds out.
 *
 * Deleted rather than left unused, the same way the dated Fukyaa deposit was
 * below: an unused export is still the one somebody imports next. It comes
 * back from the git history when the share starts, along with the page
 * section that read it.
 */

/* ------------------------------------------------------------------ *
 * Fukyaa
 * ------------------------------------------------------------------ */

export const fukyaa = {
  /** Monthly VPS rental on the package that does not include the server. */
  vpsMonthlyMyr: 100,
} as const;

/*
 * What used to be here, and why it is gone.
 *
 * Until 24 November 2026 this file modelled one Fukyaa deposit that fell from
 * 1,000 USD to 500 until the end of the year — `depositStandardUsd`,
 * `depositPromoUsd`, `promoEndsOn`, `fukyaaDeposit()` and `formatPromoEnd()`.
 * The owner replaced that with the packages below: 500 and 1,000 are two
 * standing offers that differ by whether the server is included, and neither
 * expires.
 *
 * The dated model is deleted rather than left unused. Two descriptions of the
 * same money is how /fukyaa came to be quoting a promotion while the homepage
 * sold a package, and an unused one is still the one somebody imports next.
 *
 * It took `revalidate` with it. Those windows existed only so a dated figure
 * could not freeze into static HTML; nothing on this site reads the clock for
 * a price any more. `freshness.test.ts` stays, because the next dated figure
 * will need it.
 */

/* ------------------------------------------------------------------ *
 * Mastery Signal
 * ------------------------------------------------------------------ */

export type MasteryTier = {
  key: "basic" | "pro" | "premium";
  name: string;
  minDepositUsd: number;
  unlocks: string;
};

/** The deposit tiers as masterysignal.com states them. Each runs 30 days. */
export const masteryTiers: MasteryTier[] = [
  {
    key: "basic",
    name: "Basic",
    minDepositUsd: 100,
    unlocks: "Signals and the lot calculator",
  },
  {
    key: "pro",
    name: "Pro",
    minDepositUsd: 300,
    unlocks: "Risk planner, execute trade, flexible stop loss",
  },
  {
    key: "premium",
    name: "Premium",
    minDepositUsd: 500,
    unlocks: "Everything, plus auto-trailing and breakeven",
  },
];

/**
 * What a client pays when they pay for Mastery Signal directly.
 *
 * Three terms, priced per month, so the longer term is the cheaper month.
 * `monthlyMyr` is the rate on that term and `masteryPlanTotalMyr` is what is
 * actually charged for it, because a buyer deciding between these needs both:
 * the month tells them whether they can afford it and the total tells them
 * what leaves their account.
 */
export type MasteryPlan = {
  key: "monthly" | "half-year" | "year";
  /** The term, as a buyer would say it. */
  name: string;
  months: number;
  /** Ringgit per month on this term. */
  monthlyMyr: number;
  /**
   * The one the owner points people at.
   *
   * Twelve months, by his own instruction. It was deliberately unmarked
   * before: picking the longest term on his behalf is a sales decision, not a
   * formatting one, so it waited for him to make it.
   */
  recommended: boolean;
};

export const masteryPlans: MasteryPlan[] = [
  /* Declared shortest to longest, which is the order the arithmetic reads in
     and the order the tests check. Where the recommended one SITS in the row
     is a layout question, answered once in `plan-cards.tsx`. */
  { key: "monthly", name: "1 month", months: 1, monthlyMyr: 99, recommended: false },
  { key: "half-year", name: "6 months", months: 6, monthlyMyr: 82, recommended: false },
  { key: "year", name: "12 months", months: 12, monthlyMyr: 73, recommended: true },
];

/** What the whole term costs. */
export function masteryPlanTotalMyr(plan: MasteryPlan): number {
  return plan.monthlyMyr * plan.months;
}

/**
 * What the term saves against paying month by month.
 *
 * Derived rather than stored. Written down it becomes a second figure that
 * can disagree with the first, and the discount is the whole argument for the
 * longer terms, so it is the figure most worth not getting wrong.
 */
export function masteryPlanSavingMyr(plan: MasteryPlan): number {
  const monthly = masteryPlans.find((p) => p.key === "monthly");
  if (!monthly || plan.months === 1) return 0;
  return (monthly.monthlyMyr - plan.monthlyMyr) * plan.months;
}

/* ------------------------------------------------------------------ *
 * Fukyaa: the three ways in
 * ------------------------------------------------------------------ */

/**
 * Fukyaa's packages, which differ by what the client pays instead of a
 * smaller deposit.
 *
 * All three are a real trading account in the client's own name. What varies
 * is the running cost: a smaller deposit rents the server monthly, a larger
 * one includes it, and the copy route pays nothing up front and settles a
 * share of the gain weekly instead.
 *
 * These deposits are the only ones on the site. Nothing else declares a
 * Fukyaa figure, and `products.test.ts` fails on any that is not one of
 * them.
 */
export type FukyaaPlan = {
  key: "rented-vps" | "included-vps" | "copytrade";
  name: string;
  depositUsd: number;
  /** Monthly server rental, or null when the deposit covers it. */
  vpsMonthlyMyr: number | null;
  /** Share of the gain settled weekly, or null when there is none. */
  weeklyShare: number | null;
  /** Whether the client places nothing themselves. */
  automated: boolean;
  recommended: boolean;
};

export const fukyaaPlans: FukyaaPlan[] = [
  {
    key: "rented-vps",
    name: "Basic",
    depositUsd: 500,
    vpsMonthlyMyr: fukyaa.vpsMonthlyMyr,
    weeklyShare: null,
    automated: true,
    recommended: false,
  },
  {
    key: "included-vps",
    name: "Server Included",
    depositUsd: 1000,
    vpsMonthlyMyr: null,
    weeklyShare: null,
    automated: true,
    recommended: true,
  },
  {
    key: "copytrade",
    name: "Copytrade",
    depositUsd: copytrade.minimumUsd,
    vpsMonthlyMyr: null,
    /* Null, not zero: nothing is charged on the copy today. It was 30 until
       25 November 2026, when the broker's own join screen was found to say
       "There are no fees" and the owner confirmed it. The field stays — the
       share starts later and this is where it goes back. */
    weeklyShare: null,
    automated: false,
    recommended: false,
  },
];

/* ------------------------------------------------------------------ *
 * Money, written out
 * ------------------------------------------------------------------ */

/**
 * Every ringgit figure on the site goes through here.
 *
 * `claims.test.ts` fails the build on a money literal inside a page or a
 * component, so this is also the only way to get one onto a screen.
 */
export function formatMyr(myr: number | null | undefined): string {
  if (myr === null || myr === undefined) return "Price on enquiry";
  return `RM${new Intl.NumberFormat("en-MY").format(myr)}`;
}

/** Dollars, for the deposits. The broker denominates the account in them. */
export function formatUsd(usd: number): string {
  return `${new Intl.NumberFormat("en-MY").format(usd)} USD`;
}

/* ------------------------------------------------------------------ *
 * The hero cards
 * ------------------------------------------------------------------ */

/**
 * The two fragments that sit over the hero portrait.
 *
 * `mastery.value` is a performance claim, which is the one kind of statement
 * this file and `claims.test.ts` exist to keep off the site — the owner's own
 * Mastery rules forbid its content agents from stating how often a signal
 * lands, for the same reason. He asked for it on the hero and that is his decision to make.
 * It is written here rather than in the page so there is one place to change
 * it and one place that records that the exception was deliberate.
 */
export const heroCards = {
  mastery: {
    label: "Mastery",
    value: "97% accuracy", // claims-guard: allow
    note: "AI Signals",
    mark: "/mastery-mark.png",
  },
  fukyaa: {
    label: "Fukyaa",
    /* A statement about what the client does not hand over, not about what
       the business takes. Copytrade splits the gain; this does not. */
    value: "No profit sharing",
    note: "AI Auto Trade",
    mark: "/fukyaa-mark.png",
  },
} as const;
