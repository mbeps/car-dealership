"use client";

import { useEffect } from "react";
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
  const {
    loading: deletingCar,
    fn: deleteCarFn,
    data: deleteResult,
    error: deleteError,
  } = useFetch(deleteCar);

  const {
    loading: updatingStatus,
    fn: updateCarStatusFn,
    data: updateResult,
    error: updateError,
  } = useFetch(updateCarStatus);

  // Handle delete success
  useEffect(() => {
    if (deleteResult?.success) {
      toast.success("Car deleted successfully");
      options.onDeleteSuccess?.();
    }
  }, [deleteResult, options.onDeleteSuccess]);

  // Handle delete error
  useEffect(() => {
    if (deleteError) {
      toast.error("Failed to delete car");
    }
  }, [deleteError]);

  // Handle update success
  useEffect(() => {
    if (updateResult?.success) {
      toast.success("Car status updated");
      options.onUpdateSuccess?.();
    }
  }, [updateResult, options.onUpdateSuccess]);

  // Handle update error
  useEffect(() => {
    if (updateError) {
      toast.error("Failed to update car status");
    }
  }, [updateError]);

  const handleDeleteCar = async (carId: string) => {
    await deleteCarFn(carId);
  };

  const handleUpdateStatus = async (carId: string, status: CarStatus) => {
    await updateCarStatusFn(carId, { status });
  };

  const handleToggleFeatured = async (
    carId: string,
    currentFeatured: boolean,
  ) => {
    await updateCarStatusFn(carId, { featured: !currentFeatured });
  };

  return {
    deletingCar,
    updatingStatus,
    handleDeleteCar,
    handleUpdateStatus,
    handleToggleFeatured,
  };
}
