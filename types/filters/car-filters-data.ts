/**
 * Available filter options and ranges.
 * Produced by the server from current available inventory and consumed by the listing UI.
 */
export interface CarFiltersData {
  /** Available car makes with slugs and optional country. */
  makes: Array<{
    /** Unique make identifier. */
    id: string;
    /** Make display name. */
    name: string;
    /** URL-safe make slug. */
    slug: string;
    /** Country of origin when available. */
    country?: string | null;
  }>;
  /** Available car colors with slugs. */
  colors: Array<{
    /** Unique color identifier. */
    id: string;
    /** Color display name. */
    name: string;
    /** URL-safe color slug. */
    slug: string;
  }>;
  /** Unique vehicle body types available in inventory. */
  bodyTypes: string[];
  /** Unique fuel types available in inventory. */
  fuelTypes: string[];
  /** Unique transmission types available in inventory. */
  transmissions: string[];
  /** Lowest and highest available car prices. */
  priceRange: {
    /** Lowest available price. */
    min: number;
    /** Highest available price. */
    max: number;
  };
  /** Lowest and highest available mileage values. */
  mileageRange: {
    /** Lowest available mileage. */
    min: number;
    /** Highest available mileage. */
    max: number;
  };
  /** Lowest and highest vehicle ages based on current year and available inventory. */
  ageRange: {
    /** Lowest available vehicle age. */
    min: number;
    /** Highest available vehicle age. */
    max: number;
  };
}
