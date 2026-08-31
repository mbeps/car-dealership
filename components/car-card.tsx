"use client";

import { Car as CarIcon, Heart, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { toggleSavedCar } from "@/actions/cars/toggle-saved-car";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import useFetch from "@/hooks/use-fetch";
import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";
import { formatCurrency } from "@/lib/helpers/format-currency";
import type { SerializedCar } from "@/types/car/serialized-car";

/**
 * Props for a car summary card.
 */
interface CarCardProps {
  car: SerializedCar;
}

/**
 * Displays a car listing with save and details actions.
 *
 * @param car - Car data to render.
 * @returns Car summary card.
 * @see toggleSavedCar - Server action for updating saved cars.
 */
export const CarCard = ({ car }: CarCardProps) => {
  const { user } = useUser();
  const isSignedIn = !!user;
  const { onOpen: openSignInModal } = useAuthModal();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(car.wishlisted || false);

  // Use the useFetch hook
  const { loading: isToggling, fn: toggleSavedCarFn } =
    useFetch(toggleSavedCar);

  // Handle save/unsave car
  const handleToggleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      toast.error("Please sign in to save cars");
      openSignInModal();
      return;
    }

    const result = await toggleSavedCarFn(car.id);
    if (result?.success) {
      setIsSaved(result.data.saved);
      toast.success(result.data.message);
    }
  };

  return (
    <Card className="group overflow-hidden pt-0 transition hover:shadow-lg">
      <div className="relative h-48">
        {car.images && car.images.length > 0 ? (
          <div className="relative h-full w-full">
            <Image
              src={car.images[0]}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <CarIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 rounded-full bg-white/90 p-1.5 ${
            isSaved
              ? "text-red-500 hover:text-red-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={handleToggleSave}
          disabled={isToggling}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={isSaved ? "fill-current" : ""} size={20} />
          )}
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex flex-col">
          <h3 className="line-clamp-1 font-bold text-lg">
            {car.make} {car.model}
          </h3>
          <span className="font-bold text-blue-600 text-xl">
            {formatCurrency(car.price)}
          </span>
        </div>

        <div className="mb-2 flex items-center text-gray-600">
          <span>{car.year}</span>
          <span className="mx-2">•</span>
          <span>{car.transmission}</span>
          <span className="mx-2">•</span>
          <span>{car.fuelType}</span>
        </div>

        <div className="mb-4 flex flex-wrap gap-1">
          <Badge variant="outline" className="bg-gray-50">
            {car.bodyType}
          </Badge>
          <Badge variant="outline" className="bg-gray-50">
            {car.mileage.toLocaleString()} miles
          </Badge>
          <Badge variant="outline" className="bg-gray-50">
            {car.color}
          </Badge>
        </div>

        <div className="flex justify-between">
          <Button
            className="flex-1"
            onClick={() => {
              router.push(ROUTES.HOME.CAR_DETAILS(car.id));
            }}
          >
            View Car
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
