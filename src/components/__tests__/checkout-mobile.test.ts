import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * The checkout can be typed into on a phone.
 *
 * Two separate faults made the dialog unusable on the owner's phone, and
 * only the second one is visible in a desktop browser at a narrow width:
 *
 * 1. The fields were 14px. Safari on iOS zooms the whole page in when a
 *    person focuses an input whose text is smaller than 16px — it is the
 *    browser's own defence against unreadable forms. The dialog did not grow;
 *    the page scaled up around it, which is exactly what "terlalu besar dan
 *    penuh skrin" describes. 16px is the threshold, so 16px is the floor.
 *    It cannot be expressed as a `sm:` override: the zoom happens on the
 *    phone, which is the small end of the range.
 *
 * 2. `100dvh` does not shrink for the on-screen keyboard on iOS. A card
 *    sized against it keeps its full height while half the screen is keyboard,
 *    so the field being typed into sits under it. `scroll-margin-block` gives
 *    the browser room to scroll that field clear inside the card, which it
 *    already tries to do.
 */

const CSS = path.join(process.cwd(), "src", "app", "globals.css");

/** The declarations inside one rule, as written. */
function rule(css: string, selector: string): string {
  const at = css.indexOf(`${selector} {`);
  expect(at, `${selector} is not in globals.css`).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf("}", at));
}

test("a checkout field is never smaller than 16px", () => {
  const css = fs.readFileSync(CSS, "utf8");
  const field = rule(css, ".checkout-field");

  const size = /font-size:\s*([^;]+);/.exec(field);
  expect(size, ".checkout-field sets no font-size").not.toBeNull();
  expect(
    size![1].trim(),
    "below 16px, iOS zooms the page on focus and the form takes the screen",
  ).toBe("1rem");
});

test("every control a thumb taps in the checkout is at 16px", () => {
  // Anti-vacuity for the test above: the fields are not the only thing
  // focused in this dialog, and a term button at 14px zooms the page just
  // the same on the step before the fields are reached.
  const css = fs.readFileSync(CSS, "utf8");

  for (const selector of [".checkout-field", ".checkout-term"]) {
    const size = /font-size:\s*([^;]+);/.exec(rule(css, selector));
    expect(size, `${selector} sets no font-size`).not.toBeNull();
    expect(size![1].trim(), `${selector} is under the iOS zoom threshold`).toBe(
      "1rem",
    );
  }
});

test("a focused field can scroll clear of the keyboard", () => {
  const css = fs.readFileSync(CSS, "utf8");
  const field = rule(css, ".checkout-field");

  expect(
    field,
    "without scroll-margin the browser scrolls the field flush to the card edge, under the keyboard",
  ).toMatch(/scroll-margin-block:/);
});

test("the card scrolls rather than growing past the viewport", () => {
  const css = fs.readFileSync(CSS, "utf8");
  const card = rule(css, ".checkout-card");

  expect(card).toMatch(/overflow-y:\s*auto/);
  expect(card, "the card has to be bounded by the viewport").toMatch(/dvh/);
});
