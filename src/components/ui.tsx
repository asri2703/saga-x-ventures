import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

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
 * Vertical rhythm wrapper. `tone` picks the band.
 *
 * Three bands only: the mist page, a white card-like band for contrast, and
 * the navy band that carries the brand. Navy flips the text colours, so every
 * child inside it inherits readable defaults without each one re-stating them.
 */
export function Section({
  children,
  id,
  tone = "mist",
  className = "",
}: {
  children: ReactNode;
  id?: string;
  tone?: "mist" | "paper" | "navy";
  className?: string;
}) {
  const bands = {
    mist: "bg-mist text-text",
    paper: "bg-paper text-text border-y border-line",
    navy: "bg-navy text-on-dark",
  };
  return (
    <section
      id={id}
      className={`${bands[tone]} scroll-mt-20 py-20 sm:py-28 ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  title,
  lead,
  align = "left",
  onDark = false,
}: {
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  onDark?: boolean;
}) {
  const centered = align === "center";
  return (
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      <h2
        className={`font-display text-3xl font-bold leading-[1.12] sm:text-4xl ${
          onDark ? "text-on-dark" : "text-text"
        }`}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={`mt-5 text-lg leading-relaxed ${
            onDark ? "text-on-dark-muted" : "text-text-muted"
          }`}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const buttonSizes = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

/**
 * Hot Pink never carries white text.
 *
 * White on #FF3D9A measures about 3.3:1, under the 4.5:1 that WCAG AA asks of
 * normal text, so every pink surface here takes a navy label instead — about
 * 5.0:1, and sharper to look at besides.
 */
const buttonVariants = {
  brand: "bg-pink text-navy hover:bg-pink-600 hover:text-on-dark",
  primary: "bg-navy text-on-dark hover:bg-navy-700",
  outline: "border border-line-strong text-text hover:border-navy hover:bg-paper",
  light: "bg-mist text-navy hover:bg-white",
  ghost: "text-text-muted hover:text-text",
};

type ButtonStyle = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function ButtonLink({
  variant = "brand",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & ButtonStyle) {
  return (
    <Link
      {...props}
      className={`${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`}
    />
  );
}

/** For external destinations (WhatsApp, product domains) where prefetch is pointless. */
export function ButtonAnchor({
  variant = "brand",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"a"> & ButtonStyle) {
  return (
    <a
      {...props}
      className={`${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`}
    />
  );
}

export function Button({
  variant = "brand",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & ButtonStyle) {
  return (
    <button
      {...props}
      className={`${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-paper p-6 sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function CheckItem({
  children,
  tone = "yes",
}: {
  children: ReactNode;
  tone?: "yes" | "no";
}) {
  return (
    <li className="flex gap-3 text-text-muted">
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className={`mt-0.5 h-5 w-5 shrink-0 ${tone === "yes" ? "text-navy" : "text-text-faint"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tone === "yes" ? <path d="m4 10.5 4 4 8-9" /> : <path d="M5 5l10 10M15 5L5 15" />}
      </svg>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

/**
 * Risk notice. Appears on every product surface rather than once in the footer,
 * because a visitor deciding on one product should not have to go looking for
 * what it can cost them.
 */
export function RiskNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-text-muted">
      <span className="font-semibold text-text">Risiko: </span>
      {children}
    </p>
  );
}
