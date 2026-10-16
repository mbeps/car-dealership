"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { deleteCar } from "@/actions/cars/delete-car";
import { updateCarStatus } from "@/actions/cars/update-car-status";
import type { CarStatusEnum as CarStatus } from "@/enums/car-status";
import useFetch from "@/hooks/use-fetch";

/**
 * Optional callbacks fired when a car operation succeeds.
 */
interface UseCarAdminOptions {
  onDeleteSuccess?: () => void;
  onUpdateSuccess?: () => void;
}

/**
 * Hook for car admin operations.
 * Wraps deleteCar and updateCarStatus actions with useFetch.
 * Shows success/error toasts and triggers callbacks.
 *
 * @param options - Callbacks for success events
 * @returns Loading states and operation handlers
 * @see deleteCar - Server action for deletion
 * @see updateCarStatus - Server action for status updates
 */
export function useCarAdmin(options: UseCarAdminOptions = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { loading: deletingCar, fn: deleteCarFn } = useFetch(deleteCar);

  const { loading: updatingStatus, fn: updateCarStatusFn } =
    useFetch(updateCarStatus);

  const handleDeleteCar = async (carId: string) => {
    const result = await deleteCarFn(carId);
    if (result?.success) {
      toast.success("Car deleted successfully");
      optionsRef.current.onDeleteSuccess?.();
    } else if (!result || result.success === false) {
      toast.error("Failed to delete car");
    }
  };

  const handleUpdateStatus = async (carId: string, status: CarStatus) => {
    const result = await updateCarStatusFn(carId, { status });
    if (result?.success) {
      toast.success("Car status updated");
      optionsRef.current.onUpdateSuccess?.();
    } else if (!result || result.success === false) {
      toast.error("Failed to update car status");
    }
  };

  const handleToggleFeatured = async (
    carId: string,
    currentFeatured: boolean,
  ) => {
    const result = await updateCarStatusFn(carId, {
      featured: !currentFeatured,
    });
    if (result?.success) {
      toast.success("Car status updated");
      optionsRef.current.onUpdateSuccess?.();
    } else if (!result || result.success === false) {
      toast.error("Failed to update car status");
    }
  };

  return {
    deletingCar,
    updatingStatus,
    handleDeleteCar,
    handleUpdateStatus,
    handleToggleFeatured,
  };
}
