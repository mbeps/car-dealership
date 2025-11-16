"use server";

import { createClient } from "@/lib/supabase";
import { serializeCarData } from "@/lib/helpers";
import { SerializedCar } from "@/types";

/**
 * Get featured cars for the homepage
 */
export async function getFeaturedCars(limit = 3): Promise<SerializedCar[]> {
  try {
    const supabase = await createClient();
    
    const { data: cars, error } = await supabase
      .from("Car")
      .select(
        `
        *,
        carMake:CarMake(id, name, slug),
        carColor:CarColor(id, name, slug)
      `
      )
      .eq("featured", true)
      .eq("status", "AVAILABLE")
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (cars || []).map((car) => serializeCarData(car));
  } catch (error) {
    throw new Error("Error fetching featured cars:" + (error as Error).message);
  }
}
