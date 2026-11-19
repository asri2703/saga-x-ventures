/**
 * Central site configuration.
 *
 * Saga X Ventures is the parent brand. Mastery Signal and Fukyaa are the
 * products under it; Traders Lounge is a section of this site, not a brand of
 * its own — it has no logo, no palette and no domain. Two brand layers, not
 * three, because a third would make the thing it is meant to fix worse.
 */

export const site = {
  name: "Saga X Ventures",
  tagline: "Beyond Trading.",

  /** Plain-language line that sits under the tagline. The tagline sets tone; this one is understood. */
  plain: "Belajar trade sendiri, atau biar sistem yang jalan. Dua jalan, satu tempat.",

  description:
    "Saga X Ventures membantu trader Malaysia pilih jalan yang betul — belajar trade sendiri dengan kursus dan signal, atau jalankan trading automatik. Jawab tiga soalan dan kami tunjuk yang mana sesuai.",

  url: "https://sagaxventures.com",

  email: "enquiry@sagaxventures.com",
  phoneDisplay: "+60 13-773 2703",
  phoneRaw: "60137732703",

  locationShort: "Negeri Sembilan, Malaysia",

  social: {
    facebook: "https://www.facebook.com/sagaxmedia",
    instagram: "https://www.instagram.com/sagaxmarketing",
    youtube: "",
    linkedin: "",
  },

  founder: {
    name: "Asri Zulzali",
    role: "Pengasas",
    photo: "/asri-zulzali.jpg",
  },

  /**
   * One sentence that must appear on every product page, not only the footer.
   * Trading carries real loss; saying so plainly is both the honest thing and
   * the thing that separates this from the hype in the same category.
   */
  riskLine:
    "Trading melibatkan risiko kerugian. Prestasi lepas bukan jaminan hasil masa depan, dan awak boleh kehilangan sebahagian atau keseluruhan modal.",
} as const;

/** Pre-filled WhatsApp link. Pass a message per page so context travels with the enquiry. */
export function waLink(message = "Hi Saga X Ventures, saya nak tanya pasal trading.") {
  return `https://wa.me/${site.phoneRaw}?text=${encodeURIComponent(message)}`;
}
