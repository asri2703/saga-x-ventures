import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site";
import { orgSchema, personSchema } from "@/lib/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { MotionRoot } from "@/components/motion-root";

/**
 * One family for the whole site.
 *
 * General Sans, self-hosted. The design reference the owner chose is set in
 * GT Walsheim, which is licensed commercially; General Sans is its nearest
 * freely licensed relative — geometric, soft terminals, the same friendly
 * register — and is served from this origin rather than Fontshare's CDN so
 * the page does not depend on a third party to render its own text.
 *
 * Four weights, no italics. The display cut is this family at 600 with
 * tighter tracking, not a second typeface.
 */
const generalSans = localFont({
  variable: "--font-general-sans",
  display: "swap",
  src: [
    { path: "../fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/GeneralSans-700.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    // Every page sets its own title; this template appends the brand.
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  /**
   * Retargeted from the agency's Seremban-first set.
   *
   * Local terms were right for a marketing agency, where the map pack decides
   * who gets called. They are wrong here: nobody looks for a signal provider
   * or a trading coach by town, and the audience spans two countries. The
   * real address stays in the structured data for legitimacy, but the search
   * intent being chased is trading, not locality.
   */
  keywords: [
    "forex signal Malaysia",
    "forex trading coach Malaysia",
    "one to one forex coaching",
    "learn forex trading Malaysia",
    "news trading course",
    "automated forex trading Malaysia",
    "forex mentor Indonesia",
  ],
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-MY"
      className={`${generalSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-pine">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([orgSchema, personSchema]),
          }}
        />
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
        <WhatsAppFloat />
        <MotionRoot />
      </body>
    </html>
  );
}
