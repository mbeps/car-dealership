import * as z from "zod";

export const testDriveSchema = z.object({
  date: z.date(),
  timeSlot: z.string().min(1, "Please select a time slot"),
  notes: z.string().optional(),
});

export type TestDriveFormData = z.infer<typeof testDriveSchema>;
