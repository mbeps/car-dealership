import * as z from "zod";

/**
 * Validates password reset confirmation input.
 * Requires matching passwords of at least six characters before updating credentials.
 */
export const updatePasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Parsed password update data produced by `updatePasswordSchema`.
 * Used by password reset forms and server actions that update account credentials.
 */
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
