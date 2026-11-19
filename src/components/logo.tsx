/**
 * Brand marks.
 *
 * The mark is two parallelograms at a shared slant, traced from the supplied
 * lockup: the sky bar runs from (157,0) to (0,188), the pink one picks up
 * below and right of it. Both are drawn inline rather than masked from a file,
 * because the mark is two fixed brand colours and a CSS mask can only paint
 * one.
 *
 * The colours are the brand board's Sky Blue and Hot Pink. The supplied PNG
 * renders deeper — about #2AA5EF and #EB0A78 — but those are hard to use for
 * anything but artwork: on #EB0A78, white text reaches only 4.33:1 and navy
 * 3.77:1, so neither clears AA. Matching the board keeps one pink on screen
 * instead of two that look like a mistake.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 266 273"
      className={`block shrink-0 ${className}`}
      fill="none"
    >
      <polygon points="157,0 263,0 100,188 0,188" fill="#65B9F2" />
      <polygon points="172,133 265,133 148,273 55,273" fill="#FF3D9A" />
    </svg>
  );
}

/**
 * The wordmark as live text rather than an image.
 *
 * It inherits `currentColor`, so the same component reads navy on the mist
 * header and near-white in the navy footer without a second asset — and it
 * stays crisp at any size. Only the X is pink, as in the lockup.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold ${className}`}>
      Saga <span className="text-pink">X</span> Ventures
    </span>
  );
}

/**
 * Stacked lockup — "SAGA X" over a letterspaced "VENTURES", matching the
 * supplied artwork. Used where there is room to let the mark breathe.
 */
export function LogoFull({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Logo className="h-10 w-10" />
      <span className="leading-none">
        <span className="block font-display text-xl font-extrabold tracking-tight">
          SAGA <span className="text-pink">X</span>
        </span>
        <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-[0.35em]">
          Ventures
        </span>
      </span>
    </span>
  );
}
