"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { waLink, site } from "@/lib/site";
import { ButtonAnchor } from "@/components/ui";
import { Logo, Wordmark } from "@/components/logo";

/**
 * App bar.
 *
 * Compact on purpose — 56px, not the 64px of the marketing build. On a phone
 * the tab bar at the bottom carries the main destinations, so this strip only
 * needs the brand, one action, and a way into the pages that do not earn a
 * permanent slot.
 */
const primary = [
  { href: "/mula", label: "Mula" },
  { href: "/belajar", label: "Belajar" },
  { href: "/automatik", label: "Automatik" },
  { href: "/signal", label: "Signal" },
  { href: "/lounge", label: "Lounge" },
];

const secondary = [
  { href: "/signal", label: "Signal" },
  { href: "/tentang", label: "Tentang" },
  { href: "/hubungi", label: "Hubungi" },
  { href: "/risiko", label: "Penzahiran risiko" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // The sheet is md:hidden; widening past the breakpoint would otherwise
    // leave the body scroll-locked with nothing visible to close.
    const desktop = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
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
      <header className="sticky top-0 z-50 border-b border-line bg-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-text"
            aria-label={`${site.name} — laman utama`}
          >
            <Logo className="h-7 w-7" />
            <Wordmark className="text-sm" />
          </Link>

          <nav aria-label="Utama" className="hidden items-center gap-0.5 md:flex">
            {primary.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-panel hover:text-text"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/tentang"
              className="rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-panel hover:text-text"
            >
              Tentang
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ButtonAnchor
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              variant="brand"
            >
              WhatsApp
            </ButtonAnchor>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="more-menu"
              aria-label={open ? "Tutup menu" : "Menu lain"}
              className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-muted md:hidden"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              >
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Secondary sheet. The tab bar at the bottom handles the main
          destinations, so this holds only what is left. */}
      {open ? (
        <div
          id="more-menu"
          className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto border-t border-line bg-base px-4 py-5 md:hidden"
        >
          <ul className="space-y-1">
            {secondary.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="block rounded-xl bg-panel px-4 py-3.5 text-[15px] ring-1 ring-line"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
