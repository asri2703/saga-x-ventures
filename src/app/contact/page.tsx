import type { Metadata } from "next";
import { fullAddress, site, waLink } from "@/lib/site";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact",
  description: `Message ${site.name} on WhatsApp, by phone or by email.`,
};

/**
 * No form here, on purpose.
 *
 * The agency-era quote form only composed a WhatsApp message and stored
 * nothing, so it was deleted rather than kept for the look of it. The real
 * forms arrive in Plan 2 with a database behind them. Shipping an input box
 * that quietly goes nowhere would be worse than shipping none.
 */
export default function ContactPage() {
  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <h1 className="display text-4xl leading-[1.1] text-pine sm:text-5xl">
            Message me directly
          </h1>
          <p className="mt-7 text-lg leading-relaxed text-pine-soft">
            WhatsApp is fastest and it reaches me rather than an inbox someone
            checks on Monday. Tell me what you have traded so far and what you
            are trying to fix.
          </p>

          <a
            href={waLink("Hi Asri, I have a question about ")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-block bg-ruby px-5 py-3 text-base font-bold text-white transition-colors hover:bg-ruby-deep"
          >
            Open WhatsApp
          </a>
        </div>

        <dl className="mt-16 grid max-w-3xl gap-8 border-t border-rule pt-10 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-pine-faint">Phone</dt>
            <dd className="mt-1">
              <a
                href={`tel:+${site.phoneRaw}`}
                className="tnum text-lg text-pine underline decoration-ruby decoration-2 underline-offset-4"
              >
                {site.phoneDisplay}
              </a>
            </dd>
          </div>

          <div>
            <dt className="text-sm text-pine-faint">Email</dt>
            <dd className="mt-1">
              <a
                href={`mailto:${site.email}`}
                className="text-lg text-pine underline decoration-ruby decoration-2 underline-offset-4"
              >
                {site.email}
              </a>
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-sm text-pine-faint">Office</dt>
            <dd className="mt-1 text-lg leading-relaxed text-pine-soft">
              <address className="not-italic">{fullAddress}</address>
            </dd>
          </div>
        </dl>
      </Container>
    </Section>
  );
}
