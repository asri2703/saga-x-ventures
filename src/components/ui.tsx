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
  className = "",
}: {
  children: ReactNode;
  id?: string;
  tone?: "paper" | "raised";
  className?: string;
}) {
  const bg = tone === "raised" ? "bg-paper-raised" : "bg-paper";
  return (
    <section
      id={id}
      className={`${bg} scroll-mt-20 py-20 sm:py-28 ${className}`}
    >
      {children}
    </section>
  );
}
