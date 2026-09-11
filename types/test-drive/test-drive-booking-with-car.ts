import type { SerializedCar } from "@/types/car/serialized-car";
import type { SerializedTestDriveBooking } from "@/types/test-drive/serialized-test-drive-booking";

/**
 * Test drive booking with the associated car details.
 * Used for admin listings and user reservations pages.
 */
export type TestDriveBookingWithCar = SerializedTestDriveBooking & {
  /** Serialised car details for the booked vehicle. */
  car: SerializedCar;
};
