"use client";

import { Car, Heart, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { toggleSavedCar } from "@/actions/cars/toggle-saved-car";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import useAuthModal from "@/hooks/useAuthModal";
import { useUser } from "@/hooks/useUser";

export interface CarSecondaryActionsProps {
  carId: string;
  numberPlate: string;
  carTitle: string;
  initialWishlisted: boolean;
}

/**
 * Secondary action buttons for saving/wishlisting, sharing, and MOT verification.
 */
export function CarSecondaryActions({
  carId,
  numberPlate,
  carTitle,
  initialWishlisted,
}: CarSecondaryActionsProps) {
  const { user } = useUser();
  const isSignedIn = !!user;
  const { onOpen: openSignInModal } = useAuthModal();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const { loading: savingCar, fn: toggleSavedCarFn } = useFetch(toggleSavedCar);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const handleSaveCar = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to save cars");
      openSignInModal();
      return;
    }

    if (savingCar) return;

    const result = await toggleSavedCarFn(carId);
    if (result?.success) {
      setIsWishlisted(result.data.saved);
      toast.success(result.data.message);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: carTitle,
          text: `Check out this ${carTitle} on Dealer name!`,
          url: window.location.href,
        })
        .catch((error) => {
          console.log("Error sharing", error);
          copyToClipboard();
        });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
      <Button
        variant="outline"
        className={`flex w-full items-center justify-center gap-2 ${
          isWishlisted ? "text-red-500" : ""
        }`}
        onClick={handleSaveCar}
        disabled={savingCar}
      >
        <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500" : ""}`} />
        {isWishlisted ? "Saved" : "Save"}
      </Button>

      <Button
        variant="outline"
        className="flex w-full items-center justify-center gap-2"
        onClick={handleShare}
      >
        <Share2 className="h-5 w-5" />
        Share
      </Button>

      <Button
        variant="outline"
        className="flex w-full items-center justify-center gap-2"
        render={
          <Link
            href={`https://www.check-mot.service.gov.uk/results?registration=${numberPlate}`}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
      >
        <Car className="h-5 w-5" />
        View MOT
      </Button>
    </div>
  );
}
