import { DayOfWeek } from "@/enums/day-of-week";

/**
 * Working hour input for form
 */
export interface WorkingHourInput {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}
