import type { SeriesDef } from "./series";

export function formatValue(value: number, def: Pick<SeriesDef, "suffix" | "decimals">): string {
  const n = value.toLocaleString("en-US", {
    minimumFractionDigits: def.decimals,
    maximumFractionDigits: def.decimals,
  });
  return `${n}${def.suffix}`;
}

export function formatDate(date: string, frequency: SeriesDef["frequency"]): string {
  if (frequency === "Quarterly") {
    // Stored as the quarter's first day: "2026-07-01" is Q3 2026.
    const [y, m] = date.split("-").map(Number);
    return `Q${Math.floor((m - 1) / 3) + 1} ${y}`;
  }
  return new Date(date).toLocaleDateString(
    "en-GB",
    frequency === "Daily"
      ? { day: "numeric", month: "short", year: "numeric" }
      : { month: "long", year: "numeric" },
  );
}
