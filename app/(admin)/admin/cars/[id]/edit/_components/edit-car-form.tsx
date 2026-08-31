"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateCar } from "@/actions/cars/update-car";
import { CarFormFields } from "@/components/car-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import useFetch from "@/hooks/use-fetch";
import { type CarFormData, carFormSchema } from "@/schemas/car-form";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { CarColorOption } from "@/types/car-color/car-color-option";
import type { CarMakeOption } from "@/types/car-make/car-make-option";

/**
 * Props for the car edit form.
 * Supplies existing car data and selectable option lists.
 */
interface EditCarFormProps {
  /** Existing car record to edit. */
  car: SerializedCar;
  /** Available car makes for the form dropdown. */
  carMakes: CarMakeOption[];
  /** Available car colors for the form dropdown. */
  carColors: CarColorOption[];
}

/**
 * Client form for editing an existing marketplace car.
 * Prepopulates fields, tracks existing/new/removed images, and redirects after success.
 *
 * @param car - Existing car data to edit
 * @param carMakes - Available makes for dropdown
 * @param carColors - Available colors for dropdown
 * @returns Car edit form with image removal handling
 * @see updateCar for the server action handling updates
 * @see CarFormFields for shared car fields
 */
export const EditCarForm = ({ car, carMakes, carColors }: EditCarFormProps) => {
  const router = useRouter();
  const [existingImages, setExistingImages] = useState<string[]>(
    car.images || [],
  );
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");

  // Initialize form with existing car data
  const form = useForm<CarFormData>({
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
      router.push(ROUTES.ADMIN.ADMIN_CARS);
    }
  }, [updateCarResult, router]);

  /**
   * Remove an existing image from the edit form and queue it for deletion.
   *
   * @param imageUrl - Existing image URL to remove
   * @returns Nothing
   */
  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
    setImagesToRemove((prev) => [...prev, imageUrl]);
  };

  /**
   * Submit updated car data and image changes to the server action.
   *
   * @param data - Validated car form values
   * @returns Nothing
   */
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
      year: parseInt(data.year, 10),
      price: parseFloat(data.price),
      mileage: parseInt(data.mileage, 10),
      seats: data.seats ? parseInt(data.seats, 10) : undefined,
    };

    const formData = new FormData();
    formData.append("carId", car.id);
    formData.append("carData", JSON.stringify(carData));
    newImages.forEach((image) => {
      formData.append("newImages", image);
    });
    imagesToRemove.forEach((url) => {
      formData.append("imagesToRemove", url);
    });

    // Call the updateCar function
    await updateCarFn(formData);
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
              onClick={() => router.push(ROUTES.ADMIN.ADMIN_CARS)}
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
