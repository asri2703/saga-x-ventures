import Link from "next/link";
import { retailProducts } from "@/lib/products";
import { fullAddress, site } from "@/lib/site";
import { Container } from "@/components/ui";
import { Logo } from "@/components/logo";

const siteLinks = [
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Writing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
];

/**
 * No social row. The agency-era Facebook and Instagram handles were removed
 * with the pivot rather than left pointing at the old business, and the
 * trading accounts do not exist yet. An empty space is better than a link to
 * someone the company no longer is.
 */
export function SiteFooter() {
  const year = 2026; // Static: avoids a hydration mismatch and needs no client JS.

  return (
    <footer className="border-t border-rule bg-paper-raised">
      <Container className="py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="display text-[15px] text-pine">{site.name}</span>
            </Link>
            <p className="mt-4 max-w-sm leading-relaxed text-pine-soft">
              {site.description}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-pine">Products</h2>
            <ul className="mt-4 space-y-3">
              {retailProducts.map((product) => (
                <li key={product.key}>
                  <Link
                    href={product.href}
                    prefetch={false}
                    className="text-sm text-pine-soft transition-colors hover:text-ruby-deep"
                  >
                    {product.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-sm font-semibold text-pine">Site</h2>
            <ul className="mt-4 space-y-3">
              {siteLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-pine-soft transition-colors hover:text-ruby-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-pine">Contact</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="text-sm text-pine-soft transition-colors hover:text-ruby-deep"
                >
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:+${site.phoneRaw}`}
                  className="text-sm text-pine-soft transition-colors hover:text-ruby-deep tnum"
                >
                  {site.phoneDisplay}
                </a>
              </li>
              <li className="text-sm leading-relaxed text-pine-faint">
                <address className="not-italic">{fullAddress}</address>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-rule pt-6">
          <p className="text-xs leading-relaxed text-pine-faint">
            © {year} {site.name}. Trading carries risk, and nothing on this
            site is financial advice or a promise of any result.
          </p>
        </div>
      </Container>
    </footer>
  );
}
