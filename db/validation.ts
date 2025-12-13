/**
 * Input validation schemas for database service layer.
 * These provide defense-in-depth security by validating inputs before queries.
 */

import { z } from "zod";
import { CarStatusEnum, BookingStatusEnum, UserRoleEnum } from "@/types";

// ============================================================================
// ID Validation
// ============================================================================

/**
 * Validates UUID/text IDs used throughout the system.
 * Ensures IDs are non-empty strings with reasonable length.
 */
export const idSchema = z
  .string()
  .min(1, "ID cannot be empty")
  .max(255, "ID too long");

/**
 * Validates UUID format for Supabase auth IDs.
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

// ============================================================================
// Search & Query Validation
// ============================================================================

/**
 * Validates search query strings.
 * Prevents excessively long searches that could cause DoS.
 */
export const searchQuerySchema = z
  .string()
  .max(200, "Search query too long")
  .transform((val) => val.trim())
  .optional();

/**
 * Validates pagination parameters.
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// Car-Related Validation
// ============================================================================

/**
 * Validates car status enum values.
 */
export const carStatusSchema = z.nativeEnum(CarStatusEnum);

/**
 * Validates number plate format.
 * Ensures reasonable length and non-empty.
 */
export const numberPlateSchema = z
  .string()
  .min(1, "Number plate required")
  .max(20, "Number plate too long")
  .transform((val) => val.trim().toUpperCase());

/**
 * Validates price values.
 */
export const priceSchema = z
  .number()
  .min(0, "Price cannot be negative")
  .max(999999999.99, "Price exceeds maximum");

/**
 * Validates mileage values.
 */
export const mileageSchema = z
  .number()
  .int()
  .min(0, "Mileage cannot be negative")
  .max(9999999, "Mileage exceeds maximum");

/**
 * Validates year values.
 */
export const yearSchema = z
  .number()
  .int()
  .min(1900, "Year too old")
  .max(new Date().getFullYear() + 2, "Year too far in future");

// ============================================================================
// Booking-Related Validation
// ============================================================================

/**
 * Validates booking status enum values.
 */
export const bookingStatusSchema = z.nativeEnum(BookingStatusEnum);

/**
 * Validates booking date (must be in future for new bookings).
 */
export const futureDateSchema = z.date().refine((date) => date >= new Date(), {
  message: "Booking date must be in the future",
});

/**
 * Validates time string format (HH:MM).
 */
export const timeStringSchema = z
  .string()
  .regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    "Invalid time format (use HH:MM)"
  );

// ============================================================================
// User-Related Validation
// ============================================================================

/**
 * Validates user role enum values.
 */
export const userRoleSchema = z.nativeEnum(UserRoleEnum);

/**
 * Validates email format.
 */
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email too long");

/**
 * Validates phone number (basic validation).
 */
export const phoneSchema = z
  .string()
  .max(20, "Phone number too long")
  .optional();

// ============================================================================
// Service Method Validation Helpers
// ============================================================================

/**
 * Validates search parameters for car search.
 */
export function validateSearchParams(search?: string): string | undefined {
  return searchQuerySchema.parse(search);
}

/**
 * Validates ID parameter.
 */
export function validateId(id: string): string {
  return idSchema.parse(id);
}

/**
 * Validates car status update.
 */
export function validateCarStatus(status: CarStatusEnum): CarStatusEnum {
  return carStatusSchema.parse(status);
}

/**
 * Validates booking status update.
 */
export function validateBookingStatus(
  status: BookingStatusEnum
): BookingStatusEnum {
  return bookingStatusSchema.parse(status);
}

/**
 * Validates user role update.
 */
export function validateUserRole(role: UserRoleEnum): UserRoleEnum {
  return userRoleSchema.parse(role);
}

/**
 * Validates number plate uniqueness check.
 */
export function validateNumberPlate(
  numberPlate: string,
  excludeId?: string
): { numberPlate: string; excludeId?: string } {
  return {
    numberPlate: numberPlateSchema.parse(numberPlate),
    excludeId: excludeId ? idSchema.parse(excludeId) : undefined,
  };
}
