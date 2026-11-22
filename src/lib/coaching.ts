/**
 * Coaching: three classes, two delivery modes, priced per class.
 *
 * The prices are config and nothing else reads a literal ringgit figure. The
 * owner is still settling them, so every entry starts `null` and renders as
 * "Price on enquiry" until a number is put here — which is a deliberate
 * design: an unset price must never reach a visitor as `RMnull`.
 *
 * Onsite is all-in. Transport, hotel and expenses are absorbed into the fee
 * rather than billed on top, so the figure does not vary by location.
 */

export type CoachingMode = "online" | "onsite";

export type CoachingClass = {
  slug: string;
  name: string;
  summary: string;
  order: number;
};

/** A ladder, not a menu: each class assumes the one before it. */
export const coachingClasses: CoachingClass[] = [
  {
    slug: "basic-trading",
    name: "Basic Trading",
    summary:
      "How a chart is read, where a level comes from, and how to size a position so one trade cannot end you.",
    order: 1,
  },
  {
    slug: "advance",
    name: "Advance",
    summary:
      "Structure, confluence and the patience to wait for your own setup instead of taking the market's.",
    order: 2,
  },
  {
    slug: "news-trading",
    name: "News Trading",
    summary:
      "Trading around releases: what moves, what it does to spreads, and when the right answer is to stay out.",
    order: 3,
  },
];

export type CoachingPrice = {
  mode: CoachingMode;
  classSlug: string;
  /** null = not set yet. Renders as an enquiry, never as a number. */
  myr: number | null;
};

export const coachingPrices: CoachingPrice[] = coachingClasses.flatMap((c) => [
  { mode: "online" as const, classSlug: c.slug, myr: null },
  { mode: "onsite" as const, classSlug: c.slug, myr: null },
]);

/**
 * `null` means the class exists but has no price yet.
 * `undefined` means there is no such class — a different problem, so a
 * different answer.
 */
export function getPrice(
  classSlug: string,
  mode: CoachingMode,
): number | null | undefined {
  return coachingPrices.find(
    (p) => p.classSlug === classSlug && p.mode === mode,
  )?.myr;
}

export function formatPrice(myr: number | null | undefined): string {
  if (myr === null || myr === undefined) return "Price on enquiry";
  return `RM${new Intl.NumberFormat("en-MY").format(myr)}`;
}
