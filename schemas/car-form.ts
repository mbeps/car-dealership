import * as z from "zod";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";

/**
 * Validates car listing form data before creating or updating a vehicle listing.
 * Keeps form field values as strings where the UI submits text, then converts them server-side.
 *
 * @see CarFormData for the parsed car listing shape
 */
export const carFormSchema = z.object({
  carMakeId: z.string().min(1, "Make is required"),
  carColorId: z.string().min(1, "Color is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().refine((val) => {
    const year = parseInt(val, 10);
    return (
      !Number.isNaN(year) &&
      year >= 1900 &&
      year <= new Date().getFullYear() + 1
    );
  }, "Valid year required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => {
      const price = parseFloat(val);
      return !Number.isNaN(price) && price > 0;
    }, "Price must be a valid number greater than 0"),
  mileage: z
    .string()
    .min(1, "Mileage is required")
    .refine((val) => {
      const mileage = parseInt(val, 10);
      return !Number.isNaN(mileage) && mileage >= 0;
    }, "Mileage must be a valid number"),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  bodyType: z.string().min(1, "Body type is required"),
  numberPlate: z
    .string()
    .min(1, "Number plate is required")
    .regex(
      /^[A-Z0-9]{2,10}$/,
      "Number plate must be 2-10 uppercase letters/numbers",
    ),
  seats: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const seats = parseInt(val, 10);
      return !Number.isNaN(seats) && seats > 0;
    }, "Number of seats must be a valid number"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum([CarStatus.AVAILABLE, CarStatus.UNAVAILABLE, CarStatus.SOLD]),
  featured: z.boolean(),
  features: z.array(z.string()),
});

/**
 * Parsed car listing data produced by `carFormSchema`.
 * Used by car forms, server actions, and client components that handle vehicle listings.
 */
export type CarFormData = z.infer<typeof carFormSchema>;
