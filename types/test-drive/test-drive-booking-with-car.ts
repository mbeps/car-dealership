import { SerializedTestDriveBooking } from "./serialized-test-drive-booking";
import { SerializedCar } from "../car/serialized-car";

/**
 * Test drive booking with associated car
 */
export type TestDriveBookingWithCar = SerializedTestDriveBooking & {
  car: SerializedCar;
};
