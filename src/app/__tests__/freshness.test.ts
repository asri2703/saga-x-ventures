import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * Pages that read the clock must declare how often they are re-rendered.
 *
 * A page that calls `new Date()` and is prerendered at build time freezes the
 * answer into HTML. The Fukyaa promotional deposit is written that way: the
 * figure and its expiry date both come from the clock, so a static prerender
 * would still be quoting the promotional figure, and an expiry date already
 * in the past, long after the promotion ended. Nobody would notice until a
 * customer had been quoted the wrong price.
 *
 * The clock read is often indirect — `fukyaaRoutes()` defaults its `now`
 * argument — so this walks each page's import graph rather than only its own
 * text. Any page that can reach a clock read has to export `revalidate`, and
 * at a window short enough that a figure cannot be wrong for a whole day.
 */

const SRC = path.join(process.cwd(), "src");
const APP = path.join(SRC, "app");

/** The longest a page may serve a figure that has already changed. */
const MAX_WINDOW_SECONDS = 86_400;

function read(file: string): string {
  return fs.readFileSync(file, "utf8");
}

/** Strip comments so prose about `new Date()` is not mistaken for a call. */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const READS_CLOCK = /new Date\(\s*\)|Date\.now\(\s*\)/;

/** Resolve an import specifier to a file under src, or null if external. */
function resolve(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;

  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function importsOf(file: string, text: string): string[] {
  const out: string[] = [];
  const pattern = /(?:from|import)\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const target = resolve(file, m[1]);
    if (target) out.push(target);
  }
  return out;
}

/** Walk the import graph from a page and report the first clock read found. */
function clockReachableFrom(entry: string): string | null {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);

    const text = code(read(file));
    if (READS_CLOCK.test(text)) return file;
    queue.push(...importsOf(file, text));
  }
  return null;
}

/**
 * Whether a page is rendered per request rather than prerendered.
 *
 * The rule this file enforces exists because a page prerendered once at
 * build time freezes whatever the clock said into HTML. A page that reads
 * `searchParams` cannot be prerendered at all — Next renders it per request,
 * because the parameters are not known until one arrives — so the failure
 * the rule prevents cannot happen to it.
 *
 * This is an exemption from `revalidate`, not from the rule. A dynamic page
 * reading the clock is fine precisely because it reads it again every time.
 */
function isDynamic(text: string): boolean {
  return /searchParams/.test(code(text));
}

function pageFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "__tests__") walk(full);
      } else if (e.name === "page.tsx") {
        out.push(full);
      }
    }
  };
  walk(APP);
  return out;
}

/** The exported revalidate window, or null when the page declares none. */
function revalidateWindow(text: string): number | null {
  const m = /export const revalidate\s*=\s*(\d+)\s*;/.exec(code(text));
  return m ? Number(m[1]) : null;
}

/* ------------------------------------------------------------------ *
 * The detectors, before the thing they are asked to detect.
 * ------------------------------------------------------------------ */

test("the clock detector reads calls and ignores prose about them", () => {
  expect(code("const now = new Date();")).toMatch(READS_CLOCK);
  expect(code("const t = Date.now();")).toMatch(READS_CLOCK);
  expect(code("// the clock, new Date(), is frozen here")).not.toMatch(
    READS_CLOCK,
  );
  expect(code("/* new Date() would freeze */")).not.toMatch(READS_CLOCK);
  // A fixed date is not a clock read; it renders the same at any moment.
  expect(code('new Date("2026-12-31")')).not.toMatch(READS_CLOCK);
});

test("the revalidate detector reads a literal and rejects an expression", () => {
  expect(revalidateWindow("export const revalidate = 3600;")).toBe(3600);
  // Next requires a statically analysable literal, so an expression is not a
  // declaration this guard will accept either.
  expect(revalidateWindow("export const revalidate = 60 * 60;")).toBeNull();
  expect(revalidateWindow("export const metadata = {};")).toBeNull();
});

test("there are pages to check", () => {
  expect(pageFiles().length).toBeGreaterThan(3);
});

/* ------------------------------------------------------------------ *
 * The guard.
 * ------------------------------------------------------------------ */

test("every page that can read the clock declares a revalidate window", () => {
  for (const file of pageFiles()) {
    const source = clockReachableFrom(file);
    if (!source) continue;
    // Rendered per request, so there is nothing frozen to go stale.
    if (isDynamic(read(file))) continue;

    const window = revalidateWindow(read(file));
    expect(
      window,
      `${file} reaches a clock read in ${source} but exports no revalidate, so it would be prerendered once and never again`,
    ).not.toBeNull();
    expect(window, file).toBeGreaterThan(0);
    expect(window, file).toBeLessThanOrEqual(MAX_WINDOW_SECONDS);
  }
});

test("the walk still finds a clock read in a real file", () => {
  // This used to name /fukyaa, which quoted a deposit that expired on a date.
  // That figure is gone and, as of 24 November 2026, NO page on this site
  // reads the clock — so the guard above currently passes over an empty set.
  //
  // A guard that passes because it found nothing is the usual way a guard
  // rots, and the detectors' own self-tests above only prove the regexes
  // work on strings. This proves the whole machinery — reading a file off
  // disk, stripping its comments, finding the call — still works on a real
  // one. `sitemap.ts` reads the clock and is not a page, so it is not
  // subject to the rule and will not quietly stop being an example of it.
  const file = path.join(APP, "sitemap.ts");
  expect(fs.existsSync(file)).toBe(true);
  expect(clockReachableFrom(file)).not.toBeNull();
});

test("no prerendered page reaches a clock read, so none needs a window", () => {
  // The other half of the same fact, stated so that it fails loudly when it
  // changes. A static page that starts reading the clock will fail here
  // first, and the guard above will then tell whoever added it what to
  // declare.
  const reading = pageFiles().filter(
    (file) => clockReachableFrom(file) && !isDynamic(read(file)),
  );
  expect(reading).toEqual([]);
});

test("the dynamic exemption is used, and is not a blanket one", () => {
  // An exemption nothing uses is one nobody notices has stopped working,
  // and an exemption everything uses is the rule switched off. /checkout/done
  // reads searchParams and reaches the clock through the orders repository;
  // the rest of the site does neither.
  const dynamic = pageFiles().filter((file) => isDynamic(read(file)));
  expect(dynamic.map((f) => path.basename(path.dirname(f)))).toEqual(["done"]);
  expect(clockReachableFrom(dynamic[0])).not.toBeNull();
});
