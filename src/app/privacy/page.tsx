import type { Metadata } from "next";
import { fullAddress, site } from "@/lib/site";
import { Container, Section } from "@/components/ui";

/**
 * PDPA notice.
 *
 * DRAFT — the owner is to have this wording checked before launch. It is
 * written from the shape Malaysia's Personal Data Protection Act expects and
 * from the pattern in the owner's existing mastery-privacy repo, but neither
 * this file nor its author is a lawyer, and this is the one page on the site
 * that carries legal weight.
 *
 * It already describes the event registration and payment flows that Plan 2
 * builds, because a notice written after collection starts is a notice
 * written too late.
 */

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${site.name} collects, uses and stores personal information, under Malaysia's Personal Data Protection Act.`,
  robots: { index: true, follow: false },
};

const updated = "22 November 2026";

export default function PrivacyPage() {
  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <h1 className="display text-4xl text-pine sm:text-5xl">
            Privacy notice
          </h1>
          <p className="mt-4 text-sm text-pine-faint">Last updated {updated}</p>

          <div className="prose mt-10">
            <h2>Who holds your information</h2>
            <p>
              {site.name}, {fullAddress}. For anything in this notice, contact{" "}
              <a href={`mailto:${site.email}`}>{site.email}</a> or{" "}
              {site.phoneDisplay}.
            </p>

            <h2>What is collected, and when</h2>
            <p>
              Nothing is collected from simply reading this site. Information is
              collected only when you hand it over:
            </p>
            <ul>
              <li>
                <strong>When you message or email us</strong> — your name, your
                contact details, and whatever you choose to tell us.
              </li>
              <li>
                <strong>When you register for a webinar or seminar</strong> —
                your name, email address and phone number, so the joining link
                or the venue details can reach you.
              </li>
              <li>
                <strong>When you pay for something</strong> — your name and
                contact details, what you bought, and, if you pay by transfer, a
                copy of the receipt you upload. Card and online banking details
                are handled by the payment provider and never reach this site.
              </li>
            </ul>

            <h2>What it is used for</h2>
            <p>
              To answer you, to send you what you registered or paid for, and to
              keep a record of the transaction. That is the whole list.
            </p>
            <p>
              Marketing is separate and optional. Where a form offers to send
              you news of future sessions, that box is unticked and leaving it
              unticked never stops you registering or buying — you are asking
              for a service, not for advertising. If you do tick it, you can ask
              to be taken off at any time.
            </p>

            <h2>Who else sees it</h2>
            <p>
              Service providers who make the site work: a database host, an
              email delivery provider, and a payment provider. They process it
              on our instructions and for no other purpose. Your information is
              not sold, and it is not passed to anyone else for their own
              marketing.
            </p>

            <h2>How long it is kept</h2>
            <p>
              Enquiries are kept while there is a reason to — an ongoing
              conversation or a continuing relationship. Records tied to a
              payment are kept for as long as Malaysian tax and accounting rules
              require. Anything else is deleted when it is no longer needed.
            </p>

            <h2>Your rights</h2>
            <p>
              You can ask what is held about you, ask for it to be corrected,
              ask for it to be deleted where there is no legal reason to keep
              it, and withdraw consent for marketing at any time. Write to{" "}
              <a href={`mailto:${site.email}`}>{site.email}</a> and you will get
              an answer.
            </p>

            <h2>Changes</h2>
            <p>
              This notice changes when what we collect changes. The date at the
              top is when it was last revised.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
