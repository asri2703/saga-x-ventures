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

test("no uppercase tracked labels", () => {
  // Shouting a label in tracked capitals is interface decoration, not
  // information. Sentence case says the same thing without the volume.
  for (const { file, text } of files()) {
    expect(text, file).not.toMatch(/uppercase\s+tracking-/);
    expect(text, file).not.toMatch(/tracking-\w+\s+uppercase/);
  }
});

test("no exclamation marks in visible copy", () => {
  for (const { file, text } of files()) {
    // A bang directly after a word character is prose. `p.slug !==` has a
    // space before it and `!x` has none after a word, so both are excluded.
    const prose = text.match(/[A-Za-z0-9]!(?!=)/g) ?? [];
    expect(prose, file).toHaveLength(0);
  }
});
