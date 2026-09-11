"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import type { UserRoleEnum as UserRole } from "@/enums/user-role";
import { getLogger } from "@/lib/logger";
import { ensureAdminUser } from "@/lib/supabase/ensure-admin-user";
import type { ActionResponse } from "@/types/common/action-response";

const log = getLogger(["app", "actions", "settings"]);

/**
 * Updates user role from admin settings.
 * Prevents self-role changes.
 * Revalidates admin settings page.
 *
 * @param userId - User to update
 * @param newRole - ADMIN or USER
 * @returns Success message or error
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
): Promise<ActionResponse<string>> {
  try {
    const { supabase, userId: currentUserId } = await ensureAdminUser();

    // Don't allow updating own role
    if (currentUserId === userId) {
      log.warn("User attempted to update own role (userId: {userId})", {
        userId,
      });
      return {
        success: false,
        error: "You cannot change your own role",
      };
    }

    // Update user role
    const { error: updateError } = await supabase
      .from("User")
      .update({ role: newRole })
      .eq("id", userId);

    if (updateError) throw updateError;

    log.info(
      "User role updated successfully (userId: {userId}, newRole: {newRole})",
      { userId, newRole },
    );

    revalidatePath(ROUTES.ADMIN.ADMIN_SETTINGS);

    return {
      success: true,
      data: "User role updated successfully",
    };
  } catch (error) {
    log.error("Error updating user role (userId: {userId}): {error}", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
