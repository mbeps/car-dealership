/**
 * Car search and filter parameters.
 * Represents query-string values used by the public inventory listing.
 */
export interface CarFilters {
  /** Keyword to search in model, description, body type, and number plate. */
  search?: string;
  /** Car make slug from the URL query string. */
  make?: string;
  /** Car color slug from the URL query string. */
  color?: string;
  /** Vehicle body type, such as SUV or sedan. */
  bodyType?: string;
  /** Fuel type filter. */
  fuelType?: string;
  /** Transmission type filter. */
  transmission?: string;
  /** Lowest accepted car price. */
  minPrice?: number;
  /** Highest accepted car price. */
  maxPrice?: number;
  /** Lowest accepted mileage. */
  minMileage?: number;
  /** Highest accepted mileage. */
  maxMileage?: number;
  /** Lowest accepted vehicle age in years. */
  minAge?: number;
  /** Highest accepted vehicle age in years. */
  maxAge?: number;
  /** Result sort order. */
  sortBy?: "newest" | "priceAsc" | "priceDesc";
  /** Current one-based page number. */
  page?: number;
  /** Number of cars requested per page. */
  limit?: number;
}
