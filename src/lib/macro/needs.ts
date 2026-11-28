/**
 * Other series an estimate or the Fed panel needs, by the series it is for.
 * Shared by the Economy series page and the insight writer, so both work
 * from the same numbers.
 */
export const NEEDS: Record<string, string[]> = {
  "cpi-yoy": ["cpi-mom", "cpi-index"],
  "core-cpi-yoy": ["core-cpi-mom", "core-cpi-index"],
  "pce-yoy": ["pce-mom", "pce-index"],
  "core-pce-yoy": ["core-pce-mom", "core-pce-index"],
  "ppi-yoy": ["ppi-mom", "ppi-index"],
  "core-ppi-yoy": ["core-ppi-mom", "core-ppi-index"],
  "fed-funds": ["us2y"],
  effr: ["fed-funds", "us2y"],
};
