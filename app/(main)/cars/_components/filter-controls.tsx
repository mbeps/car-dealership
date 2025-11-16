"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CarFiltersData } from "@/types";

interface CurrentFilters {
  make: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  priceRange: number[];
  mileageRange: number[];
  ageRange: number[];
}

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

  // Update local inputs when priceRange changes from parent (e.g., on reset)
  useEffect(() => {
    if (
      priceRange[0] === filters.priceRange.min &&
      priceRange[1] === filters.priceRange.max
    ) {
      setMinPriceInput("");
      setMaxPriceInput("");
    } else {
      setMinPriceInput(priceRange[0].toString());
      setMaxPriceInput(priceRange[1].toString());
    }
  }, [priceRange, filters.priceRange.min, filters.priceRange.max]);

  useEffect(() => {
    if (
      mileageRange[0] === filters.mileageRange.min &&
      mileageRange[1] === filters.mileageRange.max
    ) {
      setMinMileageInput("");
      setMaxMileageInput("");
    } else {
      setMinMileageInput(mileageRange[0].toString());
      setMaxMileageInput(mileageRange[1].toString());
    }
  }, [mileageRange, filters.mileageRange.min, filters.mileageRange.max]);

  useEffect(() => {
    if (
      ageRange[0] === filters.ageRange.min &&
      ageRange[1] === filters.ageRange.max
    ) {
      setMinAgeInput("");
      setMaxAgeInput("");
    } else {
      setMinAgeInput(ageRange[0].toString());
      setMaxAgeInput(ageRange[1].toString());
    }
  }, [ageRange, filters.ageRange.min, filters.ageRange.max]);

  const filterSections = [
    {
      id: "make",
      title: "Make",
      options: filters.makes.map((make) => ({ value: make, label: make })),
      currentValue: make,
      onChange: (value: string) => onFilterChange("make", value),
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
      ? parseInt(minPriceInput)
      : filters.priceRange.min;
    const max = maxPriceInput
      ? parseInt(maxPriceInput)
      : filters.priceRange.max;
    onFilterChange("priceRange", [min, max]);
  };

  const handleMileageBlur = () => {
    const min = minMileageInput
      ? parseInt(minMileageInput)
      : filters.mileageRange.min;
    const max = maxMileageInput
      ? parseInt(maxMileageInput)
      : filters.mileageRange.max;
    onFilterChange("mileageRange", [min, max]);
  };

  const handleAgeBlur = () => {
    const min = minAgeInput ? parseInt(minAgeInput) : filters.ageRange.min;
    const max = maxAgeInput ? parseInt(maxAgeInput) : filters.ageRange.max;
    onFilterChange("ageRange", [min, max]);
  };

  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Price Range</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="minPrice" className="text-xs text-gray-600">
              Minimum
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                $
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
            <p className="text-xs text-gray-500">
              Min: ${filters.priceRange.min.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPrice" className="text-xs text-gray-600">
              Maximum
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                $
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
            <p className="text-xs text-gray-500">
              Max: ${filters.priceRange.max.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Mileage Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Mileage Range</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="minMileage" className="text-xs text-gray-600">
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                mi
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Min: {filters.mileageRange.min.toLocaleString()} mi
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxMileage" className="text-xs text-gray-600">
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                mi
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Max: {filters.mileageRange.max.toLocaleString()} mi
            </p>
          </div>
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Age Range (Years)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="minAge" className="text-xs text-gray-600">
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                yrs
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Min: {filters.ageRange.min} years
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAge" className="text-xs text-gray-600">
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                yrs
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Max: {filters.ageRange.max} years
            </p>
          </div>
        </div>
      </div>

      {/* Filter Categories */}
      {filterSections.map((section) => (
        <div key={section.id} className="space-y-3">
          <h4 className="text-sm font-medium flex justify-between">
            <span>{section.title}</span>
            {section.currentValue && (
              <button
                className="text-xs text-gray-600 flex items-center"
                onClick={() => onClearFilter(section.id)}
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </button>
            )}
          </h4>
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {section.options.map((option) => (
              <Badge
                key={option.value}
                variant={
                  section.currentValue === option.value ? "default" : "outline"
                }
                className={`cursor-pointer px-3 py-1 ${
                  section.currentValue === option.value
                    ? "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200"
                    : "bg-white hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => {
                  section.onChange(
                    section.currentValue === option.value ? "" : option.value
                  );
                }}
              >
                {option.label}
                {section.currentValue === option.value && (
                  <Check className="ml-1 h-3 w-3 inline" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
