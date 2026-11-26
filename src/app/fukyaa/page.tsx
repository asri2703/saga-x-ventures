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
import { performance } from "@/lib/record-outcomes";
import { RecordChart } from "@/components/record-chart";
import { RecordPanel } from "@/components/record-panel";
import { RecordTabs } from "@/components/record-tabs";
import { RentSteps, type RentFinish, type RentStep } from "@/components/rent-steps";
import { ServerFeed } from "@/components/server-feed";
import { Container, Section } from "@/components/ui";
import {
  ActionOut,
  Eyebrow,
  Panel,
  Scallop,
  TextLink,
} from "@/components/shell";

/* The record is read from the feed at render, exactly as /copytrade reads
   it: same accounts, same EA, same hourly interval. */
export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/fukyaa" },
  title: "AI Auto Trade",
  description:
    "An expert advisor places the trades on a rented server that stays on. Deposit the smaller amount and rent the server monthly, or deposit more and the server is included.",
};

/**
 * AI Auto Trade.
 *
 * The same template as /copytrade — hero, a dark band that says what the
 * thing is, the real record, then the steps — because it is the same EA
 * underneath and a reader who has seen one page should recognise the other.
 * What differs is the commercial shape, and that difference is the whole
 * reason this page is written the way it is.
 *
 * On /copytrade the owner is paid out of the month's profit, so a month
 * without one costs the client nothing. Here the server is rented: the
 * client pays whether the month went well or badly. The risk is no longer
 * shared, and that is the question a reader has even when they would not
 * put it in those words. So the rent is stated as a year of rent as well as
 * a month of it — twelve months of the smaller package against nothing on
 * the larger one — and the section that explains what is being rented also
 * says what is not.
 *
 * Stating the yearly figure argues for the larger deposit, which is what
 * the owner wants. It also tells somebody considering the smaller package
 * that the rent is real money, and some of them will stop there. He was
 * told that and asked for the figure anyway.
 *
 * The picture is a server sending data, not a balance climbing. See
 * `server-feed.tsx` for why that is not a stylistic preference.
 */

/* --------------------------------------------------------------- *
 * The steps.
 *
 * Shared up to the last one, where the two packages genuinely part: the
 * smaller one has a server to pay for and the larger one does not.
 * --------------------------------------------------------------- */

function sharedSteps(depositUsd: number): RentStep[] {
  return [
    {
      key: "account",
      title: "Open a cent account",
      short: "Open",
      body: "Cent accounts use smaller contract sizes, so the expert advisor can size each position finely. Open it through the link below so the account is attributed to this site.",
      points: [
        "Keep the MT5 login number and password",
        "They are what logs you into MetaTrader 5",
        "This is the account you deposit into",
      ],
      href: "/go/broker-cent",
      cta: "Open the account",
    },
    {
      key: "verify",
      title: "Verify it",
      short: "Verify",
      body: "The broker checks a valid document before the account can take money. Nothing here can be done until this clears, and it is not instant.",
      points: [
        "Identity card",
        "Passport",
        "Another document issued by your country",
      ],
    },
    {
      key: "deposit",
      title: "Fund it",
      short: "Deposit",
      body: `At least ${formatUsd(depositUsd)}. The money stays in your own account under your own name — it is what the expert advisor trades with, not a payment to me.`,
      points: [
        "Deposited and withdrawn through the broker, not through this site",
        "More capital means larger positions, up and down alike",
        "I never hold or move your funds",
      ],
    },
  ];
}

