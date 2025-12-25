import * as z from "zod";

export const testDriveSchema = z.object({
  date: z.date({
    required_error: "Please select a date for your test drive",
  }),
  timeSlot: z.string({
    required_error: "Please select a time slot",
  }),
  notes: z.string().optional(),
});

export type TestDriveFormData = z.infer<typeof testDriveSchema>;
