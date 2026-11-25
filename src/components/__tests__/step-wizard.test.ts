import fs from "node:fs";
import { expect, test } from "vitest";

/**
 * The wizard shows one step and hides three. These are the instructions for
 * opening and funding a real trading account, so the three it hides have to
 * be in the markup the server sends and have to be visible to a reader whose
 * browser never runs the component — otherwise a script failure turns the
 * page into step one and a dead end.
 *
 * The rule is enforced in CSS, conditional on an attribute the component
 * writes after it mounts. These guard that it stays that way, because the
 * obvious tidy-up — `hidden={at !== index}` — moves the hiding into markup
 * the server renders and breaks it silently.
 */

const SOURCE = fs.readFileSync("src/components/step-wizard.tsx", "utf8");
const CSS = fs.readFileSync("src/app/globals.css", "utf8");

test("the guards are reading the right files", () => {
  expect(SOURCE).toContain("export function StepWizard");
  expect(CSS).toContain(".wizard {");
});

test("no step is hidden by the markup the server renders", () => {
  expect(SOURCE).not.toMatch(/hidden=\{/);
  expect(SOURCE).not.toMatch(/display:\s*none/);
});

test("hiding happens only once the component has mounted", () => {
  expect(CSS).toContain(".wizard[data-ready] .wizard-step:not([data-on])");
  // And the controls that would do nothing before then are not shown either.
  expect(CSS).toContain(".wizard:not([data-ready]) .wizard-nav");
});

test("the attribute the CSS waits on is written by the component", () => {
  expect(SOURCE).toContain('setAttribute("data-ready", "true")');
});

test("every step is rendered, not only the open one", () => {
  // One map over all the steps, no slice and no filter before it.
  expect(SOURCE).toMatch(/steps\.map\(\(step, index\)/);
  expect(SOURCE).not.toMatch(/steps\[(at|active)\]/);
});
