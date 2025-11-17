/**
 * Marketing data types - these are NOT database entities.
 * Used only for static homepage content (logos, images, FAQs).
 */
interface MarketingCarMake {
  id: number;
  name: string;
  slug: string;
  image: string;
}

interface MarketingBodyType {
  id: number;
  name: string;
  image: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Static car make data for homepage.
 * Displayed as logo grid on marketing page.
 * Links to filtered car searches.
 * NOTE: This is NOT the database CarMake entity - it's marketing content only.
 */
export const carMakes: MarketingCarMake[] = [
  { id: 1, name: "Hyundai", slug: "hyundai", image: "/make/hyundai.webp" },
  { id: 2, name: "Honda", slug: "honda", image: "/make/honda.webp" },
  { id: 5, name: "Lexus", slug: "lexus", image: "/make/lexus.webp" },
  { id: 3, name: "BMW", slug: "bmw", image: "/make/bmw.webp" },
  { id: 4, name: "Toyota", slug: "toyota", image: "/make/toyota.webp" },
  { id: 6, name: "Ford", slug: "ford", image: "/make/ford.webp" },
];

/**
 * Static body type data for homepage.
 * Displayed as image grid on marketing page.
 * Links to filtered car searches.
 */
export const bodyTypes: MarketingBodyType[] = [
  { id: 1, name: "SUV", image: "/body/suv.webp" },
  { id: 2, name: "Sedan", image: "/body/sedan.webp" },
  { id: 3, name: "Hatchback", image: "/body/hatchback.webp" },
  { id: 4, name: "Coupe", image: "/body/coupe.webp" },
];

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
