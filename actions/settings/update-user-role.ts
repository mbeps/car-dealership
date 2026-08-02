"use server";

import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { ROUTES } from "@/constants/routes";
import { ensureAdminUser } from "@/lib/supabase/ensure-admin-user";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types/common/action-response";

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

    revalidatePath(ROUTES.ADMIN.ADMIN_SETTINGS);

    return {
      success: true,
      data: "User role updated successfully",
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
