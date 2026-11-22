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

export type OutboundKey =
  | "mastery-broker"
  | "mastery-membership"
  | "fukyaa-broker"
  | "fukyaa-register"
  | "whatsapp";

/**
 * The broker is the same company for both products but the invite codes are
 * different, and that is how the broker attributes each one. Swapping them
 * silently sends the commission to the wrong product, so they are declared
 * once, here, and never inlined anywhere else.
 */
export const outbound: Record<OutboundKey, string> = {
  "mastery-broker":
    "https://platform.hmvestportal.com/regist-real?invitid=1AA974-WAVJR35865",
  "mastery-membership": "https://www.masterysignal.com/membership",
  "fukyaa-broker":
    "https://platform.hmvestportal.com/regist-real?invitid=004VL9-TRMRV13456",
  "fukyaa-register": "https://fukyaa.com/register",
  whatsapp: "https://wa.me/60137732703",
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
  /** The first action. `/go/<OutboundKey>` when external. */
  href: string;
  external: boolean;
};

export const products: Product[] = [
  {
    key: "mastery-signal",
    name: "Mastery Signal",
    forWho: "I can trade. I just need the setups.",
    summary:
      "Live signals with the reasoning attached, so you are reading the market rather than copying someone who is.",
    steps: [
      { label: "Open a broker account", outbound: "mastery-broker" },
      { label: "Fund it to match the package you want", outbound: null },
      { label: "Take out membership", outbound: "mastery-membership" },
    ],
    requirement: "Deposit sized to the package you choose",
    href: "/go/mastery-broker",
    external: true,
  },
  {
    key: "fukyaa",
    name: "Fukyaa AI Auto Trade",
    forWho: "I don't know how to trade.",
    summary:
      "An expert advisor places the trades for you. You fund the account and leave it running.",
    steps: [
      { label: "Open a broker account", outbound: "fukyaa-broker" },
      { label: "Fund it with at least 500 USD", outbound: null },
      { label: "Register for auto trade", outbound: "fukyaa-register" },
    ],
    requirement: "Minimum 500 USD deposit",
    href: "/go/fukyaa-broker",
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
    href: "/coaching",
    external: false,
  },
];

export function getProduct(key: string): Product | undefined {
  return products.find((p) => p.key === key);
}
