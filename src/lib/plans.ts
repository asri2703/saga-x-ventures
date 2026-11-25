import type { Plan } from "@/components/plan-cards";
import {
  copytrade,
  formatMyr,
  formatUsd,
  fukyaaPlans,
  type FukyaaPlan,
  masteryPlanSavingMyr,
  masteryPlanTotalMyr,
  masteryPlans,
} from "@/lib/commercial";

/**
 * The packages as a buyer reads them.
 *
 * Assembled here rather than in the page for one hard reason: `claims.test.ts`
 * fails the build on a money literal inside a page or a component, so every
 * figure has to arrive already formatted from `commercial.ts`. Keeping the
 * copy next to that conversion also means a figure and the sentence around it
 * cannot drift apart — the sentence is built from the figure.
 */

/**
 * Mastery Signal, paid for directly.
 *
 * Every term buys the same product, so the cards do not repeat a feature list
 * three times. What differs is the month, the total and the saving, and that
 * is what each card carries.
 */
export function masteryPlanCards(options?: { checkout?: boolean }): Plan[] {
  return masteryPlans.map((plan) => {
    const saving = masteryPlanSavingMyr(plan);
    const total = masteryPlanTotalMyr(plan);
    const includes = ["Full access to Mastery Signal"];
    if (saving > 0) {
      includes.push(`Save ${formatMyr(saving)} compared to monthly billing`);
    }
    includes.push("Registration details sent to your email after payment");

    /* The term is what is charged, so the term's total is the figure, and
       the month is the comparison under it. The one-month package has no
       second figure because its total and its month are the same number, and
       printing it twice invites the reader to look for a difference. */
    const isMonthly = plan.months === 1;

    return {
      key: plan.key,
      name: plan.name,
      price: isMonthly ? formatMyr(plan.monthlyMyr) : formatMyr(total),
      per: isMonthly ? "a month" : "total",
      secondary: isMonthly
        ? undefined
        : `${formatMyr(plan.monthlyMyr)}/month equivalent`,
      includes,
      /* Set only when the server has said the checkout may run. Absent, the
         action below stays the outbound link it has always been — a
         half-configured deployment must not open a dialog that cannot
         finish. */
      checkoutPlanKey: options?.checkout ? plan.key : null,
      action: {
        label: isMonthly ? "Get started" : `Get ${plan.name}`,
        // The fallback, not the main road. With the checkout on,
        // `checkoutPlanKey` above is set and the card opens the dialog; this
        // link is what the card does when the server has said the checkout
        // may not run, and it still reaches a person: the client registers,
        // picks their term and is approved by hand.
        href: "/go/mastery-membership",
        external: true,
      },
      recommended: plan.recommended,
    };
  });
}

/**
 * Fukyaa, where the deposit is not a price.
 *
 * It stays in the client's own trading account, which is the single most
 * important thing about this product and the thing people assume wrongly, so
 * every one of the three cards says it under the figure rather than leaving
 * it to the page they land on.
 */
export function fukyaaPlanCards(): Plan[] {
  /* The owner's own wording, one list per package.
     These used to be derived from the flags on each plan, which kept copy
     and data in step but produced a sentence nobody wrote. The deposits,
     the server fee and the recommendation still come from `commercial.ts`
     — only the lines a reader actually reads are written by hand. */
  const bullets: Record<FukyaaPlan["key"], string[]> = {
    "rented-vps": [
      "AI auto-trade runs on your own account",
      "Use your preferred broker",
      "Server is rented monthly",
    ],
    "included-vps": [
      "AI auto-trade runs on your own account",
      "Server included with this option",
      "No monthly server rental",
    ],
    copytrade: [
      "Follow the master account through copytrade",
      `Minimum deposit starts from ${formatUsd(copytrade.minimumUsd)}`,
      "Results are settled weekly according to the copytrade arrangement",
    ],
  };

  return fukyaaPlans.map((plan) => {
    return {
      key: plan.key,
      name: plan.name,
      price: formatUsd(plan.depositUsd),
      per: "deposit, held in your own trading account",
      secondary:
        plan.vpsMonthlyMyr !== null
          ? `+ ${formatMyr(plan.vpsMonthlyMyr)} monthly server fee`
          : undefined,
      includes: bullets[plan.key],
      action: {
        label: plan.automated ? "See how to start" : "See how copytrade works",
        // Both pages explain the order — account, then funding, then
        // registration — before handing over the same links. Sending someone
        // straight to a broker signup they cannot finish produced dead
        // registrations once already.
        href: plan.automated ? "/fukyaa" : "/copytrade",
        external: false,
      },
      recommended: plan.recommended,
    };
  });
}
