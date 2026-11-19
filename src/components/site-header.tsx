"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site, waLink } from "@/lib/site";
import { ButtonAnchor, ButtonLink } from "@/components/ui";
import { Logo, Wordmark } from "@/components/logo";

/**
 * Nav labels name the job, not the brand.
 *
 * "Fukyaa" and "Mastery Signal" mean nothing to someone arriving for the first
 * time, so the menu says what each one does and the brand name rides along on
 * the page itself.
 */
const navLinks = [
  { href: "/belajar", label: "Belajar" },
  { href: "/automatik", label: "Automatik" },
  { href: "/signal", label: "Signal" },
  { href: "/lounge", label: "Lounge" },
  { href: "/tentang", label: "Tentang" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Stop the page scrolling behind the open mobile menu.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    // The panel is md:hidden, so widening past the breakpoint hides it while
    // `open` stays true — leaving the body scroll-locked with no visible way
    // out. Close on the breakpoint crossing instead.
    const desktop = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-mist/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-navy"
            aria-label={`${site.name} — laman utama`}
          >
            <Logo className="h-8 w-8" />
            <Wordmark className="text-[15px]" />
          </Link>

          <nav aria-label="Utama" className="hidden items-center gap-1 md:flex">
            <Link
              href="/mula"
              className="rounded-full px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-paper"
            >
              Mula di sini
            </Link>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-sm text-text-muted transition-colors hover:text-text"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <ButtonAnchor
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              variant="brand"
            >
              WhatsApp
            </ButtonAnchor>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy md:hidden"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
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

      {/* Mobile panel. Rendered outside the header so the sticky bar keeps its
          own height and the panel can own the rest of the viewport. */}
      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-line bg-mist px-5 py-6 md:hidden"
        >
          <nav aria-label="Utama (mudah alih)" className="flex flex-col gap-1">
            <Link
              href="/mula"
              onClick={close}
              className="rounded-xl bg-paper px-4 py-3.5 font-display text-lg font-bold text-navy"
            >
              Mula di sini
            </Link>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="rounded-xl px-4 py-3.5 text-lg text-text transition-colors hover:bg-paper"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <ButtonAnchor
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              variant="brand"
              size="lg"
              onClick={close}
            >
              WhatsApp
            </ButtonAnchor>
            <ButtonLink href="/hubungi" variant="outline" size="lg" onClick={close}>
              Hubungi
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </>
  );
}
