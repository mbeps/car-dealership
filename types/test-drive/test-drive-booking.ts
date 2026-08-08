import { BookingStatus } from "@/enums/booking-status";

/**
 * Test drive booking entity stored in the database.
 * Represents a prospective buyer's reservation for a specific car and time slot.
 */
export interface TestDriveBooking {
  /** Unique database identifier. */
  id: string;
  /** ID of the car booked for the test drive. */
  carId: string;
  /** ID of the user who booked the test drive. */
  userId: string;
  /** Booked date; serialised to a string for client boundaries. */
  bookingDate: Date | string;
  /** Start time for the test drive slot. */
  startTime: string;
  /** End time for the test drive slot. */
  endTime: string;
  /** Current booking status. */
  status: BookingStatus;
  /** Optional buyer notes for the dealership. */
  notes: string | null;
  /** Row creation timestamp; serialised for client boundaries. */
  createdAt: Date | string;
  /** Row last-updated timestamp; serialised for client boundaries. */
  updatedAt: Date | string;
}
