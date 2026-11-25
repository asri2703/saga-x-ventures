import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * The diagram beside "Find what works for you".
 *
 * Three marks joined to the Mastery Signal mark, with a pulse running along
 * each join. The suite has no DOM, so these are claims about the source and
 * about the files on disk — which is where this kind of thing actually
 * breaks: a node whose image was never added renders as a broken box, and a
 * class with no CSS behind it renders as nothing at all.
 */

const SRC = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "connect-diagram.tsx"),
  "utf8",
);
const CSS = fs.readFileSync(
  path.join(process.cwd(), "src", "app", "globals.css"),
  "utf8",
);

/* The marks are listed in a table and rendered from it, so the assertions
   read the table rather than the JSX: `src={node.src}` tells a regex
   nothing, and a test that greps for `src="..."` in this file is testing a
   way of writing the component instead of the component. */
const sources = [...SRC.matchAll(/["'](\/connect\/[^"']+)["']/g)].map(
  (m) => m[1],
);

test("the hub and three nodes all have a file on disk", () => {
  expect(sources.length).toBe(4);
  for (const src of sources) {
    const file = path.join(process.cwd(), "public", src);
    expect(fs.existsSync(file), src).toBe(true);
    // A zero-byte png is a file that exists and still renders as nothing.
    expect(fs.statSync(file).size, src).toBeGreaterThan(1000);
  }
});

test("every node is named, because a logo is not alt text", () => {
  // An empty alt on a decorative repeat is right; these are the four things
  // the diagram is about, so a reader who cannot see them gets nothing.
  // Three come from the table (`alt: "..."`) and the hub's is written on the
  // element (`alt="..."`), so both spellings are collected.
  const alts = [
    ...[...SRC.matchAll(/alt:\s*"([^"]*)"/g)].map((m) => m[1]),
    ...[...SRC.matchAll(/alt="([^"]*)"/g)].map((m) => m[1]),
  ];
  expect(alts.length).toBe(sources.length);
  for (const alt of alts) expect(alt.trim().length).toBeGreaterThan(0);
});

test("the pulse is off unless motion is welcome", () => {
  // Everything else on this page that moves sits behind the same query. A
  // diagram with three dots running round it forever is the worst offender
  // on the page for somebody who asked for less.
  const rule = CSS.slice(CSS.indexOf(".connect-pulse"));
  const block = rule.slice(0, rule.indexOf("}"));
  expect(block).toContain("opacity: 0");

  const motion = CSS.indexOf("prefers-reduced-motion: no-preference", CSS.indexOf(".connect-"));
  expect(motion).toBeGreaterThan(-1);
  expect(CSS.slice(motion, motion + 600)).toContain(".connect-pulse");
});

test("every node carries a join, and the join is drawn twice", () => {
  // Without the lines the three marks are three marks sitting near a
  // fourth. Each node declares its own path, and that path is stroked once
  // as the route and once as the pulse — one element cannot carry two
  // strokes, so two passes is the mechanism, not a duplication.
  const paths = [...SRC.matchAll(/path:\s*"M [^"]+"/g)];
  expect(paths.length).toBe(sources.length - 1);
  expect(SRC).toContain("connect-line");
  expect(SRC).toContain("connect-pulse");
});
