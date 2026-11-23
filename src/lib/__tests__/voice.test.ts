import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * Voice guards.
 *
 * These catch the mechanical tells only — the ones a regex can actually see.
 * The harder problem is cadence: balanced antithesis ("not X, but Y"),
 * contrarian reversals ("Most people do X. I do not."), and aphoristic
 * closers ("which is the point"). No test catches those. They are caught by
 * reading the copy out loud and noticing it sounds like an essay rather than
 * a person.
 */

const SRC = path.join(process.cwd(), "src");

function files(): { file: string; text: string }[] {
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

/** Words that describe every template and therefore describe nothing. */
const HYPE =
  /\b(supercharge|seamless|unlock|revolutionar?y|revolutioni[sz]e|game[-\s]?chang\w*|cutting[-\s]edge|best[-\s]in[-\s]class|effortless|robust|world[-\s]class|next[-\s]level)\b/i;

test("the hype detector works", () => {
  expect("Supercharge your trading").toMatch(HYPE);
  expect("Three classes, a day each").not.toMatch(HYPE);
});

test("no hype words appear in copy", () => {
  for (const { file, text } of files()) {
    expect(text, file).not.toMatch(HYPE);
  }
});

/**
 * The one component allowed to set tracked capitals.
 *
 * The ban was written when nothing on the site used the device, and it was
 * right then: a label shouted for decoration is not information. The design
 * reference the owner chose uses it once per section as a category marker,
 * which is information, so the rule narrowed rather than disappeared — the
 * device now lives in `Eyebrow` and every other file still fails on it.
 */
const EYEBROW = path.join(SRC, "components", "shell.tsx");

test("no uppercase tracked labels outside the eyebrow", () => {
  for (const { file, text } of files()) {
    if (file === EYEBROW) continue;
    expect(text, file).not.toMatch(/uppercase\s+tracking-/);
    expect(text, file).not.toMatch(/tracking-\w+\s+uppercase/);
  }
});

test("the exemption names a file that exists and uses it", () => {
  // An exemption pointing at a moved or renamed file silently re-bans
  // nothing and would never be noticed.
  expect(fs.existsSync(EYEBROW)).toBe(true);
  expect(fs.readFileSync(EYEBROW, "utf8")).toMatch(/uppercase\s+tracking-/);
});

test("no exclamation marks in visible copy", () => {
  for (const { file, text } of files()) {
    // A bang directly after a word character is prose. `p.slug !==` has a
    // space before it and `!x` has none after a word, so both are excluded.
    const prose = text.match(/[A-Za-z0-9]!(?!=)/g) ?? [];
    expect(prose, file).toHaveLength(0);
  }
});

/* ------------------------------------------------------------------ *
 * Decoration and motion.
 *
 * The bans come from unslop, which the owner brought in. Motion shows what
 * changed; it does not ask for attention.
 * ------------------------------------------------------------------ */

const BANNED_DECORATION =
  /animate-pulse|animate-ping|transition-all|hover:scale|drop-shadow-\[|shadow-\[0_0_|bg-gradient-to-/;

test("the decoration detector works", () => {
  expect('className="transition-all"').toMatch(BANNED_DECORATION);
  expect('className="hover:scale-105"').toMatch(BANNED_DECORATION);
  expect('className="transition-colors"').not.toMatch(BANNED_DECORATION);
});

test("no banned motion or decoration utilities are used", () => {
  for (const { file, text } of files()) {
    expect(text, file).not.toMatch(BANNED_DECORATION);
  }
});

test("the retired grid class is gone", () => {
  for (const { file, text } of files()) {
    expect(text, file).not.toMatch(/bg-chart-grid/);
  }
});

test("revealed content is only ever hidden behind a class JavaScript adds", () => {
  // The hidden starting state must sit under .motion-ready. Written as a
  // bare [data-reveal] rule, every revealed section disappears for anyone
  // whose JavaScript failed or was blocked.
  const selectors = fs
    .readFileSync("src/app/globals.css", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("[data-reveal]") && line.includes("{"));

  expect(selectors.length).toBeGreaterThan(0);
  for (const selector of selectors) {
    expect(selector, "a [data-reveal] rule outside .motion-ready").toContain(
      ".motion-ready",
    );
  }
});
