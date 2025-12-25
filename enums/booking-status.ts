/**
 * Booking status for test drive bookings
 */
export enum BookingStatusEnum {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export type BookingStatus = BookingStatusEnum;
