"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { CarFilterControls } from "./filter-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CarFiltersData } from "@/types";

export const CarFilters = ({ filters }: { filters: CarFiltersData }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current filter values from searchParams
  const currentMake = searchParams.get("make") || "";
  const currentBodyType = searchParams.get("bodyType") || "";
  const currentFuelType = searchParams.get("fuelType") || "";
  const currentTransmission = searchParams.get("transmission") || "";
  const currentMinPrice = searchParams.get("minPrice")
    ? parseInt(searchParams.get("minPrice")!)
    : filters.priceRange.min;
  const currentMaxPrice = searchParams.get("maxPrice")
    ? parseInt(searchParams.get("maxPrice")!)
    : filters.priceRange.max;
  const currentMinMileage = searchParams.get("minMileage")
    ? parseInt(searchParams.get("minMileage")!)
    : filters.mileageRange.min;
  const currentMaxMileage = searchParams.get("maxMileage")
    ? parseInt(searchParams.get("maxMileage")!)
    : filters.mileageRange.max;
  const currentMinAge = searchParams.get("minAge")
    ? parseInt(searchParams.get("minAge")!)
    : filters.ageRange.min;
  const currentMaxAge = searchParams.get("maxAge")
    ? parseInt(searchParams.get("maxAge")!)
    : filters.ageRange.max;
  const currentSortBy = searchParams.get("sortBy") || "newest";

  // Local state for filters
  const [make, setMake] = useState(currentMake);
  const [bodyType, setBodyType] = useState(currentBodyType);
  const [fuelType, setFuelType] = useState(currentFuelType);
  const [transmission, setTransmission] = useState(currentTransmission);
  const [priceRange, setPriceRange] = useState([
    currentMinPrice,
    currentMaxPrice,
  ]);
  const [mileageRange, setMileageRange] = useState([
    currentMinMileage,
    currentMaxMileage,
  ]);
  const [ageRange, setAgeRange] = useState([currentMinAge, currentMaxAge]);
  const [sortBy, setSortBy] = useState(currentSortBy);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Update local state when URL parameters change
  useEffect(() => {
    setMake(currentMake);
    setBodyType(currentBodyType);
    setFuelType(currentFuelType);
    setTransmission(currentTransmission);
    setPriceRange([currentMinPrice, currentMaxPrice]);
    setMileageRange([currentMinMileage, currentMaxMileage]);
    setAgeRange([currentMinAge, currentMaxAge]);
    setSortBy(currentSortBy);
  }, [
    currentMake,
    currentBodyType,
    currentFuelType,
    currentTransmission,
    currentMinPrice,
    currentMaxPrice,
    currentMinMileage,
    currentMaxMileage,
    currentMinAge,
    currentMaxAge,
    currentSortBy,
  ]);

  // Count active filters
  const activeFilterCount = [
    make,
    bodyType,
    fuelType,
    transmission,
    currentMinPrice > filters.priceRange.min ||
      currentMaxPrice < filters.priceRange.max,
    currentMinMileage > filters.mileageRange.min ||
      currentMaxMileage < filters.mileageRange.max,
    currentMinAge > filters.ageRange.min ||
      currentMaxAge < filters.ageRange.max,
  ].filter(Boolean).length;

  // Update URL when filters change
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (make) params.set("make", make);
    if (bodyType) params.set("bodyType", bodyType);
    if (fuelType) params.set("fuelType", fuelType);
    if (transmission) params.set("transmission", transmission);

    // Validate and clamp price range
    let validMinPrice = Math.max(
      filters.priceRange.min,
      Math.min(filters.priceRange.max, priceRange[0])
    );
    let validMaxPrice = Math.max(
      filters.priceRange.min,
      Math.min(filters.priceRange.max, priceRange[1])
    );

    // Ensure min doesn't exceed max
    if (validMinPrice > validMaxPrice) {
      [validMinPrice, validMaxPrice] = [validMaxPrice, validMinPrice];
    }

    if (validMinPrice > filters.priceRange.min)
      params.set("minPrice", validMinPrice.toString());
    if (validMaxPrice < filters.priceRange.max)
      params.set("maxPrice", validMaxPrice.toString());

    // Validate and clamp mileage range
    let validMinMileage = Math.max(
      filters.mileageRange.min,
      Math.min(filters.mileageRange.max, mileageRange[0])
    );
    let validMaxMileage = Math.max(
      filters.mileageRange.min,
      Math.min(filters.mileageRange.max, mileageRange[1])
    );

    // Ensure min doesn't exceed max
    if (validMinMileage > validMaxMileage) {
      [validMinMileage, validMaxMileage] = [validMaxMileage, validMinMileage];
    }

    if (validMinMileage > filters.mileageRange.min)
      params.set("minMileage", validMinMileage.toString());
    if (validMaxMileage < filters.mileageRange.max)
      params.set("maxMileage", validMaxMileage.toString());

    // Validate and clamp age range
    let validMinAge = Math.max(
      filters.ageRange.min,
      Math.min(filters.ageRange.max, ageRange[0])
    );
    let validMaxAge = Math.max(
      filters.ageRange.min,
      Math.min(filters.ageRange.max, ageRange[1])
    );

    // Ensure min doesn't exceed max
    if (validMinAge > validMaxAge) {
      [validMinAge, validMaxAge] = [validMaxAge, validMinAge];
    }

    if (validMinAge > filters.ageRange.min)
      params.set("minAge", validMinAge.toString());
    if (validMaxAge < filters.ageRange.max)
      params.set("maxAge", validMaxAge.toString());

    if (sortBy !== "newest") params.set("sortBy", sortBy);

    // Preserve search and page params if they exist
    const search = searchParams.get("search");
    const page = searchParams.get("page");
    if (search) params.set("search", search);
    if (page && page !== "1") params.set("page", page);

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.push(url);
    setIsSheetOpen(false);
  }, [
    make,
    bodyType,
    fuelType,
    transmission,
    priceRange,
    mileageRange,
    ageRange,
    sortBy,
    pathname,
    searchParams,
    filters.priceRange.min,
    filters.priceRange.max,
    filters.mileageRange.min,
    filters.mileageRange.max,
    filters.ageRange.min,
    filters.ageRange.max,
    router,
  ]);

  // Handle filter changes
  const handleFilterChange = (filterName: string, value: string | number[]) => {
    switch (filterName) {
      case "make":
        setMake(value as string);
        break;
      case "bodyType":
        setBodyType(value as string);
        break;
      case "fuelType":
        setFuelType(value as string);
        break;
      case "transmission":
        setTransmission(value as string);
        break;
      case "priceRange":
        setPriceRange(value as number[]);
        break;
      case "mileageRange":
        setMileageRange(value as number[]);
        break;
      case "ageRange":
        setAgeRange(value as number[]);
        break;
    }
  };

  // Handle clearing specific filter
  const handleClearFilter = (filterName: string) => {
    handleFilterChange(filterName, "");
  };

  // Clear all filters
  const clearFilters = () => {
    setMake("");
    setBodyType("");
    setFuelType("");
    setTransmission("");
    setPriceRange([filters.priceRange.min, filters.priceRange.max]);
    setMileageRange([filters.mileageRange.min, filters.mileageRange.max]);
    setAgeRange([filters.ageRange.min, filters.ageRange.max]);
    setSortBy("newest");

    // Keep search term if exists
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) params.set("search", search);

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.push(url);
    setIsSheetOpen(false);
  };

  // Current filters object for the controls component
  const currentFilters = {
    make,
    bodyType,
    fuelType,
    transmission,
    priceRange,
    priceRangeMin: filters.priceRange.min,
    priceRangeMax: filters.priceRange.max,
    mileageRange,
    ageRange,
  };

  return (
    <div className="flex lg:flex-col justify-between gap-4">
      {/* Mobile Filters */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-full sm:max-w-md overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>

              <div className="py-6">
                <CarFilterControls
                  filters={filters}
                  currentFilters={currentFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilter={handleClearFilter}
                />
              </div>

              <SheetFooter className="sm:justify-between flex-row pt-2 border-t space-x-4 mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Button type="button" onClick={applyFilters} className="flex-1">
                  Show Results
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Select
        value={sortBy}
        onValueChange={(value) => {
          setSortBy(value);
          // Apply filters immediately when sort changes
          setTimeout(() => applyFilters(), 0);
        }}
      >
        <SelectTrigger className="w-[180px] lg:w-full">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {[
            { value: "newest", label: "Newest First" },
            { value: "priceAsc", label: "Price: Low to High" },
            { value: "priceDesc", label: "Price: High to Low" },
          ].map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Desktop Filters */}
      <div className="hidden lg:block sticky top-24">
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-medium flex items-center">
              <Sliders className="mr-2 h-4 w-4" />
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-sm text-gray-600"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>

          <div className="p-4">
            <CarFilterControls
              filters={filters}
              currentFilters={currentFilters}
              onFilterChange={handleFilterChange}
              onClearFilter={handleClearFilter}
            />
          </div>

          <div className="px-4 py-4 border-t">
            <Button onClick={applyFilters} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
