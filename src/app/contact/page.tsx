import type { Metadata } from "next";
import { fullAddress, site } from "@/lib/site";
import { Container, Section } from "@/components/ui";
import { ActionOut, Panel } from "@/components/shell";

/** The shared look for the two links that hand off to a device app. */
const contactLink =
  "text-lg font-medium text-pine underline decoration-ruby decoration-2 underline-offset-4";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
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
          <h1 className="display text-4xl text-pine sm:text-5xl">
            Message me directly
          </h1>
          <p className="mt-7 text-lg leading-relaxed text-pine-soft">
            WhatsApp is fastest and it reaches me rather than an inbox someone
            checks on Monday. Tell me what you have traded so far and what you
            are trying to fix.
          </p>

          {/* The only ruby on this page. Enquiries are what it exists for. */}
          <div className="mt-9">
            <ActionOut href="/go/whatsapp?m=contact">Open WhatsApp</ActionOut>
          </div>
        </div>

        <Panel className="mt-16 max-w-3xl">
          <dl className="grid gap-8 sm:grid-cols-2">
            {/* Plain anchors, not TextLink. A tel: or mailto: href handed
                target="_blank" leaves an empty tab behind when the handset
                or mail client takes over. */}
            <div>
              <dt className="text-sm text-pine-faint">Phone</dt>
              <dd className="mt-1">
                <a href={`tel:+${site.phoneRaw}`} className={contactLink}>
                  <span className="tnum">{site.phoneDisplay}</span>
                </a>
              </dd>
            </div>

            <div>
              <dt className="text-sm text-pine-faint">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${site.email}`} className={contactLink}>
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
        </Panel>
      </Container>
    </Section>
  );
}
