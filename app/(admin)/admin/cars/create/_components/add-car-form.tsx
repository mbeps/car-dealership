"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CarColorOption, CarMakeOption } from "@/types";
import { CarFormFields } from "@/components/car-form";
import { useAddCarForm } from "@/hooks/use-add-car-form";

interface AddCarFormProps {
  carMakes: CarMakeOption[];
  carColors: CarColorOption[];
}

export const AddCarForm = ({ carMakes, carColors }: AddCarFormProps) => {
  const {
    form,
    uploadedImages,
    setUploadedImages,
    imageError,
    setImageError,
    addCarLoading,
    onSubmit,
  } = useAddCarForm();

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
