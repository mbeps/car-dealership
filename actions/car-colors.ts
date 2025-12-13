"use server";

import { ActionResponse, CarColorOption } from "@/types";
import { withRLS } from "@/db/rls-manager";
import { UserCarService } from "@/db/services/user-car.service";

/**
 * Fetches all car colors for form comboboxes.
 * Sorted alphabetically by name.
 * Now uses TypeORM for database access.
 *
 * @returns All colors with id, name, slug
 * @see CarFormFields - Component using this data
 */
export async function getCarColors(): Promise<
  ActionResponse<CarColorOption[]>
> {
  try {
    return await withRLS(null, async (manager) => {
      const service = new UserCarService(manager);
      const colors = await service.getAllColors();

      return {
        success: true,
        data: colors.map((color) => ({
          id: color.id,
          name: color.name,
          slug: color.slug,
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
