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
  /**
   * The share of the month's gain that settles to the master account.
   *
   * Monthly, not weekly. The weekly model this file carried until 25
   * November 2026 was deleted that day, when the broker's join screen was
   * found saying "There are no fees"; the owner has since set the terms
   * himself, and they are a monthly settlement. The old figure happened to
   * be the same 30, which is exactly why the period is written down beside
   * it rather than left in prose.
   */
  masterSharePct: 30,
} as const;

/** What stays with the client. Derived: two numbers that must add to 100
    are one number and a subtraction. */
export function copytradeInvestorSharePct(): number {
  return 100 - copytrade.masterSharePct;
}

export function formatPct(pct: number): string {
  return `${pct}%`;
}

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
 * What is deliberately NOT here: the worked example.
 *
 * The deleted weekly model carried `example` (500 growing to 600) and
 * `exampleSplit()`, and /copytrade printed the arithmetic. A worked example
 * of a gain is a picture of a profit, which is the one thing this site does
 * not put on a screen. The rate is a price and says itself.
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
  /** Share of the gain settled monthly, or null when there is none. */
  gainSharePct: number | null;
  /** Whether the client places nothing themselves. */
  automated: boolean;
  recommended: boolean;
};

export const fukyaaPlans: FukyaaPlan[] = [
  {
    key: "rented-vps",
    name: "Standard",
    depositUsd: 500,
    vpsMonthlyMyr: fukyaa.vpsMonthlyMyr,
    gainSharePct: null,
    automated: true,
    recommended: false,
  },
  {
    key: "included-vps",
    name: "Server Included",
    depositUsd: 1000,
    vpsMonthlyMyr: null,
    gainSharePct: null,
    automated: true,
    recommended: true,
  },
  {
    key: "copytrade",
    name: "Copytrade",
    depositUsd: copytrade.minimumUsd,
    vpsMonthlyMyr: null,
    gainSharePct: copytrade.masterSharePct,
    automated: false,
    recommended: false,
  },
];

/* ------------------------------------------------------------------ *
 * What the checkout may sell
 * ------------------------------------------------------------------ */

/**
 * One key, resolved to money.
 *
 * The browser sends a key and never a price; this is where the price comes
 * from, for both products, so the figure a buyer was shown and the figure
 * they are charged cannot drift apart. It is also the list of what may be
 * bought at all: a key that is not here is not for sale, whatever a request
 * body says.
 *
 * `amountSen` of zero is a real answer, not a missing one. The package that
 * includes the server has nothing to pay, and it still has to be registered
 * — somebody has to tell me which account to connect — so it ends in a row
 * with no bill rather than at a payment page for nothing.
 *
 * Copytrade is deliberately absent. It is settled from the gain, so there is
 * no moment here at which money changes hands.
 */
export type Sellable = {
  key: string;
  /** Which product's row this becomes. */
  product: "mastery-signal" | "fukyaa";
  /** What the bill is called, for Billplz and for the buyer's statement. */
  label: string;
  amountSen: number;
  /** Whether the trading account has to be named before this can proceed. */
  needsMt5Login: boolean;
};

export function sellableFor(key: string): Sellable | null {
  const term = masteryPlans.find((plan) => plan.key === key);
  if (term) {
    return {
      key: term.key,
      product: "mastery-signal",
      label: `Mastery Signal — ${term.name}`,
      amountSen: masteryPlanTotalMyr(term) * 100,
      needsMt5Login: false,
    };
  }

  const pack = fukyaaPlans.find((plan) => plan.key === key);
  if (pack && pack.key !== "copytrade") {
    return {
      key: pack.key,
      product: "fukyaa",
      label: `AI Auto Trade — ${pack.name}`,
      /* One month. The rent is not a subscription: a payment buys a month,
         and the next one is the same step again, which is what the owner
         asked for and what the reminder email exists to prompt. */
      amountSen: (pack.vpsMonthlyMyr ?? 0) * 100,
      needsMt5Login: true,
    };
  }

  return null;
}

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
  return `${formatUsdFigure(usd)} USD`;
}

/**
 * The same figure without its unit. Not exported: the record chart, which
 * sets its own unit, cannot take a formatter from a server component anyway
 * and formats its axis itself.
 *
 * Two decimals at most: a balance converted from cents divides evenly only
 * by luck, and a dollar figure carrying three decimals reads as an error.
 */
function formatUsdFigure(usd: number): string {
  return new Intl.NumberFormat("en-MY", { maximumFractionDigits: 2 }).format(
    usd,
  );
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
