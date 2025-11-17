"use server";

import { SerializedCar } from "@/types";
import { AdminCarService } from "@/db/services";

/**
 * Retrieves featured cars for homepage.
 * Only returns AVAILABLE cars marked as featured.
 * Sorted by newest first.
 * Now uses TypeORM for optimized queries.
 *
 * @param limit - Max cars to return (default 3)
 * @returns Featured cars with make/color data
 * @see page.tsx - Homepage using this
 * @see Car.featured - Database flag
 */
export async function getFeaturedCars(limit = 3): Promise<SerializedCar[]> {
  try {
    return await AdminCarService.getFeaturedCars(limit);
  } catch (error) {
    throw new Error("Error fetching featured cars:" + (error as Error).message);
  }
}
