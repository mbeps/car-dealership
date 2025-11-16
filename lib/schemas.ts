import * as z from "zod";

/**
 * Schema for test drive booking form validation
 */
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

/**
 * Schema for car creation/edit form validation
 */
export const carFormSchema = z.object({
  carMakeId: z.string().min(1, "Make is required"),
  carColorId: z.string().min(1, "Color is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().refine((val) => {
    const year = parseInt(val);
    return !isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1;
  }, "Valid year required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => {
      const price = parseFloat(val);
      return !isNaN(price) && price > 0;
    }, "Price must be a valid number greater than 0"),
  mileage: z
    .string()
    .min(1, "Mileage is required")
    .refine((val) => {
      const mileage = parseInt(val);
      return !isNaN(mileage) && mileage >= 0;
    }, "Mileage must be a valid number"),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  bodyType: z.string().min(1, "Body type is required"),
  numberPlate: z
    .string()
    .min(1, "Number plate is required")
    .regex(
      /^[A-Z0-9]{2,10}$/,
      "Number plate must be 2-10 uppercase letters/numbers"
    ),
  seats: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const seats = parseInt(val);
      return !isNaN(seats) && seats > 0;
    }, "Number of seats must be a valid number"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD"]),
  featured: z.boolean().default(false),
  // Images are handled separately
});

export type CarFormData = z.infer<typeof carFormSchema>;
