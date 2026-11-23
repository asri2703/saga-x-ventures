import type { Metadata } from "next";
import { copytrade, exampleSplit } from "@/lib/commercial";
import { getProduct } from "@/lib/products";
import { Container, Section } from "@/components/ui";
import { ProductGuide, type PaymentRoute } from "@/components/product-guide";
import { Panel } from "@/components/shell";

export const metadata: Metadata = {
  alternates: { canonical: "/copytrade" },
  title: "Copytrade",
  description:
    "Follow the master account from your own account. The broker runs the copying and settles the share weekly.",
};

function routes(): PaymentRoute[] {
  return [
    {
      key: "deposit",
      label: "Fund a cent account",
      summary: `Deposit ${copytrade.minimumUsd} USD or more into your own cent account. There is no monthly fee and nothing to subscribe to.`,
      steps: [
        {
          n: 1,
          title: "Open a cent account",
          body: "Cent accounts use smaller contract sizes, so the copying can size your positions in fine steps rather than blunt ones. Open it through the link below.",
          outbound: "broker-cent",
          cta: "Open the account",
        },
        {
          n: 2,
          title: "Fund it",
          body: "The money stays in your own account the whole time. I never hold it and I cannot withdraw it.",
          outbound: null,
          cta: null,
        },
        {
          n: 3,
          title: "Join the copy",
          body: "Link your account to the master through the broker's own copy facility. From then on it mirrors what I do.",
          outbound: "copytrade-join",
          cta: "Join",
        },
      ],
    },
    {
      key: "direct",
      label: "There is no second route",
      summary:
        "Copytrade only works on a funded account, because what is being copied is a trade. There is nothing to subscribe to instead.",
      steps: [
        {
          n: 1,
          title: "Not sure this is the one?",
          body: "If you want something running without a deposit, Fukyaa rents you a server and works with the broker you already have. If you want to learn to place the trades yourself, that is coaching.",
          outbound: null,
          cta: null,
        },
      ],
    },
  ];
}

export default function CopytradePage() {
  const product = getProduct("copytrade")!;
  const split = exampleSplit();

  /* How the fee is worked out.
     
     The figures come from config so the page cannot drift from the terms,
     and every line is a condition rather than an assertion: this is the
     arithmetic of a fee, not an illustration of what anyone earns.

     It renders before the steps, not after the closing ask. A visitor has to
     know what the share is before being walked through joining. */
  const terms = (
    <Section tone="raised">
      <Container>
        <div className="max-w-2xl" data-reveal>
          <h2 className="display text-3xl text-pine sm:text-4xl">
            How the share is worked out
          </h2>
          <p className="mt-4 leading-relaxed text-pine-soft">
            Settled weekly, on whatever the account gained that week. A week
            that does not gain has nothing to settle.
          </p>
        </div>

        <Panel className="mt-10 max-w-3xl">
          <p className="text-sm text-pine-soft">
            Worked through with round numbers, to show the arithmetic
          </p>
          <dl className="mt-5 divide-y divide-rule">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-pine-soft">If an account were funded with</dt>
              <dd className="tnum display text-pine">
                {copytrade.example.funded} USD
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-pine-soft">and the week ended at</dt>
              <dd className="tnum display text-pine">
                {copytrade.example.grown} USD
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-pine-soft">then the week gained</dt>
              <dd className="tnum display text-pine">{split.gain} USD</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-pine-soft">
                of which my share is {copytrade.masterShare}%
              </dt>
              <dd className="tnum display text-pine">{split.master} USD</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-pine-soft">
                and {copytrade.investorShare}% stays in the account
              </dt>
              <dd className="tnum display text-pine">{split.investor} USD</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm leading-relaxed text-pine-soft">
            Round numbers, chosen because the arithmetic is easy to follow. They
            are not a forecast and no week is promised to look like this one.
            The broker calculates and settles the share; its own terms govern
            how.
          </p>
        </Panel>

        {/* Whether a losing week is carried forward is the broker's rule and
            I have not had it confirmed in writing. Saying nothing would let
            a reader assume the answer they prefer. */}
        <p
          className="mt-8 max-w-2xl rounded-[var(--radius-panel)] bg-sand px-7 py-6 leading-relaxed text-pine"
          data-reveal
        >
          How a losing week is treated against the next one is set by the
          broker, not by me. Ask before you join and I will show you their rule
          on it rather than paraphrase it.
        </p>
      </Container>
    </Section>
  );

  return (
    <>
      <ProductGuide
        product={product}
        routes={routes()}
        afterIntro={terms}
        intro={
          <>
            <h1 className="display text-4xl leading-[1.1] text-pine sm:text-5xl">
              Follow a person, not a system
            </h1>

            <div className="mt-7 space-y-5 text-lg leading-relaxed text-pine-soft">
              <p>
                Some people want the trades placed without learning to read a
                chart, and would rather it was a person doing the reading than
                an algorithm. That is what this is.
              </p>
              <p>
                Your account mirrors the master account. The money never leaves
                your side — the broker runs the copying and settles the share
                itself.
              </p>
              <p>I only get paid when the week ends up.</p>
            </div>
          </>
        }
      />

      {/* The fine print, boxed off rather than left floating under a dark
          band. Set in pine-soft, not pine-faint: pine-faint clears 4.5:1 on
          the page paper but only reaches 3.98:1 on this sunk panel, and
          boxing the text is what would have broken it. */}
      <Section className="py-14">
        <Container>
          <p className="max-w-2xl rounded-[var(--radius-panel)] bg-paper-sunk px-7 py-6 text-sm leading-relaxed text-pine-soft">
            Copying a trader carries the same risk as placing the trade
            yourself, including losing money. Nothing here is financial advice
            or a recommendation to buy or sell anything.
          </p>
        </Container>
      </Section>
    </>
  );
}
