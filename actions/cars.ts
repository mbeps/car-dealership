"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { ROUTES } from "@/lib/routes";
import { createClient, createAdminClient } from "@/lib/supabase";
import { serializeCarData } from "@/lib/helpers";
import { ActionResponse, SerializedCar } from "@/types";

type CarStatus = "AVAILABLE" | "UNAVAILABLE" | "SOLD";

const MAX_IMAGE_SIZE_MB = 1;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Calculates the size of a base64 image in bytes.
 * Base64 encoding increases size by ~33%, so we decode to get actual size.
 *
 * @param base64String - Base64 encoded image string
 * @returns Size in bytes
 */
function getBase64SizeInBytes(base64String: string): number {
  // Remove the data URL prefix if present
  const base64Data = base64String.includes(",")
    ? base64String.split(",")[1]
    : base64String;

  // Calculate the actual size: (base64 length * 3) / 4
  // Account for padding characters
  const padding = (base64Data.match(/=/g) || []).length;
  return (base64Data.length * 3) / 4 - padding;
}

/**
 * Validates that all images are under the size limit.
 *
 * @param images - Array of base64 encoded images
 * @throws Error if any image exceeds the limit
 */
function validateImageSizes(images: string[]): void {
  for (let i = 0; i < images.length; i++) {
    const sizeInBytes = getBase64SizeInBytes(images[i]);
    if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      throw new Error(
        `Image ${
          i + 1
        } is too large (${sizeInMB}MB). Images must be less than ${MAX_IMAGE_SIZE_MB}MB.`
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
  term: string
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
  term: string
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
 * Base64 images converted to buffers before upload.
 *
 * @param carData - Car details from form
 * @param images - Base64 encoded images
 * @returns Success result or error
 * @see createAdminClient - Service role client for storage
 * @see https://supabase.com/docs/reference/javascript/storage-from-upload
 */
export async function addCar({
  carData,
  images,
}: {
  carData: CarFormData;
  images: string[];
}): Promise<ActionResponse<null>> {
  try {
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

    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

    // Validate image sizes
    validateImageSizes(images);

    // Create a unique folder name for this car's images
    const carId = uuidv4();
    const folderPath = `cars/${carId}`;

    // Initialize Supabase admin client (uses service role key)
    const supabaseAdmin = createAdminClient();

    // Upload all images to Supabase storage
    const imageUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const base64Data = images[i];

      // Skip if image data is not valid
      if (!base64Data || !base64Data.startsWith("data:image/")) {
        console.warn("Skipping invalid image data");
        continue;
      }

      // Extract the base64 part (remove the data:image/xyz;base64, prefix)
      const base64 = base64Data.split(",")[1];
      const imageBuffer = Buffer.from(base64, "base64");

      // Determine file extension from the data URL
      const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
      const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";

      // Create filename
      const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload the file buffer directly
      const { error } = await supabaseAdmin.storage
        .from("car-images")
        .upload(filePath, imageBuffer, {
          contentType: `image/${fileExtension}`,
        });

      if (error) {
        console.error("Error uploading image:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get the public URL for the uploaded file
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;

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
  search = ""
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
      `
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
  { status, featured }: { status?: CarStatus; featured?: boolean }
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
 * @param carId - Car ID to update
 * @param carData - Updated car details
 * @param newImages - Base64 images to add
 * @param imagesToRemove - URLs of images to delete
 * @returns Success result or error
 * @see ROUTES.CAR_DETAILS - Public detail page
 * @see ROUTES.ADMIN_CARS - Admin car list
 */
export async function updateCar({
  carId,
  carData,
  newImages = [],
  imagesToRemove = [],
}: {
  carId: string;
  carData: CarFormData;
  newImages?: string[];
  imagesToRemove?: string[];
}): Promise<ActionResponse<null>> {
  try {
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

    if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

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
        (img: string) => !imagesToRemove.includes(img)
      );
    }

    // Upload new images if provided
    if (newImages.length > 0) {
      // Validate new image sizes
      validateImageSizes(newImages);

      const folderPath = `cars/${carId}`;
      const newImageUrls: string[] = [];

      for (let i = 0; i < newImages.length; i++) {
        const base64Data = newImages[i];

        if (!base64Data || !base64Data.startsWith("data:image/")) {
          console.warn("Skipping invalid image data");
          continue;
        }

        const base64 = base64Data.split(",")[1];
        const imageBuffer = Buffer.from(base64, "base64");

        const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
        const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";

        const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
        const filePath = `${folderPath}/${fileName}`;

        const { error } = await supabaseAdmin.storage
          .from("car-images")
          .upload(filePath, imageBuffer, {
            contentType: `image/${fileExtension}`,
          });

        if (error) {
          console.error("Error uploading image:", error);
          throw new Error(`Failed to upload image: ${error.message}`);
        }

        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;
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
