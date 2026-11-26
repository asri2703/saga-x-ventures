import type { Metadata } from "next";
import { fukyaa, fukyaaPlans, formatMyr, formatUsd } from "@/lib/commercial";
import {
  lastReportAt,
  recordDays,
  recordFunding,
  summarise,
  todayInMalaysia,
  usd,
} from "@/lib/record";
import { divisorFor, recordAccounts } from "@/lib/record-accounts";
import { performance } from "@/lib/record-outcomes";
import {
  AutoTradeFlow,
  type FlowPackage,
  type FlowStep,
} from "@/components/auto-trade-flow";
import { RecordChart } from "@/components/record-chart";
import { RecordPanel } from "@/components/record-panel";
import { RecordTabs } from "@/components/record-tabs";
import { ServerFeed } from "@/components/server-feed";
import { Container, Section } from "@/components/ui";
import {
  ActionLink,
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
    "A robot trades your account on a server that stays on. Deposit less and rent the server monthly, or deposit more and the server is included.",
};

/**
 * AI Auto Trade.
 *
 * Five things on the page, in the order a buyer asks about them: what it
 * is, what it costs, what it has done, how to start, who to ask.
 *
 * The page went through two longer versions first. The owner's note on both
 * was the same — right design, nobody will read the sentences — and on the
 * second he asked for the layout to stop looking generated as well. So:
 *
 * - One line of copy per idea. Where a figure can say it, a figure does.
 * - No label above every heading. Only the hero names the product.
 * - The packages are two rows of figures, not two cards and a third card
 *   explaining them. The year of rent is a column in the row.
 * - One set of steps. Choosing a row sets the deposit and the last step.
 * - The server drawing sits on the paper with no card and no caption.
 *
 * What survived every cut, because cutting it would be dishonest: the rent
 * is due in a losing month too, the deposit is not a payment to the owner,
 * and the record shown is the robot's own, losing days included.
 *
 * Nothing on the page animates a balance. See `server-feed.tsx`.
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

export default async function FukyaaPage() {
  const rented = fukyaaPlans.find((plan) => plan.key === "rented-vps")!;
  const included = fukyaaPlans.find((plan) => plan.key === "included-vps")!;
  const rent = formatMyr(fukyaa.vpsMonthlyMyr);

  /* The larger deposit first: it is the one the owner would rather people
     took, and it is also the cheaper one over a year.

     The smaller package ends in a payment whose Billplz route is not built
     yet — the checkout resolves Mastery's terms only — so until it is, the
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
      const [days, funding, lastAt] = await Promise.all([
        recordDays(account.login),
        recordFunding(account.login),
        lastReportAt(account.login),
      ]);
      return { account, days, funding, lastAt };
    }),
  );
  const today = todayInMalaysia();

  const record = (
    <>
      <Scallop />
      <Section id="record" tone="pine" pad="pt-12 pb-16 sm:pb-24">
        <Container>
          <div className="max-w-xl" data-reveal>
            <h2 className="display text-4xl text-paper">Its record</h2>
            <p className="mt-4 leading-relaxed text-paper/80">
              The same robot on my own accounts. Losing days included.
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
    </>
  );

  return (
    <>
      {/* ---- 1. What it is ---- */}
      <Section className="relative overflow-hidden" pad="pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div aria-hidden className="hero-grid absolute inset-0" />
        <Container className="relative">
          <div className="max-w-3xl" data-reveal>
            <Eyebrow tone="quiet">AI Auto Trade</Eyebrow>
            <h1 className="display mt-3 text-6xl leading-[1.05] text-pine">
              A robot trades your account while you work.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-pine-soft">
              It runs on a server that never switches off. The money stays in
              your own account.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <ActionLink href="#packages">See the packages</ActionLink>
              <TextLink href="#record">See its record</TextLink>
            </div>
          </div>

          <div className="mt-14 sm:mt-20" data-reveal>
            <ServerFeed />
          </div>
        </Container>
      </Section>

      {/* ---- 2 to 4. What it costs, what it has done, how to start ---- */}
      <AutoTradeFlow
        packages={packages}
        steps={STEPS}
        between={record}
        heading={
          <div className="max-w-xl" data-reveal>
            <h2 className="display text-4xl text-pine">Two packages</h2>
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

      {/* ---- 5. Who to ask ---- */}
      <Scallop />
      <Section tone="pine" pad="pt-10 pb-16 sm:pb-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="display text-3xl text-paper">
              Not sure which package?
            </h2>
            <div className="mt-8">
              <ActionOut href="/go/whatsapp?m=contact">Ask me on WhatsApp</ActionOut>
            </div>
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
