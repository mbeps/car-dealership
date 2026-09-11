/**
 * Global application-wide constants.
 */

export const DEALERSHIP_NAME = "Maruf Motors";

export interface BodyType {
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

export interface CarMake {
  id: number;
  name: string;
  slug: string;
  image: string;
}

/**
 * Static car make data for homepage.
 * Displayed as logo grid on marketing page.
 * Links to filtered car searches.
 */
export const carMakes: CarMake[] = [
  { id: 1, name: "Hyundai", slug: "hyundai", image: "/make/hyundai.webp" },
  { id: 2, name: "Honda", slug: "honda", image: "/make/honda.webp" },
  { id: 5, name: "Lexus", slug: "lexus", image: "/make/lexus.webp" },
  { id: 3, name: "BMW", slug: "bmw", image: "/make/bmw.webp" },
  { id: 4, name: "Toyota", slug: "toyota", image: "/make/toyota.webp" },
  { id: 6, name: "Ford", slug: "ford", image: "/make/ford.webp" },
];
