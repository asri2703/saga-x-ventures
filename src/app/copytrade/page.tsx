import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  copytrade,
  copytradeMinimumCents,
  formatCents,
  formatUsd,
} from "@/lib/commercial";
import { Container, Section } from "@/components/ui";
import { CopyMirror } from "@/components/copy-mirror";
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
                No time to read the chart every day?
              </h1>

              <div className="mt-7 space-y-5 text-lg leading-relaxed text-pine-soft">
                <p>
                  My account trades gold. Yours copies it, trade for trade,
                  from a broker account opened in your own name.
                </p>
                <p>
                  The money stays on your side of it the whole time. I never
                  hold it and I cannot withdraw it.
                </p>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <ActionLink href="#steps">See the four steps</ActionLink>
                <ActionLink href="#what-you-see" tone="ghost">
                  What you&rsquo;ll see
                </ActionLink>
              </div>
            </div>

            <CopyMirror />
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
          3. What is on the screen after you click.
      --------------------------------------------------------------- */}
      <Section id="what-you-see">
        <Container>
          <SectionHeading
            eyebrow="Before you click"
            title="Four things on the broker&rsquo;s screen that surprise people."
          >
            <p>
              You reach the broker&rsquo;s own pages to join. None of this is
              hidden there; it is just easier to read it here, in advance,
              than to meet it halfway through signing up.
            </p>
          </SectionHeading>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <Panel>
              <h3 className="font-semibold text-pine">
                The provider is called &ldquo;Fuky AA&rdquo;
              </h3>
              <p className="mt-2 leading-relaxed text-pine-soft">
                That is my master account at the broker, named after the
                expert advisor on it. It is not a third party and not somebody
                else&rsquo;s book.
              </p>
            </Panel>

            <Panel>
              <h3 className="font-semibold text-pine">
                The offer is labelled &ldquo;High Risk&rdquo;
              </h3>
              <p className="mt-2 leading-relaxed text-pine-soft">
                The broker&rsquo;s label, and a fair one. Gold is leveraged
                and it moves. Treat that label as the honest part of the
                screen rather than the part to scroll past.
              </p>
            </Panel>

            <Panel>
              <h3 className="font-semibold text-pine">
                The minimum is written in cents
              </h3>
              <p className="mt-2 leading-relaxed text-pine-soft">
                {formatUsd(copytrade.minimumUsd)} appears as{" "}
                {formatCents(copytradeMinimumCents())}. It is a cent account:
                the same money, counted in smaller units. Your balance will
                read a hundred times larger than what you put in, and nothing
                has grown.
              </p>
            </Panel>

            <Panel>
              <h3 className="font-semibold text-pine">
                There is nothing to pay
              </h3>
              <p className="mt-2 leading-relaxed text-pine-soft">
                The join screen says there are no fees, and that is accurate
                today. A share of gains starts later. It will be written on
                this page before it begins.
              </p>
            </Panel>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          4. What the visitor keeps hold of.
      --------------------------------------------------------------- */}
      <Section tone="raised">
        <Container>
          <SectionHeading
            eyebrow="What stays yours"
            title="The parts you keep control of."
          >
            <p>
              Copying a trader means giving up the decisions, not the money or
              the account. These are the things that do not change.
            </p>
          </SectionHeading>

          <dl className="mt-10 grid max-w-4xl gap-x-12 gap-y-8 sm:grid-cols-2">
            {[
              {
                t: "Your account, your name",
                d: "Opened by you, at the broker, with your own identification. I am not on it.",
              },
              {
                t: "Your money never moves",
                d: "It sits in that account. Deposits and withdrawals go through the broker and only you can make them.",
              },
              {
                t: "One instrument",
                d: "Gold. Not a basket of whatever looked good this month, and nothing you have to learn the names of.",
              },
              {
                t: "Stop whenever",
                d: "Unsubscribe at the broker and the copying stops. There is no term, no notice period and no lock-in.",
              },
            ].map((item) => (
              <div key={item.t} data-reveal>
                <dt className="font-semibold text-pine">{item.t}</dt>
                <dd className="mt-2 leading-relaxed text-pine-soft">
                  {item.d}
                </dd>
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
      <Section>
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
