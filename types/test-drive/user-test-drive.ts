import { SerializedTestDriveBooking } from "./serialized-test-drive-booking";

/**
 * User's test drive data for display
 */
export type UserTestDrive = Pick<
  SerializedTestDriveBooking,
  "id" | "status" | "bookingDate"
>;
