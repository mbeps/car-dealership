"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { createClient, createAdminClient } from "@/lib/supabase";
import { serializeCarData } from "@/lib/helpers";
import { ActionResponse, SerializedCar } from "@/types";

type CarStatus = "AVAILABLE" | "UNAVAILABLE" | "SOLD";

// Car form data type
interface CarFormData {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  color: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  numberPlate: string;
  seats?: number;
  description: string;
  status: string;
  featured: boolean;
}

// Add a car to the database with images
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
      const { data, error } = await supabaseAdmin.storage
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
      make: carData.make,
      model: carData.model,
      year: carData.year,
      price: carData.price.toString(), // Convert to string for Postgres numeric
      mileage: carData.mileage,
      color: carData.color,
      fuelType: carData.fuelType,
      transmission: carData.transmission,
      bodyType: carData.bodyType,
      numberPlate: carData.numberPlate,
      seats: carData.seats,
      description: carData.description,
      status: carData.status as CarStatus,
      featured: carData.featured,
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

// Fetch all cars with simple search
export async function getCars(
  search = ""
): Promise<ActionResponse<SerializedCar[]>> {
  try {
    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("Car")
      .select("*")
      .order("createdAt", { ascending: false });

    // Add search filter
    if (search) {
      query = query.or(
        `make.ilike.%${search}%,model.ilike.%${search}%,color.ilike.%${search}%`
      );
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

// Delete a car by ID
export async function deleteCar(id: string): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // First, fetch the car to get its images
    const { data: car, error: fetchError } = await supabase
      .from("Car")
      .select("images")
      .eq("id", id)
      .single();

    if (fetchError || !car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    // Delete the car from the database
    const { error: deleteError } = await supabase
      .from("Car")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Delete the images from Supabase storage
    try {
      const supabaseAdmin = createAdminClient();

      // Extract file paths from image URLs
      const filePaths = car.images
        .map((imageUrl: string) => {
          const url = new URL(imageUrl);
          const pathMatch = url.pathname.match(/\/car-images\/(.*)/);
          return pathMatch ? pathMatch[1] : null;
        })
        .filter((path: string | null): path is string => path !== null);

      // Delete files from storage if paths were extracted
      if (filePaths.length > 0) {
        const { error } = await supabaseAdmin.storage
          .from("car-images")
          .remove(filePaths);

        if (error) {
          console.error("Error deleting images:", error);
          // We continue even if image deletion fails
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

// Update car status or featured status
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
