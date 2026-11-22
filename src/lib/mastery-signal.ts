/**
 * Mastery Signal page content.
 *
 * Kept as data rather than written into the page so the steps, the features
 * and their images can change without touching layout — the same reason
 * site.ts and products.ts exist.
 */

export type JoinStep = {
  n: number;
  title: string;
  body: string;
  /** The outbound key this step hands over to, if it leaves the site. */
  outbound: "mastery-broker" | "mastery-membership" | null;
  cta: string | null;
};

/**
 * The order matters and is the whole reason this page exists: membership
 * means nothing without a funded account, so anyone sent straight to the
 * signup form registers and then stalls.
 */
export const joinSteps: JoinStep[] = [
  {
    n: 1,
    title: "Open a broker account",
    body: "Signals are placed on your own account with your own broker. Open it through the link below so the account is tied to this desk — that is what lets us see your setup when something goes wrong with it.",
    outbound: "mastery-broker",
    cta: "Open the account",
  },
  {
    n: 2,
    title: "Fund it to match the package you want",
    body: "The deposit is not a fee to us — it stays in your account and it is what you trade with. How much depends on which membership package you take, and a package that outruns your balance will not help you.",
    outbound: null,
    cta: null,
  },
  {
    n: 3,
    title: "Take out membership",
    body: "Pick the package on the Mastery Signal site. Once payment is through, your access key is issued against your email.",
    outbound: "mastery-membership",
    cta: "See the packages",
  },
  {
    n: 4,
    title: "I approve you by hand",
    body: "Every member is approved manually. It is slower than a self-serve signup and it is deliberate: it is how the people who come through here stay identifiable as mine, and it is why I know who you are when you message.",
    outbound: null,
    cta: null,
  },
];

export type Feature = {
  key: string;
  title: string;
  body: string;
  /**
   * Lives in /public. `null` renders a labelled placeholder so the layout is
   * reviewable before the screenshots exist.
   */
  image: string | null;
};

export const features: Feature[] = [
  {
    key: "signals",
    title: "Signals with the reasoning attached",
    body: "Entry, stop and target, plus why the level was chosen. Copying a number teaches you nothing; the reasoning is the part you keep.",
    image: null,
  },
  {
    key: "alerts",
    title: "Alerts that reach you",
    body: "Push notification the moment a setup is posted, so you are not refreshing a dashboard waiting for one.",
    image: null,
  },
  {
    key: "insights",
    title: "Market insight before the week opens",
    body: "What is scheduled, what it usually does to spreads, and which pairs are worth watching.",
    image: null,
  },
  {
    key: "dashboard",
    title: "One dashboard, on any device",
    body: "It installs to your phone like an app. Open positions, history and the current call in one place.",
    image: null,
  },
  {
    key: "risk",
    title: "Risk sizing built in",
    body: "Position size worked out from your balance rather than copied from someone whose account is nothing like yours.",
    image: null,
  },
];
