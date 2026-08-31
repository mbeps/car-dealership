import type { DayOfWeek } from "@/enums/day-of-week";

/**
 * Working hours for dealership.
 * Stores one weekly schedule row for dealership opening availability.
 */
export interface WorkingHour {
  /** Primary key for this weekly schedule row. */
  id: string;
  /** Dealership profile this schedule belongs to. */
  dealershipId: string;
  /** Day of week for this schedule. */
  dayOfWeek: DayOfWeek;
  /** Opening time in 24-hour format. */
  openTime: string;
  /** Closing time in 24-hour format. */
  closeTime: string;
  /** Whether the dealership is open on this day. */
  isOpen: boolean;
  /** Record creation timestamp. */
  createdAt: Date | string;
  /** Record last update timestamp. */
  updatedAt: Date | string;
}
