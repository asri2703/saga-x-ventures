import Link from "next/link";
import { retailProducts } from "@/lib/products";
import { fullAddress, site } from "@/lib/site";
import { Container } from "@/components/ui";
import { Logo } from "@/components/logo";
import { Scallop } from "@/components/shell";

const siteLinks = [
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Writing" },
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
    <footer>
      {/* The scalloped edge is drawn in pine against the paper, so the strip
          carrying it must stay paper-coloured — inside the dark block the
          bumps would be pine on pine and nothing would show.

          About half the pages close on a dark band of their own. There the
          strip would be a cream stripe trapped between two dark areas, so a
          rule in globals.css hides it when the last section is already pine
          and lets the two dark regions run together. */}
      <div className="footer-scallop bg-paper">
        <Scallop />
      </div>

      <div className="bg-pine-deep text-paper">
        <Container className="py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <Logo className="h-8 w-8 text-paper" />
                <span className="display text-[15px] text-paper">
                  {site.name}
                </span>
              </Link>
              <p className="mt-5 max-w-sm leading-relaxed text-paper/70">
                {site.footerLine}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-sand">Products</h2>
              <ul className="mt-4 space-y-3">
                {retailProducts.map((product) => (
                  <li key={product.key}>
                    <Link
                      href={product.href}
                      prefetch={false}
                      className="text-sm text-paper/70 transition-colors hover:text-paper"
                    >
                      {product.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <h2 className="mt-8 text-sm font-semibold text-sand">Site</h2>
              <ul className="mt-4 space-y-3">
                {siteLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-paper/70 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-sand">Contact</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="text-sm text-paper/70 transition-colors hover:text-paper"
                  >
                    {site.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:+${site.phoneRaw}`}
                    className="tnum text-sm text-paper/70 transition-colors hover:text-paper"
                  >
                    {site.phoneDisplay}
                  </a>
                </li>
                <li className="text-sm leading-relaxed text-paper/50">
                  <address className="not-italic">{fullAddress}</address>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 border-t border-paper/15 pt-6">
            <p className="text-xs leading-relaxed text-paper/50">
              © {year} {site.name}. Trading carries risk, and nothing on this
              site is financial advice or a promise of any result.
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
