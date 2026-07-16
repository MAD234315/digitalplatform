import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conflict resolution.
 *
 * Combines `clsx` (conditional class composition) with `tailwind-merge`
 * (later Tailwind class wins on the same property). Prefer this over raw
 * string concatenation whenever a component takes a `className` prop.
 *
 * @example
 *   cn("px-2 py-1", isActive && "bg-primary", "px-4") // -> "py-1 bg-primary px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
