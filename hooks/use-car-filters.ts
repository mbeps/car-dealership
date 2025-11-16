"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CarFiltersData } from "@/types";

/**
 * Manages car listing filters with URL sync.
 * Reads/writes filter state to query params.
 * Tracks active filter count for badge display.
 * Handles mobile filter sheet state.
 *
 * @param filters - Initial filter metadata from server
 * @returns Filter state, handlers, and apply/clear functions
 * @see CarFilters - Component using this hook
 * @see getCarFilters - Server action providing initial data
 */
export const useCarFilters = (filters: CarFiltersData) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentMake = searchParams.get("make") || "";
  const currentBodyType = searchParams.get("bodyType") || "";
  const currentColor = searchParams.get("color") || "";
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

  const [make, setMake] = useState(currentMake);
  const [bodyType, setBodyType] = useState(currentBodyType);
  const [color, setColor] = useState(currentColor);
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

  useEffect(() => {
    setMake(currentMake);
    setBodyType(currentBodyType);
    setColor(currentColor);
    setFuelType(currentFuelType);
    setTransmission(currentTransmission);
    setPriceRange([currentMinPrice, currentMaxPrice]);
    setMileageRange([currentMinMileage, currentMaxMileage]);
    setAgeRange([currentMinAge, currentMaxAge]);
    setSortBy(currentSortBy);
  }, [
    currentMake,
    currentBodyType,
    currentColor,
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

  const currentSearch = searchParams.get("search") || "";
  const activeFilterCount = [
    make,
    bodyType,
    color,
    fuelType,
    transmission,
    currentSearch,
    currentMinPrice > filters.priceRange.min ||
      currentMaxPrice < filters.priceRange.max,
    currentMinMileage > filters.mileageRange.min ||
      currentMaxMileage < filters.mileageRange.max,
    currentMinAge > filters.ageRange.min ||
      currentMaxAge < filters.ageRange.max,
  ].filter(Boolean).length;

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (make) params.set("make", make);
    if (bodyType) params.set("bodyType", bodyType);
    if (color) params.set("color", color);
    if (fuelType) params.set("fuelType", fuelType);
    if (transmission) params.set("transmission", transmission);

    let validMinPrice = Math.max(
      filters.priceRange.min,
      Math.min(filters.priceRange.max, priceRange[0])
    );
    let validMaxPrice = Math.max(
      filters.priceRange.min,
      Math.min(filters.priceRange.max, priceRange[1])
    );

    if (validMinPrice > validMaxPrice) {
      [validMinPrice, validMaxPrice] = [validMaxPrice, validMinPrice];
    }

    if (validMinPrice > filters.priceRange.min)
      params.set("minPrice", validMinPrice.toString());
    if (validMaxPrice < filters.priceRange.max)
      params.set("maxPrice", validMaxPrice.toString());

    let validMinMileage = Math.max(
      filters.mileageRange.min,
      Math.min(filters.mileageRange.max, mileageRange[0])
    );
    let validMaxMileage = Math.max(
      filters.mileageRange.min,
      Math.min(filters.mileageRange.max, mileageRange[1])
    );

    if (validMinMileage > validMaxMileage) {
      [validMinMileage, validMaxMileage] = [validMaxMileage, validMinMileage];
    }

    if (validMinMileage > filters.mileageRange.min)
      params.set("minMileage", validMinMileage.toString());
    if (validMaxMileage < filters.mileageRange.max)
      params.set("maxMileage", validMaxMileage.toString());

    let validMinAge = Math.max(
      filters.ageRange.min,
      Math.min(filters.ageRange.max, ageRange[0])
    );
    let validMaxAge = Math.max(
      filters.ageRange.min,
      Math.min(filters.ageRange.max, ageRange[1])
    );

    if (validMinAge > validMaxAge) {
      [validMinAge, validMaxAge] = [validMaxAge, validMinAge];
    }

    if (validMinAge > filters.ageRange.min)
      params.set("minAge", validMinAge.toString());
    if (validMaxAge < filters.ageRange.max)
      params.set("maxAge", validMaxAge.toString());

    if (sortBy !== "newest") params.set("sortBy", sortBy);

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
    color,
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

  const handleFilterChange = (filterName: string, value: string | number[]) => {
    switch (filterName) {
      case "make":
        setMake(value as string);
        break;
      case "bodyType":
        setBodyType(value as string);
        break;
      case "color":
        setColor(value as string);
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

  const handleClearFilter = (filterName: string) => {
    handleFilterChange(filterName, "");
  };

  const clearFilters = () => {
    setMake("");
    setBodyType("");
    setColor("");
    setFuelType("");
    setTransmission("");
    setPriceRange([filters.priceRange.min, filters.priceRange.max]);
    setMileageRange([filters.mileageRange.min, filters.mileageRange.max]);
    setAgeRange([filters.ageRange.min, filters.ageRange.max]);
    setSortBy("newest");

    router.push(pathname);
    setIsSheetOpen(false);
  };

  const currentFilters = {
    make,
    bodyType,
    color,
    fuelType,
    transmission,
    priceRange,
    priceRangeMin: filters.priceRange.min,
    priceRangeMax: filters.priceRange.max,
    mileageRange,
    ageRange,
  };

  return {
    currentFilters,
    activeFilterCount,
    sortBy,
    setSortBy,
    isSheetOpen,
    setIsSheetOpen,
    applyFilters,
    handleFilterChange,
    handleClearFilter,
    clearFilters,
  };
};