export default async function FukyaaPage() {
  const rented = fukyaaPlans.find((plan) => plan.key === "rented-vps")!;
  const included = fukyaaPlans.find((plan) => plan.key === "included-vps")!;

  /* A year of rent, computed rather than written down. A ringgit figure
     typed into a page is a bug even while it is correct — see the money
     detector in `claims.test.ts` — and this one is twelve times a number
     the owner changes. */
  const rentYearMyr = fukyaa.vpsMonthlyMyr * 12;

  /* The record. The same accounts /copytrade publishes, because they run
     this EA: a page about renting the robot that hid the robot's own record
     would be hiding the only evidence on the site. */
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

  /* The two finishes.

     The smaller package ends in a payment, and the Billplz route for it is
     not built yet — the checkout resolves Mastery's terms only. Rather than
     a button that cannot work, this takes the arrangement that already
     works, which is the same fallback `product-guide.tsx` uses when the
     checkout gate is shut. It is replaced by the dialog once the route
     accepts these packages. */
  const rentedFinish: RentFinish = {
    title: "Rent the server",
    short: "Get AI Auto Trade",
    body: `The expert advisor runs on a server rather than on your own machine, so it keeps trading when your laptop is shut. ${formatMyr(fukyaa.vpsMonthlyMyr)} buys one month. There is no standing payment: when the month is up it stops, and you are sent a reminder before it does.`,
    cta: "Arrange the server",
    href: "/go/whatsapp?m=fukyaa",
    note: "The registration link and the account connection are sent by email once the month is paid.",
  };

  const includedFinish: RentFinish = {
    title: "Register for auto trade",
    short: "Get AI Auto Trade",
    body: "Nothing monthly on this package, so there is nothing to pay for here. Register, and your trading account is connected to the server afterwards.",
    cta: "Register",
    href: "/go/fukyaa-register",
    note: "You are emailed once the account is connected. That part is done by hand, not instantly.",
  };

  return (
    <>
      {/* ---------------------------------------------------------------
          1. The hero.
      --------------------------------------------------------------- */}
      <Section className="relative overflow-hidden">
        <div aria-hidden className="hero-grid absolute inset-0" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-center lg:gap-16">
            <div data-reveal>
              <Eyebrow tone="quiet">AI Auto Trade</Eyebrow>
              <h1 className="display mt-3 text-5xl leading-[1.1] text-pine">
                You rent the server. The robot does the clicking.
              </h1>

              <div className="mt-7 space-y-5 text-lg leading-relaxed text-pine-soft">
                <p>
                  Some people told me straight that they were never going to
                  learn to read a chart. A course would have wasted their
                  money.
                </p>
                <p>
                  An expert advisor places the trades instead, on a machine
                  that stays awake. You fund your own account and leave it
                  alone.
                </p>
                <p>
                  If you would rather follow a person than an algorithm, that
                  is <TextLink href="/copytrade">Copytrade</TextLink>. Same
                  account type, and you pay out of the profit rather than
                  monthly.
                </p>
              </div>
            </div>

            <div data-reveal>
              <ServerFeed />
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          2. What you rent, and what you do not.

          The honest half. A rental is paid in a losing month too, and a
          page that leaves a reader to discover that has sold them
          something they did not agree to.
      --------------------------------------------------------------- */}
      <Scallop />
      <Section tone="pine" pad="pt-12 pb-12 sm:pt-14 sm:pb-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <Eyebrow tone="onDark">What you rent</Eyebrow>
              <h2 className="display mt-3 text-4xl text-paper">
                A machine that never sleeps.
              </h2>
              <p className="mt-5 leading-relaxed text-paper/80">
                A server with the expert advisor on it, logged into your
                account, awake when you are not. It opens, manages and closes
                positions on its own settings, with no decision from you and
                none from me.
              </p>
            </div>

            <div data-reveal>
              <Eyebrow tone="onDark">What you do not rent</Eyebrow>
              <h2 className="display mt-3 text-4xl text-paper">
                An outcome.
              </h2>
              <p className="mt-5 leading-relaxed text-paper/80">
                The rent is due whether the month went well or badly. It is
                not a share of anything, so a flat month and a good one cost
                the same. Copytrade is the other arrangement: a share of the
                month&rsquo;s profit, and nothing in a month without one.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          3. What it costs.

          Two packages, and the yearly figure beneath them. The deposit and
          the rent are not the same kind of money and the paragraph says so
          first, because a reader who thinks the deposit is a fee to me has
          misread the entire page.
      --------------------------------------------------------------- */}
      <Section tone="raised">
        <Container>
          <div className="max-w-2xl" data-reveal>
            <Eyebrow tone="quiet">What it costs</Eyebrow>
            <h2 className="display mt-3 text-4xl text-pine">
              Two numbers, and only one of them is a payment.
            </h2>
            <p className="mt-4 leading-relaxed text-pine-soft">
              The deposit goes into your own trading account and stays yours
              — you can withdraw it. The server rent is the only money that
              comes to me, and only on the smaller package.
            </p>
          </div>

          <div className="mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
            {[rented, included].map((plan) => (
              <Panel key={plan.key} className="flex flex-col" data-reveal>
                <Eyebrow tone="quiet">{plan.name}</Eyebrow>
                <p className="display mt-3 text-3xl text-pine">
                  <span className="tnum">{formatUsd(plan.depositUsd)}</span>{" "}
                  deposit
                </p>
                <p className="mt-3 flex-1 leading-relaxed text-pine-soft">
                  {plan.vpsMonthlyMyr === null
                    ? "The server is included. Nothing monthly, ever."
                    : "A smaller deposit, with the server rented month by month."}
                </p>
                <p
                  className={`mt-6 rounded-[var(--radius-float)] px-4 py-3 text-sm font-semibold text-pine ${plan.vpsMonthlyMyr === null ? "bg-sage" : "bg-blush"}`}
                >
                  {plan.vpsMonthlyMyr === null ? (
                    <>No server rent.</>
                  ) : (
                    <>
                      Plus{" "}
                      <span className="tnum">
                        {formatMyr(plan.vpsMonthlyMyr)}
                      </span>{" "}
                      a month for the server.
                    </>
                  )}
                </p>
              </Panel>
            ))}
          </div>

          {/* The year. One line of arithmetic the owner asked for, in
              ringgit on both sides so there is no exchange rate in it —
              this site has never had one and inventing one here would put a
              figure on the page that nobody set. */}
          <div className="mt-8 max-w-3xl" data-reveal>
            <Panel>
              <h3 className="display text-xl text-pine">
                Over a year, the rent is the difference.
              </h3>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-semibold text-pine-faint">
                    {rented.name}, twelve months of server
                  </dt>
                  <dd className="display tnum mt-1 text-3xl text-pine">
                    {formatMyr(rentYearMyr)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-pine-faint">
                    {included.name}, twelve months of server
                  </dt>
                  <dd className="display tnum mt-1 text-3xl text-pine">
                    {formatMyr(0)}
                  </dd>
                </div>
              </dl>
              <p className="mt-5 leading-relaxed text-pine-soft">
                That is the trade: a larger deposit, which stays your money,
                against a year of rent, which does not. Whether it is worth
                it depends on whether you were going to fund the account that
                far anyway.
              </p>
            </Panel>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          4. The record.

          The same accounts as /copytrade. They run this EA, so this is the
          robot's own record rather than an illustration of one — and the
          losing days are in it, because a record that drops them is not a
          record.
      --------------------------------------------------------------- */}
      <Section tone="pine">
        <Container>
          <div className="mx-auto max-w-xl text-center" data-reveal>
            <Eyebrow tone="onDark">The robot&rsquo;s own record</Eyebrow>
            <h2 className="display mt-3 text-4xl text-paper">
              This is what it has done.
            </h2>
            <p className="mt-5 leading-relaxed text-paper/80">
              These accounts run the same expert advisor you would be renting
              the server for. Read from their MT5 terminals, hourly, losing
              days and all. Past results do not predict future ones.
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
                  return {
                    key: account.key,
                    label: account.label,
                    result: `${usd(trading, true, divisorFor(account.unit))} USD`,
                    tone:
                      trading > 0
                        ? ("up" as const)
                        : trading < 0
                          ? ("down" as const)
                          : ("flat" as const),
                    returnPct: perf ? pct(perf.returnPct) : undefined,
                    returnTone: perf
                      ? perf.returnPct > 0
                        ? ("up" as const)
                        : perf.returnPct < 0
                          ? ("down" as const)
                          : ("flat" as const)
                      : undefined,
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
          5 and 6. The two packages, step by step.

          A section each, as /fukyaa has always had — the reader picks a
          package and reads that set of steps, rather than a toggle that
          hides half the page behind a control. The steps are identical up
          to the deposit figure and part at the finish.
      --------------------------------------------------------------- */}
      <Section id="included">
        <Container>
          <div className="max-w-2xl" data-reveal>
            <Eyebrow>Package one</Eyebrow>
            <h2 className="display mt-3 text-3xl text-pine">
              {included.name} — {formatUsd(included.depositUsd)}, no rent
            </h2>
            <p className="mt-3 leading-relaxed text-pine-soft">
              Fund the account this far and the server comes with it. Four
              steps, in the order the broker requires them.
            </p>
          </div>
          <div className="mt-10 max-w-3xl" data-reveal>
            <RentSteps
              steps={sharedSteps(included.depositUsd)}
              finish={includedFinish}
            />
          </div>
        </Container>
      </Section>

      <Section id="rented" tone="raised">
        <Container>
          <div className="max-w-2xl" data-reveal>
            <Eyebrow>Package two</Eyebrow>
            <h2 className="display mt-3 text-3xl text-pine">
              {rented.name} — {formatUsd(rented.depositUsd)}, plus the server
            </h2>
            <p className="mt-3 leading-relaxed text-pine-soft">
              Start smaller, or keep the broker you already use, and rent the
              server monthly instead. Any broker that allows an expert advisor
              will do; the one I link to is a recommendation, not a
              requirement.
            </p>
          </div>
          <div className="mt-10 max-w-3xl" data-reveal>
            <RentSteps
              steps={sharedSteps(rented.depositUsd)}
              finish={rentedFinish}
            />
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------
          7. The close, and the fine print.
      --------------------------------------------------------------- */}
      <Scallop />
      <Section tone="pine" pad="pt-10 pb-16 sm:pb-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="display text-3xl text-paper">
              Not sure which package fits what you have to work with?
            </h2>
            <p className="mt-5 leading-relaxed text-paper/80">
              Ask me before you pay or deposit anything.
            </p>
            <div className="mt-9">
              <ActionOut href="/go/whatsapp?m=contact">
                Ask about AI Auto Trade
              </ActionOut>
            </div>
          </div>
        </Container>
      </Section>

      <Section pad="py-14">
        <Container>
          <p className="max-w-2xl rounded-[var(--radius-panel)] bg-paper-sunk px-7 py-6 text-sm leading-relaxed text-pine-soft">
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
