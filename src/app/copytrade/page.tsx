import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  copytrade,
  copytradeMinimumCents,
  formatCents,
  formatMyr,
  formatPct,
  formatUsd,
  fukyaa,
} from "@/lib/commercial";
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
import { ProfitCalculator } from "@/components/profit-calculator";
import { RecordPanel } from "@/components/record-panel";
import { RecordTabs } from "@/components/record-tabs";
import { Container, Section } from "@/components/ui";
import { CopyFlow } from "@/components/copy-flow";
import { ReasonShowcase } from "@/components/reason-showcase";
import { SectionHeading } from "@/components/section-heading";
import { RecordChart } from "@/components/record-chart";
import { StepTrack } from "@/components/step-track";
import { VideoEmbed } from "@/components/video-embed";
import {
  ActionLink,
  ActionOut,
  Eyebrow,
  Scallop,
} from "@/components/shell";

/* The record is read from the feed at render. An hour is the EA's own
   interval, and the ingest route revalidates this page on every post, so
   this is only the backstop for a post that never came. */
export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/copytrade" },
  title: "Copytrade",
  description:
    "My account trades gold. Yours copies it, from your own broker account in your own name. No monthly fee, no server — you pay a share of the month's profit or nothing at all.",
};

/**
 * Copytrade.
 *
 * Two things shape this page more than anything else.
 *
 * The first is that there is nothing to show. There is no track record on
 * this site because there is no verified one yet — it will be fed from the
 * account rather than typed in — and the page says so rather than filling
 * the space with the sort of copy that is written when a writer has nothing.
 *
 * The second is the broker's own join screen, which a visitor reaches one
 * click after this page. It says the provider is "Fuky AA", labels the offer
 * "High Risk", and states the minimum as a cent figure a hundred times the
 * dollars deposited. A page that leaves all three as a surprise is a page
 * that loses the reader at the moment they are about to act, so each of them
 * is written down here first, in the section that exists for exactly that.
 */

/* --------------------------------------------------------------- *
 * The four steps, in the order the broker requires them.
 * --------------------------------------------------------------- */

type Step = {
  n: number;
  title: string;
  body: ReactNode;
  /* The two or three things a reader wants settled before doing this one.
     Every line here is a fact stated somewhere else on the page — the
     questions below, mostly. None of them is new. */
  points: string[];
  /* `tone` because two of the four steps link out and only one of them is
     the finish. Both in accent red made the page shout twice and point at
     neither; the loud one is the join. */
  action?: { label: string; href: string; tone?: "ink" | "accent" };
};

function steps(): Step[] {
  return [
    {
      n: 1,
      title: "Open a trading account",
      body: "Make sure it is a cent account.",
      points: [
        "Keep your MT5 ID and password",
        "They are what logs you into MetaTrader 5",
        "This is the account you deposit into",
      ],
      action: { label: "Open the account", href: "/go/broker-cent", tone: "ink" },
    },
    {
      n: 2,
      title: "Verify your account",
      body: "The broker checks a valid document before the account can take money.",
      points: [
        "Identity card",
        "Passport",
        "Another document issued by your country",
      ],
    },
    {
      n: 3,
      title: "Fund your account",
      body: `At least ${formatUsd(copytrade.minimumUsd)}, which shows as ${formatCents(copytradeMinimumCents())}.`,
      points: [
        "Into the cent account, not another one",
        "Help2Pay or any of the broker's payment channels",
        "Keep the slip as proof of payment",
      ],
    },
    {
      n: 4,
      title: "Subscribe to the copy",
      body: "Connect your trading account to mine.",
      points: [
        "Register as a follower first",
        /* His line reads "use MT5 ID and password as credentials". Written
           plainly it could be read as sending them to me, which is not what
           happens and not something anybody should do: they are the login
           for the broker's own copy page. */
        "Sign in to the broker with your MT5 ID and password",
        "The video below walks through it",
      ],
      action: { label: "Join the copy", href: "/go/copytrade-join", tone: "accent" },
    },
  ];
}

