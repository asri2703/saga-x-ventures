import type { PaymentRoute } from "@/components/product-guide";
import { fukyaaPlans } from "@/lib/commercial";

/**
 * Fukyaa's two ways in.
 *
 * Deposit enough and the server comes with it. Deposit less, or bring the
 * broker you already use, and rent the server monthly instead.
 *
 * The figure is read from `fukyaaPlans` rather than written down. It used to
 * be read through a dated `fukyaaDeposit()` for the same reason — one place
 * to state it — and that the date is gone does not change the reason.
 */
export function fukyaaRoutes(): PaymentRoute[] {
  const included = fukyaaPlans.find((p) => p.key === "included-vps")!;
  const rented = fukyaaPlans.find((p) => p.key === "rented-vps")!;

  return [
    {
      key: "deposit",
      label: "Fund a Harmovest account",
      summary: `Deposit ${included.depositUsd.toLocaleString("en-MY")} USD into a cent account and the server is included — nothing monthly.`,
      steps: [
        {
          n: 1,
          title: "Open a cent account",
          body: "Cent accounts use smaller contract sizes, so the EA can size positions finely. Open it through the link below.",
          outbound: "broker-cent",
          cta: "Open the account",
        },
        {
          n: 2,
          title: "Fund it",
          body: `The money stays in your account. It is what the EA trades with, not a fee.`,
          outbound: null,
          cta: null,
        },
        {
          n: 3,
          title: "Register for auto trade",
          body: "The EA runs on a server, not your machine, so it keeps trading when your laptop is shut.",
          outbound: "fukyaa-register",
          cta: "Register",
        },
      ],
    },
    {
      key: "direct",
      label: "Deposit less, rent the server",
      summary: `Start at ${rented.depositUsd.toLocaleString("en-MY")} USD and rent the server monthly instead, or keep the broker you already use. Harmovest is what I recommend, not a requirement.`,
      steps: [
        {
          n: 1,
          title: "Fund a cent account, or use the broker you have",
          body: "Any broker that allows an expert advisor will do.",
          outbound: null,
          cta: null,
        },
        {
          n: 2,
          title: "Rent the VPS",
          body: "A server that stays on, so the EA does too. Billed monthly, cancel when you want.",
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
