import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

/**
 * The claims guard.
 *
 * The owner's own Mastery system forbids its content agents from stating win
 * rates, profits or guarantees. The parent site has to hold the same line —
 * partly for consistency, mostly because performance claims on a trading site
 * in Malaysia are a regulatory exposure nobody needs.
 *
 * The "1,200 traders" figure is a twelve-year career total. It is not a
 * member count of anything, it cannot be verified from any database, and
 * phrasing it as membership would be a claim the business cannot support.
 *
 * This walks real source and content rather than checking a list someone has
 * to remember to update.
 */

const ROOTS = ["src", "content"];
const EXTENSIONS = new Set([".ts", ".tsx", ".md"]);

/**
 * A guard that cannot tell a prohibition from a violation forbids writing
 * the rule down. Documentation that quotes a banned phrase in order to ban
 * it marks the line `claims-guard: allow` and is skipped.
 *
 * The escape hatch is per line, never per file, so it cannot be used to wave
 * a whole page through.
 */
const ALLOW = "claims-guard: allow";

function strip(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.includes(ALLOW))
    .join("\n");
}

function readAllCopy(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__" || entry.name === "node_modules") continue;
        walk(full);
        continue;
      }
      if (!EXTENSIONS.has(path.extname(entry.name))) continue;
      out.push({ file: full, text: strip(fs.readFileSync(full, "utf8")) });
    }
  };

  for (const root of ROOTS) walk(path.join(process.cwd(), root));
  return out;
}

test("the guard is actually reading files", () => {
  // Without this, every assertion below passes vacuously on an empty list.
  expect(readAllCopy().length).toBeGreaterThan(10);
});

test("no win-rate, profit or guarantee claims appear in source or content", () => {
  for (const { file, text } of readAllCopy()) {
    expect(text, file).not.toMatch(
      /win[-\s]?rate|guarantee[ds]?\b|guaranteeing|profit\s+(of|up to)/i,
    );
  }
});

test("the 1,200 figure is never phrased as membership", () => {
  for (const { file, text } of readAllCopy()) {
    expect(text, file).not.toMatch(
      /1,?200\+?\s+(active\s+)?(members|subscribers|users)/i,
    );
  }
});

test("no agency-era social profiles remain", () => {
  for (const { file, text } of readAllCopy()) {
    expect(text, file).not.toMatch(/sagaxmedia|sagaxmarketing/i);
  }
});