/* --------------------------------------------------------------- *
 * The questions people actually ask.
 * --------------------------------------------------------------- */

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Do I have to do anything once it is running?",
    a: "No. Trades open and close on their own.",
  },
  {
    q: "Can you take my money?",
    a: "No. The account is in your name at the broker. I have no access to it.",
  },
  {
    q: "Who is “Fuky AA” on the broker's screen?",
    a: "My master account, named after the expert advisor on it. That is what yours follows.",
  },
  {
    q: "The broker labels this “High Risk”. Why?",
    a: "Because it is. Gold is leveraged and it moves, and the label is the broker's own.",
  },
  {
    q: "Why does my balance look so much bigger than my deposit?",
    a: "It is a cent account. The broker counts in cents — a hundred times the number, for the same money.",
  },
  {
    q: "What does it cost?",
    a: `${formatPct(copytrade.masterSharePct)} of the month's profit, settled monthly. Nothing else: no monthly fee and no server to rent. A month with no profit costs nothing.`,
  },
  {
    q: "Can I stop?",
    a: "Yes, any time. Unsubscribe at the broker and the copying stops.",
  },
  {
    q: "What happens in a losing week?",
    a: "You lose money, the same as placing the trade yourself. How the broker carries it into the next week is their rule — ask me and I will show you it.",
  },
];

