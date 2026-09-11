import { z } from "zod";

/**
 * Validates FAQ entry content and ordering for the homepage FAQ section.
 * Numeric order is preserved as an integer for stable rendering.
 */
export const faqSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(100, "Question must be 100 characters or fewer"),
  answer: z
    .string()
    .min(1, "Answer is required")
    .max(300, "Answer must be 300 characters or fewer"),
  order: z.number().int(),
});

/**
 * Parsed FAQ entry data produced by `faqSchema`.
 * Used by homepage content editors and server actions that persist FAQ rows.
 */
export type FAQFormValues = z.infer<typeof faqSchema>;
