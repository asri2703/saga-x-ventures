import type { CSSProperties } from "react";
import Image from "next/image";
import { ibProducts, retailProducts, getProduct } from "@/lib/products";
import { site } from "@/lib/site";
import { heroCards } from "@/lib/commercial";
import { Container, Section } from "@/components/ui";
import { SectionHeading } from "@/components/section-heading";
import { AccountGateway } from "@/components/account-gateway";
import {
  ActionLink,
  ActionOut,
  Eyebrow,
  FloatCard,
  Marked,
  OffsetFrame,
  Panel,
  Scallop,
  TextLink,
} from "@/components/shell";

/**
 * The fork states each product's deposit minimum, and one of those figures is
 * promotional and falls back on a known day. Prerendered once this page would
 * keep quoting the old figure. `freshness.test.ts` holds every page that
 * reads the clock to a window.
 */
export const revalidate = 3600;

export default function HomePage() {
  const cent = retailProducts.filter((p) => p.account === "cent");
  const standard = retailProducts.filter((p) => p.account === "standard");
  const coaching = getProduct("coaching")!;
  const now = new Date();

  return (
    <>
      {/* ---------------------------------------------------------------
          1. Hero. The owner's own copy, kept as he wrote it.
      --------------------------------------------------------------- */}
      <Section className="relative overflow-hidden pt-14 sm:pt-20">
        {/* Graph paper behind the hero. Decorative, so it is hidden from
            assistive technology, and it sits under its own stacking layer
            rather than on the section itself — the section's background
            colour is what keeps the paper tone consistent between bands. */}
        <div aria-hidden className="hero-grid absolute inset-0" />
        <Container className="relative">
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_minmax(0,460px)]">
            <div>
              <h1 className="display text-4xl text-pine sm:text-5xl lg:text-6xl">
                Trade Shouldn&rsquo;t Be <Marked>Complicated</Marked>.
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-relaxed text-pine-soft">
                We believe trading shouldn&rsquo;t be complicated. That&rsquo;s
                why we build innovative trading solutions designed to make the
                trading experience simpler, smarter and more flexible,
                empowering traders to focus on what matters most.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <ActionLink href="#fork">Find where you fit</ActionLink>
                <ActionLink href="/about" tone="ghost">
                  How I got here
                </ActionLink>
              </div>
            </div>

            {/* The portrait, in the reference's shape: a rounded image with a
                block of colour offset behind it, and fragments of the real
                terms floating over the edges. In the reference those cards
                are product screenshots; built from config instead, they say
                something true and needed no asset that does not exist. */}
            <div className="relative" data-reveal>
              <OffsetFrame tint="sage">
                <Image
                  src="/asri-hero.webp"
                  alt={`${site.founder.name}, founder of ${site.name}`}
                  width={1003}
                  height={1516}
                  className="h-auto w-full"
                  sizes="(min-width: 1024px) 460px, 100vw"
                  priority
                />
              </OffsetFrame>

              {/* Both cards sit low, below the feet. They were at the top
                  left and the mid right, where the upper one landed across
                  his face — the one part of a portrait that cannot be
                  covered.

                  They hang outside the frame only from `lg`, where the
                  column is a fixed 460px inside a 1152px container and there
                  is gutter to hang into. Below that the image is the full
                  container width, so a negative offset would push past the
                  page gutter and give a phone a horizontal scrollbar.

                  They also sit side by side only from `lg`. On a phone the
                  frame is about 350px wide and each card is around half of
                  that, so the low row had them nearly touching; below `lg`
                  the first one lifts and they stack instead. */}
              <FloatCard
                className="absolute bottom-16 left-2 lg:bottom-4 lg:-left-8"
                label={heroCards.mastery.label}
                value={heroCards.mastery.value}
                note={heroCards.mastery.note}
                mark={heroCards.mastery.mark}
              />
              <FloatCard
                className="absolute -bottom-5 right-2 lg:-right-6"
                label={heroCards.fukyaa.label}
                value={heroCards.fukyaa.value}
                note={heroCards.fukyaa.note}
                mark={heroCards.fukyaa.mark}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* The trust line the reference runs under its hero. One sentence,
          already true, and the only number on the page that is about me. */}
      <Section className="py-10 sm:py-12">
        <Container>
          <p className="text-center text-lg text-pine-soft" data-reveal>
            More than{" "}
            <span className="display tnum text-pine">
              {site.founder.tradersGuided.toLocaleString("en-MY")} traders
            </span>{" "}
            across Malaysia and Indonesia have been through a class or a call
            with me.
          </p>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          2. Who I am. The reference's dark band: the page inverts, and
          one thing is on screen.
      --------------------------------------------------------------- */}
      <Scallop />
      <Section tone="pine" className="pt-10">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
            <div>
              <SectionHeading eyebrow="Who I am" title="I still trade" onDark>
                <p>
                  I am {site.founder.name}. Twelve years trading, and I still
                  trade now.
                </p>
              </SectionHeading>

              <div className="mt-6 max-w-2xl space-y-5 text-lg leading-relaxed text-paper/80">
                <p>
                  A normal week is a few positions. Some weeks there is nothing
                  worth taking and I take nothing.
                </p>
              </div>

              <div className="mt-9">
                <ActionLink href="/about" tone="onDark">
                  The longer version
                </ActionLink>
              </div>
            </div>

            <div
              data-reveal
              className="rounded-[var(--radius-panel)] bg-paper p-6 sm:p-8"
            >
              <Eyebrow tone="quiet">A week, as it actually goes</Eyebrow>
              <ul className="mt-6 space-y-5">
                {[
                  {
                    k: "watch",
                    t: "Most of it is waiting",
                    b: "The level has to come to me. It often does not.",
                  },
                  {
                    k: "few",
                    t: "A few positions",
                    b: "Sized to what the week is actually offering.",
                  },
                  {
                    k: "none",
                    t: "Sometimes none at all",
                    b: "A flat week is a decision, not a failure to find one.",
                  },
                ].map((row) => (
                  <li
                    key={row.k}
                    className="border-b border-rule pb-5 last:border-0 last:pb-0"
                  >
                    <span className="block font-semibold text-pine">
                      {row.t}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-pine-soft">
                      {row.b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          3. Why I built these.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Why I built these"
            title="Three conversations"
          >
            <p>
              None of this started as a product. Each one came out of the same
              question asked a different way.
            </p>
          </SectionHeading>

          <div className="mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              {
                k: "signal",
                q: "What are you looking at right now?",
                a: "People asked me that for years. An entry price never answered it, so I started writing down the level and why it was there. That became Mastery Signal.",
              },
              {
                k: "auto",
                q: "I am never going to learn this.",
                a: "Said to my face, more than once, by people who were right about themselves. Selling them a course would have wasted their money. So they get an expert advisor and a server instead.",
              },
              {
                k: "build",
                q: "Can you build it for me?",
                a: "Other people with their own clients wanted the same tools under their own name. I had already built mine, so I build theirs.",
              },
            ].map((item, i) => (
              <Panel
                key={item.k}
                style={{ "--reveal-delay": `${i * 90}ms` } as CSSProperties}
              >
                <p className="display text-xl text-pine">
                  &ldquo;{item.q}&rdquo;
                </p>
                <p className="mt-4 leading-relaxed text-pine-soft">{item.a}</p>
              </Panel>
            ))}
          </div>

          <p
            className="mt-12 max-w-2xl text-lg leading-relaxed text-pine"
            data-reveal
          >
            What I will not do is tell you what you are going to earn. I do not
            know what I am going to earn either.
          </p>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          4. The solutions, forked by account type.
      --------------------------------------------------------------- */}
      <Section id="fork" tone="raised">
        <Container>
          <SectionHeading eyebrow="What I build" title="Which one are you?">
            <p>
              Everything starts with a broker account, and which type decides
              what you can do with it. Read the lines below and take the one
              that sounds like you.
            </p>
          </SectionHeading>

          {/* Above the columns, not below them. This decides whether to open
              one account or two, which is no use to someone who has already
              read a column and clicked. */}
          <p
            className="mt-8 max-w-2xl border-l-2 border-pine pl-4 leading-relaxed text-pine"
            data-reveal
          >
            The two account types are separate. If you want something from both
            columns, that is two accounts — worth knowing before you open the
            first one.
          </p>

          {/* items-start: the columns hold one product and two. Stretched to
              match, the shorter one ended in a panel of empty cream. */}
          <div className="mt-12 grid items-start gap-6 lg:grid-cols-2">
            <AccountGateway
              account="standard"
              title="You want to place the trades"
              note="Signals arrive with the level and the reason for it. You decide whether to take them."
              products={standard}
              now={now}
            />
            <AccountGateway
              account="cent"
              title="You want them placed for you"
              note="Smaller contract sizes, so positions can be sized finely. Follow a person, or follow a system."
              products={cent}
              now={now}
            />
          </div>

          {/* Coaching sits outside the fork: it needs no broker account. */}
          <Panel className="mt-10 flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="display text-xl text-pine">
                &ldquo;{coaching.forWho}&rdquo;
              </p>
              <p className="mt-2 leading-relaxed text-pine-soft">
                {coaching.summary}
              </p>
            </div>
            <ActionLink href={coaching.href} tone="accent" className="shrink-0">
              {coaching.cta}
            </ActionLink>
          </Panel>

          {/* The IB lane. A door, not a pitch — these two have no page yet. */}
          <div className="mt-14" data-reveal>
            <Eyebrow>If you have clients of your own</Eyebrow>
            <div className="mt-6 grid max-w-3xl gap-8 sm:grid-cols-2">
              {ibProducts.map((product) => (
                <div key={product.key}>
                  <p className="font-semibold text-pine">{product.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-pine-soft">
                    {product.summary}
                  </p>
                  <div className="mt-3">
                    <TextLink href={product.href} external className="text-sm">
                      {product.cta}
                    </TextLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          5. Award and recognition.
      --------------------------------------------------------------- */}
      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
            <div data-reveal>
              <OffsetFrame tint="sand">
                <Image
                  src={site.founder.award.image}
                  alt={`${site.founder.name} receiving the ${site.founder.award.title} award`}
                  width={1076}
                  height={919}
                  className="h-auto w-full"
                  sizes="(min-width: 1024px) 600px, 100vw"
                />
              </OffsetFrame>
            </div>

            <div>
              <SectionHeading
                eyebrow="Recognition"
                title={site.founder.award.title}
              />
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-pine-soft">
                <p>
                  {site.founder.award.body},{" "}
                  <span className="tnum">{site.founder.award.year}</span>.
                </p>
                <p>
                  The name on the screen is {site.founder.award.alias}. That is
                  what I traded under then.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          6. Coaching and classes — the close.
      --------------------------------------------------------------- */}
      <Scallop />
      <Section tone="pine" className="pt-10">
        <Container>
          <div className="mx-auto max-w-3xl text-center" data-reveal>
            <Eyebrow tone="onDark">Coaching and classes</Eyebrow>
            <h2 className="display mt-3 text-3xl text-paper sm:text-5xl">
              Learn to do this yourself
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-paper/80">
              Three classes, one to one, about a day each. Basic trading, then
              advance, then trading the news. Take them in order or take one on
              its own.
            </p>
            <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-paper/70">
              Tell me what you have traded so far and which one you think you
              need. We fix the dates first, and payment comes after that.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <ActionOut href="/go/whatsapp?m=coaching">
                Ask about coaching
              </ActionOut>
              <ActionLink href="/coaching" tone="onDark">
                See the three classes
              </ActionLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
