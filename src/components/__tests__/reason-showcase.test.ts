import fs from "node:fs";
import { expect, test } from "vitest";

/**
 * The showcase names its pictures as strings, and a string is not checked by
 * the compiler against the contents of `public/`. Rename a file and the
 * section still builds, still deploys, and shows four empty panels.
 *
 * Each reason needs two files: the picture and the thumbnail that picks it.
 */

const PAGE = fs.readFileSync("src/app/copytrade/page.tsx", "utf8");
const COMPONENT = fs.readFileSync("src/components/reason-showcase.tsx", "utf8");

const images = [...PAGE.matchAll(/image:\s*"([^"]+)"/g)].map((m) => m[1]);

test("the page gives every reason a picture", () => {
  expect(images.length).toBe(4);
});

test("every picture named on the page exists, with its thumbnail", () => {
  for (const image of images) {
    expect(fs.existsSync(`public/reasons/${image}`), image).toBe(true);
    expect(
      fs.existsSync(`public/reasons/${image.replace(".webp", "-thumb.webp")}`),
      `${image} thumbnail`,
    ).toBe(true);
  }
});

test("the thumbnail path is derived, not written out a second time", () => {
  // Two independent lists of four filenames is one list that will be edited
  // and one that will not.
  expect(COMPONENT).toContain('replace(".webp", "-thumb.webp")');
});

test("the pictures carry no alt text, because the copy already says it", () => {
  // Each reason's heading and body sit beside the picture. Describing the
  // illustration as well makes a screen reader read the section twice.
  expect(COMPONENT).not.toMatch(/alt=\{/);
  expect([...COMPONENT.matchAll(/alt=""/g)].length).toBe(2);
});
