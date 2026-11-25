import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { outbound } from "@/lib/products";
import { site } from "@/lib/site";
import nextConfig from "../../../next.config";

/**
 * Guards for the services -> products migration and for the attribution the
 * whole site exists to produce.
 *
 * A whole-branch review found the pivot had stopped one layer short: /blog,
 * /blog/[slug] and the 404 page were still selling a marketing agency on a
 * trading domain, live and indexable. Screenshots of the new pages could not
 * catch it because those pages were never looked at. A scan can.
 */

const SRC = path.join(process.cwd(), "src");

function sourceFiles(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "__tests__") walk(full);
        continue;
      }
      if (/\.tsx?$/.test(e.name)) out.push({ file: full, text: fs.readFileSync(full, "utf8") });
    }
  };
  walk(SRC);
  return out;
}

/* ------------------------------------------------------------------ *
 * The agency is gone. Its vocabulary has to go with it.
 * ------------------------------------------------------------------ */

const AGENCY_VOCABULARY =
  /free audit|\bSMEs?\b|href="\/services|search presence|ad accounts|web design|digital marketing/i;

test("the agency vocabulary detector works", () => {
  expect("Get a free audit").toMatch(AGENCY_VOCABULARY);
  expect('<ButtonLink href="/services">').toMatch(AGENCY_VOCABULARY);
  expect("Signals for traders who can already read a chart").not.toMatch(
    AGENCY_VOCABULARY,
  );
});

test("no page or component still sells the marketing agency", () => {
  for (const { file, text } of sourceFiles()) {
    expect(text, file).not.toMatch(AGENCY_VOCABULARY);
  }
});

/* ------------------------------------------------------------------ *
 * Attribution. The counter must count clicks, not page views.
 * ------------------------------------------------------------------ */

test("every internal link to /go disables prefetch", () => {
  // next/link prefetches on viewport entry and target="_blank" does not opt
  // out, so a prefetched /go link fires the redirect handler for every
  // visitor who merely scrolls it into view. Once Plan 2 logs a row per hit,
  // that turns the click counter into a page-view counter.
  for (const { file, text } of sourceFiles()) {
    // [^>] already spans newlines, and stopping at `>` keeps the match inside
    // a single opening tag. Letting it run further matched a <Link> on one
    // line against a plain <a href="/go/..."> further down the file — and a
    // plain anchor does not prefetch, so that was a false accusation.
    const linksToGo =
      /<Link\b[^>]*href=\{?["`]?\/go\//.test(text) ||
      /<Link\b[^>]*href=\{(?:product|s)\.href\}/.test(text);
    if (!linksToGo) continue;
    expect(text, `${file} links to /go without prefetch={false}`).toMatch(
      /prefetch=\{false\}/,
    );
  }
});

test("the WhatsApp destination is built from the one phone number", () => {
  // site.ts is the single source of business facts. A second copy of the
  // digits means changing the number updates the footer, the tel: link and
  // the schema while the float keeps redirecting to the old one.
  expect(outbound.whatsapp).toContain(site.phoneRaw);

  const products = fs.readFileSync(path.join(SRC, "lib/products.ts"), "utf8");
  expect(products, "products.ts hardcodes the phone number").not.toMatch(
    new RegExp(site.phoneRaw),
  );
});

/* ------------------------------------------------------------------ *
 * Routing and metadata.
 * ------------------------------------------------------------------ */

test("every retired service URL is permanently redirected", async () => {
  const redirects = await nextConfig.redirects!();
  const sources = redirects.map((r) => r.source);
  const services = [
    "/services",
    "/services/website-development",
    "/services/google-ads",
    "/services/social-media-ads",
    "/services/seo",
    "/services/system-development",
  ];
  for (const p of services) {
    expect(sources, `${p} is not redirected`).toContain(p);
  }
  for (const r of redirects) {
    // Permanent is the part that holds for all of them: a redirect a search
    // engine treats as temporary never moves the URL's standing across.
    expect(r.permanent, `${r.source} is not permanent`).toBe(true);
    // Where they land does not. The service pages fold into the homepage;
    // /mastery-signal goes to the product's own site, which is the whole
    // reason that page no longer exists here.
    if (services.includes(r.source)) expect(r.destination).toBe("/");
  }
});

test("every page declares a canonical URL", async () => {
  // Query strings arrive on every link this site is built to attract — utm
  // tags, fbclid from WhatsApp shares, IB referral params. Without a
  // canonical, Google is free to consolidate onto one of those variants.
  type WithMetadata = {
    metadata?: { alternates?: { canonical?: string | URL | null } };
  };

  const pages: [string, Promise<unknown>][] = [
    ["/about", import("@/app/about/page")],
    ["/copytrade", import("@/app/copytrade/page")],
    ["/fukyaa", import("@/app/fukyaa/page")],
    ["/coaching", import("@/app/coaching/page")],
    ["/contact", import("@/app/contact/page")],
    ["/events", import("@/app/events/page")],
    ["/privacy", import("@/app/privacy/page")],
    ["/blog", import("@/app/blog/page")],
  ];

  for (const [route, mod] of pages) {
    const { metadata } = (await mod) as WithMetadata;
    expect(metadata?.alternates?.canonical, `${route} has no canonical`).toBe(
      route,
    );
  }
});

/* ------------------------------------------------------------------ *
 * The hero diagram's reveal.
 * ------------------------------------------------------------------ */

test("the drawn path is normalised so the reveal cannot silently truncate", () => {
  // stroke-dasharray against a hardcoded length is wrong in both directions:
  // too long and the line snaps in early with dead air after it, too short
  // and everything past the ceiling never renders at all, with no error.
  // pathLength normalises the real geometry so the numbers stay exact.
  const chart = fs.readFileSync(
    path.join(SRC, "components/marked-chart.tsx"),
    "utf8",
  );
  expect(chart, "the path does not declare pathLength").toMatch(
    /pathLength=\{?["{]?1000/,
  );
  expect(chart).toMatch(/--draw-length[^\d]*1000/);
});
