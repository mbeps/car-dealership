import { TestDriveBookingWithCar } from "./test-drive-booking-with-car";
import { UserSelection } from "../user/user-selection";

/**
 * Test drive booking with the associated car and user details.
 * Used by admin test-drive management views.
 */
export type TestDriveBookingWithUser = TestDriveBookingWithCar & {
  /** Serialised user details for the booking owner. */
  user: UserSelection;
};
