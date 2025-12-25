import { TestDriveBookingWithCar } from "./test-drive-booking-with-car";
import { UserSelection } from "../user/user-selection";

/**
 * Test drive booking with associated car and user
 */
export type TestDriveBookingWithUser = TestDriveBookingWithCar & {
  user: UserSelection;
};
