"use server";

import { createClient } from "@/lib/supabase";
import { ActionResponse, CarMakeOption } from "@/types";

/**
 * Fetches all car makes for form comboboxes.
 * Sorted alphabetically by name.
 * Includes country metadata for display.
 *
 * @returns All makes with id, name, slug, country
 * @see CarFormFields - Component using this data
 */
export async function getCarMakes(): Promise<ActionResponse<CarMakeOption[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("CarMake")
      .select("id, name, slug, country")
      .order("name", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data:
        data?.map((make) => ({
          id: make.id,
          name: make.name,
          slug: make.slug,
          country: make.country,
        })) || [],
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
