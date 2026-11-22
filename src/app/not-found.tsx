import Link from "next/link";
import { Container, Section } from "@/components/ui";

/**
 * Every mistyped URL, every stale inbound link and every retired blog slug
 * lands here.
 *
 * It used to send people to /services — a page that no longer exists and now
 * 308s straight back to the homepage they were trying to leave. An empty
 * screen is a moment for direction, so this offers the three real ways on.
 */
export default function NotFound() {
  return (
    <Section>
      <Container>
        <div className="max-w-xl">
          <p className="tnum text-sm text-pine-faint">404</p>
          <h1 className="display mt-2 text-4xl text-pine sm:text-5xl">
            That page is not here
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-pine-soft">
            The link may be old, or the page may have gone with the move from
            marketing into trading. These three still work.
          </p>

          <ul className="mt-10 border-t border-rule">
            {[
              { href: "/", label: "Start at the beginning", note: "Find which of the three you need" },
              { href: "/coaching", label: "Coaching", note: "One to one, three classes" },
              { href: "/blog", label: "Writing", note: "Notes on reading a market" },
            ].map((item) => (
              <li key={item.href} className="border-b border-rule">
                <Link href={item.href} className="block py-5">
                  <span className="display block text-lg text-pine">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-pine-faint">
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
