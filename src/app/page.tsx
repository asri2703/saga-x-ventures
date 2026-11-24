import Image from "next/image";
import { ibProducts } from "@/lib/products";
import { site } from "@/lib/site";
import { heroCards } from "@/lib/commercial";
import { Container, Section } from "@/components/ui";
import { SectionHeading } from "@/components/section-heading";
import { PlanGroup } from "@/components/plan-cards";
import { PlanSwitch } from "@/components/plan-switch";
import { fukyaaPlanCards, masteryPlanCards } from "@/lib/plans";
import { LogoMarquee } from "@/components/logo-marquee";
import { BuildShowcase } from "@/components/build-showcase";
import {
  ActionLink,
  ActionOut,
  Eyebrow,
  FloatCard,
  Marked,
  OffsetFrame,
  Scallop,
  TextLink,
} from "@/components/shell";

export default function HomePage() {

  return (
    <>
      {/* ---------------------------------------------------------------
          1. Hero. The owner's own copy, kept as he wrote it.
      --------------------------------------------------------------- */}
      <Section
        pad="pt-14 pb-10 sm:pt-20 sm:pb-12"
        className="relative overflow-hidden"
      >
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
                I believe trading shouldn&rsquo;t be complicated. Twelve years
                in the market went into the tools I build: simpler to set up,
                smarter about risk, and flexible enough to fit how you already
                trade.
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

      {/* ---------------------------------------------------------------
          The logo strip. Sits directly under the hero, where a visitor who
          has read the headline is deciding whether any of this is real.
      --------------------------------------------------------------- */}
      <Section pad="py-9 sm:py-11">
        <Container>
          <p className="text-center text-sm text-pine-faint" data-reveal>
            The products I build, and the brokers they run on.
          </p>
        </Container>
        <div className="mt-8">
          <LogoMarquee />
        </div>
      </Section>

      {/* The trust line the reference runs under its hero. One sentence,
          already true, and the only number on the page that is about me. */}
      <Section pad="pt-0 pb-10 sm:pb-14">
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
      <Section tone="pine" pad="pt-10 pb-16 sm:pb-24">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
            <div>
              <SectionHeading
                eyebrow="My expertise"
                title="Trading goes beyond the charts."
                onDark
              >
                <p>
                  I&rsquo;m {site.founder.name}. With 12 years in the market,
                  my work goes beyond taking trades. I study the economics
                  behind price movements, teach traders to think beyond
                  entries, and manage trading accounts for clients.
                </p>
              </SectionHeading>

              <div className="mt-9">
                <ActionLink href="/about" tone="onDark">
                  More about me
                </ActionLink>
              </div>
            </div>

            {/* The three roles, stacked rather than laid out as a third card
                grid. The showcase below is already a row of three cards; two
                in a row makes the page read as a template with its content
                poured in. A list also suits three roles better than cards do,
                because nothing here is being chosen between. */}
            {/* Frosted on the dark band rather than a cream card on it. This
                is the one pane on the site with a genuinely dark surface
                behind it, which is where the treatment reads strongest, and
                the text inverts with it: paper on the glass measures about
                13:1, where pine on it would have been about 5:1. */}
            <div data-reveal className="panel-dark p-6 sm:p-8">
              <ul className="space-y-6">
                {[
                  {
                    k: "economics",
                    n: "01",
                    role: "Economic trader",
                    t: "The chart only tells half the story.",
                    b: "Price shows you what is happening. Economic data helps you understand why. I use both to make sense of the market.",
                  },
                  {
                    k: "teaching",
                    n: "02",
                    role: "Trading educator",
                    t: "Trading is more than buying and selling.",
                    b: "It is about understanding the market, managing risk, controlling emotions, and knowing when not to trade.",
                  },
                  {
                    k: "funds",
                    n: "03",
                    role: "Fund manager",
                    t: "Trading takes time. I will handle the work.",
                    b: "Not everyone has hours to spend watching the market. I manage trading accounts so my clients do not have to do it themselves.",
                  },
                ].map((row) => (
                  <li
                    key={row.k}
                    className="border-b border-paper/15 pb-6 last:border-0 last:pb-0"
                  >
                    {/* The numeral sits at label size beside the role, not as
                        a large marker: three roles held at once are not a
                        sequence, and a big numeral would promise an order. */}
                    <p className="text-sm text-paper/55">
                      <span className="tnum">{row.n}</span>
                      <span className="mx-2 text-paper/35">&mdash;</span>
                      <span className="font-semibold text-paper/80">
                        {row.role}
                      </span>
                    </p>
                    <p className="mt-2 font-semibold text-paper">{row.t}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-paper/75">
                      {row.b}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          3. What the products look like.

          The header is two columns rather than one: the sentence that sets
          the section up and the action that leaves it sit side by side, so
          the cards start higher up the screen than a stacked header allows.
      --------------------------------------------------------------- */}
      <Section id="build">
        <Container>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl" data-reveal>
              <Eyebrow>Built from experience</Eyebrow>
              <h2 className="display mt-3 text-3xl text-pine sm:text-4xl">
                Built from experience. Made for real traders.
              </h2>
            </div>
            <div className="max-w-sm lg:pt-2" data-reveal>
              <p className="leading-relaxed text-pine-soft">
                I&rsquo;ve turned years of trading knowledge, hands-on
                experience, and ideas into products that have helped clients
                trade smarter, save time, and stay in control.
              </p>
              <div className="mt-6">
                <ActionLink href="#fork">See which one fits</ActionLink>
              </div>
            </div>
          </div>

          <BuildShowcase />
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          4. Getting started: what each product costs, and how to start it.
      --------------------------------------------------------------- */}
      <Section id="fork" tone="raised">
        <Container>
          <SectionHeading eyebrow="Get started" title="Find what works for you.">
            <p>
              Whether you prefer trading on your own or letting automation do
              the work, there&rsquo;s an option for both.
            </p>
          </SectionHeading>

          {/* Before the packages, not after. It decides whether to open one
              broker account or two, which is no use to somebody who has
              already picked a package and clicked. */}
          <p
            className="mt-8 max-w-2xl border-l-2 border-pine pl-4 leading-relaxed text-pine"
            data-reveal
          >
            Mastery Signal uses a standard trading account, while Fukyaa runs
            on a cent account. You&rsquo;ll need separate accounts if you plan
            to use both.
          </p>

          <PlanSwitch
            firstLabel="Mastery Signal"
            secondLabel="Fukyaa"
            first={
              <PlanGroup
                eyebrow="Mastery Signal"
                title="Choose your access."
                intro={
                  <>
                    <p>
                      Already trading but need a second perspective? Get access
                      to my signals, market analysis and trading tools.
                    </p>
                    <p>
                      Pay for a subscription or get access through our broker
                      partner.
                    </p>
                  </>
                }
                plans={masteryPlanCards()}
                alternative={{
                  title: "Prefer to start without a subscription?",
                  body: "Open and fund an account with our broker partner to qualify for Mastery Signal access.",
                  action: {
                    label: "Explore broker access",
                    href: "/go/mastery-broker-access",
                    external: true,
                  },
                }}
              />
            }
            second={
              <PlanGroup
                eyebrow="Fukyaa"
                title="Choose how it runs."
                /* Written to match the Mastery block beside it: a question a
                   visitor would recognise themselves in, then what they get,
                   then the choice the cards below are asking them to make. */
                intro={
                  <>
                    <p>
                      No time to watch the market, or no interest in placing
                      the trades yourself? Let the automation take the
                      execution while the account stays in your name.
                    </p>
                    <p>
                      Fund a cent account and pick how it runs &mdash; a
                      robot on your own server, or the copy.
                    </p>
                  </>
                }
                note="The deposit is not a payment. It stays in your own account at the broker; what differs between the three is the running cost."
                plans={fukyaaPlanCards()}
              />
            }
          />

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
              {/* A cut-out standing on a tinted surface rather than a
                  photograph filling the frame. The figure is bottom-aligned
                  so he stands on the base of the card instead of floating in
                  the middle of it, and the frame is given a height rather
                  than taking the image's own: at 553x936 the picture is far
                  taller than it is wide, and sized to the column it would
                  have run a third longer than the text beside it. */}
              <OffsetFrame tint="sage">
                <div className="flex h-[24rem] items-end justify-center bg-sand sm:h-[30rem]">
                  <Image
                    src={site.founder.award.image}
                    alt={`${site.founder.name} receiving the ${site.founder.award.title} award`}
                    width={site.founder.award.imageWidth}
                    height={site.founder.award.imageHeight}
                    className="h-full w-auto object-contain"
                    sizes="(min-width: 640px) 480px, 100vw"
                    priority={false}
                  />
                </div>
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
                  This award marks one of the earlier chapters of my trading
                  journey. Before building the products and systems I work on
                  today, I was already spending my time studying the market,
                  taking trades and learning from the process.
                </p>
                <p>
                  It is a recognition I still value because it came from the
                  work itself.
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
      <Section tone="pine" pad="pt-10 pb-16 sm:pb-24">
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
