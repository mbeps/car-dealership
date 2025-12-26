import { z } from "zod";

export const homePageContentSchema = z.object({
  heroTitle: z
    .string()
    .min(1, "Hero title is required")
    .max(40, "Hero title must be 40 characters or fewer"),
  heroSubtitle: z
    .string()
    .min(1, "Hero subtitle is required")
    .max(80, "Hero subtitle must be 80 characters or fewer"),
  feature1Title: z
    .string()
    .min(1, "Feature 1 title is required")
    .max(30, "Feature title must be 30 characters or fewer"),
  feature1Description: z
    .string()
    .min(1, "Feature 1 description is required")
    .max(150, "Feature description must be 150 characters or fewer"),
  feature2Title: z
    .string()
    .min(1, "Feature 2 title is required")
    .max(30, "Feature title must be 30 characters or fewer"),
  feature2Description: z
    .string()
    .min(1, "Feature 2 description is required")
    .max(150, "Feature description must be 150 characters or fewer"),
  feature3Title: z
    .string()
    .min(1, "Feature 3 title is required")
    .max(30, "Feature title must be 30 characters or fewer"),
  feature3Description: z
    .string()
    .min(1, "Feature 3 description is required")
    .max(150, "Feature description must be 150 characters or fewer"),
  ctaTitle: z
    .string()
    .min(1, "CTA title is required")
    .max(50, "CTA title must be 50 characters or fewer"),
  ctaSubtitle: z
    .string()
    .min(1, "CTA subtitle is required")
    .max(200, "CTA subtitle must be 200 characters or fewer"),
});

export type HomePageContentFormValues = z.infer<typeof homePageContentSchema>;

export const faqSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(100, "Question must be 100 characters or fewer"),
  answer: z
    .string()
    .min(1, "Answer is required")
    .max(300, "Answer must be 300 characters or fewer"),
  order: z.coerce.number().int(),
});

export type FAQFormValues = z.infer<typeof faqSchema>;
