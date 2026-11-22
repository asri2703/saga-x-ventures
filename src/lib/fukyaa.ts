import type { PaymentRoute } from "@/components/product-guide";
import { fukyaa, fukyaaDeposit } from "@/lib/commercial";

/**
 * Fukyaa's two ways in.
 *
 * Deposit to a Harmovest account and the VPS is included. Or bring whatever
 * broker you already use and rent the VPS monthly instead.
 *
 * The deposit figure is read through `fukyaaDeposit` rather than written
 * down, so the promotional number stops being shown by itself on 1 January.
 */
export function fukyaaRoutes(now: Date = new Date()): PaymentRoute[] {
  const deposit = fukyaaDeposit(now);

  return [
    {
      key: "deposit",
      label: "Fund a Harmovest account",
      summary: deposit.isPromo
        ? `Deposit ${deposit.usd} USD into a cent account and the VPS is included — no monthly fee. That figure is a promotion and runs until ${fukyaa.promoEndsOn}.`
        : `Deposit ${deposit.usd} USD into a cent account and the VPS is included — no monthly fee.`,
      steps: [
        {
          n: 1,
          title: "Open a cent account",
          body: "Cent accounts use smaller contract sizes, which is what lets the EA size positions finely instead of in big steps. Open it through the link below.",
          outbound: "broker-cent",
          cta: "Open the account",
        },
        {
          n: 2,
          title: "Fund it",
          body: `The money stays in your account and it is what the EA trades with. It is not a fee paid to anyone.`,
          outbound: null,
          cta: null,
        },
        {
          n: 3,
          title: "Register for auto trade",
          body: "Register the account and the EA runs on a server rather than on your own machine, so it keeps trading when your laptop is shut.",
          outbound: "fukyaa-register",
          cta: "Register",
        },
      ],
    },
    {
      key: "direct",
      label: "Use your own broker, rent the VPS",
      summary: `Already trading somewhere you are happy with? Keep that broker and rent the server monthly instead. Harmovest is what I recommend, not a requirement.`,
      steps: [
        {
          n: 1,
          title: "Use the broker you already have",
          body: "Any broker that allows an expert advisor will do. The EA does not care whose platform it runs on.",
          outbound: null,
          cta: null,
        },
        {
          n: 2,
          title: "Rent the VPS",
          body: "A server that stays on, so the EA keeps working when your computer does not. Billed monthly, cancel when you want.",
          outbound: null,
          cta: null,
        },
        {
          n: 3,
          title: "Register for auto trade",
          body: "Same registration, same EA. Only the account underneath it is different.",
          outbound: "fukyaa-register",
          cta: "Register",
        },
      ],
    },
  ];
}
