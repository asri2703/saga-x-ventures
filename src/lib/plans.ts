import type { Plan } from "@/components/plan-cards";
import {
  formatMyr,
  formatUsd,
  fukyaaPlans,
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
        // The checkout the owner is building is not live yet. This is where
        // both routes already end: the client registers, picks their term and
        // is approved by hand. When Billplz is wired up, this is the one line
        // that changes.
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
  return fukyaaPlans.map((plan) => {
    const includes: string[] = [];

    includes.push(
      plan.automated
        ? "The robot places the trades on your own account"
        : "You follow my account rather than a system",
    );

    if (plan.vpsMonthlyMyr !== null) {
      // The figure itself is in `secondary`, directly under the deposit,
      // where a buyer comparing the three is already looking. Repeating it
      // here read as two different charges.
      includes.push("Runs on a server you rent monthly");
    } else if (plan.weeklyShare === null) {
      includes.push("The server is included — nothing monthly");
    } else {
      includes.push("No server to rent and nothing monthly");
    }

    includes.push(
      plan.weeklyShare === null
        ? "No share of what the account makes"
        : `${plan.weeklyShare}% of the gain, settled weekly by the broker`,
    );

    return {
      key: plan.key,
      name: plan.name,
      price: formatUsd(plan.depositUsd),
      per: "deposit, held in your own account",
      secondary:
        plan.vpsMonthlyMyr !== null
          ? `Plus ${formatMyr(plan.vpsMonthlyMyr)} a month for the server`
          : undefined,
      includes,
      action: {
        label: plan.automated ? "See how to start" : "See how the copy works",
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
