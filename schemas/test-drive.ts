import * as z from "zod";

/**
 * Validates test drive booking details submitted by a prospective buyer.
 * Requires a selected date and time slot; notes are optional.
 */
export const testDriveSchema = z.object({
  date: z.date({
    message: "Please select a date for your test drive",
  }),
  timeSlot: z.string().min(1, "Please select a time slot"),
  notes: z.string().optional(),
});

/**
 * Parsed test drive booking data produced by `testDriveSchema`.
 * Used by test drive forms and server actions that create or update bookings.
 */
export type TestDriveFormData = z.infer<typeof testDriveSchema>;
