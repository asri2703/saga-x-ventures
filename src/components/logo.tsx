import type { CSSProperties } from "react";

/**
 * Brand marks, generated from the supplied logo at public/logo.svg.
 *
 * Rendered with a CSS mask rather than <img> or inlined markup, which buys us
 * two things: the SVG stays a separate cacheable file instead of adding ~9KB
 * to every page, and the colour comes from `currentColor` — so the same file
 * works white on a dark header and brand blue on a light surface.
 *
 * Generated variants:
 *   /logo.svg       original, brand blue, untouched
 *   /logo-mark.svg  the X only, squared — used here and for the favicon
 *   /logo-full.svg  full lockup with the SAGA-X wordmark
 */

function maskStyle(src: string): CSSProperties {
  return {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };
}

/**
 * The X mark on its own. Square, so it pairs cleanly with wordmark text.
 *
 * Decorative by default: everywhere we use it, the brand name is either
 * beside it as text or on the wrapping link's aria-label, so announcing it
 * again would just make screen readers repeat themselves.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block shrink-0 bg-current ${className}`}
      style={maskStyle("/logo-mark.svg")}
    />
  );
}

/**
 * Full lockup including the SAGA-X wordmark. Aspect ratio is 300:187.5 (1.6:1),
 * so size it by width and let the height follow.
 */
export function LogoFull({ className = "h-10 w-16" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Saga X Ventures"
      className={`block shrink-0 bg-current ${className}`}
      style={maskStyle("/logo-full.svg")}
    />
  );
}
