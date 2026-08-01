"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/supabase";
import { createAdminClient } from "@/lib/supabase/supabase";
import { env } from "@/lib/env";
import { ROUTES } from "@/constants/routes";
import { checkStorageQuota } from "../storage";
import { validateFileSizes } from "@/actions/cars/validate-file-sizes";
import type { ActionResponse } from "@/types/common/action-response";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import type { CarFormData } from "@/types/car/car-form-data";

/**
 * Updates existing car with data and image changes.
 * Handles three image operations: keep existing, remove, add new.
 * Validates at least one image remains after removals.
 * Revalidates admin list and public detail page.
 *
 * @param formData - FormData with 'carId', 'carData' (JSON), 'newImages' (File[]), 'imagesToRemove' (string[])
 * @returns Success result or error
 * @see ROUTES.CAR_DETAILS - Public detail page
 * @see ROUTES.ADMIN_CARS - Admin car list
 */
export async function updateCar(
  formData: FormData,
): Promise<ActionResponse<null>> {
  try {
    const carId = formData.get("carId") as string;
    const carDataRaw = formData.get("carData");
    if (!carId || !carDataRaw) throw new Error("Car ID and data are required");
    const carData = JSON.parse(carDataRaw as string) as CarFormData;

    const newImages = (formData.getAll("newImages") || []) as File[];
    const imagesToRemove = (formData.getAll("imagesToRemove") ||
      []) as string[];

    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== UserRole.ADMIN) throw new Error("Unauthorized");

    // Get current car data
    const { data: existingCar, error: fetchError } = await supabase
      .from("Car")
      .select("images")
      .eq("id", carId)
      .single();

    if (fetchError || !existingCar) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    // Handle image operations
    let finalImages = [...existingCar.images];
    const supabaseAdmin = createAdminClient();

    // Check storage quota
    const newImagesSize = newImages.reduce((acc, img) => acc + img.size, 0);
    let removedImagesSize = 0;

    if (imagesToRemove.length > 0) {
      const folderPath = `cars/${carId}`;
      const { data: storageFiles } = await supabaseAdmin.storage
        .from("car-images")
        .list(folderPath);

      if (storageFiles) {
        const removedFileNames = imagesToRemove.map((url) => {
          try {
            const u = new URL(url);
            return u.pathname.split("/").pop();
          } catch {
            return url.split("/").pop();
          }
        });

        removedImagesSize = storageFiles
          .filter((f) => f.name && removedFileNames.includes(f.name))
          .reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
      }
    }

    const { allowed } = await checkStorageQuota(
      newImagesSize - removedImagesSize,
    );
    if (!allowed) {
      throw new Error(
        "Global storage limit reached. Please contact support or delete existing files.",
      );
    }

    // Remove images if requested
    if (imagesToRemove.length > 0) {
      const filePaths = imagesToRemove
        .map((imageUrl: string) => {
          const url = new URL(imageUrl);
          const pathMatch = url.pathname.match(/\/car-images\/(.*)/);
          return pathMatch ? pathMatch[1] : null;
        })
        .filter((path: string | null): path is string => path !== null);

      if (filePaths.length > 0) {
        const { error } = await supabaseAdmin.storage
          .from("car-images")
          .remove(filePaths);

        if (error) {
          console.error("Error deleting images:", error);
        }
      }

      finalImages = finalImages.filter(
        (img: string) => !imagesToRemove.includes(img),
      );
    }

    // Upload new images if provided
    if (newImages.length > 0) {
      // Validate new image sizes
      validateFileSizes(newImages);

      const folderPath = `cars/${carId}`;
      const newImageUrls: string[] = [];

      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];

        // Skip if not a valid file
        if (!file || !(file instanceof File)) {
          continue;
        }

        const imageBuffer = Buffer.from(await file.arrayBuffer());
        const contentType = file.type || "image/jpeg";
        const fileExtension = contentType.split("/")[1] || "jpeg";

        const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
        const filePath = `${folderPath}/${fileName}`;

        const { error } = await supabaseAdmin.storage
          .from("car-images")
          .upload(filePath, imageBuffer, {
            contentType,
          });

        if (error) {
          console.error("Error uploading image:", error);
          throw new Error(`Failed to upload image: ${error.message}`);
        }

        const publicUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;
        newImageUrls.push(publicUrl);
      }

      finalImages = [...finalImages, ...newImageUrls];
    }

    // Ensure at least one image remains
    if (finalImages.length === 0) {
      return {
        success: false,
        error: "At least one image is required",
      };
    }

    // Calculate storage delta and fetch current storage_bytes
    const { data: currentCar } = await supabase
      .from("Car")
      .select("storage_bytes")
      .eq("id", carId)
      .single();

    const currentStorageBytes = currentCar?.storage_bytes || 0;
    const netStorageChange = newImagesSize - removedImagesSize;
    const newStorageBytes = Math.max(0, currentStorageBytes + netStorageChange);

    // Update the car in the database
    const { error: updateError } = await supabase
      .from("Car")
      .update({
        carMakeId: carData.carMakeId,
        carColorId: carData.carColorId,
        model: carData.model,
        year: carData.year,
        price: carData.price.toString(),
        mileage: carData.mileage,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        bodyType: carData.bodyType,
        numberPlate: carData.numberPlate,
        seats: carData.seats,
        description: carData.description,
        status: carData.status as CarStatus,
        featured: carData.featured,
        features: carData.features || [],
        images: finalImages,
        storage_bytes: newStorageBytes,
      })
      .eq("id", carId);

    if (updateError) throw updateError;

    // Revalidate pages
    revalidatePath(ROUTES.ADMIN_CARS);
    revalidatePath(ROUTES.CAR_DETAILS(carId));

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    throw new Error("Error updating car: " + (error as Error).message);
  }
}
