import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * Nothing may be wider than the narrowest phone.
 *
 * A page that scrolls sideways is the one layout fault a reader cannot work
 * around: they pinch, they pan, and the section they were reading is half
 * off the edge. The owner reported it twice from his own phone, and both
 * times the page measured clean — but a clean measurement is a fact about
 * today, and the next `w-screen` someone adds breaks it again.
 *
 * So this guards the causes rather than the symptom. The symptom needs a
 * browser; the suite has no DOM (see `connect-diagram.test.ts`). The causes
 * are three patterns, and all three are visible in the source:
 *
 * 1. `100vw` as a LAYOUT width. The viewport unit includes the scrollbar's
 *    gutter on desktop, so an element set to it is wider than the space it
 *    has, every time. `w-screen` is the Tailwind spelling of the same bug.
 *
 * 2. A width fixed in pixels above the narrowest supported viewport. 320px
 *    is the floor this site holds; anything wider cannot fit inside it.
 *
 * A third cause — an `inset-0` sheet with no positioned ancestor, which
 * spreads over the whole page — is deliberately NOT guarded here. Whether an
 * element has such an ancestor is not visible in the file it lives in, and
 * the scan that tried produced two false positives on SVGs that fill their
 * parent exactly. A guard that cries wolf gets loosened, which is worse than
 * no guard. `copytrade-terms.test.ts` pins the one case that has actually
 * gone wrong, by name.
 */

const SRC = path.join(process.cwd(), "src");

/** The narrowest viewport this site is built to fit. */
const FLOOR = 320;

function sources(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "__tests__") walk(full);
        continue;
      }
      if (entry.name.endsWith(".tsx") || entry.name.endsWith(".css")) {
        out.push({ file: full, text: fs.readFileSync(full, "utf8") });
      }
    }
  };
  walk(SRC);
  return out;
}

/**
 * Lines whose pixel figures lay nothing out.
 *
 * `sizes` on a Next `<Image>` is a hint about which file to download:
 * `sizes="(max-width: 48rem) 100vw, 48rem"` is the correct way to write it.
 * A media condition — in CSS or through `matchMedia` — is a question about
 * the viewport, not an instruction to be that wide. Both read as widths to
 * a regular expression and neither can push the page sideways.
 */
const isNotLayout = (line: string) =>
  /\bsizes=|@media|matchMedia/.test(line);

/** Layout widths fixed in pixels on one line, over the floor. */
function fixedWidths(line: string): number[] {
  if (isNotLayout(line)) return [];
  return [
    ...line.matchAll(/(?:\b(?:w|min-w)-\[|\b(?:width|min-width):\s*)(\d+)px/g),
  ]
    .map((match) => Number(match[1]))
    .filter((px) => px > FLOOR);
}

test("nothing is laid out at the viewport's full width", () => {
  const offenders: string[] = [];
  for (const { file, text } of sources()) {
    text.split("\n").forEach((line, index) => {
      if (isNotLayout(line)) return;
      if (/\bw-screen\b/.test(line) || /width:\s*100vw/.test(line)) {
        offenders.push(`${file}:${index + 1} → ${line.trim().slice(0, 70)}`);
      }
    });
  }
  expect(
    offenders,
    `100vw includes the scrollbar gutter, so these are wider than the page:\n${offenders.join("\n")}`,
  ).toEqual([]);
});

test("the viewport-width detector catches the shapes it is looking for", () => {
  // Anti-vacuity: a scan that matched nothing would pass the test above.
  const probe = (line: string) =>
    !isNotLayout(line) &&
    (/\bw-screen\b/.test(line) || /width:\s*100vw/.test(line));

  expect(probe('<div className="w-screen" />')).toBe(true);
  expect(probe("  width: 100vw;")).toBe(true);
  // And leaves the legitimate one alone.
  expect(probe('sizes="(max-width: 48rem) 100vw, 48rem"')).toBe(false);
  expect(probe('<div className="w-full" />')).toBe(false);
});

test("no width is fixed above the narrowest phone", () => {
  const offenders: string[] = [];
  for (const { file, text } of sources()) {
    text.split("\n").forEach((line, index) => {
      for (const px of fixedWidths(line)) {
        offenders.push(`${file}:${index + 1} → ${px}px, over ${FLOOR}px`);
      }
    });
  }
  expect(
    offenders,
    `wider than a ${FLOOR}px phone, so the page scrolls sideways on one:\n${offenders.join("\n")}`,
  ).toEqual([]);
});

test("the fixed-width detector reads both spellings, and no false ones", () => {
  // Anti-vacuity for the test above: the same function, not a copy of it,
  // so the two cannot drift apart.
  expect(fixedWidths('<div className="w-[900px]" />')).toEqual([900]);
  expect(fixedWidths("  min-width: 640px;")).toEqual([640]);

  // At or under the floor is fine, and so is a unit that scales.
  expect(fixedWidths("  width: 320px;")).toEqual([]);
  expect(fixedWidths("  width: 100%;")).toEqual([]);

  // A figure that asks about the viewport is not a figure that sets it.
  expect(fixedWidths('sizes="(min-width: 768px) 320px, 100vw"')).toEqual([]);
  expect(fixedWidths('matchMedia("(min-width: 768px)")')).toEqual([]);
  expect(fixedWidths("@media (min-width: 640px) {")).toEqual([]);
});
