interface CarMake {
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
