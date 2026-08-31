"use client";

import { Filter, Sliders, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCarFilters } from "@/hooks/use-car-filters";
import type { CarFiltersData } from "@/types/filters/car-filters-data";
import { CarFilterControls } from "./filter-controls";

/**
 * Car inventory filter UI.
 * Mobile: Sheet drawer with active filter count and apply button.
 * Desktop: Sticky sidebar with live filters and sort controls.
 * Manages filter state via useCarFilters hook.
 *
 * @param filters - Available filter options from server.
 * @see useCarFilters - Hook managing filter state.
 * @see CarFilterControls - Shared filter form controls.
 */
export const CarFilters = ({ filters }: { filters: CarFiltersData }) => {
  const {
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
  } = useCarFilters(filters);

  return (
    <div className="flex justify-between gap-4 lg:flex-col">
      {/* Mobile Filters */}
      <div className="mb-4 lg:hidden">
        <div className="flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" className="flex items-center gap-2" />
              }
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
                  {activeFilterCount}
                </Badge>
              )}
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-full overflow-y-auto sm:max-w-md"
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>

              <div className="px-6 py-6">
                <CarFilterControls
                  filters={filters}
                  currentFilters={currentFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilter={handleClearFilter}
                />
              </div>

              <SheetFooter className="mt-auto flex-row space-x-4 border-t pt-2 sm:justify-between">
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
          setSortBy(value ?? "newest");
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
      <div className="sticky top-24 hidden lg:block">
        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="flex items-center justify-between border-b bg-gray-50 p-4">
            <h3 className="flex items-center font-medium">
              <Sliders className="mr-2 h-4 w-4" />
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-gray-600 text-sm"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>

          <div className="p-6">
            <CarFilterControls
              filters={filters}
              currentFilters={currentFilters}
              onFilterChange={handleFilterChange}
              onClearFilter={handleClearFilter}
            />
          </div>

          <div className="border-t px-4 py-4">
            <Button onClick={applyFilters} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
