import { TestDriveBooking } from "./test-drive-booking";

/**
 * Test drive booking with string dates
 */
export type SerializedTestDriveBooking = {
  [K in keyof TestDriveBooking]: TestDriveBooking[K] extends Date
    ? string
    : TestDriveBooking[K];
};
