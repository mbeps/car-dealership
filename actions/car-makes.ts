"use server";

import { createClient } from "@/lib/supabase";
import { ActionResponse, CarMakeOption } from "@/types";

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
