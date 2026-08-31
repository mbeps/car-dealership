"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
 * Keeps local input state until a filter is applied by the parent.
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

  // Local input state (string values for inputs)
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [minMileageInput, setMinMileageInput] = useState("");
  const [maxMileageInput, setMaxMileageInput] = useState("");
  const [minAgeInput, setMinAgeInput] = useState("");
  const [maxAgeInput, setMaxAgeInput] = useState("");

  // Sync state from props (Derived State Pattern)
  const [prevPriceRange, setPrevPriceRange] = useState(priceRange);
  if (prevPriceRange !== priceRange) {
    setPrevPriceRange(priceRange);
    const isDefault =
      priceRange[0] === filters.priceRange.min &&
      priceRange[1] === filters.priceRange.max;
    setMinPriceInput(isDefault ? "" : priceRange[0].toString());
    setMaxPriceInput(isDefault ? "" : priceRange[1].toString());
  }

  const [prevMileageRange, setPrevMileageRange] = useState(mileageRange);
  if (prevMileageRange !== mileageRange) {
    setPrevMileageRange(mileageRange);
    const isDefault =
      mileageRange[0] === filters.mileageRange.min &&
      mileageRange[1] === filters.mileageRange.max;
    setMinMileageInput(isDefault ? "" : mileageRange[0].toString());
    setMaxMileageInput(isDefault ? "" : mileageRange[1].toString());
  }

  const [prevAgeRange, setPrevAgeRange] = useState(ageRange);
  if (prevAgeRange !== ageRange) {
    setPrevAgeRange(ageRange);
    const isDefault =
      ageRange[0] === filters.ageRange.min &&
      ageRange[1] === filters.ageRange.max;
    setMinAgeInput(isDefault ? "" : ageRange[0].toString());
    setMaxAgeInput(isDefault ? "" : ageRange[1].toString());
  }

  const filterSections = [
    {
      id: "make",
      title: "Make",
      options: filters.makes.map((make) => ({
        value: make.slug,
        label: make.name,
      })),
      currentValue: make,
      onChange: (value: string) => onFilterChange("make", value),
    },
    {
      id: "color",
      title: "Color",
      options: filters.colors.map((color) => ({
        value: color.slug,
        label: color.name,
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

  const handlePriceInputChange = (index: number, value: string) => {
    // Only allow numeric input
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (index === 0) {
      setMinPriceInput(cleanValue);
    } else {
      setMaxPriceInput(cleanValue);
    }
  };

  const handleMileageInputChange = (index: number, value: string) => {
    // Only allow numeric input
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (index === 0) {
      setMinMileageInput(cleanValue);
    } else {
      setMaxMileageInput(cleanValue);
    }
  };

  const handleAgeInputChange = (index: number, value: string) => {
    // Only allow numeric input
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (index === 0) {
      setMinAgeInput(cleanValue);
    } else {
      setMaxAgeInput(cleanValue);
    }
  };

  // Update parent state on blur to trigger validation on submit
  const handlePriceBlur = () => {
    const min = minPriceInput
      ? parseInt(minPriceInput, 10)
      : filters.priceRange.min;
    const max = maxPriceInput
      ? parseInt(maxPriceInput, 10)
      : filters.priceRange.max;
    onFilterChange("priceRange", [min, max]);
  };

  const handleMileageBlur = () => {
    const min = minMileageInput
      ? parseInt(minMileageInput, 10)
      : filters.mileageRange.min;
    const max = maxMileageInput
      ? parseInt(maxMileageInput, 10)
      : filters.mileageRange.max;
    onFilterChange("mileageRange", [min, max]);
  };

  const handleAgeBlur = () => {
    const min = minAgeInput ? parseInt(minAgeInput, 10) : filters.ageRange.min;
    const max = maxAgeInput ? parseInt(maxAgeInput, 10) : filters.ageRange.max;
    onFilterChange("ageRange", [min, max]);
  };

  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Price Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minPrice" className="text-gray-600 text-xs">
              Minimum
            </Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 text-sm">
                £
              </span>
              <Input
                id="minPrice"
                type="text"
                inputMode="numeric"
                value={minPriceInput}
                onChange={(e) => handlePriceInputChange(0, e.target.value)}
                onBlur={handlePriceBlur}
                placeholder={filters.priceRange.min.toLocaleString()}
                className="pl-6"
              />
            </div>
            <p className="text-gray-500 text-xs">
              Min: {formatCurrency(filters.priceRange.min)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPrice" className="text-gray-600 text-xs">
              Maximum
            </Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 text-sm">
                £
              </span>
              <Input
                id="maxPrice"
                type="text"
                inputMode="numeric"
                value={maxPriceInput}
                onChange={(e) => handlePriceInputChange(1, e.target.value)}
                onBlur={handlePriceBlur}
                placeholder={filters.priceRange.max.toLocaleString()}
                className="pl-6"
              />
            </div>
            <p className="text-gray-500 text-xs">
              Max: {formatCurrency(filters.priceRange.max)}
            </p>
          </div>
        </div>
      </div>

      {/* Mileage Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Mileage Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minMileage" className="text-gray-600 text-xs">
              Minimum
            </Label>
            <div className="relative">
              <Input
                id="minMileage"
                type="text"
                inputMode="numeric"
                value={minMileageInput}
                onChange={(e) => handleMileageInputChange(0, e.target.value)}
                onBlur={handleMileageBlur}
                placeholder={filters.mileageRange.min.toLocaleString()}
                className="pr-8"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 text-sm">
                mi
              </span>
            </div>
            <p className="text-gray-500 text-xs">
              Min: {filters.mileageRange.min.toLocaleString()} mi
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxMileage" className="text-gray-600 text-xs">
              Maximum
            </Label>
            <div className="relative">
              <Input
                id="maxMileage"
                type="text"
                inputMode="numeric"
                value={maxMileageInput}
                onChange={(e) => handleMileageInputChange(1, e.target.value)}
                onBlur={handleMileageBlur}
                placeholder={filters.mileageRange.max.toLocaleString()}
                className="pr-8"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 text-sm">
                mi
              </span>
            </div>
            <p className="text-gray-500 text-xs">
              Max: {filters.mileageRange.max.toLocaleString()} mi
            </p>
          </div>
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Age Range (Years)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minAge" className="text-gray-600 text-xs">
              Minimum
            </Label>
            <div className="relative">
              <Input
                id="minAge"
                type="text"
                inputMode="numeric"
                value={minAgeInput}
                onChange={(e) => handleAgeInputChange(0, e.target.value)}
                onBlur={handleAgeBlur}
                placeholder={filters.ageRange.min.toString()}
                className="pr-10"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 text-sm">
                yrs
              </span>
            </div>
            <p className="text-gray-500 text-xs">
              Min: {filters.ageRange.min} years
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAge" className="text-gray-600 text-xs">
              Maximum
            </Label>
            <div className="relative">
              <Input
                id="maxAge"
                type="text"
                inputMode="numeric"
                value={maxAgeInput}
                onChange={(e) => handleAgeInputChange(1, e.target.value)}
                onBlur={handleAgeBlur}
                placeholder={filters.ageRange.max.toString()}
                className="pr-10"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 text-sm">
                yrs
              </span>
            </div>
            <p className="text-gray-500 text-xs">
              Max: {filters.ageRange.max} years
            </p>
          </div>
        </div>
      </div>

      {/* Filter Categories */}
      {filterSections.map((section) => (
        <div key={section.id} className="space-y-3">
          <h4 className="flex justify-between font-medium text-sm">
            <span>{section.title}</span>
            {section.currentValue && (
              <button
                className="flex items-center text-gray-600 text-xs"
                onClick={() => onClearFilter(section.id)}
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </button>
            )}
          </h4>
          <div className="custom-scrollbar flex max-h-60 flex-wrap gap-2 overflow-y-auto pr-1">
            {section.options.map((option) => (
              <Badge
                key={option.value}
                variant={
                  section.currentValue === option.value ? "default" : "outline"
                }
                className={`cursor-pointer px-3 py-1 ${
                  section.currentValue === option.value
                    ? "border-blue-200 bg-blue-100 text-blue-900 hover:bg-blue-200"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  section.onChange(
                    section.currentValue === option.value ? "" : option.value,
                  );
                }}
              >
                {option.label}
                {section.currentValue === option.value && (
                  <Check className="ml-1 inline h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
