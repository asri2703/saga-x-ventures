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

/** Vertical rhythm wrapper. `tone` picks the background band. */
export function Section({
  children,
  id,
  tone = "ink",
  className = "",
}: {
  children: ReactNode;
  id?: string;
  tone?: "ink" | "surface";
  className?: string;
}) {
  const bg = tone === "surface" ? "bg-surface" : "bg-ink";
  return (
    <section
      id={id}
      className={`${bg} scroll-mt-20 border-t border-line/60 py-20 sm:py-28 ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** Small uppercase label that sits above a heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
      <span aria-hidden className="h-px w-6 bg-accent/60" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    // Every section heading reveals on scroll — one attribute, picked up by
    // the single observer in MotionRoot.
    <div data-reveal className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-body sm:text-4xl">
        {title}
      </h2>
      {lead ? (
        <p className="mt-5 text-lg leading-relaxed text-muted">{lead}</p>
      ) : null}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const buttonSizes = {
  md: "px-5 py-2.5",
  lg: "px-7 py-3.5 text-base",
};

const buttonVariants = {
  primary: "bg-accent text-ink hover:bg-accent-hot",
  outline:
    "border border-line-bright text-body hover:border-accent hover:text-accent",
  ghost: "text-muted hover:text-body",
};

type ButtonStyle = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function ButtonLink({
  variant = "primary",
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

/** For external destinations (WhatsApp, mail) where Link's prefetch is pointless. */
export function ButtonAnchor({
  variant = "primary",
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
  variant = "primary",
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

/** Bordered card used for services, process steps, and trust points. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-elevated/60 p-6 transition-colors duration-300 hover:border-line-bright sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-muted">
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="mt-0.5 h-5 w-5 shrink-0 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 10.5 4 4 8-9" />
      </svg>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
