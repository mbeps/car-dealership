import { CarStatus } from "@/enums/car-status";

/**
 * Normalised car listing entity used by app routes, cards, and client components.
 * Maintains display-friendly fields such as make, color, price, and image URLs.
 */
export interface Car {
  /** Unique database identifier. */
  id: string;
  /** ID of the selected car make option. */
  carMakeId: string;
  /** ID of the selected car color option. */
  carColorId: string;
  /** Vehicle make name. */
  make: string;
  /** Vehicle model name. */
  model: string;
  /** Manufacturing year. */
  year: number;
  /** Listing price. */
  price: number;
  /** Odometer mileage. */
  mileage: number;
  /** Vehicle color label. */
  color: string;
  /** Fuel type label. */
  fuelType: string;
  /** Transmission type label. */
  transmission: string;
  /** Body type label. */
  bodyType: string;
  /** Vehicle registration or number plate. */
  numberPlate: string;
  /** Seating capacity, or null when unavailable. */
  seats: number | null;
  /** Vehicle description. */
  description: string;
  /** Current listing status. */
  status: CarStatus;
  /** Whether this listing should be featured. */
  featured: boolean;
  /** Optional feature tags shown on the listing. */
  features: string[];
  /** Public image URLs for the listing. */
  images: string[];
  /** Creation timestamp. */
  createdAt: Date | string;
  /** Last update timestamp. */
  updatedAt: Date | string;
}
