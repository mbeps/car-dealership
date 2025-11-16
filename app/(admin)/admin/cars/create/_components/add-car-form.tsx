"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, X, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { addCar } from "@/actions/cars";
import useFetch from "@/hooks/use-fetch";
import Image from "next/image";
import { carFormSchema, CarFormData } from "@/lib/schemas";

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
const carStatuses = ["AVAILABLE", "UNAVAILABLE", "SOLD"];

export const AddCarForm = () => {
  const router = useRouter();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState("");

  // Initialize form with react-hook-form and zod
  const {
    register,
    setValue,
    getValues,
    formState: { errors },
    handleSubmit,
    watch,
  } = useForm({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      price: "",
      mileage: "",
      color: "",
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

  // Handle multiple image uploads with Dropzone
  const onMultiImagesDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit and will be skipped`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);

        // Process the images
        const newImages: string[] = [];
        validFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === "string") {
              newImages.push(result);
            }

            // When all images are processed
            if (newImages.length === validFiles.length) {
              setUploadedImages((prev) => [...prev, ...newImages]);
              setUploadProgress(0);
              setImageError("");
              toast.success(
                `Successfully uploaded ${validFiles.length} images`
              );
            }
          };
          reader.readAsDataURL(file);
        });
      }
    }, 200);
  }, []);

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

  // Remove image from upload preview
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Make */}
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                {...register("make")}
                placeholder="e.g. Toyota"
                className={errors.make ? "border-red-500" : ""}
              />
              {errors.make && (
                <p className="text-xs text-red-500">{errors.make.message}</p>
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
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                {...register("color")}
                placeholder="e.g. Blue"
                className={errors.color ? "border-red-500" : ""}
              />
              {errors.color && (
                <p className="text-xs text-red-500">{errors.color.message}</p>
              )}
            </div>

            {/* Fuel Type */}
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select
                onValueChange={(value) => setValue("fuelType", value)}
                defaultValue={getValues("fuelType")}
              >
                <SelectTrigger
                  className={errors.fuelType ? "border-red-500" : ""}
                >
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
                <p className="text-xs text-red-500">
                  {errors.fuelType.message}
                </p>
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
                <SelectTrigger
                  className={errors.bodyType ? "border-red-500" : ""}
                >
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
                <p className="text-xs text-red-500">
                  {errors.bodyType.message}
                </p>
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
                <p className="text-xs text-red-500">
                  {errors.numberPlate.message}
                </p>
              )}
            </div>

            {/* Seats */}
            <div className="space-y-2">
              <Label htmlFor="seats">
                Number of Seats{" "}
                <span className="text-sm text-gray-500">(Optional)</span>
              </Label>
              <Input id="seats" {...register("seats")} placeholder="e.g. 5" />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) =>
                  setValue(
                    "status",
                    value as "AVAILABLE" | "UNAVAILABLE" | "SOLD"
                  )
                }
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
              className={`min-h-32 ${
                errors.description ? "border-red-500" : ""
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
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

          {/* Image Upload with Dropzone */}
          <div>
            <Label
              htmlFor="images"
              className={imageError ? "text-red-500" : ""}
            >
              Images {imageError && <span className="text-red-500">*</span>}
            </Label>
            <div className="mt-2">
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
                    Drag & drop or click to upload multiple images
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    (JPG, PNG, WebP, max 5MB each)
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

            {/* Image Previews */}
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium">
                  Uploaded Images ({uploadedImages.length})
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="group relative">
                      <Image
                        src={image}
                        alt={`Car image ${index + 1}`}
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
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
