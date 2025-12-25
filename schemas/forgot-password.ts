import * as z from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
