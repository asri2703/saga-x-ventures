import { site } from "@/lib/site";

/**
 * Structured data.
 *
 * Kept out of layout.tsx so it can be tested directly — a layout file is a
 * framework entry point with rules about what it may export, and the schema
 * is plain data that deserves its own module either way.
 *
 * Two objects with stable @id values, linked both ways. Google treats a
 * person and the business they run as separate entities, and the link is what
 * tells it they are related rather than two unconnected listings.
 *
 * There is no `sameAs`. The agency-era Facebook and Instagram profiles were
 * removed with the pivot and the trading accounts do not exist yet; declaring
 * the old ones would assert that this domain is still the marketing agency.
 */

const ORG_ID = `${site.url}/#organization`;
const PERSON_ID = `${site.url}/#asri-zulzali`;

export const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: site.name,
  description: site.description,
  url: site.url,
  email: site.email,
  telephone: `+${site.phoneRaw}`,
  areaServed: [
    { "@type": "Country", name: "Malaysia" },
    { "@type": "Country", name: "Indonesia" },
  ],
  founder: { "@id": PERSON_ID },
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: site.address.postcode,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    addressCountry: "MY",
  },
} as const;

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: site.founder.name,
  jobTitle: site.founder.role,
  url: site.url,
  image: `${site.url}${site.founder.photo}`,
  worksFor: { "@id": ORG_ID },
  award: `${site.founder.award.title}, ${site.founder.award.body} ${site.founder.award.year}`,
  knowsAbout: [
    "Forex trading",
    "Technical analysis",
    "Risk management",
    "News trading",
  ],
} as const;
