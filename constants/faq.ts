interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQ data for homepage accordion.
 * Common questions about test drives and car search.
 */
export const faqItems: FAQItem[] = [
  {
    question: "How does the test drive booking work?",
    answer:
      "Simply find a car you're interested in, click the 'Test Drive' button, and select an available time slot. Our system will confirm your booking and provide all necessary details.",
  },
  {
    question: "How can I search for cars?",
    answer:
      "Use the search bar to look up makes, models, or keywords and combine it with filters like body type and price to quickly narrow down the inventory.",
  },
  {
    question: "Are all cars certified and verified?",
    answer:
      "All cars listed on our platform undergo a verification process. We are a trusted dealerships and verified private seller.",
  },
  {
    question: "What happens after I book a test drive?",
    answer:
      "After booking, you'll receive a confirmation email with all the details. We will also contact you to confirm and provide any additional information.",
  },
];
