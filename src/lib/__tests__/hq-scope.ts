import path from "node:path";

/**
 * Where the HQ dashboard lives, for the design guards to step around.
 *
 * The guards in this folder (no hype words, no exclamation marks, no
 * breakpoint type sizes, no glow or gradient utilities) describe the public
 * site's voice and look. The dashboard at apps.sagaxventures.com is an
 * internal tool built from shadcn components, whose own code uses `!`
 * important modifiers and `transition-all`, and whose layout steps type at
 * breakpoints on purpose. Holding it to the marketing rules would mean
 * rewriting a component library to pass a style test written for copy.
 *
 * The exemption is by folder, and the folders are named here and nowhere
 * else, so a marketing page cannot slip into it by accident.
 */
const HQ_DIRS = [
  path.join("src", "app", "apps"),
  path.join("src", "components", "ui"),
  path.join("src", "components", "hq"),
  path.join("src", "hooks"),
];

export function isHqPath(full: string): boolean {
  const rel = path.relative(process.cwd(), full);
  return HQ_DIRS.some((dir) => rel === dir || rel.startsWith(dir + path.sep));
}
