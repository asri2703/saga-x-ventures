/**
 * The three things a visitor can be sent to.
 *
 * Two of them live on other sites and are promoted by other people as well,
 * which is the whole reason this site exists: a person who arrives through a
 * link here is identifiably ours. Every outbound link therefore goes through
 * `/go/<OutboundKey>` rather than straight out.
 *
 * Note that `ProductKey` and `OutboundKey` are deliberately separate
 * namespaces. A product is not one link — Mastery Signal and Fukyaa each need
 * a broker account and a deposit before the thing itself — so a product's
 * `href` names its FIRST action, and `steps` carries the rest.
 */

import { site } from "@/lib/site";

export type OutboundKey =
  | "broker-cent"
  | "broker-standard"
  | "mastery-membership"
  | "fukyaa-register"
  | "copytrade-join"
  | "whatsapp";

/**
 * The broker is the same company for both products but the invite codes are
 * different, and that is how the broker attributes each one. Swapping them
 * silently sends the commission to the wrong product, so they are declared
 * once, here, and never inlined anywhere else.
 */
export const outbound: Record<OutboundKey, string> = {
  // Cent: smaller contract sizes, which is why the EA and copy-trading
  // products sit here — finer position sizing, smaller risk per step.
  "broker-cent":
    "https://platform.hmvestportal.com/regist-real?invitid=004VL9-TRMRV13456",
  "broker-standard":
    "https://platform.hmvestportal.com/regist-real?invitid=1AA974-WAVJR35865",
  // Both routes through this site end here: the client registers, chooses
  // their tier, and is approved by hand. This site never links to /join,
  // which is the card checkout and has its own customer list.
  "mastery-membership": "https://www.masterysignal.com/membership",
  "fukyaa-register": "https://fukyaa.com/register",
  // Not set up yet. Empty rather than absent so the type stays closed and a
  // step renders a placeholder instead of linking to the current page.
  "copytrade-join": "",
  // Built from site.ts rather than copied. A second set of digits means
  // changing the number updates the footer, the tel: link and the schema
  // while the float on every page keeps dialling the old one.
  whatsapp: `https://wa.me/${site.phoneRaw}`,
};

export type ProductKey = "mastery-signal" | "fukyaa" | "coaching";

export type Step = {
  label: string;
  /** null when the step happens elsewhere, e.g. funding an account. */
  outbound: OutboundKey | null;
};

export type Product = {
  key: ProductKey;
  name: string;
  /** The visitor's own words — the question this product answers. */
  forWho: string;
  summary: string;
  steps: Step[];
  /** The qualifier that decides whether someone should bother. */
  requirement: string | null;
  /**
   * Which broker account type this product needs.
   *
   * This is what actually divides the products — the two invite codes are
   * per account type, not per product, and three products share two codes.
   * null where no broker account is involved.
   */
  account: "cent" | "standard" | null;
  /** The first action. `/go/<OutboundKey>` when external. */
  href: string;
  /**
   * What the button says. Derived from `external` until Mastery Signal got a
   * page: the label flipped to "See the classes" on a product that has no
   * classes, because one boolean was standing in for three different actions.
   */
  cta: string;
  external: boolean;
};

export const products: Product[] = [
  {
    key: "mastery-signal",
    name: "Mastery Signal",
    forWho: "I can trade. I just need the setups.",
    summary:
      "Live signals with the level and the reason for it, so you can check the call before you take it.",
    steps: [
      { label: "Open a standard account", outbound: "broker-standard" },
      { label: "Fund it to match the package you want", outbound: null },
      { label: "Take out membership", outbound: "mastery-membership" },
    ],
    requirement: "Deposit sized to the tier you choose",
    account: "standard",
    // Mastery Signal has a page here now. Sending someone straight to a
    // broker signup they cannot complete — it needs a funded account before
    // membership means anything — produced dead registrations. The page
    // explains the order first, then hands over the same links.
    href: "/mastery-signal",
    cta: "See how to join",
    external: false,
  },
  {
    key: "fukyaa",
    name: "Fukyaa AI Auto Trade",
    forWho: "I don't know how to trade.",
    summary:
      "An expert advisor places the trades. You fund the account and leave it running.",
    steps: [
      { label: "Open a cent account", outbound: "broker-cent" },
      { label: "Fund it with at least 500 USD", outbound: null },
      { label: "Register for auto trade", outbound: "fukyaa-register" },
    ],
    requirement: "Minimum 500 USD deposit",
    account: "cent",
    href: "/go/broker-cent",
    cta: "Open an account",
    external: true,
  },
  {
    key: "coaching",
    name: "Coaching",
    forWho: "I want to learn properly.",
    summary:
      "One to one, a day per class, from reading a chart to trading the news.",
    steps: [],
    requirement: null,
    account: null,
    href: "/coaching",
    cta: "See the classes",
    external: false,
  },
];

export function getProduct(key: string): Product | undefined {
  return products.find((p) => p.key === key);
}

/**
 * WhatsApp prefills.
 *
 * Every WhatsApp call to action goes through /go/whatsapp so the volume is
 * counted, which means the per-page opening line cannot live in the href any
 * more. The page passes a key, the route resolves the sentence.
 *
 * An unrecognised key falls back to the general line rather than failing:
 * a bad key is our bug, and dropping a visitor to protect a counter would be
 * the wrong trade.
 */
export const whatsappPrefills = {
  general: "Hi Saga X Ventures, I have a question.",
  coaching: "Hi Asri, I'd like to ask about coaching. I'm interested in: ",
  contact: "Hi Asri, I have a question about ",
  events: "Hi, when is the next session?",
  topic: "Hi Asri, something I'd like you to write about: ",
} as const;

export type WhatsAppPrefill = keyof typeof whatsappPrefills;

export function whatsappUrl(key: string | null): string {
  const prefill =
    key && Object.hasOwn(whatsappPrefills, key)
      ? whatsappPrefills[key as WhatsAppPrefill]
      : whatsappPrefills.general;
  return `${outbound.whatsapp}?text=${encodeURIComponent(prefill)}`;
}
