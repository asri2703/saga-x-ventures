import type { ReactNode } from "react";
import Link from "next/link";
import { ActionLink, ActionOut, Eyebrow } from "@/components/shell";

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
      data-reveal
      /* The recommendation is marked with colour and a word, not with a card
         lifted out of the row. Scaling one card up — which the reference does
         to two of its three — pushes the figures out of line with each other,
         and lining the figures up is the only job this row has. */
      className={`flex flex-col p-6 sm:p-7 ${
        plan.recommended ? "panel-pick" : "panel"
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
        <p className="tnum mt-3 text-sm text-pine-soft">{plan.secondary}</p>
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
        {plan.action.external ? (
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
 * One product's block: who it is for, its plans, and any route in that is not
 * one of them.
 */
export function PlanGroup({
  eyebrow,
  title,
  forWho,
  note,
  plans,
  alternative,
}: {
  eyebrow: string;
  title: string;
  /** The visitor's own words, from `products.ts`. */
  forWho: string;
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
    action: { label: string; href: string };
  };
}) {
  return (
    <div className="mt-14">
      <div data-reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="display mt-3 text-2xl text-pine sm:text-3xl">{title}</h3>
        <p className="mt-3 max-w-xl leading-relaxed text-pine-soft">
          &ldquo;{forWho}&rdquo;
        </p>
        {note ? (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-pine-faint">
            {note}
          </p>
        ) : null}
      </div>

      <ul className="mt-9 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.key} plan={plan} />
        ))}
      </ul>

      {alternative ? (
        <div
          data-reveal
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
            className="shrink-0 self-start rounded-full border border-pine px-6 py-3 text-base font-semibold text-pine transition-colors hover:bg-pine hover:text-paper sm:self-auto"
          >
            {alternative.action.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
