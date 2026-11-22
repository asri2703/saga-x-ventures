/**
 * Central site configuration.
 *
 * Everything the business says about itself lives here, so it changes in one
 * place. Pages read from this; they do not restate it.
 */

export const site = {
  name: "Saga X Ventures",
  tagline: "Signals, automation and one-to-one coaching for traders",
  description:
    "Asri Zulzali's trading practice. Signals for traders who can already read a chart, automated trading for those who cannot, and one-to-one coaching for anyone who wants to learn. Serving Malaysia and Indonesia.",

  url: "https://sagaxventures.com",

  email: "enquiry@sagaxventures.com",
  phoneDisplay: "+60 13-773 2703",
  phoneRaw: "60137732703", // digits only — used for WhatsApp links

  address: {
    street: "136-1, Jalan Komersial Senawang, Taipan 1",
    postcode: "70450",
    city: "Seremban",
    state: "Negeri Sembilan",
    country: "Malaysia",
  },

  /** Compact form for footers and tight spaces. */
  locationShort: "Seremban, Negeri Sembilan",

  founder: {
    name: "Asri Zulzali",
    role: "Founder",
    /** Lives in /public. Portrait crop works best — it renders 4:5. */
    photo: "/asri-zulzali.jpg",

    /**
     * These two numbers carry the site's entire credibility claim, so read
     * the rule before using them anywhere.
     *
     * `tradersGuided` is a CAREER TOTAL across `yearsExperience` years. It is
     * not a current member count of Mastery Signal or of anything else, it is
     * not verifiable from any database, and copy must never let a reader take
     * it that way. Write "more than 1,200 traders over twelve years", never
     * "1,200 members" or "1,200 active traders". claims-guard: allow
     *
     * There are no performance claims on this site at all. A test enforces
     * the exact wording; see src/lib/__tests__/claims.test.ts.
     */
    yearsExperience: 12,
    tradersGuided: 1200,
  },
} as const;

/** Single-line address — used in the footer and structured data. */
export const fullAddress = `${site.address.street}, ${site.address.postcode} ${site.address.city}, ${site.address.state}`;

/** Pre-filled WhatsApp link. Pass a custom message per page for better context. */
export function waLink(message = "Hi Saga X Ventures, I'd like to ask about trading.") {
  return `https://wa.me/${site.phoneRaw}?text=${encodeURIComponent(message)}`;
}
