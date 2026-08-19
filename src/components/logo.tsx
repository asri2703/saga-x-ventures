/**
 * Placeholder brand mark — an upward chevron (growth) inside a rounded tile.
 *
 * TODO: swap this for your real logo when you have one. If you export an SVG,
 * paste its <path> data in place of the paths below and keep the 32x32
 * viewBox so every size on the site stays correct.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Sagax Ventures logo"
    >
      <defs>
        <linearGradient id="sagax-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffc35c" />
          <stop offset="100%" stopColor="#b8801f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sagax-mark)" />
      <path
        d="M9 20.5 16 12l7 8.5"
        fill="none"
        stroke="#08090b"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 24.5 16 20l3.5 4.5"
        fill="none"
        stroke="#08090b"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
    </svg>
  );
}
