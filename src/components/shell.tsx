import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * The shell: the shapes every page is built out of.
 *
 * Taken from the Officevibe reference the owner chose — pill actions, soft
 * panels, a dark band with a scalloped edge, cards that float over
 * photographs — in this site's own palette rather than the reference's navy
 * and coral.
 *
 * Layout primitives (Container, Section) stay in `ui.tsx`. This file is only
 * the visual vocabulary.
 */

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

type ButtonTone = "ink" | "accent" | "ghost" | "onDark";

/*
 * The tones are now colour classes in globals.css, beside the sweep that
 * crosses them on hover — see the `.btn` block. They used to be Tailwind
 * utilities with a `hover:bg-*` each; a utility cannot reach the panel that
 * does the sweeping, and two descriptions of one button's hover state is how
 * they come to disagree.
 */
function buttonClass(tone: ButtonTone, className: string): string {
  return [
    "btn inline-flex items-center justify-center rounded-full px-7 py-3.5",
    "text-base font-semibold",
    `btn--${tone}`,
    className,
  ].join(" ");
}

/** An action that stays on the site. */
export function ActionLink({
  href,
  tone = "ink",
  children,
  className = "",
  prefetch,
}: {
  href: string;
  tone?: ButtonTone;
  children: ReactNode;
  className?: string;
  prefetch?: false;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={buttonClass(tone, className)}
    >
      {children}
    </Link>
  );
}

/**
 * The hero action.
 *
 * From Uiverse.io by cssbuttons-io - https://uiverse.io/cssbuttons-io/massive-mayfly-74
 * MIT License, Copyright (c) cssbuttons-io (cssbuttons.io)
 *
 * A disc with an arrow that grows across the whole pill on hover. It is the
 * one action in a hero and nowhere else: a page gets one of these, at the
 * top, and everything below it stays an `ActionLink`. The look lives in
 * globals.css under `.sweep`, where the adaptation is written down.
 *
 * The label is set in capitals by the stylesheet, not by the caller, so the
 * words stay readable in the source and in the page's own voice.
 */
export function ActionSweep({
  href,
  children,
  className = "",
  prefetch,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: false;
}) {
  return (
    <Link href={href} prefetch={prefetch} className={`sweep ${className}`}>
      {/* Decorative: the label beside it already says where this goes. */}
      <span className="sweep-circle" aria-hidden>
        <span className="sweep-arrow" />
      </span>
      <span className="sweep-text">{children}</span>
    </Link>
  );
}

/** An action that leaves the site. Always through `/go/<key>`. */
export function ActionOut({
  href,
  tone = "accent",
  children,
  className = "",
}: {
  href: string;
  tone?: ButtonTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass(tone, className)}
    >
      {children}
    </a>
  );
}

