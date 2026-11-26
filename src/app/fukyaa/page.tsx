import type { Metadata } from "next";
import { fukyaa, fukyaaPlans, formatMyr, formatUsd } from "@/lib/commercial";
import {
  lastReportAt,
  recordDays,
  recordFunding,
  recordLots,
  summarise,
  todayInMalaysia,
  usd,
} from "@/lib/record";
import { divisorFor, recordAccounts } from "@/lib/record-accounts";
import {
  lotsPerDayPer1000,
  outcomes,
  performance,
} from "@/lib/record-outcomes";
import {
  AutoTradeFlow,
  type FlowPackage,
  type FlowStep,
} from "@/components/auto-trade-flow";
import { FollowReplay } from "@/components/follow-replay";
import { ProfitCalculator } from "@/components/profit-calculator";
import { RecordChart } from "@/components/record-chart";
import { RecordPanel } from "@/components/record-panel";
import { RecordTabs } from "@/components/record-tabs";
import { SectionHeading } from "@/components/section-heading";
import { AiMesh } from "@/components/ai-mesh";
import { WhyAi } from "@/components/why-ai";
import { Container, Section } from "@/components/ui";
import {
  ActionSweep,
  ActionOut,
  Eyebrow,
  Scallop,
  TextLink,
} from "@/components/shell";

/* The record is read from the feed at render, as /copytrade reads it. */
export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/fukyaa" },
  title: "AI Auto Trade",
  description:
    "Rent the server a trading robot runs on. It trades your own account while your laptop is off. Deposit less and rent monthly, or deposit more and the server is included.",
};

/**
 * AI Auto Trade.
 *
 * Eight sections, in the owner's own order: what it is, what renting means,
 * why anyone would, what the robot has done, what a deposit would mean,
 * what it would have done with the reader's money, how to start, and the
 * questions people ask first.
 *
 * It is the same robot as /copytrade, so most of this page is that page's
 * machinery pointed at a different commercial arrangement — the record, the
 * calculator and the replay are the same components reading the same
 * accounts. What differs is the fee, and the fee is what every honest
 * difference on this page comes from:
 *
 *   Copytrade  — a share of the month's gain. Nothing in a flat month.
 *   This       — a flat monthly rent. Due in a flat month too.
 *
 * So the calculator does not subtract a share, the reasons grid ends on the
 * flat fee rather than dressing it up, and the line under the packages says
 * the uncomfortable half out loud. The rent stays in ringgit everywhere and
 * is never mixed into a dollar figure: this site has no exchange rate, on
 * purpose, and inventing one would put a number on the page nobody set.
 *
 * Nothing on this page animates a balance.
 */

const STEPS: FlowStep[] = [
  {
    key: "account",
    title: "Open a cent account",
    body: "The robot trades on a cent account. Keep the MT5 login and password you are given.",
    href: "/go/broker-cent",
    cta: "Open the account",
  },
  {
    key: "verify",
    title: "Verify it",
    body: "Upload your ID or passport. The broker has to approve it before you can deposit.",
  },
  {
    key: "deposit",
    title: "Deposit",
    body: "At least {deposit}, into your own account. You can withdraw it yourself.",
  },
];

const FAQ = [
  {
    q: "What is an EA?",
    a: "A program that places trades by its own rules. This one is Fukyaa. It watches the market and opens and closes positions without being told.",
  },
  {
    q: "Do I need to know how to trade?",
    a: "No. That is the whole point of it. You will want to know enough to judge whether to keep going, and the record above is there for that.",
  },
  {
    q: "What am I actually paying for?",
    a: "A server that stays switched on, with the robot and your account logged into it. Your laptop can be shut. On the larger deposit the server comes with it and there is nothing monthly.",
  },
  {
    q: "What happens if I stop paying?",
    a: "The server stops and the robot stops with it. Your account and the money in it are untouched — they were never mine to touch.",
  },
  {
    q: "Does it renew by itself?",
    a: "No. One payment buys one month. You get an email before it runs out, and you pay again only if you want to carry on.",
  },
  {
    q: "Can I lose money?",
    a: "Yes. It trades with leverage and it has losing days — they are in the record above, not hidden from it. Only deposit what you can afford to lose.",
  },
  {
    q: "Is my money with you?",
    a: "No. The account is with the broker, in your name. You deposit into it and you withdraw from it yourself. I never hold or move your funds.",
  },
  {
    q: "Can I use a broker I already have?",
    a: "Any broker that allows an expert advisor will do. The one I link to is what I recommend and what the deposit figures above assume.",
  },
];

