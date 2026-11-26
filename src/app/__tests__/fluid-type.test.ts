import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * Type scales with the viewport, in one continuous run.
 *
 * The headings used to be built from Tailwind steps with a breakpoint
 * override: `text-4xl sm:text-5xl`. That is two fixed sizes with a jump
 * between them, so an h1 was 36px at every width from 320 to 639 and 48px
 * from 640 up. A 320px phone and a 639px phone — a 2x difference in the room
 * available — were given exactly the same type, and the owner read that on
 * his own phone as "not flexible": the page did not respond to the width, it
 * responded to a threshold it had already crossed.
 *
 * The fix is one `clamp()` per step, spanning 320px to 1280px, declared on
 * the `--text-*` theme tokens. Every existing `text-4xl` keeps working and
 * now scales; the breakpoint overrides come off, because a second size at a
 * threshold is the jump this is removing. Taking a step away is what makes
 * the range continuous, so the two halves of this test are one change:
 * leave the overrides in and the clamps only smooth the inside of each band.
 */

const SRC = path.join(process.cwd(), "src");
const CSS = path.join(SRC, "app", "globals.css");

/** The steps the headings use. Each is declared fluid, none is a fixed rem. */
const FLUID_STEPS = [
  "--text-xl",
  "--text-2xl",
  "--text-3xl",
  "--text-4xl",
  "--text-5xl",
  "--text-6xl",
] as const;

function sources(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "__tests__") walk(full);
        continue;
      }
      if (entry.name.endsWith(".tsx")) {
        out.push({ file: full, text: fs.readFileSync(full, "utf8") });
      }
    }
  };
  walk(SRC);
  return out;
}

test("every type step the headings use is a clamp, not a fixed size", () => {
  const css = fs.readFileSync(CSS, "utf8");

  for (const step of FLUID_STEPS) {
    const declaration = new RegExp(`${step}:\\s*([^;]+);`).exec(css);
    expect(declaration, `${step} is not declared in globals.css`).not.toBeNull();
    expect(
      declaration![1],
      `${step} is a fixed size; it has to scale with the viewport`,
    ).toMatch(/clamp\(/);
  }
});

test("a clamp carries a floor, a slope and a ceiling", () => {
  // Anti-vacuity for the test above: `clamp(` alone would pass with a
  // one-argument call that cannot scale. Each needs its three parts, and the
  // middle one has to move with the viewport.
  const css = fs.readFileSync(CSS, "utf8");

  for (const step of FLUID_STEPS) {
    const declaration = new RegExp(`${step}:\\s*clamp\\(([^;]+)\\);`).exec(css);
    expect(declaration, `${step} is not a clamp with arguments`).not.toBeNull();
    const parts = declaration![1].split(",");
    expect(parts, `${step} needs a floor, a preferred size and a ceiling`)
      .toHaveLength(3);
    expect(parts[1], `${step} does not scale: its middle term has no vw`)
      .toMatch(/vw/);
  }
});

test("no heading sets a second size at a breakpoint", () => {
  const files = sources();
  // Anti-vacuity: a walk that found nothing would pass the loop below.
  expect(files.length).toBeGreaterThan(20);

  const offenders: string[] = [];
  for (const { file, text } of files) {
    text.split("\n").forEach((line, index) => {
      const step = /\b(sm|md|lg|xl):text-(?:xs|sm|base|lg|\d*xl)\b/.exec(line);
      if (step) offenders.push(`${file}:${index + 1} → ${step[0]}`);
    });
  }

  expect(
    offenders,
    `type is sized by clamp now; these set a second size at a breakpoint:\n${offenders.join("\n")}`,
  ).toEqual([]);
});
