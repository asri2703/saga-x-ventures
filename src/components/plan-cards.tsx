import type { ReactNode } from "react";
import Link from "next/link";
import { ActionLink, ActionOut, Eyebrow } from "@/components/shell";
import { CheckoutOpener } from "@/components/checkout-opener";
import type { MasteryPlan } from "@/lib/commercial";

/**
 * The three ways into a product, priced.
 *
 * Shape taken from the pricing grid the owner chose: a row of plans, one
 * marked as the recommendation, each with a figure, what it includes, and its
 * own action.
 *
 * What did not come across, and why:
 *
 * The reference's monthly/annual switch. Here the term IS the plan — one
 * month, six, twelve — so a toggle would be a second control over the same
 * decision the cards already make. Fukyaa's three are not terms at all.
 *
 * The confetti on toggling, the spring-in from below, and the side cards
 * rotated and scaled back in 3D. Those are the house style of every pricing
 * page built this year, `voice.test.ts` already bans the utilities two of
 * them need, and a buyer comparing three figures is doing the one thing on
 * this site that deserves no distraction at all.
 */

export type Plan = {
  key: string;
  /** What the plan is called. */
  name: string;
  /** The figure, formatted. */
  price: string;
  /** What the figure is per — "a month", "deposit". Not a unit string. */
  per: string;
  /** The second figure, where there is one: the term's total, say. */
  secondary?: string;
  /** What it includes. Two or three lines; a fourth is not read. */
  includes: string[];
  action: { label: string; href: string; external: boolean };
  /**
   * The term this card buys, when the checkout is open for business.
   *
   * Set by the page, not by `plans.ts`, because whether the checkout may run
   * is a server-side decision about credentials and `plans.ts` is shared with
   * the test suite. Absent, the action stays the link it has always been.
   */
  checkoutPlanKey?: MasteryPlan["key"] | null;
  /** One line under the action, for the thing a buyer asks next. */
  footnote?: string;
  recommended: boolean;
};

/** The tick beside an included line. The line carries the meaning. */
function Tick() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[0.3rem] h-3.5 w-3.5 shrink-0 text-ruby"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <li
      /* The recommendation is lifted out of the row, at the owner's
         instruction. It is a translate and not a scale: a scale would set the
         figure on this card at a different size from the two beside it, and
         three prices a buyer is comparing should be the same size. Lifting
         moves it without resizing it.

         Only from `lg`, where the three are actually side by side. Stacked on
         a phone there is no row to rise out of, and the lift would read as a
         gap somebody forgot to close. */
      className={`flex flex-col p-6 sm:p-7 ${
        plan.recommended ? "panel-pick lg:-translate-y-6" : "panel"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold text-pine">{plan.name}</p>
        {plan.recommended ? (
          <span className="shrink-0 rounded-full bg-ruby px-2.5 py-1 text-xs font-semibold text-white">
            Recommended
          </span>
        ) : null}
      </div>

      <p className="display tnum mt-5 text-3xl text-pine">{plan.price}</p>
      <p className="mt-1 text-sm text-pine-faint">{plan.per}</p>
      {plan.secondary ? (
        <p className="tnum mt-3 text-sm italic text-pine-faint">
          {plan.secondary}
        </p>
      ) : null}

      <ul className="mt-6 flex-1 space-y-3">
        {plan.includes.map((line) => (
          <li
            key={line}
            className="flex gap-3 text-sm leading-relaxed text-pine-soft"
          >
            <Tick />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        {plan.checkoutPlanKey ? (
          <CheckoutOpener
            planKey={plan.checkoutPlanKey}
            label={plan.action.label}
            tone={plan.recommended ? "accent" : "ghost"}
            className="w-full"
          />
        ) : plan.action.external ? (
          <ActionOut
            href={plan.action.href}
            tone={plan.recommended ? "accent" : "ghost"}
            className="w-full"
          >
            {plan.action.label}
          </ActionOut>
        ) : (
          <ActionLink
            href={plan.action.href}
            tone={plan.recommended ? "accent" : "ghost"}
            className="w-full"
          >
            {plan.action.label}
          </ActionLink>
        )}
      </div>

      {plan.footnote ? (
        <p className="mt-4 text-xs leading-relaxed text-pine-faint">
          {plan.footnote}
        </p>
      ) : null}
    </li>
  );
}

/**
 * The recommended plan sits in the middle of the row.
 *
 * Declaration order in `commercial.ts` is shortest term to longest, which is
 * what the arithmetic and its tests read. Where the recommendation sits is a
 * different question, and it is answered here: the middle, because that is
 * where a lifted card has a card on each side to rise above, and where the
 * eye lands first on a row of three.
 *
 * Anything other than three plans is returned untouched. There is no middle
 * of two, and this is not a general sorting function.
 */
export function centreRecommended(plans: Plan[]): Plan[] {
  if (plans.length !== 3) return plans;
  const at = plans.findIndex((plan) => plan.recommended);
  if (at === -1 || at === 1) return plans;
  const rest = plans.filter((plan) => !plan.recommended);
  return [rest[0], plans[at], rest[1]];
}

/**
 * One product's block: who it is for, its plans, and any route in that is not
 * one of them.
 */
export function PlanGroup({
  eyebrow,
  title,
  intro,
  note,
  plans,
  alternative,
}: {
  eyebrow: string;
  title: string;
  /** What the product is and who it is for. One or two short paragraphs. */
  intro: ReactNode;
  /** One line about how buying actually goes, where that is not obvious. */
  note?: ReactNode;
  plans: Plan[];
  /**
   * A way in that is not a package — Mastery's free access through a broker
   * deposit. It sits after the plans rather than among them: it is not a
   * fourth thing to compare, it is what to do if none of the three suit.
   */
  alternative?: {
    title: string;
    body: ReactNode;
    /**
     * `external` sends it out through `/go/<key>` in a new tab.
     *
     * It is not inferred from the href. Every link that leaves this site goes
     * through that redirect, so an outbound one is always same-origin by the
     * time it reaches here and there is nothing in the string to infer from.
     */
    action: { label: string; href: string; external?: boolean };
  };
}) {
  return (
    <div>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="display mt-3 text-2xl text-pine sm:text-3xl">{title}</h3>
        <div className="mt-4 max-w-xl space-y-3 leading-relaxed text-pine-soft">
          {intro}
        </div>
        {note ? (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-pine-faint">
            {note}
          </p>
        ) : null}
      </div>

      {/* Stretched, so all three panes are the same height whatever their
          lines come to — the 1-month card has one line fewer than the other
          two. The lift is a transform, which does not touch the layout box,
          so the middle card is still the same height as its neighbours and
          simply sits higher than them. */}
      <ul className="mt-9 grid gap-5 lg:grid-cols-3">
        {centreRecommended(plans).map((plan) => (
          <PlanCard key={plan.key} plan={plan} />
        ))}
      </ul>

      {alternative ? (
        <div
          className="mt-6 flex flex-col gap-5 rounded-[var(--radius-panel)] border border-dashed border-rule-strong p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
        >
          <div className="max-w-xl">
            <p className="font-semibold text-pine">{alternative.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-pine-soft">
              {alternative.body}
            </p>
          </div>
          <Link
            href={alternative.action.href}
            {...(alternative.action.external
              ? {
                  prefetch: false as const,
                  target: "_blank",
                  rel: "noopener noreferrer",
                }
              : {})}
            className="btn btn--ghost shrink-0 self-start rounded-full px-6 py-3 text-base font-semibold sm:self-auto"
          >
            {alternative.action.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
