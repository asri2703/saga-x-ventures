import type { SeriesDef } from "./series";

export function formatValue(value: number, def: Pick<SeriesDef, "suffix" | "decimals">): string {
  const n = value.toLocaleString("en-US", {
    minimumFractionDigits: def.decimals,
    maximumFractionDigits: def.decimals,
  });
  return `${n}${def.suffix}`;
}

export function formatDate(date: string, frequency: SeriesDef["frequency"]): string {
  return new Date(date).toLocaleDateString(
    "en-GB",
    frequency === "Daily"
      ? { day: "numeric", month: "short", year: "numeric" }
      : { month: "long", year: "numeric" },
  );
}
