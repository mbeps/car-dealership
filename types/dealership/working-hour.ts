import { DayOfWeek } from "@/enums/day-of-week";

/**
 * Working hours for dealership
 */
export interface WorkingHour {
  id: string;
  dealershipId: string;
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
