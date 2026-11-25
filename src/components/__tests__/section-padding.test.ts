import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * Section padding goes through the `pad` prop, never through `className`.
 *
 * Sixteen sections across the site asked for tighter spacing by passing a
 * padding utility in `className`, and every one of them that asked for less
 * than the default silently lost. Two utilities setting the same property
 * have equal specificity, so the winner is decided by their order in the
 * compiled stylesheet; Tailwind emits the scale ascending, so `.py-10` is
 * written before `.py-16` and `py-16` won. Nothing failed, nothing warned,
 * and the pages rendered at default spacing while the source read as though
 * they had been tightened. The owner found it by eye.
 *
 * `pad` replaces the default outright, so there is only ever one set of
 * padding utilities on the element and nothing to lose against.
 */

const SRC = path.join(process.cwd(), "src");

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

/** Every `<Section ...>` opening tag, attributes included. */
function sectionTags(text: string): string[] {
  // No dotAll flag: a negated class already spans newlines, and this
  // project's TypeScript target predates the flag.
  return text.match(/<Section\b[^>]*>/g) ?? [];
}

const PADDING_IN_CLASSNAME = /className=\{?["`][^"`]*\bp[ytb]-/;

test("the detector finds padding in a className and ignores it in pad", () => {
  expect('<Section className="py-10 sm:py-14">').toMatch(PADDING_IN_CLASSNAME);
  expect('<Section pad="py-10" className="relative">').not.toMatch(
    PADDING_IN_CLASSNAME,
  );
});

test("there are sections to check", () => {
  // Without this the scan below passes on an empty list if the component is
  // ever renamed.
  const total = sources().reduce((n, s) => n + sectionTags(s.text).length, 0);
  expect(total).toBeGreaterThan(10);
});

test("no Section receives padding through className", () => {
  for (const { file, text } of sources()) {
    for (const tag of sectionTags(text)) {
      expect(tag, `${file}: use the pad prop`).not.toMatch(
        PADDING_IN_CLASSNAME,
      );
    }
  }
});
