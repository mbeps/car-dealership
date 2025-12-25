import { BookingStatus } from "@/enums/booking-status";

/**
 * Test drive booking entity
 */
export interface TestDriveBooking {
  id: string;
  carId: string;
  userId: string;
  bookingDate: Date | string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
