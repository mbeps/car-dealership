"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";

import { addCar } from "@/actions/cars";
import useFetch from "@/hooks/use-fetch";
import { carFormSchema, CarFormData } from "@/lib/schemas";

export const useAddCarForm = () => {
  const router = useRouter();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
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
      status: "AVAILABLE",
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
      router.push(ROUTES.ADMIN_CARS);
    }
  }, [addCarResult, router]);

  const onSubmit = async (data: CarFormData) => {
    if (uploadedImages.length === 0) {
      setImageError("Please upload at least one image");
      return;
    }

    const carData = {
      ...data,
      year: parseInt(data.year),
      price: parseFloat(data.price),
      mileage: parseInt(data.mileage),
      seats: data.seats ? parseInt(data.seats) : undefined,
    };

    await addCarFn({
      carData,
      images: uploadedImages,
    });
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
