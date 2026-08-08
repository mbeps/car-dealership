import { SerializedTestDriveBooking } from "./serialized-test-drive-booking";

/**
 * User-facing test drive summary.
 * Keeps only the identity, status, and date needed to show existing bookings.
 */
export type UserTestDrive = Pick<
  SerializedTestDriveBooking,
  "id" | "status" | "bookingDate"
>;
