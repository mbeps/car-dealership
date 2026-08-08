import * as z from "zod";

/**
 * Validates email input for password reset requests.
 * Used before sending a reset link so only addressable accounts can start recovery.
 */
export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Valid email is required" }),
});

/**
 * Parsed email data produced by `forgotPasswordSchema`.
 * Used by password reset forms and server actions that send recovery emails.
 */
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
