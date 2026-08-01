"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";

/**
 * Updates car status or featured flag from admin table.
 * Allows toggling AVAILABLE/SOLD/UNAVAILABLE and featured.
 * Revalidates admin car list.
 *
 * @param id - Car ID to update
 * @param status - New status if changing
 * @param featured - New featured flag if changing
 * @returns Success result or error
 */
export async function updateCarStatus(
  id: string,
  { status, featured }: { status?: CarStatus; featured?: boolean },
): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    const updateData: {
      status?: CarStatus;
      featured?: boolean;
    } = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (featured !== undefined) {
      updateData.featured = featured;
    }

    // Update the car
    const { error } = await supabase
      .from("Car")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    // Revalidate the cars list page
    revalidatePath("/admin/cars");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error updating car status:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
