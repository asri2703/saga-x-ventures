/**
 * Mastery Signal page content.
 *
 * Kept as data rather than written into the page so the steps, the features
 * and their images can change without touching layout — the same reason
 * site.ts and products.ts exist.
 */

import type { PaymentRoute } from "@/components/product-guide";
import { masteryTiers } from "@/lib/commercial";

/**
 * Mastery Signal's two ways in.
 *
 * Both end at the same place: the client registers at masterysignal.com and
 * is approved by hand. This site never links to /join — that is the card
 * checkout, it has its own customer list, and a second one here would mean
 * two records of who is a member.
 *
 * The order matters and is the whole reason this page exists: registering
 * before there is a funded account behind it leaves people stalled.
 */
export function masterySignalRoutes(): PaymentRoute[] {
  const tiers = masteryTiers
    .map((t) => `${t.name} from ${t.minDepositUsd} USD`)
    .join(", ");

  return [
    {
      key: "deposit",
      label: "Fund a trading account",
      summary: `Deposit into your own trading account and the subscription costs nothing. How much decides which tools you get: ${tiers}.`,
      steps: [
        {
          n: 1,
          title: "Open a standard account",
          body: "Signals are placed on your own account with your own broker. Open it through the link below so I can see your setup when something goes wrong with it.",
          outbound: "broker-standard",
          cta: "Open the account",
        },
        {
          n: 2,
          title: "Fund it to the tier you want",
          body: "The money stays in your account and it is what you trade with. It is not a fee. A tier that outruns your balance will not help you.",
          outbound: null,
          cta: null,
        },
        {
          n: 3,
          title: "Register and choose your tier",
          body: "Submit your account details on the Mastery Signal site. Your access key is emailed once it is verified.",
          outbound: "mastery-membership",
          cta: "Register",
        },
      ],
    },
    {
      key: "direct",
      label: "Pay the subscription instead",
      summary:
        "Would rather not put money into a trading account? Pay for a package here by FPX and the subscription runs on its own.",
      steps: [
        {
          n: 1,
          title: "Choose a package and pay",
          body: "One month, six or twelve. Pick the term, pay by FPX, and your registration details come by email.",
          outbound: null,
          cta: "Choose a package",
          opensCheckout: true,
        },
        {
          n: 2,
          title: "Register and choose Pro",
          body: "Once payment is through, register on the Mastery Signal site with the same email you paid with, and choose Pro. I approve it by hand on that side.",
          outbound: "mastery-membership",
          cta: "Register",
        },
      ],
    },
  ];
}

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
    body: "Entry, stop and target, plus why that level was picked. The reasoning is the part you still have after the trade closes.",
    image: null,
  },
  {
    key: "alerts",
    title: "Alerts that reach you",
    body: "Push notification the moment a setup is posted, so you are not sitting on a dashboard refreshing it.",
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
    body: "Position size worked out from your balance, not copied from someone whose account looks nothing like yours.",
    image: null,
  },
];
