"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import { getOrCreateDbUser } from "./get-or-create-db-user";

/**
 * Toggles car in user's wishlist.
 * Creates UserSavedCar record or deletes existing.
 * Revalidates saved cars page.
 *
 * @param carId - Car to save/unsave
 * @returns Result with saved status and message for toast
 * @see UserSavedCar - Join table for wishlists
 * @see ROUTES.SAVED_CARS - Page that displays wishlist
 */
export async function toggleSavedCar(
  carId: string,
): Promise<ActionResponse<{ saved: boolean; message: string }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    const user = await getOrCreateDbUser(supabase, authUser);

    // Check if car exists
    const { data: car } = await supabase
      .from("Car")
      .select("id")
      .eq("id", carId)
      .single();

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    // Check if car is already saved
    const { data: existingSave, error: existingSaveError } = await supabase
      .from("UserSavedCar")
      .select("*")
      .eq("userId", user.id)
      .eq("carId", carId)
      .maybeSingle();

    if (existingSaveError && existingSaveError.code !== "PGRST116") {
      throw existingSaveError;
    }

    // If car is already saved, remove it
    if (existingSave) {
      const { error: deleteError } = await supabase
        .from("UserSavedCar")
        .delete()
        .eq("userId", user.id)
        .eq("carId", carId);

      if (deleteError) {
        throw deleteError;
      }

      revalidatePath(ROUTES.SAVED_CARS);
      return {
        success: true,
        data: {
          saved: false,
          message: "Car removed from favorites",
        },
      };
    }

    // If car is not saved, add it
    const { error: insertError } = await supabase.from("UserSavedCar").insert({
      userId: user.id,
      carId,
    });

    if (insertError) {
      throw insertError;
    }

    revalidatePath(ROUTES.SAVED_CARS);
    return {
      success: true,
      data: {
        saved: true,
        message: "Car added to favorites",
      },
    };
  } catch (error) {
    throw new Error(`Error toggling saved car:${(error as Error).message}`);
  }
}
