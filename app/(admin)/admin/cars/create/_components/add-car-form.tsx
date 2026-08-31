"use client";

import { Loader2 } from "lucide-react";
import { CarFormFields } from "@/components/car-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAddCarForm } from "@/hooks/use-add-car-form";
import type { CarColorOption } from "@/types/car-color/car-color-option";
import type { CarMakeOption } from "@/types/car-make/car-make-option";

/**
 * Props for the car creation form wrapper.
 * Supplies selectable make and color options to the shared car fields.
 */
interface AddCarFormProps {
  /** Available car makes for the form dropdown. */
  carMakes: CarMakeOption[];
  /** Available car colors for the form dropdown. */
  carColors: CarColorOption[];
}

/**
 * Client wrapper for creating a marketplace car.
 * Delegates field validation and submission to the shared car form hook.
 *
 * @param carMakes - Available car makes for the form dropdown
 * @param carColors - Available car colors for the form dropdown
 * @returns Car creation form with uploaded image handling
 * @see useAddCarForm for form logic and submission
 * @see CarFormFields for shared car fields
 */
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
