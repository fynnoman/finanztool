import { startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths } from "date-fns";

export type RangeKey = "month" | "year" | "all";

/** Resolve a range key + optional month offset into a [start, end) window. */
export function resolveRange(key: RangeKey, monthOffset = 0): { start?: Date; end?: Date } {
  const now = new Date();
  if (key === "month") {
    const anchor = addMonths(now, monthOffset);
    return { start: startOfMonth(anchor), end: addMonths(startOfMonth(anchor), 1) };
  }
  if (key === "year") {
    return { start: startOfYear(now), end: endOfYear(now) };
  }
  return {};
}

export function withinRange(date: Date, start?: Date, end?: Date): boolean {
  if (start && date < start) return false;
  if (end && date >= end) return false;
  return true;
}
