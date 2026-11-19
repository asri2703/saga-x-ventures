import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Consistent page gutter. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * A band of the app.
 *
 * Spacing is tighter than a marketing page on purpose: a product surface packs
 * more into a screen, and the long airy sections were most of what made the
 * last pass read as a brochure.
 */
export function Section({
  children,
  id,
  tone = "base",
  className = "",
}: {
  children: ReactNode;
  id?: string;
  tone?: "base" | "panel" | "light";
  className?: string;
}) {
  const bands = {
    base: "bg-base text-text",
    panel: "bg-panel text-text",
    light: "bg-mist text-navy",
  };
  return (
    <section
      id={id}
      className={`${bands[tone]} scroll-mt-16 py-12 sm:py-16 ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** Section label — small, quiet, and always paired with a heading. */
export function SectionHeading({
  title,
  lead,
  onLight = false,
}: {
  title: ReactNode;
  lead?: ReactNode;
  onLight?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <h2
        className={`font-display text-2xl font-bold leading-tight sm:text-3xl ${
          onLight ? "text-navy" : "text-text"
        }`}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={`mt-3 leading-relaxed ${
            onLight ? "text-navy/70" : "text-text-muted"
          }`}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";

const buttonSizes = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-[15px]",
  block: "w-full px-5 py-3.5 text-[15px]",
};

/**
 * Hot Pink never carries white type: white on #FF3D9A is about 3.3:1, under
 * the 4.5:1 AA asks of normal text. Navy on pink reaches 5.0:1.
 */
const buttonVariants = {
  brand: "bg-pink text-navy hover:bg-pink-600 hover:text-mist",
  primary: "bg-sky text-navy hover:bg-sky-300",
  panel: "bg-raised text-text ring-1 ring-line hover:ring-line-strong",
  outline: "ring-1 ring-line-strong text-text hover:bg-raised",
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

/** Raised surface. The app's basic unit. */
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-panel p-5 ring-1 ring-line sm:p-6 ${className}`}
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
        className={`mt-0.5 h-5 w-5 shrink-0 ${tone === "yes" ? "text-sky" : "text-text-faint"}`}
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

/** Risk notice. On every product surface, not once in the footer. */
export function RiskNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-raised px-4 py-3 text-sm leading-relaxed text-text-muted ring-1 ring-line">
      <span className="font-semibold text-text">Risiko: </span>
      {children}
    </p>
  );
}
