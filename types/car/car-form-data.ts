/**
 * Normalised car listing data for create and edit car server actions.
 * Client forms submit text fields, so this type stores numeric values as numbers after validation.
 */
export interface CarFormData {
  /** ID of the selected car make option. */
  carMakeId: string;
  /** ID of the selected car color option. */
  carColorId: string;
  /** Vehicle model name. */
  model: string;
  /** Manufacturing year as a number. */
  year: number;
  /** Listing price as a number. */
  price: number;
  /** Odometer mileage as a number. */
  mileage: number;
  /** Fuel type label. */
  fuelType: string;
  /** Transmission type label. */
  transmission: string;
  /** Body type label. */
  bodyType: string;
  /** Vehicle registration or number plate. */
  numberPlate: string;
  /** Optional seating capacity. */
  seats?: number;
  /** Vehicle description. */
  description: string;
  /** Current car status. */
  status: string;
  /** Whether this listing should be featured. */
  featured: boolean;
  /** Optional feature tags shown on the listing. */
  features: string[];
}
