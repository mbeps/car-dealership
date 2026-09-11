import * as z from "zod";

/**
 * Validates dealership profile details for dealership settings and account management.
 * Requires contact fields needed to publish or update a seller profile.
 */
export const dealershipInfoSchema = z.object({
  name: z.string().min(1, "Dealership name is required"),
  address: z.string().min(1, "Address is required"),
  email: z.email({ error: "Valid email is required" }),
  phone: z.string().min(1, "Phone number is required"),
  whatsappPhone: z.string().min(1, "WhatsApp number is required"),
});

/**
 * Parsed dealership profile data produced by `dealershipInfoSchema`.
 * Used by dealership settings forms and server actions that persist profile details.
 */
export type DealershipInfoFormData = z.infer<typeof dealershipInfoSchema>;