export default async function FukyaaPage() {
  const rented = fukyaaPlans.find((plan) => plan.key === "rented-vps")!;
  const included = fukyaaPlans.find((plan) => plan.key === "included-vps")!;
  const rent = formatMyr(fukyaa.vpsMonthlyMyr);

  /* The larger deposit first: the owner would rather people took it, and
     over a year it is also the cheaper of the two.

     The smaller package ends in a payment whose Billplz route is not built
     yet — the checkout resolves Mastery's terms only — so until it is, its
     last step is the arrangement that already works. */
  const packages: FlowPackage[] = [
    {
      key: included.key,
      name: included.name,
      deposit: formatUsd(included.depositUsd),
      rent: "Included",
      rentUnit: "server",
      year: formatMyr(0),
      finish: {
        title: "Register",
        body: "No rent to pay. Register, and I connect your account to the server. You get an email when it is running.",
        cta: "Register",
        href: "/go/fukyaa-register",
      },
    },
    {
      key: rented.key,
      name: rented.name,
      deposit: formatUsd(rented.depositUsd),
      rent,
      rentUnit: "server, a month",
      /* Twelve times a figure the owner changes, so computed here. */
      year: formatMyr(fukyaa.vpsMonthlyMyr * 12),
      finish: {
        title: "Rent the server",
        body: `${rent} pays for one month. Your registration link comes by email, and so does a reminder before the month ends.`,
        cta: "Rent the server",
        href: "/go/whatsapp?m=server",
      },
    },
  ];

  /* The same accounts /copytrade publishes, because they run this robot. */
  const records = await Promise.all(
    recordAccounts().map(async (account) => {
      const [days, funding, lastAt, lots] = await Promise.all([
        recordDays(account.login),
        recordFunding(account.login),
        lastReportAt(account.login),
        recordLots(account.login),
      ]);
      return { account, days, funding, lastAt, lots };
    }),
  );
  const today = todayInMalaysia();

  /* The calculator and the replay run on the longest record, not the
     newest account: a window is twenty-one trading days and the newest
     cannot supply one. They are the same robot on the same settings, which
     is what makes the substitution honest, and the longest record is also
     the only one holding a losing stretch — the half a buyer most needs. */
  const longest = records.reduce<(typeof records)[number] | null>(
    (best, record) =>
      best === null || record.days.length > best.days.length ? record : best,
    null,
  );
  const spread = longest ? outcomes(longest.days) : null;
  const longestLots = longest
    ? lotsPerDayPer1000(
        longest.days,
        longest.lots,
        divisorFor(longest.account.unit),
      )
    : null;

  return (
    <>
      {/* ---------------------------------------------------------------
          1. The hero.
      --------------------------------------------------------------- */}
      <Section
        className="relative overflow-hidden"
        pad="pt-16 pb-12 sm:pt-24 sm:pb-16"
      >
        <div aria-hidden className="hero-grid absolute inset-0" />
        <Container className="relative">
          {/* No eyebrow. The owner's headline names the product itself,
              and a label above it saying the same words twice would spend
              the top of the page repeating. */}
          {/* Two columns from `lg` up: the drawing belongs beside the
              headline, not under it. Below that it stacks, and the headline
              keeps its measure either way. */}
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="max-w-3xl" data-reveal>
            {/* The owner's headline. "AI Handle" is his; "handles" is the
                only change, because a display line is the one place on a
                page where a slip is read as carelessness about everything
                under it. */}
            <h1 className="display text-6xl leading-[1.05] text-pine">
              Your Account, AI Handles Everything
            </h1>
            {/* His sentence, with one repetition taken out: the draft said
                the trades go "through the system while the AI handles the
                trading activity", which is the same half twice. What stays
                is the part a reader needs — whose account it is, and who
                places the trades in it. */}
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-pine-soft">
              Fukyaa is an AI auto-trading system. It connects to your own
              account and places the trades there, while the AI handles the
              trading.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              {/* One action. The record is a section away, and a hero that
                  offers two doors points at neither. */}
              <ActionSweep href="#start">Subscribe AI Now</ActionSweep>
            </div>
          </div>

            <div data-reveal>
              <AiMesh />
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          2. What it is, and how it trades.

          The owner's two halves: what the thing is, and what it does all
          day. The price used to stand here, and the reason it could move is
          that the uncomfortable half of it did not move with it — the
          packages below still say the rent is due in a losing month too,
          above the button that takes the money. A page that leaves that to
          be discovered after payment has sold something that was not
          agreed to.
      --------------------------------------------------------------- */}
      <Scallop />
      <Section tone="pine" pad="pt-12 pb-12 sm:pt-14 sm:pb-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <Eyebrow tone="onDark">What is AI Trade</Eyebrow>
              <h2 className="display mt-3 text-4xl text-paper">
                Your account, automated.
              </h2>
              <p className="mt-5 leading-relaxed text-paper/80">
                Fukyaa connects to your broker account and handles the
                trading steps for you.
              </p>
            </div>

            <div data-reveal>
              <Eyebrow tone="onDark">How does AI trade</Eyebrow>
              <h2 className="display mt-3 text-4xl text-paper">
                It follows the system.
              </h2>
              <p className="mt-5 leading-relaxed text-paper/80">
                Fukyaa checks the market, looks for the right conditions and
                manages the trade in your account.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          3. Why use AI Auto Trade.

          The owner's four reasons, in watermelon's `feature-2` arrangement:
          the words on the left, one reason open at a time, and a drawing of
          it in the panel beside them. See `why-ai.tsx` for what was kept
          from that block and what was not.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          <WhyAi />
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          4. The record.

          The same accounts /copytrade publishes, because they run this
          robot. Losing days included: a record that drops them is not one.
      --------------------------------------------------------------- */}
      <Scallop />
      <Section id="record" tone="pine" pad="pt-12 pb-16 sm:pb-24">
        <Container>
          <div className="mx-auto max-w-xl text-center" data-reveal>
            <Eyebrow tone="onDark">Performance</Eyebrow>
            <h2 className="display mt-3 text-4xl text-paper">
              What the robot has done.
            </h2>
            <p className="mt-5 leading-relaxed text-paper/80">
              My own accounts, read from MT5 every hour. Losing days
              included. Past results do not predict future ones.
            </p>
          </div>

          <div className="mt-10" data-reveal>
            {records.length > 1 ? (
              <RecordTabs
                tabs={records.map(({ account, days, funding, lastAt }) => {
                  const summary = summarise(days);
                  const trading = summary?.trading ?? 0;
                  const perf = performance(days);
                  const pct = (r: number) =>
                    `${r < 0 ? "−" : "+"}${(Math.abs(r) * 100).toFixed(1)}%`;
                  const tone = (n: number) =>
                    n > 0
                      ? ("up" as const)
                      : n < 0
                        ? ("down" as const)
                        : ("flat" as const);
                  return {
                    key: account.key,
                    label: account.label,
                    result: `${usd(trading, true, divisorFor(account.unit))} USD`,
                    tone: tone(trading),
                    returnPct: perf ? pct(perf.returnPct) : undefined,
                    returnTone: perf ? tone(perf.returnPct) : undefined,
                    since: summary
                      ? `Since ${new Date(`${summary.since}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}`
                      : undefined,
                    panel: (
                      <RecordPanel
                        account={account}
                        days={days}
                        funding={funding}
                        lastAt={lastAt}
                        today={today}
                      />
                    ),
                  };
                })}
              />
            ) : records.length === 1 ? (
              <RecordPanel
                account={records[0].account}
                days={records[0].days}
                funding={records[0].funding}
                lastAt={records[0].lastAt}
                today={today}
              />
            ) : (
              <RecordChart
                points={[]}
                name="Balance"
                unit="USD"
                empty="The line starts the day the account feed is connected. Nothing is drawn here until it is."
              />
            )}
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          5. The calculator.

          Copytrade's, with the share switched off: here the fee is flat and
          in ringgit, so it is never subtracted from a dollar figure. Which
          rent applies is decided by the deposit the slider produced, which
          is what decides it in real life — so the panel argues for the
          larger deposit out of arithmetic rather than out of copy.

          Omitted entirely when the record is too short to hold one
          twenty-one day window. A calculator with nothing behind it is
          worse than no calculator.
      --------------------------------------------------------------- */}
      {spread ? (
        <Section id="calculator" className="relative overflow-hidden">
          <div aria-hidden className="hero-grid absolute inset-0" />
          <Container className="relative">
            <div className="mx-auto max-w-xl text-center" data-reveal>
              <Eyebrow tone="quiet">Calculator</Eyebrow>
              <h2 className="display mt-3 text-4xl text-pine">
                What would it take?
              </h2>
              <p className="mt-5 leading-relaxed text-pine-soft">
                Set what you want a month. This works out the deposit behind
                it, from the record above.
              </p>
            </div>

            <div className="mt-10" data-reveal>
              <ProfitCalculator
                outcomes={spread}
                /* No share of the gain on a rental. */
                sharePct={0}
                lots={longestLots}
                rent={{
                  includedFrom: included.depositUsd,
                  monthly: rent,
                  included: "Included",
                }}
              />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ---------------------------------------------------------------
          6. The replay.

          History in the reader's own money, past tense throughout, with the
          days the account lost a quarter of itself drawn as the cliffs they
          were. An animation that only climbed would read as an advert; the
          drop is what makes the rest believable.
      --------------------------------------------------------------- */}
      {longest && longest.days.length > 0 ? (
        <>
          <Scallop />
          <Section tone="pine" pad="pt-12 pb-16 sm:pb-24">
            <Container>
              <div className="mx-auto max-w-xl text-center" data-reveal>
                <Eyebrow tone="onDark">See it your way</Eyebrow>
                <h2 className="display mt-3 text-4xl text-paper">
                  What it would have done.
                </h2>
                <p className="mt-5 leading-relaxed text-paper/80">
                  Pick what you would have put in. The line is the record
                  above, in your money, from the day it started.
                </p>
              </div>

              <div className="mt-10" data-reveal>
                <FollowReplay
                  days={longest.days}
                  deposits={[
                    rented.depositUsd,
                    included.depositUsd,
                    included.depositUsd * 2,
                    included.depositUsd * 5,
                  ]}
                />
              </div>
            </Container>
          </Section>
        </>
      ) : null}

      {/* ---------------------------------------------------------------
          7. Getting started.

          The packages and the steps together, sharing one choice: pressing
          a package row sets the deposit figure and the last step. Two sets
          of steps, one per package, said almost everything twice.
      --------------------------------------------------------------- */}
      <AutoTradeFlow
        packages={packages}
        steps={STEPS}
        between={null}
        heading={
          <div className="max-w-xl" data-reveal>
            <Eyebrow tone="quiet">Getting started</Eyebrow>
            <h2 className="display mt-3 text-4xl text-pine">
              Pick a package.
            </h2>
            <p className="mt-4 leading-relaxed text-pine-soft">
              The deposit stays yours. Only the server rent is paid to me.
            </p>
          </div>
        }
        note={
          <>
            Rent is due every month, in a losing month too. Rather pay only
            when there is profit?{" "}
            <TextLink href="/copytrade">See Copytrade</TextLink>.
          </>
        }
      />

      {/* ---------------------------------------------------------------
          8. Questions.
      --------------------------------------------------------------- */}
      <Section id="questions" tone="raised">
        <Container>
          <SectionHeading eyebrow="Questions" title="Asked before, answered here." />

          <div className="mt-10 max-w-3xl divide-y divide-rule border-y border-rule">
            {FAQ.map((item) => (
              /* <details> rather than a React toggle: it opens without
                 JavaScript, it is in the accessibility tree already, and
                 the browser's own find-in-page can open it. */
              <details key={item.q} className="faq-item group" data-reveal>
                <summary className="faq-summary">
                  <span>{item.q}</span>
                  <span aria-hidden className="faq-sign" />
                </summary>
                <p className="pb-5 leading-relaxed text-pine-soft">{item.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-10" data-reveal>
            <ActionOut href="/go/whatsapp?m=contact">
              Ask me anything else
            </ActionOut>
          </div>
        </Container>
      </Section>

      {/* The one block left at full length. It is read by people looking
          for exactly it. */}
      <Section pad="py-14">
        <Container>
          <p className="max-w-2xl text-sm leading-relaxed text-pine-faint">
            An expert advisor places trades automatically and can lose money
            doing it. The server rent is payable whether the month gained or
            lost. Nothing here is financial advice or a recommendation to buy
            or sell anything, and no result is promised or implied.
          </p>
        </Container>
      </Section>
    </>
  );
}