export default async function CopytradePage() {
  // Every configured account, master first, read in parallel.
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

  /* The calculator runs on the longest record we have, not on the master.
     A stretch is thirty trading days and the master has nine, so the master
     cannot supply a single one; the account that can is the one that has
     been running longest. They are the same EA on the same settings, which
     is what makes that substitution honest — and the longest record is also
     the only one that contains a losing stretch, which is the half of the
     answer a buyer most needs. */
  const longest = records.reduce<(typeof records)[number] | null>(
    (best, record) =>
      best === null || record.days.length > best.days.length ? record : best,
    null,
  );
  const spread = longest ? outcomes(longest.days) : null;
  const longestPerf = longest ? performance(longest.days) : null;
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
          1. The question, then what this is.
      --------------------------------------------------------------- */}
      <Section
        pad="pt-14 pb-12 sm:pt-20 sm:pb-16"
        className="relative overflow-hidden"
      >
        {/* The same graph paper the homepage hero is drawn on. Decorative,
            so it is hidden from assistive technology, and it sits in its own
            layer rather than on the section — the section's background
            colour is what keeps the paper tone consistent between bands.
            `relative` on the section and on the Container, `overflow-hidden`
            so the sheet stops at the band's edge. */}
        <div aria-hidden className="hero-grid absolute inset-0" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,32rem)] lg:items-center lg:gap-16">
            <div data-reveal>
              <Eyebrow tone="quiet">Copytrade</Eyebrow>
              <h1 className="display mt-3 text-5xl leading-[1.1] text-pine">
                My trades. Your account. Your call.
              </h1>

              <div className="mt-7 space-y-5 text-lg leading-relaxed text-pine-soft">
                <p>
                  Fukyaa copies the trades from my account to yours. Your
                  account stays under your own name, and your funds remain
                  with your broker.
                </p>
                <p>
                  You stay in control &mdash; including when to pause, close
                  or withdraw, subject to your broker&rsquo;s terms.
                </p>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                {/* One action. The second link sent the reader to the
                    questions before they had one, and a hero that offers two
                    doors points at neither. The questions are still a section
                    away, down the page, where a reader arrives with one. */}
                <ActionLink href="#steps">Join us now</ActionLink>
              </div>
            </div>

            <CopyFlow />
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          2. What it is, and what it costs.

          The owner's copy, with two corrections he would want made.

          He wrote that the follower "will receive the same amount" as the
          master. That is not what copying does: the lot is scaled to the
          follower's balance, so what tracks is the proportion, not the
          figure. His next sentence says exactly that, so the two together
          contradicted each other — the wrong one went.

          He also wrote "completely free" beside the share. A reader who
          believes the first sentence and then meets the second has been
          told something untrue about their money. What is free is the fixed
          side: no monthly fee, no server, nothing before there is a gain.

          One paragraph a column, not two. Two short paragraphs with a gap
          between them took the height of four lines to say two, which is
          what made the band look mostly empty.
      --------------------------------------------------------------- */}
      <Scallop />
      {/* The band sat 40px under its scallop and 80px above its own edge,
          which is what left the dark gap below the text. The two columns are
          short, so the foot had nothing to hold. Even top and bottom now. */}
      <Section tone="pine" pad="pt-12 pb-12 sm:pt-14 sm:pb-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <Eyebrow tone="onDark">What is copytrade</Eyebrow>
              <h2 className="display mt-3 text-4xl text-paper">
                Same trades, your size.
              </h2>
              <p className="mt-5 leading-relaxed text-paper/80">
                Every trade my account opens, yours opens too, sized to your
                own balance.
              </p>
            </div>

            <div data-reveal>
              <Eyebrow tone="onDark">Why choose it</Eyebrow>
              <h2 className="display mt-3 text-4xl text-paper">
                Pay from the profit.
              </h2>
              <p className="mt-5 leading-relaxed text-paper/80">
                Fukyaa rents a server at {formatMyr(fukyaa.vpsMonthlyMyr)} a
                month. Copytrade rents nothing. You pay{" "}
                {formatPct(copytrade.masterSharePct)} of the month&rsquo;s
                profit, settled monthly, and nothing in a month without one.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          3. Why people choose it.

          A showcase, from the component the owner chose. It was four tiles
          in a grid, then ruled rows, then tabs, then an orbit. This one
          carries a picture per reason, which is the part none of the others
          had: the four headlines sit together as a menu, the one being asked
          about is explained, and the picture says which one that is.

          This replaced a section listing what a visitor meets on the
          broker's own screens. Two of those — the "Fuky AA" provider name
          and the "High Risk" label — are the most useful things on this
          page and did not deserve to vanish with it, so they moved into the
          questions below.
      --------------------------------------------------------------- */}
      <Section id="reasons">
        <Container>
          <SectionHeading
            eyebrow="Why people join"
            title="Why trade alone? Just follow my step."
          >
            <p>
              Copytrade is not a shortcut, and it is not for everyone. It is
              for people who want their own trading account to follow a
              strategy without having to place every trade themselves.
            </p>
          </SectionHeading>

          <ReasonShowcase
            reasons={[
              {
                title: "Don't have time to learn and trade?",
                body: "Most of my clients have the same problem. Work runs 6 to 8, and learning the basics takes three to six months. You don't need to. Just copy my trades.",
                image: "busy.webp",
              },
              {
                title: "Worried about your money?",
                body: "I never ask for your money. You open a trading account in your own name and deposit into that account. Withdraw any time, straight from it, with nobody in the middle.",
                image: "account.webp",
              },
              {
                title: "Want to start now?",
                body: `The minimum is ${formatUsd(copytrade.minimumUsd)}. More capital means bigger positions, up and down alike. It sits in a cent account, so the copying can size your trades in small units.`,
                image: "deposit.webp",
              },
              {
                title: "Take control of your account",
                body: "Watch it yourself in MT5. Log in to your trading account and every trade and position is there. Need a hand? Ask me.",
                image: "monitor.webp",
              },
            ]}
          />
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          5. The record.

          One centred column on the dark band: the heading, the description,
          the chart. The owner's copy, and his own call on the claim it
          makes.

          The band is the second `pine` section on the page, and the card on
          it is lit rather than inverted — see the `[data-tone="pine"]
          .record` block in globals.css, which retargets the chart's colour
          tokens instead of restyling each of its parts.

          The readings are each account's own, posted hourly by a reporter
          EA on its terminal — see `src/lib/record.ts`, and
          `src/lib/record-accounts.ts` for which accounts. Each panel's note
          says where its figures come from and what a balance includes,
          inside the card (`record-panel.tsx`), because a screenshot of the
          card carries it and a caption under one does not.
      --------------------------------------------------------------- */}
      <Section tone="pine">
        <Container>
          <div className="mx-auto max-w-xl text-center" data-reveal>
            <Eyebrow tone="onDark">Our record</Eyebrow>
            <h2 className="display mt-3 text-4xl text-paper">
              Trading performance
            </h2>
            <p className="mt-5 leading-relaxed text-paper/80">
              Straight from our MT5 terminals, updated every hour. Every
              figure here is the account&rsquo;s own &mdash; the bad days
              included.
            </p>
          </div>

          {/* One account: its panel. Several: a tab each, master first.
              None configured: the empty chart, which says why. */}
          <div className="mt-10" data-reveal>
            {records.length > 1 ? (
              <RecordTabs
                tabs={records.map(({ account, days, funding, lastAt }) => {
                  const summary = summarise(days);
                  const trading = summary?.trading ?? 0;
                  const perf = performance(days);
                  const pct = (r: number) =>
                    `${r < 0 ? "−" : "+"}${(Math.abs(r) * 100).toFixed(1)}%`;
                  return {
                    key: account.key,
                    label: account.label,
                    result: `${usd(trading, true, divisorFor(account.unit))} USD`,
                    tone: trading > 0 ? "up" : trading < 0 ? "down" : "flat",
                    /* The return gets its own sign, not the dollar figure's.
                       They can disagree: a gain on a large base and a loss
                       on a small one are the same account. */
                    returnPct: perf ? pct(perf.returnPct) : undefined,
                    returnTone: perf
                      ? perf.returnPct > 0
                        ? ("up" as const)
                        : perf.returnPct < 0
                          ? ("down" as const)
                          : ("flat" as const)
                      : undefined,
                    // Read from the record itself, so three masters from
                    // three different months tell themselves apart.
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
          6. What it would take.

          Sits between the record and the steps on purpose: a reader who has
          just seen the figures asks "what would that mean for me", and the
          next thing they are shown is how to start. Putting it after the
          steps would answer the question once they had stopped asking it.

          The whole section is omitted when the record is too short to hold
          a single thirty-day stretch — see `record-outcomes.ts`. A
          calculator with nothing behind it is worse than no calculator.
      --------------------------------------------------------------- */}
      {spread && longest && longestPerf ? (
        <Section id="calculator">
          <Container>
            <div className="mx-auto max-w-xl text-center" data-reveal>
              <Eyebrow tone="quiet">Trading calculator</Eyebrow>
              <h2 className="display mt-3 text-4xl text-pine">
                Plan with what you want.
              </h2>
              <p className="mt-5 leading-relaxed text-pine-soft">
                Set a monthly target and see the deposit behind it, worked
                from our own record.
              </p>
            </div>

            <div className="mt-10" data-reveal>
              <ProfitCalculator
                outcomes={spread}
                deepest={longestPerf.deepest}
                recovery={longestPerf.recovery}
                lots={longestLots}
              />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ---------------------------------------------------------------
          7. How to start.

          The track, then the walkthrough under it. The order is the owner's
          and it is the right way round: the steps are what a reader came for
          and the video is the same four steps done once, so it sits where
          somebody who has read them and still wants to see them will look.
      --------------------------------------------------------------- */}
      <Section id="steps" tone="raised">
        <Container>
          <SectionHeading
            eyebrow="Getting started"
            title="Four steps, in order."
          >
            <p>
              About twenty minutes, most of it waiting on the broker. Do them
              in this order: the last one cannot be done first.
            </p>
          </SectionHeading>

          <StepTrack steps={steps()} />

          {/* Centred, which it can be because it is the one thing in this
              section that is not read left to right. */}
          <div className="mx-auto mt-16 max-w-3xl" data-reveal>
            <p className="mb-5 text-center text-sm text-pine-faint">
              Or watch me do all four, once.
            </p>
            <VideoEmbed
              id="q4ARWVtJMdo"
              title="Copytrade Follower Tutorial"
              still="copytrade-walkthrough.webp"
            />
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          7. Questions.
      --------------------------------------------------------------- */}
      <Section id="questions">
        <Container>
          <SectionHeading eyebrow="Questions" title="Asked before, answered here." />

          <div className="mt-10 max-w-3xl divide-y divide-rule border-y border-rule">
            {FAQ.map((item) => (
              /* <details> rather than a React toggle: it opens without
                 JavaScript, it is in the accessibility tree already, and the
                 browser's own find-in-page can open it. */
              <details key={item.q} className="faq-item group" data-reveal>
                <summary className="faq-summary">
                  <span>{item.q}</span>
                  <span aria-hidden className="faq-sign" />
                </summary>
                <p className="pb-5 leading-relaxed text-pine-soft">{item.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4" data-reveal>
            <ActionOut href="/go/whatsapp?m=contact">
              Ask me anything else
            </ActionOut>
          </div>
        </Container>
      </Section>

      {/* The fine print, boxed off rather than left floating under a dark
          band. Set in pine-soft, not pine-faint: pine-faint clears 4.5:1 on
          the page paper but only reaches 3.98:1 on this sunk panel, and
          boxing the text is what would have broken it. */}
      <Section pad="py-14">
        <Container>
          <p className="max-w-2xl rounded-[var(--radius-panel)] bg-paper-sunk px-7 py-6 text-sm leading-relaxed text-pine-soft">
            Copying a trader carries the same risk as placing the trade
            yourself, including losing money. Leveraged trading can lose more
            than it makes. Nothing here is financial advice or a
            recommendation to buy or sell anything.
          </p>
        </Container>
      </Section>
    </>
  );
}
