interface FeaturedCar {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  images: string[];
  transmission: string;
  fuelType: string;
  bodyType: string;
  mileage: number;
  color: string;
  wishlisted: boolean;
}

interface CarMake {
  id: number;
  name: string;
  slug: string;
  image: string;
}

interface BodyType {
  id: number;
  name: string;
  image: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

export const carMakes: CarMake[] = [
  { id: 1, name: "Hyundai", slug: "hyundai", image: "/make/hyundai.webp" },
  { id: 2, name: "Honda", slug: "honda", image: "/make/honda.webp" },
  { id: 5, name: "Lexus", slug: "lexus", image: "/make/lexus.webp" },
  { id: 3, name: "BMW", slug: "bmw", image: "/make/bmw.webp" },
  { id: 4, name: "Toyota", slug: "toyota", image: "/make/toyota.webp" },
  { id: 6, name: "Ford", slug: "ford", image: "/make/ford.webp" },
];

export const bodyTypes: BodyType[] = [
  { id: 1, name: "SUV", image: "/body/suv.webp" },
  { id: 2, name: "Sedan", image: "/body/sedan.webp" },
  { id: 3, name: "Hatchback", image: "/body/hatchback.webp" },
  { id: 4, name: "Coupe", image: "/body/coupe.webp" },
];

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
