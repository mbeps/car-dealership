"use server";

import { createPublicClient } from "@/lib/supabase/supabase";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import type { SerializedCar } from "@/types/car/serialized-car";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";

/**
 * Retrieves featured cars for the public homepage.
 * Only returns AVAILABLE cars flagged as featured, sorted by newest descending.
 *
 * @param limit - Max consecutive cars to return (default: 3)
 * @returns An array of SerializedCar objects containing make and color metadata
 * @see page.tsx - Homepage reference using this action
 */
export async function getFeaturedCars(limit = 3): Promise<SerializedCar[]> {
  try {
    const supabase = createPublicClient();

    const { data: cars, error } = await supabase
      .from("Car")
      .select(
        `
        *,
        carMake:CarMake(id, name, slug),
        carColor:CarColor(id, name, slug)
      `,
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
