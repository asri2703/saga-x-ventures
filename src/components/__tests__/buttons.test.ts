import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * One button, everywhere.
 *
 * On 25 November 2026 the owner replaced the site's buttons with a Uiverse
 * one: a panel that sweeps in from the left on hover while the label flips
 * to the colour behind it. The sweep is a `::before` panel, so it cannot be
 * described by a utility class — which is exactly how the old buttons were
 * written, `hover:bg-pine hover:text-paper` repeated in six files.
 *
 * A hand-rolled pill does not fail: it just quietly keeps the old hover and
 * is the one button on the site that does not sweep. So this reads the
 * source for action pills and insists each one wears a `btn--` tone.
 */

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : sources(full);
    }
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

/* A pill with weighted type and an action's padding. Two things are
   deliberately outside the set: icon buttons — the menu toggle, the
   WhatsApp float, the video's play target — which carry no label, and
   badges, which are the same pill at `py-1` and are read rather than
   pressed. */
const CLASSES = /class[Nn]ame=[{"`][^"`]*/g;

/* A pill with weighted type and an action's padding. Two things are
   deliberately outside the set: icon buttons — the menu toggle, the
   WhatsApp float, the video's play target — which carry no label, and
   badges, which are the same pill at `py-1` and are read rather than
   pressed. Tested as three independent conditions, not one regex, because
   the order utilities are written in is not meaningful. */
function isAction(cls: string): boolean {
  return (
    cls.includes("rounded-full") &&
    cls.includes("font-semibold") &&
    /py-(?:2\.5|3|3\.5|4)/.test(cls)
  );
}

const found = sources("src")
  .flatMap((file) =>
    (fs.readFileSync(file, "utf8").match(CLASSES) ?? []).map((cls) => ({
      file,
      cls,
    })),
  )
  .filter(({ cls }) => isAction(cls) && !cls.includes("btn--"));

test("every action pill wears a button tone", () => {
  expect(found.map((f) => `${f.file}: ${f.cls}`)).toEqual([]);
});

test("the scan is finding buttons at all", () => {
  // Without this, a regex that matches nothing passes the test above
  // for ever.
  const all = sources("src").filter((file) =>
    fs.readFileSync(file, "utf8").includes("btn--"),
  );
  expect(all.length).toBeGreaterThanOrEqual(4);
});
