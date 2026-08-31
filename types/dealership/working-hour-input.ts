import type { DayOfWeek } from "@/enums/day-of-week";

/**
 * Working hour input for form.
 * Represents the subset of opening-hour data submitted by admin forms.
 */
export interface WorkingHourInput {
  /** Day of week for this schedule. */
  dayOfWeek: DayOfWeek;
  /** Opening time in 24-hour format. */
  openTime: string;
  /** Closing time in 24-hour format. */
  closeTime: string;
  /** Whether the dealership is open on this day. */
  isOpen: boolean;
}
