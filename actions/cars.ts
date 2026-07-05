"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { ROUTES } from "@/constants/routes";
import { env } from "@/lib/env";
import { createClient, createAdminClient } from "@/lib/supabase/supabase";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import { checkStorageQuota } from "./storage";
import type { ActionResponse } from "@/types/common/action-response";
import type { SerializedCar } from "@/types/car/serialized-car";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";

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
 * Searches makes for admin car list filtering.
 * Case-insensitive partial match on make name.
 *
 * @param supabase - Supabase client instance
 * @param term - Search term
 * @returns Array of matching make IDs
 */
async function getMakeIdsForTerm(
  supabase: Awaited<ReturnType<typeof createClient>>,
  term: string,
): Promise<string[]> {
  if (!term) return [];

  const { data, error } = await supabase
    .from("CarMake")
    .select("id")
    .ilike("name", `%${term}%`);

  if (error) throw error;

  return data?.map((item) => item.id) ?? [];
}

/**
 * Searches colors for admin car list filtering.
 * Case-insensitive partial match on color name.
 *
 * @param supabase - Supabase client instance
 * @param term - Search term
 * @returns Array of matching color IDs
 */
async function getColorIdsForTerm(
  supabase: Awaited<ReturnType<typeof createClient>>,
  term: string,
): Promise<string[]> {
  if (!term) return [];

  const { data, error } = await supabase
    .from("CarColor")
    .select("id")
    .ilike("name", `%${term}%`);

  if (error) throw error;

  return data?.map((item) => item.id) ?? [];
}

// Car form data type
interface CarFormData {
  carMakeId: string;
  carColorId: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  numberPlate: string;
  seats?: number;
  description: string;
  status: string;
  featured: boolean;
  features: string[];
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

/**
 * Fetches all cars for admin management.
 * Supports search across make, color, model, plate.
 * No pagination - returns full list sorted by newest.
 *
 * @param search - Search term for filtering
 * @returns All cars with nested make/color data
 */
export async function getCars(
  search = "",
): Promise<ActionResponse<SerializedCar[]>> {
  try {
    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("Car")
      .select(
        `
        *,
        carMake:CarMake(id, name, slug),
        carColor:CarColor(id, name, slug)
      `,
      )
      .order("createdAt", { ascending: false });

    // Add search filter
    if (search) {
      const matchingMakeIds = await getMakeIdsForTerm(supabase, search);
      const matchingColorIds = await getColorIdsForTerm(supabase, search);
      const clauses = [
        `model.ilike.%${search}%`,
        `description.ilike.%${search}%`,
        `numberPlate.ilike.%${search}%`,
      ];

      matchingMakeIds.forEach((id) => {
        clauses.push(`carMakeId.eq.${id}`);
      });
      matchingColorIds.forEach((id) => {
        clauses.push(`carColorId.eq.${id}`);
      });

      query = query.or(clauses.join(","));
    }

    const { data: cars, error } = await query;

    if (error) throw error;

    const serializedCars = (cars || []).map((car) => serializeCarData(car));

    return {
      success: true,
      data: serializedCars,
    };
  } catch (error) {
    console.error("Error fetching cars:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Deletes car and associated images from storage.
 * Removes the entire car folder from storage.
 * Best-effort storage cleanup - proceeds even if fails.
 * Revalidates admin car list.
 *
 * @param id - Car ID to delete
 * @returns Success result or error
 * @see createAdminClient - Service role client for storage deletion
 * @see https://supabase.com/docs/reference/javascript/storage-from-remove
 */
export async function deleteCar(id: string): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Delete associated test drive bookings first to avoid FK constraint violation
    const { error: bookingsError } = await supabase
      .from("TestDriveBooking")
      .delete()
      .eq("carId", id);

    if (bookingsError) {
      console.error("Error deleting test drive bookings:", bookingsError);
      throw bookingsError;
    }

    // Delete the car from the database
    const { error: deleteError } = await supabase
      .from("Car")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Delete the car's image folder from Supabase storage
    try {
      const supabaseAdmin = createAdminClient();
      const folderPath = `cars/${id}`;

      // List all files in the car's folder
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from("car-images")
        .list(folderPath);

      if (listError) {
        console.error("Error listing car images:", listError);
      } else if (files && files.length > 0) {
        // Build paths to all files in the folder
        const filePaths = files.map((file) => `${folderPath}/${file.name}`);

        // Delete all files
        const { error: removeError } = await supabaseAdmin.storage
          .from("car-images")
          .remove(filePaths);

        if (removeError) {
          console.error("Error deleting car images:", removeError);
        }
      }
    } catch (storageError) {
      console.error("Error with storage operations:", storageError);
      // Continue with the function even if storage operations fail
    }

    // Revalidate the cars list page
    revalidatePath("/admin/cars");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting car:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Updates car status or featured flag from admin table.
 * Allows toggling AVAILABLE/SOLD/UNAVAILABLE and featured.
 * Revalidates admin car list.
 *
 * @param id - Car ID to update
 * @param status - New status if changing
 * @param featured - New featured flag if changing
 * @returns Success result or error
 */
export async function updateCarStatus(
  id: string,
  { status, featured }: { status?: CarStatus; featured?: boolean },
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    const updateData: {
      status?: CarStatus;
      featured?: boolean;
    } = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (featured !== undefined) {
      updateData.featured = featured;
    }

    // Update the car
    const { error } = await supabase
      .from("Car")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    // Revalidate the cars list page
    revalidatePath("/admin/cars");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error updating car status:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

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
