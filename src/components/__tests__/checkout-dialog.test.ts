import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * The dialog, read as source.
 *
 * The suite runs in node with no DOM, so these are claims about the code
 * rather than about a rendered tree — the same approach `voice.test.ts` and
 * `section-padding.test.ts` already take. What they pin are the things that
 * would be invisible until a buyer hit them: a price written by hand, an
 * amount posted from the browser, a dialog that cannot be escaped, a submit
 * that can be pressed twice.
 */

/** Comments stripped: a note explaining why something is absent should not
 *  read as that thing being present. `freshness.test.ts` does the same. */
const read = (file: string) =>
  fs
    .readFileSync(path.join(process.cwd(), file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const DIALOG = read("src/components/checkout-dialog.tsx");
const OPENER = read("src/components/checkout-opener.tsx");

test("the dialog states no price of its own", () => {
  // claims.test.ts bans a money literal in a component. This says the same
  // thing from the other side: the figure has to come from commercial.ts.
  expect(DIALOG).not.toMatch(/RM\s?\d/);
  expect(DIALOG).toMatch(/formatMyr|masteryPlanTotalMyr/);
});

test("it posts a plan key and not an amount", () => {
  // A price that arrives from a browser is a price a browser can change.
  expect(DIALOG).toMatch(/planKey/);
  expect(DIALOG).not.toMatch(/amountSen\s*:/);
});

test("it asks for a name, an email and a phone number", () => {
  expect(DIALOG).toMatch(/name="name"/);
  expect(DIALOG).toMatch(/name="email"/);
  expect(DIALOG).toMatch(/name="phone"/);
  expect(DIALOG).toMatch(/type="email"/);
});

test("it tells the buyer to register with the same email", () => {
  // The only thing joining the payment here to the account there.
  expect(DIALOG).toMatch(/same email/i);
});

test("it says what the details are used for and links to the notice", () => {
  // A transaction needs the notice, not a consent checkbox — and a checkbox
  // implying otherwise would be worse than none.
  expect(DIALOG).toMatch(/\/privacy/);
  expect(DIALOG).not.toMatch(/type="checkbox"/);
});

test("it is a dialog, labelled, and escapable", () => {
  expect(DIALOG).toMatch(/role="dialog"/);
  expect(DIALOG).toMatch(/aria-modal/);
  expect(DIALOG).toMatch(/aria-labelledby/);
  expect(DIALOG).toMatch(/Escape/);
});

test("focus moves into the dialog and the opener takes it back", () => {
  expect(DIALOG).toMatch(/\.focus\(\)/);
  expect(OPENER).toMatch(/\.focus\(\)/);
});

test("the submit button cannot be pressed twice", () => {
  // Two presses are two bills for one purchase.
  expect(DIALOG).toMatch(/disabled=\{/);
});

test("opened with no package, it asks for one before anything else", () => {
  // /mastery-signal's calls to action name no term.
  expect(DIALOG).toMatch(/planKey === null|!planKey|plan === null/);
  expect(DIALOG).toMatch(/masteryPlans\.map/);
});

test("nothing inside the dialog carries data-reveal", () => {
  // Scroll reveals are collected once on mount. This mounts later, so it
  // would arrive hidden with no trigger left to un-hide it.
  expect(DIALOG).not.toMatch(/data-reveal/);
  expect(OPENER).not.toMatch(/data-reveal/);
});

test("both are client components", () => {
  expect(DIALOG).toMatch(/^"use client"/);
  expect(OPENER).toMatch(/^"use client"/);
});

test("neither reads a server-only secret", () => {
  // checkoutEnabled() reads SUPABASE_SERVICE_ROLE_KEY. Calling it here would
  // either fail or, worse, bundle it.
  for (const [name, source] of [["dialog", DIALOG], ["opener", OPENER]] as const) {
    expect(source, name).not.toMatch(/checkoutEnabled|checkoutConfig/);
    expect(source, name).not.toMatch(/SERVICE_ROLE|BILLPLZ_/);
  }
});

test("a failed submit leaves a way to reach a person", () => {
  expect(DIALOG).toMatch(/whatsapp/i);
});

test("choosing a term moves focus into the form behind it", () => {
  // The term buttons unmount the moment one is picked, and the button that
  // held focus goes with them — focus falls to <body>, outside the dialog,
  // and a keyboard user's next Tab starts from the top of the page. The
  // focus call has to run again when the choice changes, not only on mount.
  expect(DIALOG).toMatch(/useEffect\([\s\S]{0,400}?focus\(\)[\s\S]{0,200}?\},\s*\[chosen\]\)/);
});

test("the dialog is portalled to the body, not left in the page tree", () => {
  // `position: fixed` is relative to the nearest ancestor with a transform,
  // not to the window. GSAP puts a transform on the panels this opener sits
  // inside, so an in-tree dialog becomes a box clipped to its section and
  // the pricing cards below it paint on top — z-index cannot reach across
  // a stacking context it is trapped in. A portal to <body> leaves every
  // one of those ancestors behind.
  expect(DIALOG).toMatch(/createPortal/);
  expect(DIALOG).toMatch(/document\.body/);
});

test("it does not portal before the document exists", () => {
  // The dialog is a client component, but Next still renders it on the
  // server for the first paint, where `document` is not defined.
  expect(DIALOG).toMatch(/mounted|typeof document|useEffect/);
});

test("the page behind does not scroll while the dialog is open", () => {
  // Now that it covers the window rather than sitting in a section, a
  // scroll gesture that misses the card scrolls the page underneath it —
  // on a phone the backdrop is most of what a thumb lands on.
  expect(DIALOG).toMatch(/document\.body\.style\.overflow/);
});
