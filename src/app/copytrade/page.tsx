import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  copytrade,
  copytradeMinimumCents,
  formatCents,
  formatUsd,
} from "@/lib/commercial";
import { Container, Section } from "@/components/ui";
import { CopyFlow } from "@/components/copy-flow";
import { SectionHeading } from "@/components/section-heading";
import {
  ActionLink,
  ActionOut,
  Eyebrow,
  Panel,
  Scallop,
} from "@/components/shell";

export const metadata: Metadata = {
  alternates: { canonical: "/copytrade" },
  title: "Copytrade",
  description:
    "My account trades gold. Yours copies it, from your own broker account in your own name. No fee today, and the money never leaves your side.",
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
  /* `tone` because two of the four steps link out and only one of them is
     the finish. Both in accent red made the page shout twice and point at
     neither; the loud one is the join. */
  action?: { label: string; href: string; tone?: "ink" | "accent" };
};

function steps(): Step[] {
  return [
    {
      n: 1,
      title: "Open a cent account",
      body: "Cent accounts price in smaller units, so the copying can size your positions in fine steps instead of blunt ones. Open it through this link — it opens the account on a tighter spread, which on an account that trades often is most of what you pay.",
      action: { label: "Open the account", href: "/go/broker-cent", tone: "ink" },
    },
    {
      n: 2,
      title: "Verify it",
      body: "The broker asks for identification before the account can take money. Nothing on my side is involved and nothing happens until it clears.",
    },
    {
      n: 3,
      title: "Fund it",
      body: `Deposit ${formatUsd(copytrade.minimumUsd)} or more. The account will show it as ${formatCents(copytradeMinimumCents())} — see below for why.`,
    },
    {
      n: 4,
      title: "Join the copy",
      body: "Last, not first. The broker's copy page needs a funded account to link, so joining before the deposit lands gets you a screen that cannot do anything.",
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
    a: "No. Trades open and close in your account on their own. You do not confirm anything and there is nothing to watch.",
  },
  {
    q: "Can you take my money?",
    a: "No. The account is opened in your name at the broker and the money sits in it the whole time. I have no access to it, cannot withdraw from it, and never hold it.",
  },
  {
    q: "Who is “Fuky AA” on the broker's screen?",
    a: "My master account, named after the expert advisor running on it. It is not a third party and not somebody else's book — it is the account yours will be following.",
  },
  {
    q: "The broker labels this “High Risk”. Why?",
    a: "Because it is. Gold is leveraged and it moves, and the label is the broker's own assessment rather than a formality. Treat it as the honest part of the screen rather than the part to scroll past.",
  },
  {
    q: "Why does my balance look so much bigger than my deposit?",
    a: "Because it is a cent account. The broker counts it in cents, so a hundred times the number, for the same money. Nothing has grown.",
  },
  {
    q: "What does it cost?",
    a: "Nothing today. There is no subscription and the broker's own join screen says the same. A share of gains starts later; when it does, it will be written here before it begins, not after.",
  },
  {
    q: "Can I stop?",
    a: "Yes, whenever you want. Unsubscribe at the broker and the copying stops. Your account, your money and anything still open stay yours.",
  },
  {
    q: "What happens in a losing week?",
    a: "You lose money, the same as if you had placed the trades yourself. How the broker treats a losing week against the next one is set by them, not by me — ask before you join and I will show you their rule rather than paraphrase it.",
  },
];

export default function CopytradePage() {
  return (
    <>
      {/* ---------------------------------------------------------------
          1. The question, then what this is.
      --------------------------------------------------------------- */}
      <Section pad="pt-14 pb-12 sm:pt-20 sm:pb-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,32rem)] lg:items-center lg:gap-16">
            <div data-reveal>
              <Eyebrow tone="quiet">Copytrade</Eyebrow>
              <h1 className="display mt-3 text-4xl leading-[1.1] text-pine sm:text-5xl">
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
                <ActionLink href="#steps">Join us now</ActionLink>
                {/* The questions, not the reasons: "what happens after I
                    join" is answered by "do I have to do anything", "can I
                    stop" and "what about a losing week". */}
                <ActionLink href="#questions" tone="ghost">
                  What happens after I join
                </ActionLink>
              </div>
            </div>

            <CopyFlow />
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          2. The problem, and what answers it.
      --------------------------------------------------------------- */}
      <Scallop />
      <Section tone="pine" pad="pt-10 pb-16 sm:pb-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <Eyebrow tone="onDark">The problem</Eyebrow>
              <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">
                Gold moves while you are at work.
              </h2>
              <p className="mt-5 leading-relaxed text-paper/80">
                Reading gold properly means being at the chart when London
                opens and again when New York does. Most people are working
                through one of those and asleep for the other. The cost is not
                the trade you miss — it is the one you take late, after the
                move it was supposed to catch has already happened.
              </p>
            </div>

            <div data-reveal>
              <Eyebrow tone="onDark">What answers it</Eyebrow>
              <h2 className="display mt-3 text-3xl text-paper sm:text-4xl">
                The reading still happens. You are not the one doing it.
              </h2>
              <p className="mt-5 leading-relaxed text-paper/80">
                An expert advisor called Fukyaa runs on my account and trades
                gold, and only gold. It takes the entries, manages them and
                closes them. Your account copies what it does, a moment after
                it does it.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          3. Why people choose it.

          Rows, not cards. Four identical rounded tiles in a 2x2 grid give
          four unequal statements the same weight and the same voice, and
          are the layout anything generated for any product arrives in. A
          ruled list puts the reason in the display face at the left and its
          explanation beside it, which is a shape with a hierarchy in it.

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
            title="Four reasons people choose to copy my account."
          >
            <p>
              Copytrade is not a shortcut, and it is not for everyone. It is
              for people who want their own trading account to follow a
              strategy without having to place every trade themselves.
            </p>
          </SectionHeading>

          <dl className="mt-12 max-w-4xl divide-y divide-rule border-y border-rule">
            {[
              {
                t: "You do not have to watch the chart all day",
                d: "Trades from the master account are copied to your account. You can check your positions without spending the whole day in front of the screen.",
              },
              {
                t: "Your account stays in your own name",
                d: "Your deposit goes into your own broker account. I do not hold your money or withdraw it for you.",
              },
              {
                t: "The minimum is clear from the start",
                d: `Copytrade starts from a ${formatUsd(copytrade.minimumUsd)} deposit in a cent account. The balance may appear 100 times larger because the account is measured in cents.`,
              },
              {
                t: "You can see what is happening",
                d: "The trades, positions and account activity are visible from your own broker account. You do not have to rely only on screenshots or updates from someone else.",
              },
            ].map((item) => (
              <div
                key={item.t}
                className="grid gap-3 py-8 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-12"
                data-reveal
              >
                <dt className="display text-xl leading-tight text-pine sm:text-2xl">
                  {item.t}
                </dt>
                <dd className="leading-relaxed text-pine-soft">{item.d}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          5. The record, and why it is not here.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          <div className="max-w-2xl" data-reveal>
            <Eyebrow tone="quiet">The record</Eyebrow>
            <h2 className="display mt-3 text-3xl text-pine sm:text-4xl">
              There are no numbers on this page yet.
            </h2>
            <div className="mt-5 space-y-5 leading-relaxed text-pine-soft">
              <p>
                When the record goes here it will be read from the account
                itself, on a schedule, and not typed in by me. That work is
                not finished, so for now this page shows nothing.
              </p>
              <p>
                In the meantime, treat any trading page that shows you figures
                it wrote down itself with the suspicion it has earned. A
                number nobody can check is a sentence, not a record.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          6. How to start.
      --------------------------------------------------------------- */}
      <Section id="steps" tone="raised">
        <Container>
          <SectionHeading eyebrow="Getting started" title="Four steps, in order.">
            <p>
              The order matters: the copy page needs an account that already
              holds money, so joining is last.
            </p>
          </SectionHeading>

          <ol className="mt-10 max-w-3xl space-y-4">
            {steps().map((step) => (
              <li key={step.n} data-reveal>
                <Panel>
                  <div className="flex gap-5">
                    <span className="tnum display shrink-0 text-2xl text-pine-faint">
                      {step.n}
                    </span>
                    <div>
                      <h3 className="font-semibold text-pine">{step.title}</h3>
                      <p className="mt-2 leading-relaxed text-pine-soft">
                        {step.body}
                      </p>
                      {step.action ? (
                        <div className="mt-4">
                          <ActionOut
                            href={step.action.href}
                            tone={step.action.tone ?? "ink"}
                          >
                            {step.action.label}
                          </ActionOut>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Panel>
              </li>
            ))}
          </ol>
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
