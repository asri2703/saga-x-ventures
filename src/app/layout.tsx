import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
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
  // Local terms first, deliberately. "Marketing agency Seremban" is winnable
  // within months; "marketing agency Malaysia" is a years-long fight against
  // established agencies. Rank locally, then widen.
  keywords: [
    "marketing agency Seremban",
    "digital marketing Negeri Sembilan",
    "web design Seremban",
    "Google Ads agency Seremban",
    "SEO Seremban",
    "web development Malaysia",
    "digital marketing for SME Malaysia",
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

/**
 * LocalBusiness structured data. This is what lets Google show your business
 * details in search — worth having from day one, and it demonstrates the SEO
 * work you sell.
 */
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.name,
  description: site.description,
  url: site.url,
  email: site.email,
  telephone: `+${site.phoneRaw}`,
  areaServed: { "@type": "Country", name: "Malaysia" },
  /**
   * No `sameAs`. The agency-era Facebook and Instagram handles were removed
   * rather than left declaring the old business as this one, and the trading
   * accounts do not exist yet. Declaring nothing is correct; declaring the
   * wrong profiles would tell Google this domain is the marketing agency.
   */
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: site.address.postcode,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    addressCountry: "MY",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-MY"
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {/* Keyboard users should be able to jump past the nav. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
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
