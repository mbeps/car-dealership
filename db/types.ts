/**
 * TypeORM-specific types and DTOs for database operations.
 * These extend the base entities with additional fields that are
 * computed or joined at runtime.
 */

import {
  DealershipInfo,
  WorkingHour,
  Car,
  CarMake,
  CarColor,
  User,
  TestDriveBooking,
} from "./entities";

/**
 * DealershipInfo with nested working hours array.
 * Used by admin settings service when fetching dealership details.
 */
export type DealershipInfoWithHours = DealershipInfo & {
  workingHours: WorkingHour[];
};

/**
 * Car entity with resolved make and color relations.
 * Used when eager loading is needed for display purposes.
 */
export type CarWithRelations = Car & {
  carMake: CarMake;
  carColor: CarColor;
};

/**
 * TestDriveBooking with all relations populated.
 * Used in admin dashboard and user reservation views.
 */
export type TestDriveBookingWithRelations = TestDriveBooking & {
  car: CarWithRelations;
  user: User;
};
