import Link from "next/link";
import { Container, Section } from "@/components/ui";

/**
 * Every mistyped URL, every stale inbound link and every retired blog slug
 * lands here.
 *
 * It used to send people to /services — a page that no longer exists and now
 * 308s straight back to the homepage they were trying to leave. An empty
 * screen is a moment for direction, so this offers the three real ways on.
 *
 * It renders on the dark band because it is a dead end: nothing else is on
 * this page, and the only thing to do is leave it.
 */
export default function NotFound() {
  return (
    <Section tone="pine" pad="py-28 sm:py-36">
      <Container>
        <div className="mx-auto max-w-2xl">
          <p className="tnum text-sm text-sand">404</p>
          <h1 className="display mt-3 text-4xl text-paper sm:text-5xl">
            That page is not here
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-paper/80">
            The link may be old, or the page may have gone with the move from
            marketing into trading. These three still work.
          </p>

          <ul className="mt-12 space-y-4">
            {[
              {
                href: "/",
                label: "Start at the beginning",
                note: "Find which of the three you need",
              },
              {
                href: "/coaching",
                label: "Coaching",
                note: "One to one, three classes",
              },
              {
                href: "/blog",
                label: "Writing",
                note: "Notes on reading a market",
              },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-[var(--radius-panel)] bg-paper px-6 py-5 transition-colors hover:bg-sage"
                >
                  <span className="display block text-lg text-pine">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm text-pine-faint">
                    {item.note}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
