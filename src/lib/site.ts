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

    /**
     * An award is a fact about recognition, not a claim about results, which
     * is why it survives the claims rule when almost no other proof does.
     *
     * The year only: the owner does not recall the date and the badge in the
     * photograph is not legible enough to read one off. An invented date
     * would be worse than no date.
     *
     * `alias` is the name on the award screen. He traded under it then. Left
     * unexplained, a different name on an award reads as borrowed; one line
     * turns it into a fact about him.
     */
    award: {
      title: "Best In-House Trader",
      body: "TradingLive Trading Influencers Awards",
      year: 2026,
      alias: "Zack King",
      /* A cut-out, so it needs a surface to stand on rather than filling a
         frame edge to edge. Its dimensions live here with it: the page used
         to carry them as literals, and swapping the image for one of a
         different shape would have left them stale and the layout wrong. */
      image: "/award-2026.webp",
      imageWidth: 553,
      imageHeight: 936,
    },
  },
} as const;

/** Single-line address — used in the footer and structured data. */
export const fullAddress = `${site.address.street}, ${site.address.postcode} ${site.address.city}, ${site.address.state}`;
