"use server";

import { createClient } from "@/lib/supabase";
import { ActionResponse, CarColorOption } from "@/types";

/**
 * Fetches all car colors for form comboboxes.
 * Sorted alphabetically by name.
 *
 * @returns All colors with id, name, slug
 * @see CarFormFields - Component using this data
 */
export async function getCarColors(): Promise<
  ActionResponse<CarColorOption[]>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("CarColor")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data:
        data?.map((color) => ({
          id: color.id,
          name: color.name,
          slug: color.slug,
        })) || [],
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
