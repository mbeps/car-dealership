"use server";

import { ActionResponse, CarColorOption } from "@/types";
import { AdminCarService } from "@/db/services";

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
    const colors = await AdminCarService.getAllColors();

    return {
      success: true,
      data: colors.map((color) => ({
        id: color.id,
        name: color.name,
        slug: color.slug,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
