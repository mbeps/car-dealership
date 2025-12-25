"use server";

import { createClient } from "@/lib/supabase";
import { serializeCarData } from "@/lib/helpers";
import type { SerializedCar } from "@/types/car/serialized-car";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";

/**
 * Retrieves featured cars for homepage.
 * Only returns AVAILABLE cars marked as featured.
 * Sorted by newest first.
 *
 * @param limit - Max cars to return (default 3)
 * @returns Featured cars with make/color data
 * @see page.tsx - Homepage using this
 * @see Car.featured - Database flag
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
      .eq("status", CarStatus.AVAILABLE)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (cars || []).map((car) => serializeCarData(car));
  } catch (error) {
    throw new Error("Error fetching featured cars:" + (error as Error).message);
  }
}
