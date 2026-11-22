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
 * The promotional figure expires by itself. Written into a page it would
 * become a false price on 1 January, on a date everybody already knows, and
 * nobody would notice until a customer was angry about it.
 */
export function fukyaaDeposit(on: Date): { usd: number; isPromo: boolean } {
  const lastMoment = new Date(`${fukyaa.promoEndsOn}T23:59:59.999Z`);
  const isPromo = on.getTime() <= lastMoment.getTime();
  return {
    usd: isPromo ? fukyaa.depositPromoUsd : fukyaa.depositStandardUsd,
    isPromo,
  };
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
 * What a client pays here when they pay directly instead of depositing.
 *
 * `null` until the owner sets it, which renders as "Price on enquiry" rather
 * than a broken number — the same handling as the coaching ladder.
 */
export const masterySubscriptionMyr: number | null = null;
