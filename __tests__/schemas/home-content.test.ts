import { describe, it, expect } from "vitest";
import { homePageContentSchema, faqSchema } from "@/schemas/home-content";

const validContent = {
  heroTitle: "Find your dream car",
  heroSubtitle: "Browse premium vehicles",
  feature1Title: "Fast search",
  feature1Description: "Filter by make and body type",
  feature2Title: "Save cars",
  feature2Description: "Bookmark listings you like",
  feature3Title: "Book test drives",
  feature3Description: "Schedule a visit online",
  ctaTitle: "Get started",
  ctaSubtitle: "Sign up today and start browsing",
};

describe("homePageContentSchema", () => {
  it("accepts valid content", () => {
    const result = homePageContentSchema.safeParse(validContent);
    expect(result.success).toBe(true);
  });

  it("rejects empty hero title", () => {
    const result = homePageContentSchema.safeParse({
      ...validContent,
      heroTitle: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects hero title over 40 characters", () => {
    const result = homePageContentSchema.safeParse({
      ...validContent,
      heroTitle: "x".repeat(41),
    });
    expect(result.success).toBe(false);
  });

  it("accepts hero title at exactly 40 characters", () => {
    const result = homePageContentSchema.safeParse({
      ...validContent,
      heroTitle: "x".repeat(40),
    });
    expect(result.success).toBe(true);
  });

  it("rejects hero subtitle over 80 characters", () => {
    const result = homePageContentSchema.safeParse({
      ...validContent,
      heroSubtitle: "x".repeat(81),
    });
    expect(result.success).toBe(false);
  });

  it("rejects feature title over 30 characters", () => {
    const result = homePageContentSchema.safeParse({
      ...validContent,
      feature2Title: "x".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("rejects feature description over 150 characters", () => {
    const result = homePageContentSchema.safeParse({
      ...validContent,
      feature3Description: "x".repeat(151),
    });
    expect(result.success).toBe(false);
  });

  it("rejects CTA title over 50 characters", () => {
    const result = homePageContentSchema.safeParse({
      ...validContent,
      ctaTitle: "x".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects CTA subtitle over 200 characters", () => {
    const result = homePageContentSchema.safeParse({
      ...validContent,
      ctaSubtitle: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("reports a message for a missing required field", () => {
    const { heroTitle: _omitted, ...rest } = validContent;
    const result = homePageContentSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.includes("heroTitle")),
      ).toBe(true);
    }
  });

  it("rejects non-string values", () => {
    const result = homePageContentSchema.safeParse({
      ...validContent,
      heroTitle: 42,
    });
    expect(result.success).toBe(false);
  });
});

describe("faqSchema", () => {
  const validFaq = {
    question: "Do you offer financing?",
    answer: "Yes, we partner with several lenders.",
    order: 1,
  };

  it("accepts a valid FAQ entry", () => {
    const result = faqSchema.safeParse(validFaq);
    expect(result.success).toBe(true);
  });

  it("rejects an empty question", () => {
    const result = faqSchema.safeParse({ ...validFaq, question: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a question over 100 characters", () => {
    const result = faqSchema.safeParse({
      ...validFaq,
      question: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an answer over 300 characters", () => {
    const result = faqSchema.safeParse({
      ...validFaq,
      answer: "x".repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer order", () => {
    const result = faqSchema.safeParse({ ...validFaq, order: 1.5 });
    expect(result.success).toBe(false);
  });

  it("preserves integer order in parsed output", () => {
    const result = faqSchema.parse(validFaq);
    expect(result.order).toBe(1);
  });
});
