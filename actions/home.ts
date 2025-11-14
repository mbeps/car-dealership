"use server";

import { createClient } from "@/lib/supabase";
import { SerializedCar } from "@/types";

/**
 * Get featured cars for the homepage
 */
export async function getFeaturedCars(limit = 3): Promise<SerializedCar[]> {
  try {
    const supabase = await createClient();
    
    const { data: cars, error } = await supabase
      .from("Car")
      .select("*")
      .eq("featured", true)
      .eq("status", "AVAILABLE")
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (cars || []).map(car => ({
      ...car,
      price: parseFloat(car.price.toString()),
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    }));
  } catch (error) {
    throw new Error("Error fetching featured cars:" + (error as Error).message);
  }
}
