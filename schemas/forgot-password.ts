import * as z from "zod";

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Valid email is required" }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
