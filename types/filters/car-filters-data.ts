/**
 * Available filter options and ranges
 */
export interface CarFiltersData {
  makes: Array<{
    id: string;
    name: string;
    slug: string;
    country?: string | null;
  }>;
  colors: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  priceRange: {
    min: number;
    max: number;
  };
  mileageRange: {
    min: number;
    max: number;
  };
  ageRange: {
    min: number;
    max: number;
  };
}
