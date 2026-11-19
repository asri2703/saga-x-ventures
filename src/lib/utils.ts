import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, letting a later Tailwind class win over an earlier one in
 * the same group. The imported block imports this as `cn`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
