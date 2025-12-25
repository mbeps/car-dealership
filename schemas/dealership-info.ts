import * as z from "zod";

export const dealershipInfoSchema = z.object({
  name: z.string().min(1, "Dealership name is required"),
  address: z.string().min(1, "Address is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  whatsappPhone: z.string().min(1, "WhatsApp number is required"),
});

export type DealershipInfoFormData = z.infer<typeof dealershipInfoSchema>;
