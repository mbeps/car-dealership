"use client";

import { useCallback, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { X, Upload, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  CarColorOption,
  CarMakeOption,
  CarStatusEnum as CarStatus,
} from "@/types";
import { CarFormData } from "@/lib/schemas";
import { readAsDataUrl } from "@/lib/image-utils";

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

interface CarFormFieldsProps {
  form: UseFormReturn<CarFormData>;
  carMakes: CarMakeOption[];
  carColors: CarColorOption[];
  existingImages?: string[];
  newImages: string[];
  onNewImagesChange: (images: string[]) => void;
  onExistingImageRemove?: (imageUrl: string) => void;
  imageError: string;
  onImageErrorChange: (error: string) => void;
}

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [makePopoverOpen, setMakePopoverOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [featureInput, setFeatureInput] = useState("");

  const {
    register,
    setValue,
    getValues,
    formState: { errors },
    watch,
  } = form;

  const selectedMakeId = watch("carMakeId");
  const selectedColorId = watch("carColorId");
  const selectedMake = carMakes.find((make) => make.id === selectedMakeId);
  const selectedColor = carColors.find((color) => color.id === selectedColorId);
  const carMakeIdField = register("carMakeId");
  const carColorIdField = register("carColorId");

  // Handle multiple image uploads with Dropzone
  const onMultiImagesDrop = useCallback(
    (acceptedFiles: File[]) => {
      const processFiles = async () => {
        const validFiles = acceptedFiles.filter((file) => {
          if (file.size > 1024 * 1024) {
            toast.error(
              `${file.name} exceeds the 1MB limit and will be skipped`
            );
            return false;
          }
          return true;
        });

        if (validFiles.length === 0) return;

        setUploadProgress(5);
        const processedImages: string[] = [];

        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          try {
            const dataUrl = await readAsDataUrl(file);
            processedImages.push(dataUrl);
          } catch (error) {
            console.error("Failed to process image", error);
            toast.error(`Failed to process ${file.name}`);
          } finally {
            const progress = Math.round(((i + 1) / validFiles.length) * 100);
            setUploadProgress(progress);
          }
        }

        if (processedImages.length > 0) {
          onNewImagesChange([...newImages, ...processedImages]);
          onImageErrorChange("");
          toast.success(
            `Added ${processedImages.length} image${
              processedImages.length > 1 ? "s" : ""
            }`
          );
        } else {
          toast.error("No images were added");
        }

        setTimeout(() => setUploadProgress(0), 300);
      };

      void processFiles();
    },
    [newImages, onImageErrorChange, onNewImagesChange]
  );

  const {
    getRootProps: getMultiImageRootProps,
    getInputProps: getMultiImageInputProps,
  } = useDropzone({
    onDrop: onMultiImagesDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
  });

  // Remove new image from upload preview
  const removeNewImage = (index: number) => {
    onNewImagesChange(newImages.filter((_, i) => i !== index));
  };

  const totalImages = existingImages.length + newImages.length;

  // Handle adding features
  const handleAddFeature = () => {
    const trimmedFeature = featureInput.trim();
    if (!trimmedFeature) {
      toast.error("Feature cannot be empty");
      return;
    }

    const currentFeatures = watch("features") || [];
    if (currentFeatures.includes(trimmedFeature)) {
      toast.error("Feature already added");
      return;
    }

    setValue("features", [...currentFeatures, trimmedFeature]);
    setFeatureInput("");
  };

  // Handle removing features
  const handleRemoveFeature = (index: number) => {
    const currentFeatures = watch("features") || [];
    setValue(
      "features",
      currentFeatures.filter((_, i) => i !== index)
    );
  };

  // Handle key press for adding features
  const handleFeatureKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddFeature();
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Make */}
        <div className="space-y-2">
          <Label htmlFor="carMakeId">Make</Label>
          <Popover open={makePopoverOpen} onOpenChange={setMakePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={makePopoverOpen}
                className={cn(
                  "w-full justify-between",
                  errors.carMakeId ? "border-red-500" : ""
                )}
              >
                {selectedMake ? selectedMake.name : "Select make"}
                <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <Command>
                <CommandInput placeholder="Search make..." />
                <CommandList>
                  <CommandEmpty>No make found.</CommandEmpty>
                  <CommandGroup>
                    {carMakes.map((make) => (
                      <CommandItem
                        key={make.id}
                        value={make.name}
                        onSelect={() => {
                          setValue("carMakeId", make.id, {
                            shouldValidate: true,
                          });
                          setMakePopoverOpen(false);
                        }}
                        className="text-sm"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            make.id === selectedMakeId
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {make.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <input
            type="hidden"
            {...carMakeIdField}
            value={selectedMakeId || ""}
          />
          {errors.carMakeId && (
            <p className="text-xs text-red-500">{errors.carMakeId.message}</p>
          )}
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            {...register("model")}
            placeholder="e.g. Camry"
            className={errors.model ? "border-red-500" : ""}
          />
          {errors.model && (
            <p className="text-xs text-red-500">{errors.model.message}</p>
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
          />
          {errors.year && (
            <p className="text-xs text-red-500">{errors.year.message}</p>
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
          />
          {errors.price && (
            <p className="text-xs text-red-500">{errors.price.message}</p>
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
          />
          {errors.mileage && (
            <p className="text-xs text-red-500">{errors.mileage.message}</p>
          )}
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="carColorId">Color</Label>
          <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={colorPopoverOpen}
                className={cn(
                  "w-full justify-between",
                  errors.carColorId ? "border-red-500" : ""
                )}
              >
                {selectedColor ? selectedColor.name : "Select color"}
                <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <Command>
                <CommandInput placeholder="Search color..." />
                <CommandList>
                  <CommandEmpty>No color found.</CommandEmpty>
                  <CommandGroup>
                    {carColors.map((color) => (
                      <CommandItem
                        key={color.id}
                        value={color.name}
                        onSelect={() => {
                          setValue("carColorId", color.id, {
                            shouldValidate: true,
                          });
                          setColorPopoverOpen(false);
                        }}
                        className="text-sm"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            color.id === selectedColorId
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {color.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <input
            type="hidden"
            {...carColorIdField}
            value={selectedColorId || ""}
          />
          {errors.carColorId && (
            <p className="text-xs text-red-500">{errors.carColorId.message}</p>
          )}
        </div>

        {/* Fuel Type */}
        <div className="space-y-2">
          <Label htmlFor="fuelType">Fuel Type</Label>
          <Select
            onValueChange={(value) => setValue("fuelType", value)}
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
            <p className="text-xs text-red-500">{errors.fuelType.message}</p>
          )}
        </div>

        {/* Transmission */}
        <div className="space-y-2">
          <Label htmlFor="transmission">Transmission</Label>
          <Select
            onValueChange={(value) => setValue("transmission", value)}
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
            <p className="text-xs text-red-500">
              {errors.transmission.message}
            </p>
          )}
        </div>

        {/* Body Type */}
        <div className="space-y-2">
          <Label htmlFor="bodyType">Body Type</Label>
          <Select
            onValueChange={(value) => setValue("bodyType", value)}
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
            <p className="text-xs text-red-500">{errors.bodyType.message}</p>
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
          />
          {errors.numberPlate && (
            <p className="text-xs text-red-500">{errors.numberPlate.message}</p>
          )}
        </div>

        {/* Seats */}
        <div className="space-y-2">
          <Label htmlFor="seats">
            Number of Seats{" "}
            <span className="text-sm text-gray-500">(Optional)</span>
          </Label>
          <Input
            id="seats"
            {...register("seats")}
            placeholder="e.g. 5"
            className={errors.seats ? "border-red-500" : ""}
          />
          {errors.seats && (
            <p className="text-xs text-red-500">{errors.seats.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            onValueChange={(value) => setValue("status", value as CarStatus)}
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
        />
        {errors.description && (
          <p className="text-xs text-red-500">{errors.description.message}</p>
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
          <p className="text-sm text-gray-500">
            Featured cars appear on the homepage
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2">
        <Label htmlFor="features">Features</Label>
        <div className="flex gap-2">
          <Input
            id="features"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyPress={handleFeatureKeyPress}
            placeholder="e.g. Bluetooth, Navigation System, Leather Seats"
          />
          <Button
            type="button"
            onClick={handleAddFeature}
            variant="outline"
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {watch("features") && watch("features").length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {watch("features").map((feature, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(index)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500">
          Add features one by one. Press Enter or click + to add.
        </p>
      </div>

      {/* Image Management */}
      <div>
        <Label htmlFor="images" className={imageError ? "text-red-500" : ""}>
          Images {imageError && <span className="text-red-500">*</span>}
        </Label>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="mt-2">
            <h3 className="mb-2 text-sm font-medium">
              Current Images ({existingImages.length})
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {existingImages.map((image, index) => (
                <div key={index} className="group relative">
                  <Image
                    src={image}
                    alt={`Car image ${index + 1}`}
                    height={50}
                    width={50}
                    className="h-28 w-full rounded-md object-cover"
                    priority
                  />
                  {onExistingImageRemove && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => onExistingImageRemove(image)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Images */}
        <div className={existingImages.length > 0 ? "mt-4" : "mt-2"}>
          <div
            {...getMultiImageRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition ${
              imageError ? "border-red-500" : "border-gray-300"
            }`}
          >
            <input {...getMultiImageInputProps()} />
            <div className="flex flex-col items-center justify-center">
              <Upload className="mb-3 h-12 w-12 text-gray-400" />
              <span className="text-sm text-gray-600">
                Drag & drop or click to upload{" "}
                {existingImages.length > 0 ? "new " : ""}images
              </span>
              <span className="mt-1 text-xs text-gray-500">
                (JPG, PNG, WebP, max 1MB each)
              </span>
            </div>
          </div>
          {imageError && (
            <p className="mt-1 text-xs text-red-500">{imageError}</p>
          )}
          {uploadProgress > 0 && (
            <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200">
              <div
                className="h-2.5 rounded-full bg-blue-600"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* New Images Preview */}
        {newImages.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium">
              {existingImages.length > 0 ? "New " : "Uploaded "}Images (
              {newImages.length})
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {newImages.map((image, index) => (
                <div key={index} className="group relative">
                  <Image
                    src={image}
                    alt={`${existingImages.length > 0 ? "New " : ""}car image ${
                      index + 1
                    }`}
                    height={50}
                    width={50}
                    className="h-28 w-full rounded-md object-cover"
                    priority
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => removeNewImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Images Count */}
        {existingImages.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            Total images: {totalImages}
          </p>
        )}
      </div>
    </>
  );
}
