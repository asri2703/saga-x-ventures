import type { Metadata } from "next";
import { Archivo } from "next/font/google";
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
 * The `wdth` axis is requested explicitly — by default Next only ships the
 * weight axis to keep the file small. Width is the typographic device here:
 * display type is this same font at a wider cut, not a second typeface. That
 * is a deliberate avoidance of the cream-background-plus-high-contrast-serif
 * combination that every generated page currently uses.
 *
 * Archivo also carries tabular figures, which matter wherever prices line up.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
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
      className={`${archivo.variable} h-full antialiased`}
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
