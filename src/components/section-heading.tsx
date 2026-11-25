import type { ReactNode } from "react";
import { Eyebrow } from "@/components/shell";

/**
 * A section's opening.
 *
 * The eyebrow is the reference's category marker — tracked capitals, which
 * only `Eyebrow` is allowed to render. See the note on that component for
 * why the ban elsewhere still stands.
 */
export function SectionHeading({
  eyebrow,
  eyebrowTone,
  title,
  children,
  onDark = false,
}: {
  eyebrow?: string;
  eyebrowTone?: "accent" | "quiet" | "onDark";
  title: ReactNode;
  children?: ReactNode;
  onDark?: boolean;
}) {
  return (
    <div className="max-w-2xl" data-reveal>
      {/* The eyebrow is quiet by default. Ruby on every section heading made
          the accent ambient, and an accent everywhere marks nothing. */}
      {eyebrow ? (
        <Eyebrow tone={eyebrowTone ?? (onDark ? "onDark" : "quiet")}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <h2
        className={`display mt-3 text-3xl sm:text-4xl ${
          onDark ? "text-paper" : "text-pine"
        }`}
      >
        {title}
      </h2>
      {children ? (
        <div
          className={`mt-4 leading-relaxed ${
            onDark ? "text-paper/80" : "text-pine-soft"
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
