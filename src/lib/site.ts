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

  // TODO: replace with your real email address
  email: "hello@sagaxventures.com",
  phoneDisplay: "+60 13-773 2703",
  phoneRaw: "60137732703", // digits only, no + or spaces — used for WhatsApp links
  // TODO: confirm — change if you are not based in KL
  location: "Kuala Lumpur, Malaysia",

  // TODO: add your social profiles (leave "" to hide the link)
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
  },

  // TODO: your name — SMEs buy from people, not logos
  founder: {
    name: "Asri",
    role: "Founder",
  },
} as const;

/** Pre-filled WhatsApp link. Pass a custom message per page for better context. */
export function waLink(message = "Hi Sagax Ventures, I'd like a free audit.") {
  return `https://wa.me/${site.phoneRaw}?text=${encodeURIComponent(message)}`;
}
