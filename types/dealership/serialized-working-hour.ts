import type { WorkingHour } from "./working-hour";

/**
 * Serialized working hour with string dates.
 * Preserves non-date fields and converts date fields for JSON-safe responses.
 *
 * @see WorkingHour - Source dealership opening hours
 */
export type SerializedWorkingHour = {
  [K in keyof WorkingHour]: WorkingHour[K] extends Date
    ? string
    : WorkingHour[K];
};
