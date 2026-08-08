"use server";

import { createClient } from "@/lib/supabase/supabase";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import type { ActionResponse } from "@/types/common/action-response";
import type { SerializedCar } from "@/types/car/serialized-car";
import { getOrCreateDbUser } from "./get-or-create-db-user";

/**
 * Retrieves user's wishlist with car details.
 * Joins UserSavedCar with full car data and relations.
 * Sorted by most recently saved.
 *
 * @returns User's saved cars with make/color data
 * @see UserSavedCar - Wishlist join table
 * @see ROUTES.SAVED_CARS - Page displaying wishlist
 */
export async function getSavedCars(): Promise<ActionResponse<SerializedCar[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const user = await getOrCreateDbUser(supabase, authUser);

    // Get saved cars with their details
    const { data: savedCars, error } = await supabase
      .from("UserSavedCar")
      .select(
        `
        *,
        car:Car(
          *,
          carMake:CarMake(id, name, slug),
          carColor:CarColor(id, name, slug)
        )
      `,
      )
      .eq("userId", user.id)
      .order("savedAt", { ascending: false });

    if (error) throw error;

    // Extract and format car data
    const cars = (savedCars || []).map((saved) => serializeCarData(saved.car));

    return {
      success: true,
      data: cars,
    };
  } catch (error) {
    console.error("Error fetching saved cars:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
