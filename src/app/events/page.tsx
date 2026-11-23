import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";
import { site } from "@/lib/site";
import { ActionOut, Panel, TextLink } from "@/components/shell";

/**
 * Placeholder.
 *
 * The real events system — the schedule, registration, and the email that
 * carries the Zoom link or the venue — is Plan 2, and needs a database and a
 * mail provider that are not wired up yet. The route exists now so the
 * navigation and the sitemap have nothing broken in them at any point.
 */

export const metadata: Metadata = {
  alternates: { canonical: "/events" },
  title: "Events",
  description:
    "Webinars and in-person sessions with Asri Zulzali. Registration opens here.",
};

export default function EventsPage() {
  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <h1 className="display text-4xl text-pine sm:text-5xl">
            Sessions, online and in person
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-pine-soft">
            Webinars run on Zoom and the link is emailed the moment you
            register. In-person seminars have a fixed number of seats.
          </p>
          <Panel className="mt-10">
            <p className="leading-relaxed text-pine-soft">
              Registration is not open on this page yet. Until it is, message us
              and we will tell you when the next session is set.
            </p>

            <div className="mt-8">
              <ActionOut href="/go/whatsapp?m=events">
                Ask about the next session
              </ActionOut>
            </div>

            <p className="mt-6 text-sm text-pine-faint">
              Or email{" "}
              <TextLink href={`mailto:${site.email}`} external>
                {site.email}
              </TextLink>
              .
            </p>
          </Panel>
        </div>
      </Container>
    </Section>
  );
}