/** A quieter action: underlined text, ruby rule beneath it. */
export function TextLink({
  href,
  children,
  external = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const style = `font-medium text-pine underline decoration-ruby decoration-2 underline-offset-4 ${className}`;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={style}>
      {children}
    </a>
  ) : (
    <Link href={href} className={style}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * Headings
 * ------------------------------------------------------------------ */

/**
 * The small label above a heading.
 *
 * Tracked capitals, which `voice.test.ts` bans everywhere else and permits
 * only here. It is quiet by default: an eyebrow on every section painted in
 * ruby made the accent ambient, and an accent that appears everywhere marks
 * nothing. Ruby stays on the action. The ban exists so a label is not shouted for decoration; the
 * reference uses the device once per section as a category marker, which is
 * information. Confining it to this component keeps the rule enforceable:
 * any other file that tries it still fails the build.
 */
export function Eyebrow({
  children,
  tone = "quiet",
}: {
  children: ReactNode;
  tone?: "accent" | "quiet" | "onDark";
}) {
  const colour =
    tone === "accent"
      ? "text-ruby-deep"
      : tone === "onDark"
        ? "text-sand"
        : "text-pine-faint";
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.14em] ${colour}`}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

/** A soft panel. The reference carries structure in elevation, not in lines. */
export function Panel({
  children,
  className = "",
  reveal = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  reveal?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      {...(reveal ? { "data-reveal": "" } : {})}
      style={style}
      className={`panel p-7 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * The scalloped edge into the dark band.
 *
 * Decoration with no meaning, so it is hidden from assistive technology
 * rather than announced as an image of nothing.
 */
export function Scallop() {
  return <div aria-hidden className="scallop-top" />;
}

/* ------------------------------------------------------------------ *
 * The floating card
 * ------------------------------------------------------------------ */

/**
 * A fragment of product interface, overlapping a photograph.
 *
 * In the reference these are screenshots. Here they are built from the real
 * figures instead, which is both more honest and the reason this rebuild did
 * not have to wait for screenshots that do not exist yet.
 */
export function FloatCard({
  label,
  value,
  note,
  tint = "sage",
  mark,
  className = "",
  style,
}: {
  label: string;
  value: string;
  note?: string;
  tint?: "sage" | "blush" | "sand";
  /**
   * A product logo for the disc, as a path under /public.
   *
   * Without one the disc is a flat tint, which is decoration encoding
   * nothing. With one it tells you which product the card is about, which is
   * the only reason for a disc to be there at all.
   */
  mark?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const chip =
    tint === "blush" ? "bg-blush" : tint === "sand" ? "bg-sand" : "bg-sage";
  return (
    <div
      style={style}
      className={`float-card flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 ${className}`}
    >
      {mark ? (
        /* The label beside it already names the product, so the mark is
           decoration here and carries no alt text — announced, it would read
           the product name twice in a row. */
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper-raised sm:h-11 sm:w-11"
        >
          <Image
            src={mark}
            alt=""
            aria-hidden
            width={256}
            height={256}
            className="h-7 w-7 object-contain sm:h-8 sm:w-8"
          />
        </span>
      ) : (
        <span
          aria-hidden
          className={`h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10 ${chip}`}
        />
      )}
      <span>
        <span className="block text-xs text-pine-faint">{label}</span>
        <span className="tnum block text-sm font-semibold text-pine">
          {value}
        </span>
        {note ? (
          <span className="block text-xs text-pine-faint">{note}</span>
        ) : null}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Hand-drawn marks
 * ------------------------------------------------------------------ */

/**
 * The swoosh under a word in a heading.
 *
 * Wrap the word, not the line: `Trade <Marked>simply</Marked>`. The stroke is
 * drawn under the text rather than through it, and it is decorative, so it
 * carries no accessible name.
 */
export function Marked({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        aria-hidden
        viewBox="0 0 200 14"
        preserveAspectRatio="none"
        className="absolute inset-x-0 h-[0.22em] w-full text-ruby"
        style={{ bottom: "-0.06em" }}
      >
        <path
          d="M3 9.5C38 4.2 92 2.6 136 4.4c24 1 44 3 61 5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** The curved arrow the reference draws between a photo and a card. */
export function CurvedArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 80"
      fill="none"
      className={`text-pine-faint ${className}`}
    >
      <path
        d="M6 8c34 2 62 18 76 46"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="0 0"
      />
      <path
        d="M72 44l12 12 12-10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A photograph in the reference's shape: rounded, with an offset block of
 * colour behind it so the image is not a bare rectangle on the paper.
 */
export function OffsetFrame({
  children,
  tint = "sage",
  className = "",
}: {
  children: ReactNode;
  tint?: "sage" | "blush" | "sand";
  className?: string;
}) {
  const block =
    tint === "blush" ? "bg-blush" : tint === "sand" ? "bg-sand" : "bg-sage";
  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden
        /* Offset downward on a phone, down AND right from `sm`.
           The sideways offset is 16px and a phone's page gutter is 20px, so
           on a phone the block came within 4px of the screen edge while the
           frame's left side still had its full 20px. The composition read as
           though it had been nudged off centre. From `sm` the gutter is 32px
           and there is room for the offset the reference actually uses. */
        className={`absolute -bottom-3 right-0 h-full w-full rounded-[var(--radius-panel)] sm:-bottom-4 sm:-right-4 ${block}`}
      />
      <div className="relative overflow-hidden rounded-[var(--radius-panel)]">
        {children}
      </div>
    </div>
  );
}
