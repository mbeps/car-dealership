"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { getLogger } from "@/lib/logger";
import { ensureAdminUser } from "@/lib/supabase/ensure-admin-user";
import type { ActionResponse } from "@/types/common/action-response";
import type { WorkingHour } from "@/types/dealership/working-hour";

const log = getLogger(["app", "actions", "settings"]);

type WorkingHourInput = Omit<
  WorkingHour,
  "id" | "dealershipId" | "createdAt" | "updatedAt"
>;

/**
 * Replaces all working hours for dealership.
 * Deletes existing hours then inserts new set.
 * Revalidates admin settings and test drive pages.
 *
 * @param dealershipId - Target dealership
 * @param workingHours - New hours to save
 * @returns Success message or error
 * @see WorkingHour - Hours table
 */
export async function saveWorkingHours(
  dealershipId: string,
  workingHours: WorkingHourInput[],
): Promise<ActionResponse<string>> {
  try {
    const { supabase } = await ensureAdminUser();

    // Delete existing working hours for this dealership
    const { error: deleteError } = await supabase
      .from("WorkingHour")
      .delete()
      .eq("dealershipId", dealershipId);

    if (deleteError) throw deleteError;

    // Insert new working hours if any provided
    if (workingHours.length > 0) {
      const hoursToInsert = workingHours.map((hour) => ({
        ...hour,
        dealershipId,
      }));

      const { error: insertError } = await supabase
        .from("WorkingHour")
        .insert(hoursToInsert);

      if (insertError) throw insertError;
    }

    log.info(
      "Working hours saved successfully (dealershipId: {dealershipId}, count: {count})",
      { dealershipId, count: workingHours.length },
    );

    revalidatePath(ROUTES.ADMIN.ADMIN_SETTINGS);
    // Revalidate test-drive pages as working hours affect availability
    revalidatePath("/test-drive");

    return {
      success: true,
      data: "Working hours updated successfully",
    };
  } catch (error) {
    log.error(
      "Error saving working hours (dealershipId: {dealershipId}): {error}",
      {
        dealershipId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
