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
  /** Of the account's gain, settled weekly. */
  masterShare: 30,
  investorShare: 70,
  /**
   * The owner's own worked example. It explains how the fee is calculated and
   * is never an earnings illustration: "if the account goes from 500 to 600,
   * the 100 is split" is the term; "turn 500 into 600" is a performance claim
   * and is banned.
   */
  example: { funded: 500, grown: 600 },
} as const;

export function exampleSplit(): {
  gain: number;
  master: number;
  investor: number;
} {
  const gain = copytrade.example.grown - copytrade.example.funded;
  return {
    gain,
    master: (gain * copytrade.masterShare) / 100,
    investor: (gain * copytrade.investorShare) / 100,
  };
}

/* ------------------------------------------------------------------ *
 * Fukyaa
 * ------------------------------------------------------------------ */

export const fukyaa = {
  depositStandardUsd: 1000,
  depositPromoUsd: 500,
  /** Inclusive. The last day the promotional figure applies. */
  promoEndsOn: "2026-12-31",
  /** Monthly VPS rental, for clients who bring their own broker instead. */
  vpsMonthlyMyr: 100,
} as const;

/**
 * The deposit that applies on a given date.
 *
 * UNRESOLVED, and the owner has to settle it. This models one deposit that
 * falls from 1,000 to 500 until the end of the year. `fukyaaPlans` below
 * models 500 and 1,000 as two packages that differ by whether the server is
 * included, with no end date. Both are on the site: this one drives the
 * product's qualifier on /fukyaa and /coaching, the packages drive the
 * homepage. They cannot both be true, and the newer one came from him last,
 * so the promotion is the part most likely to be stale.
 *
 * The promotional figure expires by itself. Written into a page it would
 * become a false price on 1 January, on a date everybody already knows, and
 * nobody would notice until a customer was angry about it.
 */
export function fukyaaDeposit(on: Date): { usd: number; isPromo: boolean } {
  // Malaysian time, not UTC. Pinned to UTC the promotional figure would sit
  // on the page until eight in the morning on the first working day after it
  // ended — the one morning somebody would be looking.
  const lastMoment = new Date(`${fukyaa.promoEndsOn}T23:59:59.999+08:00`);
  const isPromo = on.getTime() <= lastMoment.getTime();
  return {
    usd: isPromo ? fukyaa.depositPromoUsd : fukyaa.depositStandardUsd,
    isPromo,
  };
}

/**
 * The deadline as a person would say it.
 *
 * `promoEndsOn` is stored sortable and compared as a date; printed raw on a
 * page it reads as a database value. Formatted here rather than in the page,
 * so every place that mentions the deadline says it the same way.
 */
export function formatPromoEnd(): string {
  return new Date(`${fukyaa.promoEndsOn}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );
}

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
   * None of the three is marked. He marked a recommendation on Fukyaa and
   * did not mark one here, and picking the dearest or the longest on his
   * behalf is a sales decision, not a formatting one.
   */
  recommended: boolean;
};

export const masteryPlans: MasteryPlan[] = [
  { key: "monthly", name: "1 month", months: 1, monthlyMyr: 99, recommended: false },
  { key: "half-year", name: "6 months", months: 6, monthlyMyr: 82, recommended: false },
  { key: "year", name: "12 months", months: 12, monthlyMyr: 73, recommended: false },
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
 * Note that `depositUsd` here and `fukyaaDeposit()` above now describe the
 * same money two different ways — the dated promotion predates these
 * packages. See the note on `fukyaaDeposit`.
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
    name: "Smaller deposit",
    depositUsd: 500,
    vpsMonthlyMyr: fukyaa.vpsMonthlyMyr,
    weeklyShare: null,
    automated: true,
    recommended: false,
  },
  {
    key: "included-vps",
    name: "Server included",
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
    /* What the client hands over out of a gain, not what the business earns
       anywhere else. This figure is a cost to the buyer and is stated for
       that reason. */
    weeklyShare: copytrade.masterShare,
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
