"use server";

import { getOrCreateDbUser } from "@/actions/cars/get-or-create-db-user";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import { getLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/supabase";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { ActionResponse } from "@/types/common/action-response";

const log = getLogger(["app", "actions", "cars"]);

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
  log.debug("Fetching saved cars");
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      log.warn("Unauthorized attempt to fetch saved cars");
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
    log.error("Error fetching saved cars: {error}", {
      error: (error as Error).message,
    });
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
