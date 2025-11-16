"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/routes";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateCar } from "@/actions/cars";
import useFetch from "@/hooks/use-fetch";
import { carFormSchema, CarFormData } from "@/lib/schemas";
import { CarColorOption, CarMakeOption, SerializedCar } from "@/types";
import { CarFormFields } from "@/components/car-form";

interface EditCarFormProps {
  car: SerializedCar;
  carMakes: CarMakeOption[];
  carColors: CarColorOption[];
}

export const EditCarForm = ({ car, carMakes, carColors }: EditCarFormProps) => {
  const router = useRouter();
  const [existingImages, setExistingImages] = useState<string[]>(
    car.images || []
  );
  const [newImages, setNewImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");

  // Initialize form with existing car data
  const form = useForm({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      carMakeId: car.carMakeId,
      carColorId: car.carColorId,
      model: car.model,
      year: car.year.toString(),
      price: car.price.toString(),
      mileage: car.mileage.toString(),
      fuelType: car.fuelType,
      transmission: car.transmission,
      bodyType: car.bodyType,
      numberPlate: car.numberPlate,
      seats: car.seats?.toString() || "",
      description: car.description,
      status: car.status,
      featured: car.featured,
      features: car.features || [],
    },
  });

  // Custom hooks for API calls
  const {
    loading: updateCarLoading,
    fn: updateCarFn,
    data: updateCarResult,
  } = useFetch(updateCar);

  // Handle successful car update
  useEffect(() => {
    if (updateCarResult?.success) {
      toast.success("Car updated successfully");
      router.push(ROUTES.ADMIN_CARS);
    }
  }, [updateCarResult, router]);

  // Remove existing image
  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
    setImagesToRemove((prev) => [...prev, imageUrl]);
  };

  const onSubmit = async (data: CarFormData) => {
    // Check if at least one image remains
    const totalImages = existingImages.length + newImages.length;
    if (totalImages === 0) {
      setImageError("Please keep at least one image");
      return;
    }

    // Prepare data for server action
    const carData = {
      ...data,
      year: parseInt(data.year),
      price: parseFloat(data.price),
      mileage: parseInt(data.mileage),
      seats: data.seats ? parseInt(data.seats) : undefined,
    };

    // Call the updateCar function
    await updateCarFn({
      carId: car.id,
      carData,
      newImages,
      imagesToRemove,
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Car Details</CardTitle>
        <CardDescription>Update the details of the car.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CarFormFields
            form={form}
            carMakes={carMakes}
            carColors={carColors}
            existingImages={existingImages}
            newImages={newImages}
            onNewImagesChange={setNewImages}
            onExistingImageRemove={handleRemoveExistingImage}
            imageError={imageError}
            onImageErrorChange={setImageError}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={updateCarLoading}
            >
              {updateCarLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Car...
                </>
              ) : (
                "Update Car"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ROUTES.ADMIN_CARS)}
              disabled={updateCarLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
