"use client";

import type { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import type { CarFormData } from "@/schemas/car-form";
import type { CarColorOption } from "@/types/car-color/car-color-option";
import type { CarMakeOption } from "@/types/car-make/car-make-option";
import { CarComboboxSelect } from "./car-form/car-combobox-select";
import { CarFeaturesInput } from "./car-form/car-features-input";
import { CarImageUploader } from "./car-form/car-image-uploader";

// Predefined options
const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"];
const transmissions = ["Automatic", "Manual", "Semi-Automatic"];
const bodyTypes = [
  "SUV",
  "Sedan",
  "Hatchback",
  "Convertible",
  "Coupe",
  "Wagon",
  "Pickup",
];
const carStatuses = [
  CarStatus.AVAILABLE,
  CarStatus.UNAVAILABLE,
  CarStatus.SOLD,
];

/**
 * Props for the car edit form fields.
 */
interface CarFormFieldsProps {
  /** React Hook Form instance for the car form. */
  form: UseFormReturn<CarFormData>;
  /** Available makes for the make selector. */
  carMakes: CarMakeOption[];
  /** Available colors for the color selector. */
  carColors: CarColorOption[];
  /** Existing uploaded car image URLs. */
  existingImages?: string[];
  /** Newly selected image files. */
  newImages: File[];
  /** Callback for updated selected image files. */
  onNewImagesChange: (images: File[]) => void;
  /** Optional callback for removing existing uploaded images. */
  onExistingImageRemove?: (imageUrl: string) => void;
  /** Current image upload error message. */
  imageError: string;
  /** Callback for clearing the image upload error message. */
  onImageErrorChange: (error: string) => void;
}

/**
 * Renders fields for editing a car listing.
 * Handles make, color, vehicle details, features, and image uploads.
 *
 * @param form - React Hook Form instance for the car form.
 * @param carMakes - Available makes for the make selector.
 * @param carColors - Available colors for the color selector.
 * @param existingImages - Existing uploaded car image URLs.
 * @param newImages - Newly selected image files.
 * @param onNewImagesChange - Callback for updated image files.
 * @param onExistingImageRemove - Optional callback for removing existing images.
 * @param imageError - Current image upload error.
 * @param onImageErrorChange - Callback for clearing the image upload error message.
 * @returns Car form fields UI.
 * @see CarFormData - Form schema used by this component
 */
export function CarFormFields({
  form,
  carMakes,
  carColors,
  existingImages = [],
  newImages,
  onNewImagesChange,
  onExistingImageRemove,
  imageError,
  onImageErrorChange,
}: CarFormFieldsProps) {
  const {
    register,
    setValue,
    getValues,
    formState: { errors },
    watch,
  } = form;

  const selectedMakeId = watch("carMakeId");
  const selectedColorId = watch("carColorId");
  const carMakeIdField = register("carMakeId");
  const carColorIdField = register("carColorId");

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Make */}
        <CarComboboxSelect
          id="carMakeId"
          label="Make"
          options={carMakes}
          value={selectedMakeId}
          onChange={(id) => setValue("carMakeId", id, { shouldValidate: true })}
          placeholder="Select make"
          searchPlaceholder="Search make..."
          emptyMessage="No make found."
          error={errors.carMakeId?.message}
          registrationProps={carMakeIdField}
        />

        {/* Model */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            {...register("model")}
            placeholder="e.g. Camry"
            className={errors.model ? "border-red-500" : ""}
            suppressHydrationWarning
          />
          {errors.model && (
            <p className="text-red-500 text-xs">{errors.model.message}</p>
          )}
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            {...register("year")}
            placeholder="e.g. 2022"
            className={errors.year ? "border-red-500" : ""}
            suppressHydrationWarning
          />
          {errors.year && (
            <p className="text-red-500 text-xs">{errors.year.message}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price (£)</Label>
          <Input
            id="price"
            {...register("price")}
            placeholder="e.g. 25000"
            className={errors.price ? "border-red-500" : ""}
            suppressHydrationWarning
          />
          {errors.price && (
            <p className="text-red-500 text-xs">{errors.price.message}</p>
          )}
        </div>

        {/* Mileage */}
        <div className="space-y-2">
          <Label htmlFor="mileage">Mileage</Label>
          <Input
            id="mileage"
            {...register("mileage")}
            placeholder="e.g. 15000"
            className={errors.mileage ? "border-red-500" : ""}
            suppressHydrationWarning
          />
          {errors.mileage && (
            <p className="text-red-500 text-xs">{errors.mileage.message}</p>
          )}
        </div>

        {/* Color */}
        <CarComboboxSelect
          id="carColorId"
          label="Color"
          options={carColors}
          value={selectedColorId}
          onChange={(id) =>
            setValue("carColorId", id, { shouldValidate: true })
          }
          placeholder="Select color"
          searchPlaceholder="Search color..."
          emptyMessage="No color found."
          error={errors.carColorId?.message}
          registrationProps={carColorIdField}
        />

        {/* Fuel Type */}
        <div className="space-y-2">
          <Label htmlFor="fuelType">Fuel Type</Label>
          <Select
            onValueChange={(value) => {
              if (value === null) return;
              setValue("fuelType", value);
            }}
            defaultValue={getValues("fuelType")}
          >
            <SelectTrigger className={errors.fuelType ? "border-red-500" : ""}>
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              {fuelTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.fuelType && (
            <p className="text-red-500 text-xs">{errors.fuelType.message}</p>
          )}
        </div>

        {/* Transmission */}
        <div className="space-y-2">
          <Label htmlFor="transmission">Transmission</Label>
          <Select
            onValueChange={(value) => {
              if (value === null) return;
              setValue("transmission", value);
            }}
            defaultValue={getValues("transmission")}
          >
            <SelectTrigger
              className={errors.transmission ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select transmission" />
            </SelectTrigger>
            <SelectContent>
              {transmissions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.transmission && (
            <p className="text-red-500 text-xs">
              {errors.transmission.message}
            </p>
          )}
        </div>

        {/* Body Type */}
        <div className="space-y-2">
          <Label htmlFor="bodyType">Body Type</Label>
          <Select
            onValueChange={(value) => {
              if (value === null) return;
              setValue("bodyType", value);
            }}
            defaultValue={getValues("bodyType")}
          >
            <SelectTrigger className={errors.bodyType ? "border-red-500" : ""}>
              <SelectValue placeholder="Select body type" />
            </SelectTrigger>
            <SelectContent>
              {bodyTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.bodyType && (
            <p className="text-red-500 text-xs">{errors.bodyType.message}</p>
          )}
        </div>

        {/* Number Plate */}
        <div className="space-y-2">
          <Label htmlFor="numberPlate">Number Plate</Label>
          <Input
            id="numberPlate"
            {...register("numberPlate")}
            placeholder="e.g. AB12CDE"
            className={errors.numberPlate ? "border-red-500" : ""}
            suppressHydrationWarning
          />
          {errors.numberPlate && (
            <p className="text-red-500 text-xs">{errors.numberPlate.message}</p>
          )}
        </div>

        {/* Seats */}
        <div className="space-y-2">
          <Label htmlFor="seats">
            Number of Seats{" "}
            <span className="text-gray-500 text-sm">(Optional)</span>
          </Label>
          <Input
            id="seats"
            {...register("seats")}
            placeholder="e.g. 5"
            className={errors.seats ? "border-red-500" : ""}
            suppressHydrationWarning
          />
          {errors.seats && (
            <p className="text-red-500 text-xs">{errors.seats.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            onValueChange={(value) => {
              if (value === null) return;
              setValue("status", value as CarStatus);
            }}
            defaultValue={getValues("status")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {carStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Enter detailed description of the car..."
          className={`min-h-32 ${errors.description ? "border-red-500" : ""}`}
          suppressHydrationWarning
        />
        {errors.description && (
          <p className="text-red-500 text-xs">{errors.description.message}</p>
        )}
      </div>

      {/* Featured */}
      <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
        <Checkbox
          id="featured"
          checked={watch("featured")}
          onCheckedChange={(checked) => {
            setValue("featured", checked === true);
          }}
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="featured">Feature this car</Label>
          <p className="text-gray-500 text-sm">
            Featured cars appear on the homepage
          </p>
        </div>
      </div>

      {/* Features */}
      <CarFeaturesInput
        features={watch("features")}
        onChange={(features) => setValue("features", features)}
      />

      {/* Image Management */}
      <CarImageUploader
        existingImages={existingImages}
        newImages={newImages}
        onNewImagesChange={onNewImagesChange}
        onExistingImageRemove={onExistingImageRemove}
        imageError={imageError}
        onImageErrorChange={onImageErrorChange}
      />
    </>
  );
}
