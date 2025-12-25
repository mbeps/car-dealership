interface BodyType {
  id: number;
  name: string;
  image: string;
}

/**
 * Static body type data for homepage.
 * Displayed as image grid on marketing page.
 * Links to filtered car searches.
 */
export const bodyTypes: BodyType[] = [
  { id: 1, name: "SUV", image: "/body/suv.webp" },
  { id: 2, name: "Sedan", image: "/body/sedan.webp" },
  { id: 3, name: "Hatchback", image: "/body/hatchback.webp" },
  { id: 4, name: "Coupe", image: "/body/coupe.webp" },
];
