"use server";

import { SerializedCar } from "@/types";
import { withRLS } from "@/db/rls-manager";
import { UserCarService } from "@/db/services/user-car.service";

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
    // Public data, run as anon
    return await withRLS(null, async (manager) => {
      const service = new UserCarService(manager);
      return await service.getFeaturedCars(limit);
    });
  } catch (error) {
    throw new Error("Error fetching featured cars:" + (error as Error).message);
  }
}
