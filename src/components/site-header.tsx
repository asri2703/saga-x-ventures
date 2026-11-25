"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { retailProducts } from "@/lib/products";
import { site } from "@/lib/site";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Writing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  // Closing on link click (rather than watching the pathname in an effect)
  // avoids a cascading re-render on every navigation.
  const close = () => setOpen(false);

  // Stop the page scrolling behind the open mobile menu.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes whichever thing is open. This listener is deliberately not
  // gated on the mobile panel's state: when it was, the desktop dropdown had
  // no Escape path at all, which is the only way out for a keyboard user who
  // opened it and does not want any of the three products.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setProductsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    // The panel is md:hidden, so widening past the breakpoint hides it while
    // `open` stays true — leaving the body scroll-locked with no visible way
    // to release it. Close on the breakpoint crossing instead.
    const desktop = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    desktop.addEventListener("change", onBreakpoint);
    return () => desktop.removeEventListener("change", onBreakpoint);
  }, [open]);

  return (
    <>
      {/* The header is glass too, and it is the one pane with real content
          travelling underneath it. The hairline is what separates it from the
          section below once the page has scrolled; without it the blur alone
          leaves the two reading as one surface. */}
      <header className="site-header sticky top-0 z-50 border-b border-[var(--glass-line)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${site.name} — home`}
          >
            <Logo className="h-8 w-8" />
            <span className="display text-[15px] text-pine">{site.name}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {/* Products opens a menu because none of the three is one click —
                each needs a broker account first, and saying so here stops a
                visitor bouncing off a signup form they cannot complete. */}
            {/* A disclosure, not a menu.
                It previously carried aria-haspopup="true" — which a screen
                reader announces as "has menu popup" — over a plain list of
                links, with no aria-expanded and no handler on the button. The
                one action the announcement implies did nothing. Now the state
                is real: click or Enter toggles it, aria-expanded says which
                way it is, and the panel is removed from the tree when shut
                rather than merely made invisible. */}
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setProductsOpen(false);
                }
              }}
            >
              <button
                type="button"
                onClick={() => setProductsOpen((v) => !v)}
                aria-expanded={productsOpen}
                aria-controls="products-panel"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-pine-soft transition-colors hover:text-pine"
              >
                Products
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className={`h-3 w-3 transition-transform ${productsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2.5 4.5 6 8l3.5-3.5" />
                </svg>
              </button>

              {productsOpen ? (
                <div
                  id="products-panel"
                  className="absolute left-1/2 top-full w-80 -translate-x-1/2 pt-2"
                >
                  <ul className="panel panel-raised overflow-hidden p-2">
                    {retailProducts.map((product) => (
                      <li key={product.key}>
                        <Link
                          href={product.href}
                          prefetch={false}
                          onClick={() => setProductsOpen(false)}
                          className="block rounded-[var(--radius-float)] px-3 py-2.5 transition-colors hover:bg-paper-sunk"
                        >
                          <span className="block text-sm font-semibold text-pine">
                            {product.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-pine-faint">
                            {product.forWho}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-pine-soft transition-colors hover:text-pine"
              >
                {link.label}
              </Link>
            ))}

            {/* Quiet on purpose. Ruby marks the one thing to do next, once
                per screen — and on every page except the homepage that one
                thing is in the page, not in the chrome. A ruby button here
                would compete with it on every single view. */}
            <Link
              href="/coaching"
              className="btn btn--ink ml-3 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Start here
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 p-2 text-pine md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile panel. Positioned below the 4rem header and sized with dvh so
          it fills the screen on phones whose browser chrome changes height —
          vh alone collapsed this panel on a previous build. */}
      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-rule bg-paper px-5 py-6 md:hidden"
        >
          <p className="text-xs text-pine-faint">
            Products
          </p>
          <ul className="mt-3 space-y-1">
            {retailProducts.map((product) => (
              <li key={product.key}>
                <Link
                  href={product.href}
                  prefetch={false}
                  onClick={close}
                  className="block border-b border-rule py-3"
                >
                  <span className="block font-semibold text-pine">
                    {product.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-pine-faint">
                    {product.forWho}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-6 space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="block border-b border-rule py-3 text-pine"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/coaching"
            onClick={close}
            className="btn btn--ink mt-8 block rounded-full px-5 py-3.5 text-center text-base font-semibold"
          >
            Start here
          </Link>
        </div>
      ) : null}
    </>
  );
}
