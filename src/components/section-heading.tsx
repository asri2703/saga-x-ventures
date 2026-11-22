import type { ReactNode } from "react";

/**
 * A section's opening.
 *
 * The eyebrow is sentence case, not tracked capitals. The voice guard fails
 * the build on that pairing, because shouting a label is decoration rather
 * than information.
 */
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-2xl" data-reveal>
      {eyebrow ? (
        <p className="text-sm text-pine-faint">{eyebrow}</p>
      ) : null}
      <h2 className="display mt-2 text-3xl text-pine sm:text-4xl">{title}</h2>
      {children ? (
        <div className="mt-4 leading-relaxed text-pine-soft">{children}</div>
      ) : null}
    </div>
  );
}
