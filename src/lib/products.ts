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
import { copytrade, fukyaaPlans } from "@/lib/commercial";

export type OutboundKey =
  | "broker-cent"
  | "broker-standard"
  | "mastery-membership"
  | "mastery-site"
  | "mastery-broker-access"
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
  // The product's own front door. The menu and the footer send people
  // straight here rather than to a page on this site, because that is where
  // Mastery Signal actually lives — through /go, like every other outbound
  // link, so the click is counted and the address is written once.
  "mastery-site": "https://www.masterysignal.com/",
  // The other way in: no subscription, access earned by funding a broker
  // account instead. A separate page on the product's own site, and a
  // separate key so the two routes stay countable apart — which is the whole
  // reason this redirect exists.
  "mastery-broker-access": "https://www.masterysignal.com/ads/signal",
  "fukyaa-register": "https://fukyaa.com/register",
  // Not set up yet. Empty rather than absent so the type stays closed and a
  // step renders a placeholder instead of linking to the current page.
  "copytrade-join": "",
  // Built from site.ts rather than copied. A second set of digits means
  // changing the number updates the footer, the tel: link and the schema
  // while the float on every page keeps dialling the old one.
  whatsapp: `https://wa.me/${site.phoneRaw}`,
};

export type ProductKey =
  | "mastery-signal"
  | "copytrade"
  | "fukyaa"
  | "coaching"
  | "broker-partnership"
  | "fintech-innovation";

/**
 * Who buys it.
 *
 * `retail` is a trader buying for themselves. `ib` is someone with a network
 * of their own. Only the retail lane reaches navigation, because the two IB
 * products have no page yet and a nav entry that goes nowhere is worse than
 * no entry.
 */
export type ProductLane = "retail" | "ib";

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
  /**
   * The qualifier that decides whether someone should bother.
   *
   * Still a function rather than a string, and still derived from
   * `commercial.ts` rather than written down — that is what keeps it from
   * contradicting the figures on the homepage.
   *
   * It took a `Date` until 24 November 2026, because Fukyaa's minimum was
   * promotional and fell back on a known day. The packages replaced that, no
   * product's qualifier depends on the clock any more, and the argument went
   * with the last one that used it — along with the `revalidate` windows the
   * three pages carried only to keep a dated figure fresh.
   */
  requirement: () => string | null;
  /**
   * Which broker account type this product needs.
   *
   * This is what actually divides the products — the two invite codes are
   * per account type, not per product, and three products share two codes.
   * null where no broker account is involved.
   */
  account: "cent" | "standard" | null;
  lane: ProductLane;
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
    requirement: () => "Deposit sized to the tier you choose",
    account: "standard",
    lane: "retail",
    /* Straight to its own site.
       This used to open /mastery-signal, a page here that explained the
       order — account, funding, then membership — because dropping someone
       on a broker signup they cannot finish produced dead registrations.
       masterysignal.com does that job itself and is where the product
       actually lives, so the menu and the footer send people there. The
       homepage still carries the packages and the checkout. */
    href: "/go/mastery-site",
    cta: "See how to join",
    external: true,
  },
  {
    key: "fukyaa",
    name: "Fukyaa AI Auto Trade",
    forWho: "I don't know how to trade.",
    summary:
      "An expert advisor places the trades. You fund the account and leave it running.",
    steps: [
      { label: "Open a cent account", outbound: "broker-cent" },
      { label: "Fund it to the minimum", outbound: null },
      { label: "Register for auto trade", outbound: "fukyaa-register" },
    ],
    /* The smallest of the packages, read from them rather than written
       down. The figure used to be dated and is not any more; what has not
       changed is that two places stating it separately is how they come to
       disagree. */
    requirement: () =>
      `Minimum ${Math.min(...fukyaaPlans.map((p) => p.depositUsd)).toLocaleString("en-MY")} USD deposit`,
    account: "cent",
    lane: "retail",
    // Same reasoning as Mastery Signal: a cent account alone does nothing
    // until it is funded and the EA registered. The page explains the order.
    href: "/fukyaa",
    cta: "See how to start",
    external: false,
  },
  {
    key: "copytrade",
    name: "Copytrade",
    forWho: "I'd rather follow a person than a system.",
    summary:
      "You follow the master account from your own account. The money stays with you; the broker runs the copying and settles the share weekly.",
    steps: [
      { label: "Open a cent account", outbound: "broker-cent" },
      { label: "Fund it with the minimum", outbound: null },
      { label: "Join the copy", outbound: "copytrade-join" },
    ],
    requirement: () =>
      `Minimum ${copytrade.minimumUsd.toLocaleString("en-MY")} USD deposit`,
    account: "cent",
    lane: "retail",
    href: "/copytrade",
    cta: "See how it works",
    external: false,
  },
  {
    key: "coaching",
    name: "Coaching",
    forWho: "I want to learn properly.",
    summary:
      "One to one, a day per class, from reading a chart to trading the news.",
    steps: [],
    requirement: () => null,
    account: null,
    lane: "retail",
    href: "/coaching",
    cta: "See the classes",
    external: false,
  },
  {
    key: "broker-partnership",
    name: "Broker Partnership",
    forWho: "I have a network of my own.",
    summary:
      "Offer these products to the people you already talk to. No cost to start.",
    steps: [],
    requirement: () => null,
    account: null,
    lane: "ib",
    href: "/go/whatsapp?m=partnership",
    cta: "Talk it through",
    external: true,
  },
  {
    key: "fintech-innovation",
    name: "Fintech Innovation",
    forWho: "I want the platform under my own name.",
    summary:
      "A signal platform built and branded as yours, rather than you sending clients to someone else's.",
    steps: [],
    requirement: () => null,
    account: null,
    lane: "ib",
    href: "/go/whatsapp?m=partnership",
    cta: "Talk it through",
    external: true,
  },
];

/** A trader buying for themselves. The only lane in navigation. */
export const retailProducts = products.filter((p) => p.lane === "retail");

/** Someone with a network of their own. No page yet; see §3 of the spec. */
export const ibProducts = products.filter((p) => p.lane === "ib");

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
  partnership: "Hi Asri, I have a network of my own and want to talk about partnership. ",
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
