import type { TestDriveBooking } from "./test-drive-booking";

/**
 * Serializable test drive booking used when data crosses the server-client boundary.
 * Date values are converted to strings so clients can render and submit them safely.
 */
export type SerializedTestDriveBooking = {
  /** Database identifier. */
  [K in keyof TestDriveBooking]: TestDriveBooking[K] extends Date
    ? string
    : TestDriveBooking[K];
};
