/**
 * Test drive booking form data.
 * Mirrors the Zod-validated booking input before it is sent to the server action.
 */
export interface TestDriveFormData {
  /** ID of the car selected for the test drive. */
  carId: string;
  /** Date selected by the user for the test drive. */
  bookingDate: string;
  /** Start time for the requested test drive slot. */
  startTime: string;
  /** End time for the requested test drive slot. */
  endTime: string;
  /** Optional notes sent to the dealership with the booking. */
  notes?: string;
}
