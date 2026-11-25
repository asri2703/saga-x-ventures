import type { ReactNode } from "react";

/**
 * The two layout primitives the site actually uses.
 *
 * Everything else that lived here — Eyebrow, SectionHeading, three Button
 * variants, Card and CheckItem — was built for the agency's service pages and
 * had no importers left after the pivot. They were also the last things in
 * the codebase referencing the old dark-theme colour tokens, which is why
 * deleting them is what let those aliases go.
 */

/** Consistent page gutter. Every section uses this so nothing drifts. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Vertical rhythm wrapper.
 *
 * It does NOT wrap its children in a Container. It used to, while every page
 * also opened one explicitly — so every page had a doubled gutter and sat
 * 20px narrower than intended on a phone.
 *
 * It also no longer draws a rule along its top edge. A hairline between every
 * section is the broadsheet default; on this site the drafting language
 * belongs to the hero diagram and nowhere else.
 */
export function Section({
  children,
  id,
  tone = "paper",
  pad,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  /**
   * `pine` is the reference's dark band: the page inverts for one section so
   * the thing inside it is the only thing on screen. Text colours inside it
   * are the section's job, not this wrapper's, because a band holds headings
   * and body at different strengths.
   */
  tone?: "paper" | "raised" | "pine";
  /**
   * Padding utilities that REPLACE the default, rather than sit beside it.
   *
   * They used to be passed through `className`, and every one of them that
   * asked for less than the default silently lost. Two utilities setting the
   * same property have equal specificity, so the winner is decided by their
   * order in the compiled stylesheet, and Tailwind emits the scale in
   * ascending order — `.py-10` before `.py-16`. So `py-16` won and sixteen
   * sections across the site rendered at the default spacing while reading as
   * though they had been tightened. Passing the padding here means exactly
   * one set of utilities is emitted and there is nothing to lose against.
   */
  pad?: string;
  className?: string;
}) {
  /* `raised` is a step DOWN from the paper, not up, despite the name.
     It used to be `paper-raised`, which is also the colour of a card, so on a
     banded section every panel was exactly the colour of the band behind it
     and sank into it — which is what the owner saw. The band is now darker
     than the page and the panes sit above both. The name is kept because
     every call site and the footer's `data-tone` rule use it. */
  const bg =
    tone === "pine"
      ? "bg-pine-deep text-paper"
      : tone === "raised"
        ? "bg-paper-band"
        : "bg-paper";
  return (
    <section
      id={id}
      /* Read by the footer, which hides its scalloped strip when the page
         already ends dark. See the rule in globals.css. */
      data-tone={tone}
      className={`${bg} scroll-mt-20 ${pad ?? "py-16 sm:py-24"} ${className}`}
    >
      {children}
    </section>
  );
}
