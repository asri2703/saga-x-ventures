import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionRoot } from "@/components/motion-root";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  // Malay first. These are the words the buyer actually types; the brand looks
  // international, but nobody searches for it in English here.
  keywords: [
    "belajar trading Malaysia",
    "kursus trading",
    "robot trading",
    "trading automatik",
    "signal forex Malaysia",
    "kelas trading online",
    "EA forex Malaysia",
  ],
  openGraph: {
    type: "website",
    locale: "ms_MY",
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
 * Organization rather than LocalBusiness.
 *
 * The previous build declared a street address and a Google Business Profile.
 * Both are gone — the office is closed and the listing retired — and leaving
 * them in structured data would be telling Google something untrue about a
 * place that no longer trades. Organization describes a business that exists
 * without claiming a counter you can walk into.
 */
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  slogan: site.tagline,
  description: site.description,
  url: site.url,
  email: site.email,
  telephone: `+${site.phoneRaw}`,
  areaServed: { "@type": "Country", name: "Malaysia" },
  founder: { "@type": "Person", name: site.founder.name },
  sameAs: [site.social.facebook, site.social.instagram, site.social.youtube].filter(
    Boolean,
  ),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ms-MY"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-mist text-text">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-dark"
        >
          Terus ke kandungan
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <MotionRoot />
      </body>
    </html>
  );
}
