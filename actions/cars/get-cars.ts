"use server";

import { serializeCarData } from "@/lib/helpers/serialize-car";
import { createClient } from "@/lib/supabase/supabase";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { ActionResponse } from "@/types/common/action-response";
import { getColorIdsForTerm } from "./get-color-ids-for-term";
import { getMakeIdsForTerm } from "./get-make-ids-for-term";

/**
 * Fetches all cars for admin management.
 * Supports search across make, color, model, plate.
 * No pagination - returns full list sorted by newest.
 *
 * @param search - Search term for filtering
 * @returns All cars with nested make/color data
 */
export async function getCars(
  search = "",
): Promise<ActionResponse<SerializedCar[]>> {
  try {
    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("Car")
      .select(
        `
        *,
        carMake:CarMake(id, name, slug),
        carColor:CarColor(id, name, slug)
      `,
      )
      .order("createdAt", { ascending: false });

    // Add search filter
    if (search) {
      const matchingMakeIds = await getMakeIdsForTerm(supabase, search);
      const matchingColorIds = await getColorIdsForTerm(supabase, search);
      const clauses = [
        `model.ilike.%${search}%`,
        `description.ilike.%${search}%`,
        `numberPlate.ilike.%${search}%`,
      ];

      matchingMakeIds.forEach((id) => {
        clauses.push(`carMakeId.eq.${id}`);
      });
      matchingColorIds.forEach((id) => {
        clauses.push(`carColorId.eq.${id}`);
      });

      query = query.or(clauses.join(","));
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
