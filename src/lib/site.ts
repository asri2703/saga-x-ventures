/**
 * Central site configuration.
 *
 * >>> EDIT THIS FILE FIRST. <<<
 * Everything marked TODO is a placeholder — change it to your real details
 * and it updates everywhere on the site at once.
 */

export const site = {
  name: "Sagax Ventures",
  tagline: "Marketing & development for Malaysian SMEs",
  description:
    "We build the website, run the ads, and fix the SEO — one team, one invoice, one person accountable. Serving small and medium businesses across Malaysia.",

  // TODO: replace with your real domain once you buy it
  url: "https://sagaxventures.com",

  email: "enquiry@sagaxventures.com",
  phoneDisplay: "+60 13-773 2703",
  phoneRaw: "60137732703", // digits only, no + or spaces — used for WhatsApp links

  /**
   * Broken into parts so the LocalBusiness schema can use each field
   * separately. A complete, consistent address is what lets Google connect
   * this site to your Google Business Profile — the single biggest local
   * ranking factor for an SME.
   */
  address: {
    street: "136-1, Jalan Komersial Senawang, Taipan 1",
    postcode: "70450",
    city: "Seremban",
    state: "Negeri Sembilan",
    country: "Malaysia",
  },

  /** Compact form for footers and tight spaces. */
  locationShort: "Seremban, Negeri Sembilan",

  // TODO: add your social profiles (leave "" to hide the link)
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
  },

  founder: {
    name: "Asri Zulzali",
    role: "Founder",
    /** Lives in /public. Portrait crop works best — it renders 4:5. */
    photo: "/asri-zulzali.jpg",
  },
} as const;

/** Single-line address — used in the footer and structured data. */
export const fullAddress = `${site.address.street}, ${site.address.postcode} ${site.address.city}, ${site.address.state}`;

/** Pre-filled WhatsApp link. Pass a custom message per page for better context. */
export function waLink(message = "Hi Sagax Ventures, I'd like a free audit.") {
  return `https://wa.me/${site.phoneRaw}?text=${encodeURIComponent(message)}`;
}
