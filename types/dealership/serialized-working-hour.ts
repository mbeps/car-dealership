import { WorkingHour } from "./working-hour";

/**
 * Serialized working hour with string dates
 */
export type SerializedWorkingHour = {
  [K in keyof WorkingHour]: WorkingHour[K] extends Date
    ? string
    : WorkingHour[K];
};
