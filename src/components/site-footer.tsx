import Link from "next/link";
import { products } from "@/lib/products";
import { fullAddress, site } from "@/lib/site";
import { Container } from "@/components/ui";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  const year = 2026; // Static: avoids a hydration mismatch and needs no client JS.

  return (
    <footer className="border-t border-line bg-surface">
      <Container className="py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="text-[15px] font-semibold tracking-tight text-body">
                {site.name}
              </span>
            </Link>
            <p className="mt-4 max-w-sm leading-relaxed text-muted">
              {site.description}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-body">Products</h2>
            <ul className="mt-4 space-y-3">
              {products.map((s) => (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    className="text-sm text-muted transition-colors hover:text-accent"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-body">Company</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  Insights
                </Link>
              </li>
              <li>
                <Link
                  href="/#process"
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  How we work
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  Contact
                </Link>
              </li>
            </ul>

            <h2 className="mt-8 text-sm font-semibold text-body">Get in touch</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:+${site.phoneRaw}`}
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  {site.phoneDisplay}
                </a>
              </li>
              <li className="text-sm leading-relaxed text-faint">
                {/* Full address in the footer on every page — a consistent
                    NAP (name, address, phone) across the site is what local
                    SEO is built on. */}
                <address className="not-italic">{fullAddress}</address>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <p className="text-sm text-faint">
            © {year} {site.name}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
