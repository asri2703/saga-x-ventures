import type { Metadata } from "next";
import { site, waLink } from "@/lib/site";
import { QuoteForm } from "@/components/quote-form";
import { Card, Container, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact & Free Audit",
  description:
    "Request a free marketing audit or a quote from Sagax Ventures. Based in Seremban, Negeri Sembilan, working with SMEs across Malaysia.",
  alternates: { canonical: "/contact" },
};

const expectations = [
  {
    title: "We reply within one working day",
    body: "Usually the same day. If we cannot help, we will tell you that quickly rather than leave you waiting.",
  },
  {
    title: "The audit is genuinely free",
    body: "No card, no obligation, no trial that quietly becomes a subscription. You keep the findings either way.",
  },
  {
    title: "You speak to the person doing the work",
    body: `You deal with ${site.founder.name} directly — not a salesperson who disappears after you sign.`,
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line/60">
        <div aria-hidden className="bg-grid bg-grid-fade absolute inset-0" />
        <div
          aria-hidden
          className="animate-drift-a absolute left-1/2 top-0 h-80 w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/18 blur-[100px]"
        />
        <Container className="relative py-20 sm:py-24">
          <div className="max-w-3xl">
            <Eyebrow>Get in touch</Eyebrow>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-body sm:text-5xl">
              Tell us what is not working
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Send us your details and we will come back with a free audit of
              your website, ads, and search presence — plus a straight answer on
              what to fix first.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-body">
              Request a quote
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              The more you tell us, the more useful our first reply will be.
              Only your name and phone number are required.
            </p>
            <div className="mt-10">
              <QuoteForm />
            </div>
          </div>

          <aside className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-body">
                Prefer to message?
              </h2>
              <p className="mt-2 leading-relaxed text-muted">
                Most of our clients start on WhatsApp. It is the fastest way to
                reach us.
              </p>
              <ul className="mt-6 space-y-4 text-sm">
                <li>
                  <p className="text-faint">WhatsApp</p>
                  <a
                    href={waLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent hover:underline"
                  >
                    {site.phoneDisplay}
                  </a>
                </li>
                <li>
                  <p className="text-faint">Email</p>
                  <a
                    href={`mailto:${site.email}`}
                    className="font-semibold text-accent hover:underline"
                  >
                    {site.email}
                  </a>
                </li>
                <li>
                  <p className="text-faint">Office</p>
                  <address className="not-italic leading-relaxed text-body">
                    {site.address.street}
                    <br />
                    {site.address.postcode} {site.address.city}
                    <br />
                    {site.address.state}
                  </address>
                </li>
                <li>
                  <p className="text-faint">Serving</p>
                  <p className="text-body">SMEs across Malaysia</p>
                </li>
              </ul>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-body">
                What happens next
              </h2>
              <ul className="mt-5 space-y-5">
                {expectations.map((e) => (
                  <li key={e.title}>
                    <p className="text-sm font-semibold text-body">{e.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {e.body}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}
