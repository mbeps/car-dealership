"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { addCar } from "@/actions/cars";
import useFetch from "@/hooks/use-fetch";
import { carFormSchema, CarFormData } from "@/lib/schemas";
import { CarColorOption, CarMakeOption } from "@/types";
import { CarFormFields } from "@/components/car-form";

interface AddCarFormProps {
  carMakes: CarMakeOption[];
  carColors: CarColorOption[];
}

export const AddCarForm = ({ carMakes, carColors }: AddCarFormProps) => {
  const router = useRouter();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");

  // Initialize form with react-hook-form and zod
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
    },
  });

  // Custom hooks for API calls
  const {
    loading: addCarLoading,
    fn: addCarFn,
    data: addCarResult,
  } = useFetch(addCar);

  // Handle successful car addition
  useEffect(() => {
    if (addCarResult?.success) {
      toast.success("Car added successfully");
      router.push("/admin/cars");
    }
  }, [addCarResult, router]);

  const onSubmit = async (data: CarFormData) => {
    // Check if images are uploaded
    if (uploadedImages.length === 0) {
      setImageError("Please upload at least one image");
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

    // Call the addCar function with our useFetch hook
    await addCarFn({
      carData,
      images: uploadedImages,
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Car Details</CardTitle>
        <CardDescription>
          Enter the details of the car you want to add.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CarFormFields
            form={form}
            carMakes={carMakes}
            carColors={carColors}
            newImages={uploadedImages}
            onNewImagesChange={setUploadedImages}
            imageError={imageError}
            onImageErrorChange={setImageError}
          />

          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={addCarLoading}
          >
            {addCarLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Car...
              </>
            ) : (
              "Add Car"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
