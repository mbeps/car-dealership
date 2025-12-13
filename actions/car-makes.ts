"use server";

import { ActionResponse, CarMakeOption } from "@/types";
import { withRLS } from "@/db/rls-manager";
import { UserCarService } from "@/db/services/user-car.service";

/**
 * Fetches all car makes for form comboboxes.
 * Sorted alphabetically by name.
 * Includes country metadata for display.
 * Now uses TypeORM for database access.
 *
 * @returns All makes with id, name, slug, country
 * @see CarFormFields - Component using this data
 */
export async function getCarMakes(): Promise<ActionResponse<CarMakeOption[]>> {
  try {
    return await withRLS(null, async (manager) => {
      const service = new UserCarService(manager);
      const makes = await service.getAllMakes();

      return {
        success: true,
        data: makes.map((make) => ({
          id: make.id,
          name: make.name,
          slug: make.slug,
          country: make.country,
        })),
      };
    });
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
