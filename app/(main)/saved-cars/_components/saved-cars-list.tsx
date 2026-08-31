"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { CarCard } from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { ActionResponse } from "@/types/common/action-response";

/**
 * Renders the user's saved cars.
 * Displays saved cars in a responsive grid.
 * Marks every displayed car as wishlisted for the shared card component.
 * Shows empty state with CTA to browse inventory.
 *
 * @param initialData - Server-fetched saved cars.
 * @see getSavedCars - Server action fetching wishlist.
 * @see CarCard - Reused car display component.
 */
export function SavedCarsList({
  initialData,
}: {
  initialData: ActionResponse<SerializedCar[]>;
}) {
  // No saved cars
  if (!initialData?.success || initialData.data.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border bg-gray-50 p-8 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4">
          <Heart className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="mb-2 font-medium text-lg">No Saved Cars</h3>
        <p className="mb-6 max-w-md text-gray-500">
          You haven't saved any cars yet. Browse our listings and click the
          heart icon to save cars for later.
        </p>
        <Button variant="default" render={<Link href={ROUTES.HOME.CARS} />}>
          Browse Cars
        </Button>
      </div>
    );
  }

  // Display saved cars
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {initialData.success &&
        initialData.data.map((car: SerializedCar) => (
          <CarCard key={car.id} car={{ ...car, wishlisted: true }} />
        ))}
    </div>
  );
}
