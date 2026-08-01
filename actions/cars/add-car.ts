"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/env";
import { createClient, createAdminClient } from "@/lib/supabase/supabase";
import { checkStorageQuota } from "../storage";
import type { ActionResponse } from "@/types/common/action-response";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import type { CarFormData } from "@/types/car/car-form-data";

const MAX_IMAGE_SIZE_MB = env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Validates that all files are under the size limit.
 *
 * @param files - Array of File objects
 * @throws Error if any file exceeds the limit
 */
function validateFileSizes(files: File[]): void {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `Image ${
          i + 1
        } is too large (${sizeInMB}MB). Images must be less than ${MAX_IMAGE_SIZE_MB}MB.`,
      );
    }
  }
}

/**
 * Creates new car listing with image uploads.
 * Uploads images to Supabase Storage using admin client.
 * Generates unique folder per car for organization.
 * Files are processed as Buffers before upload.
 *
 * @param formData - FormData containing 'carData' (JSON string) and 'images' (File[])
 * @returns Success result or error
 * @see createAdminClient - Service role client for storage
 * @see https://supabase.com/docs/reference/javascript/storage-from-upload
 */
export async function addCar(
  formData: FormData,
): Promise<ActionResponse<null>> {
  try {
    const carDataRaw = formData.get("carData");
    if (!carDataRaw) throw new Error("Car data is required");
    const carData = JSON.parse(carDataRaw as string) as CarFormData;

    const images = formData.getAll("images") as File[];
    if (!images || images.length === 0) {
      throw new Error("At least one image is required");
    }

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

    // Validate image sizes
    validateFileSizes(images);

    // Check storage quota
    const totalSize = images.reduce((acc, img) => acc + img.size, 0);
    const { allowed } = await checkStorageQuota(totalSize);
    if (!allowed) {
      throw new Error(
        "Global storage limit reached. Please contact support or delete existing files.",
      );
    }

    // Create a unique folder name for this car's images
    const carId = uuidv4();
    const folderPath = `cars/${carId}`;

    // Initialize Supabase admin client (uses service role key)
    const supabaseAdmin = createAdminClient();

    // Upload all images to Supabase storage
    const imageUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];

      // Convert File to Buffer
      const imageBuffer = Buffer.from(await file.arrayBuffer());

      // Get file extension and content type
      const contentType = file.type || "image/jpeg";
      const fileExtension = contentType.split("/")[1] || "jpeg";

      // Create filename
      const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload the file buffer directly
      const { error } = await supabaseAdmin.storage
        .from("car-images")
        .upload(filePath, imageBuffer, {
          contentType,
        });

      if (error) {
        console.error("Error uploading image:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get the public URL for the uploaded file
      const publicUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;

      imageUrls.push(publicUrl);
    }

    if (imageUrls.length === 0) {
      throw new Error("No valid images were uploaded");
    }

    // Add the car to the database
    const { error: insertError } = await supabase.from("Car").insert({
      id: carId,
      carMakeId: carData.carMakeId,
      carColorId: carData.carColorId,
      model: carData.model,
      year: carData.year,
      price: carData.price.toString(), // Convert to string for Postgres numeric
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
      images: imageUrls,
      storage_bytes: totalSize,
    });

    if (insertError) throw insertError;

    // Revalidate the cars list page
    revalidatePath("/admin/cars");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    throw new Error("Error adding car:" + (error as Error).message);
  }
}
