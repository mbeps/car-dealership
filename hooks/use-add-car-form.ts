"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { addCar } from "@/actions/cars/add-car";
import { ROUTES } from "@/constants/routes";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import useFetch from "@/hooks/use-fetch";
import { type CarFormData, carFormSchema } from "@/schemas/car-form";

/**
 * Hook for car creation form.
 * Manages react-hook-form with zod validation.
 * Handles image state and submission with useFetch.
 * Redirects to admin cars list on success.
 *
 * @returns Form instance, image state, loading, and submit handler
 * @see carFormSchema - Validation schema
 * @see addCar - Server action
 */
export const useAddCarForm = () => {
  const router = useRouter();
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState("");

  const form = useForm({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      carMakeId: "",
      carColorId: "",
      model: "",
      year: "",
      price: "",
      mileage: "",
      fuelType: "",
      transmission: "",
      bodyType: "",
      numberPlate: "",
      seats: "",
      description: "",
      status: CarStatus.AVAILABLE,
      featured: false,
      features: [],
    },
  });

  const {
    loading: addCarLoading,
    fn: addCarFn,
    data: addCarResult,
  } = useFetch(addCar);

  useEffect(() => {
    if (addCarResult?.success) {
      toast.success("Car added successfully");
      router.push(ROUTES.ADMIN.ADMIN_CARS);
    }
  }, [addCarResult, router]);

  const onSubmit = async (data: CarFormData) => {
    if (uploadedImages.length === 0) {
      setImageError("Please upload at least one image");
      return;
    }

    const carData = {
      ...data,
      year: parseInt(data.year, 10),
      price: parseFloat(data.price),
      mileage: parseInt(data.mileage, 10),
      seats: data.seats ? parseInt(data.seats, 10) : undefined,
    };

    const formData = new FormData();
    formData.append("carData", JSON.stringify(carData));
    uploadedImages.forEach((image) => {
      formData.append("images", image);
    });

    await addCarFn(formData);
  };

  return {
    form,
    uploadedImages,
    setUploadedImages,
    imageError,
    setImageError,
    addCarLoading,
    onSubmit,
  };
};
