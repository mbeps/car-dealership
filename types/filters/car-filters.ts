/**
 * Car search and filter parameters
 */
export interface CarFilters {
  search?: string;
  make?: string;
  color?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  minAge?: number;
  maxAge?: number;
  sortBy?: "newest" | "priceAsc" | "priceDesc";
  page?: number;
  limit?: number;
}
