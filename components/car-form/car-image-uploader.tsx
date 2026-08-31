"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { env, FILE_LIMITS } from "@/lib/env";

export interface CarImageUploaderProps {
  existingImages?: string[];
  newImages: File[];
  onNewImagesChange: (images: File[]) => void;
  onExistingImageRemove?: (imageUrl: string) => void;
  imageError?: string;
  onImageErrorChange: (error: string) => void;
}

/**
 * Dropzone-based image uploader with preview grid and image deletion.
 */
export function CarImageUploader({
  existingImages = [],
  newImages,
  onNewImagesChange,
  onExistingImageRemove,
  imageError,
  onImageErrorChange,
}: CarImageUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const imagePreviews = newImages.map((file) => URL.createObjectURL(file));

  // Clean up object URLs on unmount or when newImages changes
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviews]);

  // Handle multiple image uploads with Dropzone
  const onMultiImagesDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > FILE_LIMITS.CAR_IMAGE) {
          toast.error(
            `${file.name} exceeds the ${env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB}MB limit and will be skipped`,
          );
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setUploadProgress(100);

      onNewImagesChange([...newImages, ...validFiles]);
      onImageErrorChange("");
      toast.success(
        `Added ${validFiles.length} image${validFiles.length > 1 ? "s" : ""}`,
      );

      setTimeout(() => setUploadProgress(0), 300);
    },
    [newImages, onImageErrorChange, onNewImagesChange],
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

  const removeNewImage = (index: number) => {
    onNewImagesChange(newImages.filter((_, i) => i !== index));
  };

  const totalImages = existingImages.length + newImages.length;

  return (
    <div>
      <Label htmlFor="images" className={imageError ? "text-red-500" : ""}>
        Images {imageError && <span className="text-red-500">*</span>}
      </Label>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="mt-2">
          <h3 className="mb-2 font-medium text-sm">
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
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
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
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition hover:bg-gray-50 ${
            imageError ? "border-red-500" : "border-gray-300"
          }`}
        >
          <input {...getMultiImageInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <Upload className="mb-3 h-12 w-12 text-gray-400" />
            <span className="text-gray-600 text-sm">
              Drag & drop or click to upload{" "}
              {existingImages.length > 0 ? "new " : ""}images
            </span>
            <span className="mt-1 text-gray-500 text-xs">
              (JPG, PNG, WebP, max 1MB each)
            </span>
          </div>
        </div>
        {imageError && (
          <p className="mt-1 text-red-500 text-xs">{imageError}</p>
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
      {imagePreviews.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 font-medium text-sm">
            {existingImages.length > 0 ? "New " : "Uploaded "}Images (
            {imagePreviews.length})
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {imagePreviews.map((previewUrl, index) => (
              <div key={index} className="group relative">
                <Image
                  src={previewUrl}
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
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
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
        <p className="mt-2 text-gray-600 text-sm">
          Total images: {totalImages}
        </p>
      )}
    </div>
  );
}
