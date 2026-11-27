import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionRoot } from "@/components/motion-root";

/**
 * The public site's chrome: skip link, header, footer and scroll motion.
 *
 * It used to live in the root layout, which put the marketing nav on every
 * route, including the HQ dashboard under /apps. The route group keeps the
 * URLs exactly as they were; only the dashboard steps out of it.
 */
// Typed by hand rather than as LayoutProps so not-found.tsx can reuse it.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Keyboard users should be able to jump past the nav. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-pine focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <MotionRoot />
    </>
  );
}
