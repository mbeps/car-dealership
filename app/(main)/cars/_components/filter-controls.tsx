"use client";

import { FilterBadgeGroup } from "@/components/filters/filter-badge-group";
import { NumericRangeFilter } from "@/components/filters/numeric-range-filter";
import { formatCurrency } from "@/lib/helpers/format-currency";
import type { CarFiltersData } from "@/types/filters/car-filters-data";

interface CurrentFilters {
  make: string;
  bodyType: string;
  color: string;
  fuelType: string;
  transmission: string;
  priceRange: number[];
  mileageRange: number[];
  ageRange: number[];
}

/**
 * Shared filter form controls for car inventory filters.
 * Renders category dropdowns plus price, mileage, and age range inputs.
 * Used by both the mobile sheet drawer and desktop filter sidebar.
 *
 * @param filters - Available filter metadata, including category options and numeric ranges.
 * @param currentFilters - Current filter values.
 * @param onFilterChange - Callback for filter changes.
 * @param onClearFilter - Callback for clearing individual filters.
 * @see CarFilters - Parent component using this.
 */
export const CarFilterControls = ({
  filters,
  currentFilters,
  onFilterChange,
  onClearFilter,
}: {
  filters: CarFiltersData;
  currentFilters: CurrentFilters;
  onFilterChange: (filterName: string, value: string | number[]) => void;
  onClearFilter: (filterName: string) => void;
}) => {
  const {
    make,
    bodyType,
    color,
    fuelType,
    transmission,
    priceRange,
    mileageRange,
    ageRange,
  } = currentFilters;

  const filterSections = [
    {
      id: "make",
      title: "Make",
      options: filters.makes.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
      currentValue: make,
      onChange: (value: string) => onFilterChange("make", value),
    },
    {
      id: "color",
      title: "Color",
      options: filters.colors.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
      currentValue: color,
      onChange: (value: string) => onFilterChange("color", value),
    },
    {
      id: "bodyType",
      title: "Body Type",
      options: filters.bodyTypes.map((type) => ({ value: type, label: type })),
      currentValue: bodyType,
      onChange: (value: string) => onFilterChange("bodyType", value),
    },
    {
      id: "fuelType",
      title: "Fuel Type",
      options: filters.fuelTypes.map((type) => ({ value: type, label: type })),
      currentValue: fuelType,
      onChange: (value: string) => onFilterChange("fuelType", value),
    },
    {
      id: "transmission",
      title: "Transmission",
      options: filters.transmissions.map((type) => ({
        value: type,
        label: type,
      })),
      currentValue: transmission,
      onChange: (value: string) => onFilterChange("transmission", value),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Price Range */}
      <NumericRangeFilter
        title="Price Range"
        minId="minPrice"
        maxId="maxPrice"
        defaultMin={filters.priceRange.min}
        defaultMax={filters.priceRange.max}
        value={priceRange}
        onChange={(range) => onFilterChange("priceRange", range)}
        unitPrefix="£"
        formatDisplay={(val) => formatCurrency(val).replace(/^£/, "")}
      />

      {/* Mileage Range */}
      <NumericRangeFilter
        title="Mileage Range"
        minId="minMileage"
        maxId="maxMileage"
        defaultMin={filters.mileageRange.min}
        defaultMax={filters.mileageRange.max}
        value={mileageRange}
        onChange={(range) => onFilterChange("mileageRange", range)}
        unitSuffix="mi"
      />

      {/* Age Range */}
      <NumericRangeFilter
        title="Age Range (Years)"
        minId="minAge"
        maxId="maxAge"
        defaultMin={filters.ageRange.min}
        defaultMax={filters.ageRange.max}
        value={ageRange}
        onChange={(range) => onFilterChange("ageRange", range)}
        unitSuffix="years"
      />

      {/* Filter Categories */}
      {filterSections.map((section) => (
        <FilterBadgeGroup
          key={section.id}
          id={section.id}
          title={section.title}
          options={section.options}
          selectedValue={section.currentValue}
          onSelect={section.onChange}
          onClear={() => onClearFilter(section.id)}
        />
      ))}
    </div>
  );
};
